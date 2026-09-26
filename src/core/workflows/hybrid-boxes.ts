import type { Carton } from '../domain/carton.js';
import {
  validateItem,
  type Item,
} from '../domain/item.js';
import type { OptimizationObjective } from '../domain/objectives.js';
import type { SolverAdapter } from '../solver/contracts.js';
import {
  planHaveBoxes,
  type HaveBoxesWorkflowResult,
} from './have-boxes.js';
import {
  planNeedBoxes,
  type NeedBoxesWorkflowResult,
} from './need-boxes.js';

export interface HybridBoxesWorkflowInput {
  items: readonly Item[];
  cartons: readonly Carton[];
  objective: OptimizationObjective;
}

export interface HybridRemainderInstanceMapping {
  itemId: string;
  supplementalInstanceIndex: number;
  originalInstanceIndex: number;
}

export interface HybridBoxesWorkflowResult {
  kind: 'hybrid';
  existing: HaveBoxesWorkflowResult;
  remainderItems: Item[];
  remainderInstanceMapping: HybridRemainderInstanceMapping[];
  supplemental: NeedBoxesWorkflowResult | null;
  replacementAlternative: NeedBoxesWorkflowResult | null;
}

function cloneItemWithQuantity(
  item: Item,
  quantity: number
): Item {
  validateItem(item);

  return {
    id: item.id,
    ...(item.name !== undefined
      ? { name: item.name }
      : {}),
    ...(item.sku !== undefined
      ? { sku: item.sku }
      : {}),
    dimensions: {
      length: item.dimensions.length,
      width: item.dimensions.width,
      height: item.dimensions.height,
    },
    quantity,
    ...(item.unitWeightG !== undefined
      ? { unitWeightG: item.unitWeightG }
      : {}),
    constraints: {
      rotationPolicy: item.constraints.rotationPolicy,
      fragile: item.constraints.fragile,
      paddingAllowanceMm:
        item.constraints.paddingAllowanceMm,
      spacingAllowanceMm:
        item.constraints.spacingAllowanceMm,
      stackable: item.constraints.stackable,
    },
  };
}

function buildRemainder(
  items: readonly Item[],
  existing: HaveBoxesWorkflowResult
): {
  items: Item[];
  mapping: HybridRemainderInstanceMapping[];
} {
  if (existing.planningResult.kind !== 'planned') {
    return {
      items: [],
      mapping: [],
    };
  }

  const unplacedByItemId = new Map<string, number[]>();

  for (const unplaced of existing.planningResult.plan
    .unplacedItems) {
    const indexes =
      unplacedByItemId.get(unplaced.itemId) ?? [];

    indexes.push(unplaced.instanceIndex);
    unplacedByItemId.set(unplaced.itemId, indexes);
  }

  const remainderItems: Item[] = [];
  const mapping: HybridRemainderInstanceMapping[] = [];
  const consumedItemIds = new Set<string>();

  for (const item of items) {
    const originalIndexes =
      unplacedByItemId.get(item.id);

    if (!originalIndexes || originalIndexes.length === 0) {
      continue;
    }

    const sortedOriginalIndexes = [
      ...originalIndexes,
    ].sort((left, right) => left - right);

    remainderItems.push(
      cloneItemWithQuantity(
        item,
        sortedOriginalIndexes.length
      )
    );

    sortedOriginalIndexes.forEach(
      (originalInstanceIndex, supplementalInstanceIndex) => {
        mapping.push({
          itemId: item.id,
          supplementalInstanceIndex,
          originalInstanceIndex,
        });
      }
    );

    consumedItemIds.add(item.id);
  }

  for (const itemId of unplacedByItemId.keys()) {
    if (!consumedItemIds.has(itemId)) {
      throw new Error(
        `Canonical existing plan references unknown item: ${itemId}`
      );
    }
  }

  return {
    items: remainderItems,
    mapping,
  };
}

/**
 * Run Mode 3: "Use What I Have, Then Tell Me What to Buy".
 *
 * This workflow is deliberately staged:
 *
 * 1. Plan only against caller-supplied existing cartons.
 * 2. Read the remainder only from the canonical verified existing plan.
 * 3. Reconstruct normalized remainder items while preserving an explicit
 *    mapping from supplemental local instance indexes back to the original
 *    item-instance indexes.
 * 4. Generate purchase cartons and canonically plan only that remainder.
 * 5. Keep a complete purchase-only replacement alternative separate for
 *    comparison. No automatic winner is chosen.
 *
 * The workflow never concatenates independently verified sub-plans into a
 * fabricated PackingPlan. Each sub-plan remains canonical and independently
 * verified through planPacking(...).
 */
export async function planHybridBoxes(
  workflowId: string,
  solver: SolverAdapter,
  input: HybridBoxesWorkflowInput
): Promise<HybridBoxesWorkflowResult> {
  const existing = await planHaveBoxes(
    `${workflowId}:existing`,
    solver,
    {
      items: input.items,
      cartons: input.cartons,
      objective: {
        kind: input.objective.kind,
      },
    }
  );

  if (existing.planningResult.kind !== 'planned') {
    return {
      kind: 'hybrid',
      existing,
      remainderItems: [],
      remainderInstanceMapping: [],
      supplemental: null,
      replacementAlternative: null,
    };
  }

  const remainder = buildRemainder(
    input.items,
    existing
  );

  if (remainder.items.length === 0) {
    return {
      kind: 'hybrid',
      existing,
      remainderItems: [],
      remainderInstanceMapping: [],
      supplemental: null,
      replacementAlternative: null,
    };
  }

  const supplemental = await planNeedBoxes(
    `${workflowId}:supplemental`,
    solver,
    {
      items: remainder.items,
      objective: {
        kind: input.objective.kind,
      },
    }
  );

  const replacementAlternative = await planNeedBoxes(
    `${workflowId}:replacement`,
    solver,
    {
      items: input.items,
      objective: {
        kind: input.objective.kind,
      },
    }
  );

  return {
    kind: 'hybrid',
    existing,
    remainderItems: remainder.items,
    remainderInstanceMapping: remainder.mapping,
    supplemental,
    replacementAlternative,
  };
}
