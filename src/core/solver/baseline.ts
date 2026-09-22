import type { Carton } from '../domain/carton.js';
import type { Item } from '../domain/item.js';
import type { RotationPolicy } from '../domain/constraints.js';
import {
  getRotatedDimensions,
  VALID_PLACEMENT_ROTATIONS,
  type ItemPlacement,
  type PlacementRotation,
  type PlanStatus,
} from '../domain/result.js';
import type { UnplacedReason } from '../domain/plan-contracts.js';
import type {
  SolverAdapter,
  SolverCandidateCarton,
  SolverCandidatePlan,
  SolverInput,
  SolverOutput,
} from './contracts.js';

const GEOMETRY_TOLERANCE_MM = 1e-10;

const ROTATIONS_BY_POLICY: Record<
  RotationPolicy,
  readonly PlacementRotation[]
> = {
  any: ['LWH', 'WLH', 'LHW', 'HLW', 'WHL', 'HWL'],
  upright: ['LWH', 'WLH'],
  'vertical-axis-only': ['LWH', 'WLH'],
  fixed: ['LWH'],
};

interface Point {
  x: number;
  y: number;
  z: number;
}

interface OpenCarton {
  carton: Carton;
  candidate: SolverCandidateCarton;
}

function getInventoryLimit(carton: Carton): number | undefined {
  const limits: number[] = [];

  if (carton.quantityAvailable !== undefined) {
    limits.push(carton.quantityAvailable);
  }

  if (carton.stockQuantity !== undefined) {
    limits.push(carton.stockQuantity);
  }

  return limits.length === 0
    ? undefined
    : Math.min(...limits);
}

function canOpenCarton(
  carton: Carton,
  usage: ReadonlyMap<string, number>
): boolean {
  const limit = getInventoryLimit(carton);

  if (limit === undefined) {
    return true;
  }

  return (usage.get(carton.id) ?? 0) < limit;
}

function getCandidatePoints(
  placements: readonly ItemPlacement[]
): Point[] {
  const points: Point[] = [
    { x: 0, y: 0, z: 0 },
  ];

  for (const placement of placements) {
    points.push(
      {
        x: placement.x + placement.length,
        y: placement.y,
        z: placement.z,
      },
      {
        x: placement.x,
        y: placement.y + placement.width,
        z: placement.z,
      },
      {
        x: placement.x,
        y: placement.y,
        z: placement.z + placement.height,
      }
    );
  }

  const seen = new Set<string>();
  const unique: Point[] = [];

  for (const point of points) {
    const key = `${point.x}|${point.y}|${point.z}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(point);
    }
  }

  unique.sort((a, b) =>
    a.z - b.z ||
    a.y - b.y ||
    a.x - b.x
  );

  return unique;
}

function fitsInsideCarton(
  point: Point,
  length: number,
  width: number,
  height: number,
  carton: Carton
): boolean {
  return (
    point.x >= -GEOMETRY_TOLERANCE_MM &&
    point.y >= -GEOMETRY_TOLERANCE_MM &&
    point.z >= -GEOMETRY_TOLERANCE_MM &&
    point.x + length <=
      carton.internalDimensions.length +
        GEOMETRY_TOLERANCE_MM &&
    point.y + width <=
      carton.internalDimensions.width +
        GEOMETRY_TOLERANCE_MM &&
    point.z + height <=
      carton.internalDimensions.height +
        GEOMETRY_TOLERANCE_MM
  );
}

function overlaps(
  candidate: ItemPlacement,
  existing: ItemPlacement
): boolean {
  const overlapX =
    Math.min(
      candidate.x + candidate.length,
      existing.x + existing.length
    ) -
    Math.max(candidate.x, existing.x);

  const overlapY =
    Math.min(
      candidate.y + candidate.width,
      existing.y + existing.width
    ) -
    Math.max(candidate.y, existing.y);

  const overlapZ =
    Math.min(
      candidate.z + candidate.height,
      existing.z + existing.height
    ) -
    Math.max(candidate.z, existing.z);

  return (
    overlapX > GEOMETRY_TOLERANCE_MM &&
    overlapY > GEOMETRY_TOLERANCE_MM &&
    overlapZ > GEOMETRY_TOLERANCE_MM
  );
}

function weightAllowsPlacement(
  carton: Carton,
  item: Item,
  placements: readonly ItemPlacement[],
  itemById: ReadonlyMap<string, Item>
): boolean {
  if (carton.maxGrossWeightG === undefined) {
    return true;
  }

  if (
    carton.emptyBoxWeightG === undefined ||
    item.unitWeightG === undefined
  ) {
    return true;
  }

  let grossWeightG =
    carton.emptyBoxWeightG + item.unitWeightG;

  for (const placement of placements) {
    const placedItem = itemById.get(placement.itemId);

    if (
      placedItem === undefined ||
      placedItem.unitWeightG === undefined
    ) {
      return true;
    }

    grossWeightG += placedItem.unitWeightG;
  }

  return grossWeightG <= carton.maxGrossWeightG;
}

function findPlacement(
  item: Item,
  instanceIndex: number,
  openCarton: OpenCarton,
  itemById: ReadonlyMap<string, Item>
): ItemPlacement | undefined {
  const rotations =
    ROTATIONS_BY_POLICY[item.constraints.rotationPolicy];

  const points = getCandidatePoints(
    openCarton.candidate.placements
  );

  for (const point of points) {
    for (const rotation of rotations) {
      const dimensions = getRotatedDimensions(
        item.dimensions,
        rotation
      );

      if (
        !fitsInsideCarton(
          point,
          dimensions.length,
          dimensions.width,
          dimensions.height,
          openCarton.carton
        )
      ) {
        continue;
      }

      if (
        !weightAllowsPlacement(
          openCarton.carton,
          item,
          openCarton.candidate.placements,
          itemById
        )
      ) {
        continue;
      }

      const placement: ItemPlacement = {
        itemId: item.id,
        instanceIndex,
        x: point.x,
        y: point.y,
        z: point.z,
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        rotation,
      };

      if (
        openCarton.candidate.placements.some(existing =>
          overlaps(placement, existing)
        )
      ) {
        continue;
      }

      return placement;
    }
  }

  return undefined;
}

function rotationFitsEmptyCarton(
  item: Item,
  carton: Carton,
  rotations: readonly PlacementRotation[]
): boolean {
  return rotations.some(rotation => {
    const dimensions = getRotatedDimensions(
      item.dimensions,
      rotation
    );

    return fitsInsideCarton(
      { x: 0, y: 0, z: 0 },
      dimensions.length,
      dimensions.width,
      dimensions.height,
      carton
    );
  });
}

function classifyUnplacedReason(
  item: Item,
  input: SolverInput,
  usage: ReadonlyMap<string, number>,
  itemById: ReadonlyMap<string, Item>
): UnplacedReason {
  const allowedRotations =
    ROTATIONS_BY_POLICY[item.constraints.rotationPolicy];

  const geometricallyAllowed = input.cartons.filter(carton =>
    rotationFitsEmptyCarton(
      item,
      carton,
      allowedRotations
    )
  );

  const weightFeasible = geometricallyAllowed.filter(carton =>
    weightAllowsPlacement(
      carton,
      item,
      [],
      itemById
    )
  );

  if (
    geometricallyAllowed.length > 0 &&
    weightFeasible.length === 0
  ) {
    return 'weight-limit';
  }

  if (
    weightFeasible.length > 0 &&
    weightFeasible.every(
      carton => !canOpenCarton(carton, usage)
    )
  ) {
    return 'inventory-exhausted';
  }

  if (geometricallyAllowed.length === 0) {
    const allowedSet = new Set<PlacementRotation>(
      allowedRotations
    );

    const forbiddenRotations =
      VALID_PLACEMENT_ROTATIONS.filter(
        rotation => !allowedSet.has(rotation)
      );

    const forbiddenFit = input.cartons.some(carton =>
      canOpenCarton(carton, usage) &&
      rotationFitsEmptyCarton(
        item,
        carton,
        forbiddenRotations
      )
    );

    if (forbiddenFit) {
      return 'constraint-conflict';
    }
  }

  return 'no-fitting-carton';
}

function deriveStatus(
  requestedCount: number,
  placedCount: number
): PlanStatus {
  if (requestedCount === 0) {
    return 'feasible';
  }

  if (placedCount === requestedCount) {
    return 'feasible';
  }

  if (placedCount > 0) {
    return 'partial';
  }

  return 'infeasible';
}

function solveCandidate(input: SolverInput): SolverCandidatePlan {
  const openCartons: OpenCarton[] = [];
  const unplacedItems: SolverCandidatePlan['unplacedItems'] = [];

  const usage = new Map<string, number>();

  const itemById = new Map(
    input.items.map(item => [item.id, item])
  );

  let requestedCount = 0;
  let placedCount = 0;

  for (const item of input.items) {
    requestedCount += item.quantity;

    for (
      let instanceIndex = 0;
      instanceIndex < item.quantity;
      instanceIndex++
    ) {
      let placed = false;

      for (const openCarton of openCartons) {
        const placement = findPlacement(
          item,
          instanceIndex,
          openCarton,
          itemById
        );

        if (placement === undefined) {
          continue;
        }

        openCarton.candidate.placements.push(placement);
        placedCount++;
        placed = true;
        break;
      }

      if (placed) {
        continue;
      }

      for (const carton of input.cartons) {
        if (!canOpenCarton(carton, usage)) {
          continue;
        }

        const candidate: SolverCandidateCarton = {
          cartonId: carton.id,
          placements: [],
        };

        const openCarton: OpenCarton = {
          carton,
          candidate,
        };

        const placement = findPlacement(
          item,
          instanceIndex,
          openCarton,
          itemById
        );

        if (placement === undefined) {
          continue;
        }

        candidate.placements.push(placement);
        openCartons.push(openCarton);

        usage.set(
          carton.id,
          (usage.get(carton.id) ?? 0) + 1
        );

        placedCount++;
        placed = true;
        break;
      }

      if (!placed) {
        unplacedItems.push({
          itemId: item.id,
          instanceIndex,
          reason: classifyUnplacedReason(
            item,
            input,
            usage,
            itemById
          ),
        });
      }
    }
  }

  return {
    status: deriveStatus(
      requestedCount,
      placedCount
    ),
    cartons: openCartons.map(
      openCarton => openCarton.candidate
    ),
    unplacedItems,
  };
}

export class BaselineSolver implements SolverAdapter {
  async solve(input: SolverInput): Promise<SolverOutput> {
    const startedAt = Date.now();

    const candidate = solveCandidate(input);

    return {
      candidates: [candidate],
      solverMeta: {
        solverId: 'packmetry-baseline',
        solverVersion: '1',
        durationMs: Date.now() - startedAt,
        deterministic: true,
      },
    };
  }
}