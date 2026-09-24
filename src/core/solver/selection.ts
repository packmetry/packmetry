import type { Carton } from '../domain/carton.js';
import type { Item } from '../domain/item.js';
import type { ObjectiveKind } from '../domain/objectives.js';
import type {
  SolverCandidatePlan,
  SolverInput,
} from './contracts.js';
import type { CandidateVerificationResult } from './integration.js';

export type CandidateSelectionResult =
  | {
      kind: 'selected';
      selectedCandidateIndex: number;
      rankedCandidateIndexes: number[];
    }
  | {
      kind: 'no-valid-candidate';
    }
  | {
      kind: 'objective-unsupported';
      objective: ObjectiveKind;
    }
  | {
      kind: 'insufficient-data';
      objective: ObjectiveKind;
      missingMetric: 'carton-cost' | 'gross-weight';
    };

interface CandidateMetrics {
  index: number;
  placedItemCount: number;
  unplacedItemCount: number;
  cartonCount: number;
  itemVolumeMm3: number;
  cartonVolumeMm3: number;
  emptyVolumeMm3: number;
  utilization: number;
  totalCartonCost?: number;
  maxGrossWeightG?: number;
  totalGrossWeightG?: number;
}

function resolveCarton(input: SolverInput, cartonId: string): Carton {
  const carton = input.cartons.find(candidate => candidate.id === cartonId);

  if (!carton) {
    throw new Error(`Verified candidate references unknown carton: ${cartonId}`);
  }

  return carton;
}

function resolveItem(input: SolverInput, itemId: string): Item {
  const item = input.items.find(candidate => candidate.id === itemId);

  if (!item) {
    throw new Error(`Verified candidate references unknown item: ${itemId}`);
  }

  return item;
}

function measureCandidate(
  input: SolverInput,
  candidate: SolverCandidatePlan,
  index: number
): CandidateMetrics {
  let placedItemCount = 0;
  let itemVolumeMm3 = 0;
  let cartonVolumeMm3 = 0;

  let cartonCostKnown = true;
  let totalCartonCost = 0;

  let grossWeightKnown = true;
  let maxGrossWeightG = 0;
  let totalGrossWeightG = 0;

  for (const candidateCarton of candidate.cartons) {
    const carton = resolveCarton(input, candidateCarton.cartonId);

    cartonVolumeMm3 +=
      carton.internalDimensions.length *
      carton.internalDimensions.width *
      carton.internalDimensions.height;

    if (carton.costPerBox === undefined) {
      cartonCostKnown = false;
    } else {
      totalCartonCost += carton.costPerBox;
    }

    let cartonGrossWeightG = 0;

    if (carton.emptyBoxWeightG === undefined) {
      grossWeightKnown = false;
    } else {
      cartonGrossWeightG += carton.emptyBoxWeightG;
    }

    for (const placement of candidateCarton.placements) {
      const item = resolveItem(input, placement.itemId);

      placedItemCount += 1;
      itemVolumeMm3 +=
        placement.length *
        placement.width *
        placement.height;

      if (item.unitWeightG === undefined) {
        grossWeightKnown = false;
      } else {
        cartonGrossWeightG += item.unitWeightG;
      }
    }

    if (grossWeightKnown) {
      totalGrossWeightG += cartonGrossWeightG;
      maxGrossWeightG = Math.max(maxGrossWeightG, cartonGrossWeightG);
    }
  }

  for (const unplacedItem of candidate.unplacedItems) {
    resolveItem(input, unplacedItem.itemId);
  }

  const emptyVolumeMm3 = cartonVolumeMm3 - itemVolumeMm3;

  return {
    index,
    placedItemCount,
    unplacedItemCount: candidate.unplacedItems.length,
    cartonCount: candidate.cartons.length,
    itemVolumeMm3,
    cartonVolumeMm3,
    emptyVolumeMm3,
    utilization:
      cartonVolumeMm3 === 0
        ? 0
        : itemVolumeMm3 / cartonVolumeMm3,
    ...(cartonCostKnown ? { totalCartonCost } : {}),
    ...(grossWeightKnown
      ? { maxGrossWeightG, totalGrossWeightG }
      : {}),
  };
}

function compareAscending(first: number, second: number): number {
  return first - second;
}

function compareDescending(first: number, second: number): number {
  return second - first;
}

function compareBalanced(
  first: CandidateMetrics,
  second: CandidateMetrics
): number {
  return (
    compareAscending(first.cartonCount, second.cartonCount) ||
    compareAscending(first.emptyVolumeMm3, second.emptyVolumeMm3) ||
    compareDescending(first.utilization, second.utilization) ||
    compareAscending(first.index, second.index)
  );
}

function compareLeastWastedVolume(
  first: CandidateMetrics,
  second: CandidateMetrics
): number {
  return (
    compareAscending(first.emptyVolumeMm3, second.emptyVolumeMm3) ||
    compareAscending(first.cartonVolumeMm3, second.cartonVolumeMm3) ||
    compareAscending(first.cartonCount, second.cartonCount) ||
    compareDescending(first.utilization, second.utilization) ||
    compareAscending(first.index, second.index)
  );
}

function compareEasierToCarry(
  first: CandidateMetrics,
  second: CandidateMetrics
): number {
  return (
    compareAscending(first.maxGrossWeightG!, second.maxGrossWeightG!) ||
    compareAscending(first.totalGrossWeightG!, second.totalGrossWeightG!) ||
    compareAscending(first.cartonCount, second.cartonCount) ||
    compareAscending(first.emptyVolumeMm3, second.emptyVolumeMm3) ||
    compareAscending(first.index, second.index)
  );
}

function compareCartonCost(
  first: CandidateMetrics,
  second: CandidateMetrics
): number {
  return (
    compareAscending(first.totalCartonCost!, second.totalCartonCost!) ||
    compareAscending(first.cartonCount, second.cartonCount) ||
    compareAscending(first.emptyVolumeMm3, second.emptyVolumeMm3) ||
    compareAscending(first.index, second.index)
  );
}

function bestCoverage(metrics: CandidateMetrics[]): CandidateMetrics[] {
  const maxPlacedItemCount = Math.max(
    ...metrics.map(candidate => candidate.placedItemCount)
  );

  const mostPlaced = metrics.filter(
    candidate => candidate.placedItemCount === maxPlacedItemCount
  );

  const minUnplacedItemCount = Math.min(
    ...mostPlaced.map(candidate => candidate.unplacedItemCount)
  );

  return mostPlaced.filter(
    candidate => candidate.unplacedItemCount === minUnplacedItemCount
  );
}

function selectedResult(
  ranked: CandidateMetrics[]
): CandidateSelectionResult {
  const rankedCandidateIndexes = ranked.map(candidate => candidate.index);

  return {
    kind: 'selected',
    selectedCandidateIndex: rankedCandidateIndexes[0]!,
    rankedCandidateIndexes,
  };
}

export function selectVerifiedCandidate(
  input: SolverInput,
  candidates: readonly CandidateVerificationResult[]
): CandidateSelectionResult {
  const validMetrics = candidates
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => result.verification.valid)
    .map(({ result, index }) =>
      measureCandidate(input, result.candidate, index)
    );

  if (validMetrics.length === 0) {
    return { kind: 'no-valid-candidate' };
  }

  const comparable = bestCoverage(validMetrics);
  const objective = input.objective.kind;

  switch (objective) {
    case 'balanced':
    case 'fewest-cartons':
      return selectedResult([...comparable].sort(compareBalanced));

    case 'least-wasted-volume':
      return selectedResult(
        [...comparable].sort(compareLeastWastedVolume)
      );

    case 'easier-to-carry':
      if (
        comparable.some(
          candidate =>
            candidate.maxGrossWeightG === undefined ||
            candidate.totalGrossWeightG === undefined
        )
      ) {
        return {
          kind: 'insufficient-data',
          objective,
          missingMetric: 'gross-weight',
        };
      }

      return selectedResult(
        [...comparable].sort(compareEasierToCarry)
      );

    case 'min-carton-cost':
      if (
        comparable.some(
          candidate => candidate.totalCartonCost === undefined
        )
      ) {
        return {
          kind: 'insufficient-data',
          objective,
          missingMetric: 'carton-cost',
        };
      }

      return selectedResult([...comparable].sort(compareCartonCost));

    case 'existing-inventory-first':
    case 'min-dim-weight':
      return {
        kind: 'objective-unsupported',
        objective,
      };
  }
}
