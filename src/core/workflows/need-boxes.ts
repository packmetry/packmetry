import type { Carton } from '../domain/carton.js';
import type { Item } from '../domain/item.js';
import type { OptimizationObjective } from '../domain/objectives.js';
import {
  planPacking,
  type CanonicalPlanningResult,
} from '../solver/pipeline.js';
import type {
  SolverAdapter,
  SolverInput,
} from '../solver/contracts.js';
import { generatePurchaseCartonCandidates } from './purchase-carton-candidates.js';

export interface NeedBoxesWorkflowInput {
  items: readonly Item[];
  objective: OptimizationObjective;
}

export type NeedBoxesCartonProvenance =
  'purchase-recommendation';

export interface PurchaseCartonRecommendation {
  cartonId: string;
  carton: Carton;
  quantity: number;
}

export interface NeedBoxesWorkflowResult {
  kind: 'need-boxes';
  planningResult: CanonicalPlanningResult;
  generatedCartons: Carton[];
  cartonProvenance: Record<
    string,
    NeedBoxesCartonProvenance
  >;
  purchaseRecommendations: PurchaseCartonRecommendation[];
}

function cloneItem(item: Item): Item {
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

function buildCartonProvenance(
  cartons: readonly Carton[]
): Record<string, NeedBoxesCartonProvenance> {
  const provenance: Record<
    string,
    NeedBoxesCartonProvenance
  > = {};

  for (const carton of cartons) {
    provenance[carton.id] = 'purchase-recommendation';
  }

  return provenance;
}

function buildPurchaseRecommendations(
  planningResult: CanonicalPlanningResult,
  generatedCartons: readonly Carton[]
): PurchaseCartonRecommendation[] {
  if (planningResult.kind !== 'planned') {
    return [];
  }

  const usage = new Map<string, number>();

  for (const packedCarton of planningResult.plan.cartons) {
    const cartonId = packedCarton.carton.id;

    usage.set(
      cartonId,
      (usage.get(cartonId) ?? 0) + 1
    );
  }

  const recommendations: PurchaseCartonRecommendation[] =
    [];

  for (const carton of generatedCartons) {
    const quantity = usage.get(carton.id) ?? 0;

    if (quantity === 0) {
      continue;
    }

    recommendations.push({
      cartonId: carton.id,
      carton,
      quantity,
    });
  }

  return recommendations;
}

/**
 * Run Mode 1: "I Need Boxes".
 *
 * The caller supplies items and an optimization objective, but no cartons.
 * Packmetry generates deterministic purchase-carton candidates and sends
 * them through the existing canonical planning pipeline.
 *
 * Every successful recommendation therefore comes from:
 *
 * generated cartons
 * -> solver
 * -> independent verification
 * -> verified candidate selection
 * -> canonical PackingPlan construction
 *
 * Generated carton dimensions are internal-dimension recommendations only.
 * They do not claim supplier availability, price, tare weight, stock, or
 * external dimensions.
 */
export async function planNeedBoxes(
  workflowId: string,
  solver: SolverAdapter,
  input: NeedBoxesWorkflowInput
): Promise<NeedBoxesWorkflowResult> {
  const planningItems = input.items.map(cloneItem);

  const generatedCartons =
    generatePurchaseCartonCandidates(planningItems);

  const solverInput: SolverInput = {
    items: planningItems,
    cartons: generatedCartons,
    objective: {
      kind: input.objective.kind,
    },
  };

  const planningResult = await planPacking(
    `${workflowId}:need`,
    solver,
    solverInput
  );

  return {
    kind: 'need-boxes',
    planningResult,
    generatedCartons,
    cartonProvenance:
      buildCartonProvenance(generatedCartons),
    purchaseRecommendations:
      buildPurchaseRecommendations(
        planningResult,
        generatedCartons
      ),
  };
}
