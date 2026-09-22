import type {
  SolverCandidatePlan,
  SolverInput,
} from '../solver/contracts.js';
import type { VerificationIssue } from './contracts.js';

function getInventoryLimit(
  carton: SolverInput['cartons'][number]
): number | undefined {
  const limits: number[] = [];

  if (carton.quantityAvailable !== undefined) {
    limits.push(carton.quantityAvailable);
  }

  if (carton.stockQuantity !== undefined) {
    limits.push(carton.stockQuantity);
  }

  if (limits.length === 0) {
    return undefined;
  }

  return Math.min(...limits);
}

function findFirstOveruseIndex(
  candidate: SolverCandidatePlan,
  cartonId: string,
  limit: number
): number | undefined {
  let count = 0;

  for (
    let cartonIndex = 0;
    cartonIndex < candidate.cartons.length;
    cartonIndex++
  ) {
    if (candidate.cartons[cartonIndex].cartonId !== cartonId) {
      continue;
    }

    count++;

    if (count > limit) {
      return cartonIndex;
    }
  }

  return undefined;
}

export function collectLimitIssues(
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

  const cartonUsage = new Map<string, number>();

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

    cartonUsage.set(
      carton.id,
      (cartonUsage.get(carton.id) ?? 0) + 1
    );

    if (
      carton.maxGrossWeightG === undefined ||
      carton.emptyBoxWeightG === undefined
    ) {
      continue;
    }

    let grossWeightG = carton.emptyBoxWeightG;
    let weightKnown = true;

    for (const placement of candidateCarton.placements) {
      const item = itemById.get(placement.itemId);

      if (!item || item.unitWeightG === undefined) {
        weightKnown = false;
        break;
      }

      grossWeightG += item.unitWeightG;
    }

    if (
      weightKnown &&
      grossWeightG > carton.maxGrossWeightG
    ) {
      issues.push({
        code: 'weight-limit',
        message:
          `Carton "${carton.id}" gross weight ${grossWeightG}g ` +
          `exceeds maximum ${carton.maxGrossWeightG}g`,
        cartonId: carton.id,
        cartonIndex,
      });
    }
  }

  for (const carton of input.cartons) {
    const usage = cartonUsage.get(carton.id) ?? 0;
    const limit = getInventoryLimit(carton);

    if (limit === undefined || usage <= limit) {
      continue;
    }

    issues.push({
      code: 'inventory-overuse',
      message:
        `Carton "${carton.id}" is used ${usage} times but ` +
        `inventory limit is ${limit}`,
      cartonId: carton.id,
      cartonIndex: findFirstOveruseIndex(
        candidate,
        carton.id,
        limit
      ),
    });
  }

  return issues;
}