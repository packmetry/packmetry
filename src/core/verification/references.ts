import type {
  SolverCandidatePlan,
  SolverInput,
} from '../solver/contracts.js';
import type { VerificationIssue } from './contracts.js';

export function collectReferenceAndQuantityIssues(
  input: SolverInput,
  candidate: SolverCandidatePlan
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];

  const itemById = new Map<string, SolverInput['items'][number]>();
  for (const item of input.items) {
    itemById.set(item.id, item);
  }

  const cartonIds = new Set<string>();
  for (const carton of input.cartons) {
    cartonIds.add(carton.id);
  }

  const occurrenceCounts = new Map<string, Map<number, number>>();

  function recordValidInstance(itemId: string, instanceIndex: number): void {
    let byInstance = occurrenceCounts.get(itemId);

    if (!byInstance) {
      byInstance = new Map<number, number>();
      occurrenceCounts.set(itemId, byInstance);
    }

    byInstance.set(
      instanceIndex,
      (byInstance.get(instanceIndex) ?? 0) + 1
    );
  }

  for (const [cartonIndex, candidateCarton] of candidate.cartons.entries()) {
    if (!cartonIds.has(candidateCarton.cartonId)) {
      issues.push({
        code: 'unknown-carton',
        message: `Carton "${candidateCarton.cartonId}" does not exist in solver input`,
        cartonId: candidateCarton.cartonId,
        cartonIndex,
      });
    }

    for (const placement of candidateCarton.placements) {
      const item = itemById.get(placement.itemId);

      if (!item) {
        issues.push({
          code: 'unknown-item',
          message: `Item "${placement.itemId}" referenced by placement does not exist in solver input`,
          itemId: placement.itemId,
          instanceIndex: placement.instanceIndex,
          cartonId: candidateCarton.cartonId,
          cartonIndex,
        });
        continue;
      }

      if (
        !Number.isInteger(placement.instanceIndex) ||
        placement.instanceIndex < 0 ||
        placement.instanceIndex >= item.quantity
      ) {
        issues.push({
          code: 'invalid-instance',
          message: `Instance ${placement.instanceIndex} is invalid for item "${placement.itemId}"`,
          itemId: placement.itemId,
          instanceIndex: placement.instanceIndex,
          cartonId: candidateCarton.cartonId,
          cartonIndex,
        });
        continue;
      }

      recordValidInstance(placement.itemId, placement.instanceIndex);
    }
  }

  for (const unplacedItem of candidate.unplacedItems) {
    const item = itemById.get(unplacedItem.itemId);

    if (!item) {
      issues.push({
        code: 'unknown-item',
        message: `Item "${unplacedItem.itemId}" referenced by unplaced item does not exist in solver input`,
        itemId: unplacedItem.itemId,
        instanceIndex: unplacedItem.instanceIndex,
      });
      continue;
    }

    if (
      !Number.isInteger(unplacedItem.instanceIndex) ||
      unplacedItem.instanceIndex < 0 ||
      unplacedItem.instanceIndex >= item.quantity
    ) {
      issues.push({
        code: 'invalid-instance',
        message: `Instance ${unplacedItem.instanceIndex} is invalid for item "${unplacedItem.itemId}"`,
        itemId: unplacedItem.itemId,
        instanceIndex: unplacedItem.instanceIndex,
      });
      continue;
    }

    recordValidInstance(unplacedItem.itemId, unplacedItem.instanceIndex);
  }

  for (const item of input.items) {
    const byInstance = occurrenceCounts.get(item.id);

    for (let instanceIndex = 0; instanceIndex < item.quantity; instanceIndex++) {
      const count = byInstance?.get(instanceIndex) ?? 0;

      if (count !== 1) {
        issues.push({
          code: 'quantity-mismatch',
          message: `Item "${item.id}" instance ${instanceIndex} appears ${count} times; expected exactly once`,
          itemId: item.id,
          instanceIndex,
        });
      }
    }
  }

  return issues;
}