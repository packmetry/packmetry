import {
  createCarton,
  type Carton,
} from '../domain/carton.js';
import type { Item } from '../domain/item.js';
import { validateItem } from '../domain/item.js';
import type { OptimizationObjective } from '../domain/objectives.js';
import { ValidationError } from '../units/types.js';
import {
  planPacking,
  type CanonicalPlanningResult,
} from '../solver/pipeline.js';
import type {
  SolverAdapter,
  SolverInput,
} from '../solver/contracts.js';

export interface HaveBoxesWorkflowInput {
  items: readonly Item[];
  cartons: readonly Carton[];
  objective: OptimizationObjective;
}

export type HaveBoxesCartonProvenance =
  'existing-inventory';

export interface ExistingCartonUsage {
  cartonId: string;
  carton: Carton;
  usedQuantity: number;
  effectiveAvailability?: number;
  remainingQuantity?: number;
}

export interface HaveBoxesInventoryUsage {
  usedCartons: ExistingCartonUsage[];
  unusedCartons: ExistingCartonUsage[];
}

export interface HaveBoxesWorkflowResult {
  kind: 'have-boxes';
  planningResult: CanonicalPlanningResult;
  suppliedCartons: Carton[];
  cartonProvenance: Record<
    string,
    HaveBoxesCartonProvenance
  >;
  inventoryUsage: HaveBoxesInventoryUsage | null;
}

function cloneItem(item: Item): Item {
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
    quantity: item.quantity,
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

function cloneCarton(carton: Carton): Carton {
  return createCarton({
    id: carton.id,
    ...(carton.name !== undefined
      ? { name: carton.name }
      : {}),
    internalDimensions: {
      length: carton.internalDimensions.length,
      width: carton.internalDimensions.width,
      height: carton.internalDimensions.height,
    },
    ...(carton.quantityAvailable !== undefined
      ? {
          quantityAvailable:
            carton.quantityAvailable,
        }
      : {}),
    ...(carton.cartonCode !== undefined
      ? { cartonCode: carton.cartonCode }
      : {}),
    ...(carton.maxGrossWeightG !== undefined
      ? {
          maxGrossWeightG:
            carton.maxGrossWeightG,
        }
      : {}),
    ...(carton.emptyBoxWeightG !== undefined
      ? {
          emptyBoxWeightG:
            carton.emptyBoxWeightG,
        }
      : {}),
    ...(carton.costPerBox !== undefined
      ? { costPerBox: carton.costPerBox }
      : {}),
    ...(carton.stockQuantity !== undefined
      ? { stockQuantity: carton.stockQuantity }
      : {}),
    ...(carton.supplier !== undefined
      ? { supplier: carton.supplier }
      : {}),
    ...(carton.externalDimensions !== undefined
      ? {
          externalDimensions: {
            length:
              carton.externalDimensions.length,
            width:
              carton.externalDimensions.width,
            height:
              carton.externalDimensions.height,
          },
        }
      : {}),
    ...(carton.notes !== undefined
      ? { notes: carton.notes }
      : {}),
  });
}

function buildCartonProvenance(
  cartons: readonly Carton[]
): Record<string, HaveBoxesCartonProvenance> {
  const provenance: Record<
    string,
    HaveBoxesCartonProvenance
  > = {};

  for (const carton of cartons) {
    provenance[carton.id] = 'existing-inventory';
  }

  return provenance;
}

function getEffectiveAvailability(
  carton: Carton
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

function buildCartonUsage(
  carton: Carton,
  usedQuantity: number
): ExistingCartonUsage {
  const effectiveAvailability =
    getEffectiveAvailability(carton);

  return {
    cartonId: carton.id,
    carton,
    usedQuantity,
    ...(effectiveAvailability !== undefined
      ? {
          effectiveAvailability,
          remainingQuantity:
            effectiveAvailability - usedQuantity,
        }
      : {}),
  };
}

function buildInventoryUsage(
  planningResult: CanonicalPlanningResult,
  cartons: readonly Carton[]
): HaveBoxesInventoryUsage | null {
  if (planningResult.kind !== 'planned') {
    return null;
  }

  const usage = new Map<string, number>();

  for (const packedCarton of planningResult.plan.cartons) {
    const cartonId = packedCarton.carton.id;

    usage.set(
      cartonId,
      (usage.get(cartonId) ?? 0) + 1
    );
  }

  const usedCartons: ExistingCartonUsage[] = [];
  const unusedCartons: ExistingCartonUsage[] = [];

  for (const carton of cartons) {
    const summary = buildCartonUsage(
      carton,
      usage.get(carton.id) ?? 0
    );

    if (summary.usedQuantity > 0) {
      usedCartons.push(summary);
    } else {
      unusedCartons.push(summary);
    }
  }

  return {
    usedCartons,
    unusedCartons,
  };
}

/**
 * Run Mode 2: "I Already Have Boxes".
 *
 * The caller supplies the complete set of carton types that may be used.
 * This workflow does not generate purchase cartons and does not silently
 * switch to hybrid mode when the supplied inventory is insufficient.
 *
 * Existing quantityAvailable / stockQuantity values remain authoritative.
 * When both are present, the baseline solver and workflow summary use the
 * stricter limit.
 *
 * Inventory usage is derived only from the canonical verified PackingPlan.
 */
export async function planHaveBoxes(
  workflowId: string,
  solver: SolverAdapter,
  input: HaveBoxesWorkflowInput
): Promise<HaveBoxesWorkflowResult> {
  if (input.items.length === 0) {
    throw new ValidationError(
      'Have boxes workflow requires at least one item'
    );
  }

  if (input.cartons.length === 0) {
    throw new ValidationError(
      'Have boxes workflow requires at least one carton'
    );
  }

  const planningItems = input.items.map(cloneItem);
  const suppliedCartons = input.cartons.map(cloneCarton);

  const solverInput: SolverInput = {
    items: planningItems,
    cartons: suppliedCartons,
    objective: {
      kind: input.objective.kind,
    },
  };

  const planningResult = await planPacking(
    `${workflowId}:have`,
    solver,
    solverInput
  );

  return {
    kind: 'have-boxes',
    planningResult,
    suppliedCartons,
    cartonProvenance:
      buildCartonProvenance(suppliedCartons),
    inventoryUsage:
      buildInventoryUsage(
        planningResult,
        suppliedCartons
      ),
  };
}
