import type { RotationPolicy } from '../domain/constraints.js';
import {
  getRotatedDimensions,
  type ItemPlacement,
  type PlacementRotation,
} from '../domain/result.js';
import type {
  SolverCandidatePlan,
  SolverInput,
} from '../solver/contracts.js';
import type { VerificationIssue } from './contracts.js';

const GEOMETRY_TOLERANCE_MM = 1e-10;

function isValidInstance(
  item: SolverInput['items'][number],
  placement: ItemPlacement
): boolean {
  return (
    Number.isInteger(placement.instanceIndex) &&
    placement.instanceIndex >= 0 &&
    placement.instanceIndex < item.quantity
  );
}

function dimensionsMatchRotation(
  item: SolverInput['items'][number],
  placement: ItemPlacement
): boolean {
  const expected = getRotatedDimensions(
    item.dimensions,
    placement.rotation
  );

  return (
    Math.abs(placement.length - expected.length) <=
      GEOMETRY_TOLERANCE_MM &&
    Math.abs(placement.width - expected.width) <=
      GEOMETRY_TOLERANCE_MM &&
    Math.abs(placement.height - expected.height) <=
      GEOMETRY_TOLERANCE_MM
  );
}

function rotationAllowed(
  policy: RotationPolicy,
  rotation: PlacementRotation
): boolean {
  switch (policy) {
    case 'any':
      return true;

    case 'upright':
    case 'vertical-axis-only':
      return rotation === 'LWH' || rotation === 'WLH';

    case 'fixed':
      return rotation === 'LWH';
  }
}

function placementInsideCarton(
  placement: ItemPlacement,
  carton: SolverInput['cartons'][number]
): boolean {
  const dimensions = carton.internalDimensions;

  return (
    placement.x >= -GEOMETRY_TOLERANCE_MM &&
    placement.y >= -GEOMETRY_TOLERANCE_MM &&
    placement.z >= -GEOMETRY_TOLERANCE_MM &&
    placement.x + placement.length <=
      dimensions.length + GEOMETRY_TOLERANCE_MM &&
    placement.y + placement.width <=
      dimensions.width + GEOMETRY_TOLERANCE_MM &&
    placement.z + placement.height <=
      dimensions.height + GEOMETRY_TOLERANCE_MM
  );
}

function placementsOverlap(
  first: ItemPlacement,
  second: ItemPlacement
): boolean {
  const overlapX =
    Math.min(
      first.x + first.length,
      second.x + second.length
    ) - Math.max(first.x, second.x);

  const overlapY =
    Math.min(
      first.y + first.width,
      second.y + second.width
    ) - Math.max(first.y, second.y);

  const overlapZ =
    Math.min(
      first.z + first.height,
      second.z + second.height
    ) - Math.max(first.z, second.z);

  return (
    overlapX > GEOMETRY_TOLERANCE_MM &&
    overlapY > GEOMETRY_TOLERANCE_MM &&
    overlapZ > GEOMETRY_TOLERANCE_MM
  );
}

export function collectGeometryIssues(
  input: SolverInput,
  candidate: SolverCandidatePlan
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];

  const itemById = new Map(
    input.items.map(item => [item.id, item])
  );

  const cartonById = new Map(
    input.cartons.map(carton => [carton.id, carton])
  );

  for (
    let cartonIndex = 0;
    cartonIndex < candidate.cartons.length;
    cartonIndex++
  ) {
    const candidateCarton = candidate.cartons[cartonIndex];
    const carton = cartonById.get(candidateCarton.cartonId);

    if (!carton) {
      continue;
    }

    for (const placement of candidateCarton.placements) {
      const item = itemById.get(placement.itemId);

      if (!item || !isValidInstance(item, placement)) {
        continue;
      }

      if (!dimensionsMatchRotation(item, placement)) {
        issues.push({
          code: 'rotation-violation',
          message:
            `Placement dimensions for item "${placement.itemId}" ` +
            `instance ${placement.instanceIndex} do not match ` +
            `rotation ${placement.rotation}`,
          itemId: placement.itemId,
          instanceIndex: placement.instanceIndex,
          cartonId: candidateCarton.cartonId,
          cartonIndex,
        });
      }

      if (
        !rotationAllowed(
          item.constraints.rotationPolicy,
          placement.rotation
        )
      ) {
        issues.push({
          code: 'rotation-violation',
          message:
            `Rotation ${placement.rotation} is not allowed for ` +
            `item "${placement.itemId}" with policy ` +
            `"${item.constraints.rotationPolicy}"`,
          itemId: placement.itemId,
          instanceIndex: placement.instanceIndex,
          cartonId: candidateCarton.cartonId,
          cartonIndex,
        });
      }

      if (!placementInsideCarton(placement, carton)) {
        issues.push({
          code: 'boundary-violation',
          message:
            `Item "${placement.itemId}" instance ` +
            `${placement.instanceIndex} exceeds carton ` +
            `"${candidateCarton.cartonId}" boundaries`,
          itemId: placement.itemId,
          instanceIndex: placement.instanceIndex,
          cartonId: candidateCarton.cartonId,
          cartonIndex,
        });
      }
    }

    for (
      let firstIndex = 0;
      firstIndex < candidateCarton.placements.length;
      firstIndex++
    ) {
      const first = candidateCarton.placements[firstIndex];
      const firstItem = itemById.get(first.itemId);

      if (!firstItem || !isValidInstance(firstItem, first)) {
        continue;
      }

      for (
        let secondIndex = firstIndex + 1;
        secondIndex < candidateCarton.placements.length;
        secondIndex++
      ) {
        const second = candidateCarton.placements[secondIndex];
        const secondItem = itemById.get(second.itemId);

        if (!secondItem || !isValidInstance(secondItem, second)) {
          continue;
        }

        if (placementsOverlap(first, second)) {
          issues.push({
            code: 'overlap',
            message:
              `Item "${first.itemId}" instance ${first.instanceIndex} ` +
              `overlaps item "${second.itemId}" instance ` +
              `${second.instanceIndex} in carton ` +
              `"${candidateCarton.cartonId}"`,
            itemId: first.itemId,
            instanceIndex: first.instanceIndex,
            cartonId: candidateCarton.cartonId,
            cartonIndex,
          });
        }
      }
    }
  }

  return issues;
}