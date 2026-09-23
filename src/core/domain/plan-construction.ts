import type { Carton } from './carton.js';
import type { PackingPlan } from './packing-plan.js';
import { validatePackingPlan } from './packing-plan.js';
import type {
  CartonMetrics,
  PlanMetrics,
  SolverMeta,
  UnplacedItem,
} from './plan-contracts.js';
import type { ItemPlacement, PlanStatus } from './result.js';
import type { CandidateVerificationResult } from '../solver/integration.js';
import type {
  SolverCandidateCarton,
  SolverInput,
} from '../solver/contracts.js';

function cloneCarton(carton: Carton): Carton {
  return {
    ...carton,
    internalDimensions: {
      length: carton.internalDimensions.length,
      width: carton.internalDimensions.width,
      height: carton.internalDimensions.height,
    },
    ...(carton.externalDimensions
      ? {
          externalDimensions: {
            length: carton.externalDimensions.length,
            width: carton.externalDimensions.width,
            height: carton.externalDimensions.height,
          },
        }
      : {}),
  };
}

function clonePlacement(placement: ItemPlacement): ItemPlacement {
  return {
    itemId: placement.itemId,
    instanceIndex: placement.instanceIndex,
    x: placement.x,
    y: placement.y,
    z: placement.z,
    length: placement.length,
    width: placement.width,
    height: placement.height,
    rotation: placement.rotation,
  };
}

function cloneUnplacedItem(item: UnplacedItem): UnplacedItem {
  return {
    itemId: item.itemId,
    instanceIndex: item.instanceIndex,
    reason: item.reason,
  };
}

function buildPackedCarton(
  input: SolverInput,
  candidateCarton: SolverCandidateCarton
): PackingPlan['cartons'][number] {
  const sourceCarton = input.cartons.find(
    carton => carton.id === candidateCarton.cartonId
  );

  if (!sourceCarton) {
    throw new Error(
      `Verified candidate referenced unknown carton: ${candidateCarton.cartonId}`
    );
  }

  const carton = cloneCarton(sourceCarton);
  const placements = candidateCarton.placements.map(clonePlacement);

  const itemVolumeMm3 = placements.reduce(
    (sum, placement) =>
      sum +
      placement.length *
        placement.width *
        placement.height,
    0
  );

  const cartonVolumeMm3 =
    carton.internalDimensions.length *
    carton.internalDimensions.width *
    carton.internalDimensions.height;

  const metrics: CartonMetrics = {
    itemCount: placements.length,
    itemVolumeMm3,
    cartonVolumeMm3,
    emptyVolumeMm3: cartonVolumeMm3 - itemVolumeMm3,
    utilization: itemVolumeMm3 / cartonVolumeMm3,
  };

  let contentsWeightG = 0;
  let contentsWeightKnown = true;

  for (const placement of placements) {
    const item = input.items.find(
      candidateItem => candidateItem.id === placement.itemId
    );

    if (!item) {
      throw new Error(
        `Verified candidate referenced unknown item: ${placement.itemId}`
      );
    }

    if (item.unitWeightG === undefined) {
      contentsWeightKnown = false;
      break;
    }

    contentsWeightG += item.unitWeightG;
  }

  if (placements.length === 0 || contentsWeightKnown) {
    metrics.contentsWeightG = contentsWeightG;

    if (carton.emptyBoxWeightG !== undefined) {
      metrics.grossWeightG =
        contentsWeightG + carton.emptyBoxWeightG;
    }
  }

  return {
    carton,
    placements,
    metrics,
  };
}

function deriveStatus(
  input: SolverInput,
  candidate: CandidateVerificationResult['candidate']
): PlanStatus {
  const requestedItemCount = input.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const placedItemCount = candidate.cartons.reduce(
    (sum, carton) => sum + carton.placements.length,
    0
  );

  if (requestedItemCount === 0) {
    return 'feasible';
  }

  if (placedItemCount === requestedItemCount) {
    return 'feasible';
  }

  if (
    candidate.unplacedItems.some(
      item => item.reason === 'solver-limit-reached'
    )
  ) {
    return 'limit_reached';
  }

  if (placedItemCount > 0) {
    return 'partial';
  }

  return 'infeasible';
}

function buildPlanMetrics(
  cartons: PackingPlan['cartons'],
  unplacedItems: UnplacedItem[]
): PlanMetrics {
  const metrics: PlanMetrics = {
    cartonCount: cartons.length,
    placedItemCount: cartons.reduce(
      (sum, carton) => sum + carton.metrics.itemCount,
      0
    ),
    unplacedItemCount: unplacedItems.length,
    itemVolumeMm3: cartons.reduce(
      (sum, carton) => sum + carton.metrics.itemVolumeMm3,
      0
    ),
    cartonVolumeMm3: cartons.reduce(
      (sum, carton) => sum + carton.metrics.cartonVolumeMm3,
      0
    ),
    emptyVolumeMm3: cartons.reduce(
      (sum, carton) => sum + carton.metrics.emptyVolumeMm3,
      0
    ),
    utilization: 0,
  };

  metrics.utilization =
    metrics.cartonVolumeMm3 === 0
      ? 0
      : metrics.itemVolumeMm3 / metrics.cartonVolumeMm3;

  if (
    cartons.length === 0 ||
    cartons.every(
      carton => carton.metrics.contentsWeightG !== undefined
    )
  ) {
    metrics.totalContentsWeightG = cartons.reduce(
      (sum, carton) =>
        sum + (carton.metrics.contentsWeightG ?? 0),
      0
    );
  }

  if (
    cartons.length === 0 ||
    cartons.every(
      carton => carton.metrics.grossWeightG !== undefined
    )
  ) {
    metrics.totalGrossWeightG = cartons.reduce(
      (sum, carton) => sum + (carton.metrics.grossWeightG ?? 0),
      0
    );
  }

  if (
    cartons.length === 0 ||
    cartons.every(carton => carton.carton.costPerBox !== undefined)
  ) {
    metrics.totalCartonCost = cartons.reduce(
      (sum, carton) => sum + (carton.carton.costPerBox ?? 0),
      0
    );
  }

  return metrics;
}

export function constructPackingPlan(
  planId: string,
  input: SolverInput,
  verifiedCandidate: CandidateVerificationResult,
  solverMeta: SolverMeta
): PackingPlan {
  if (!verifiedCandidate.verification.valid) {
    throw new Error(
      'Cannot construct PackingPlan from invalid verified candidate'
    );
  }

  const candidate = verifiedCandidate.candidate;

  const cartons = candidate.cartons.map(candidateCarton =>
    buildPackedCarton(input, candidateCarton)
  );

  const unplacedItems =
    candidate.unplacedItems.map(cloneUnplacedItem);

  const plan: PackingPlan = {
    id: planId,
    status: deriveStatus(input, candidate),
    objective: {
      kind: input.objective.kind,
    },
    cartons,
    unplacedItems,
    metrics: buildPlanMetrics(cartons, unplacedItems),
    explanations: [],
    solverMeta: {
      solverId: solverMeta.solverId,
      ...(solverMeta.solverVersion !== undefined
        ? { solverVersion: solverMeta.solverVersion }
        : {}),
      durationMs: solverMeta.durationMs,
      deterministic: solverMeta.deterministic,
    },
  };

  validatePackingPlan(plan);

  return plan;
}