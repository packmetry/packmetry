import type { PackingPlan } from '../domain/packing-plan.js';
import { BaselineSolver } from '../solver/baseline.js';
import type { SolverAdapter } from '../solver/contracts.js';
import type { UnselectedCandidateSelection } from '../solver/pipeline.js';
import {
  planHaveBoxes,
  type HaveBoxesInventoryUsage,
} from '../workflows/have-boxes.js';
import {
  validateBatchPlanningInput,
  type BatchPlanningInput,
} from './contracts.js';

/** A plan can be partial or infeasible; always inspect its canonical status. */
export type BatchOrderOutcome =
  | {
      kind: 'plan';
      orderId: string;
      plan: PackingPlan;
      alternatives: PackingPlan[];
      inventoryUsage: HaveBoxesInventoryUsage;
    }
  | {
      kind: 'unselected';
      orderId: string;
      selection: UnselectedCandidateSelection;
    }
  | {
      kind: 'error';
      orderId: string;
      message: string;
    };

/** Progress counts completed orders, not internal solver iterations. */
export interface BatchExecutionProgress {
  completed: number;
  total: number;
  plansProduced: number;
  unselected: number;
  errors: number;
}

export interface BatchExecutionResult extends BatchExecutionProgress {
  status: 'completed' | 'cancelled';
  outcomes: BatchOrderOutcome[];
}

/**
 * The cancellation flag is observed BETWEEN orders. It cannot interrupt a
 * currently running solver. The future Web Worker can be terminated separately.
 */
export interface BatchExecutionOptions {
  signal?: { readonly aborted: boolean };
  onProgress?: (progress: BatchExecutionProgress) => void;
  /** Solver factory permits isolated unit tests and later worker adapters. */
  createSolver?: () => SolverAdapter;
}

/**
 * Execute one verified Have Boxes workflow per order, in deterministic order.
 * This is a headless sequential foundation, NOT a Web Worker implementation.
 *
 * Each order sees the same original carton availability, independently.
 * Aggregate demand is NOT stock reservation or proof of sufficient stock.
 * No input, browser storage or UI state is mutated by this function.
 */
export async function executeBatchPlanning(
  input: BatchPlanningInput,
  options: BatchExecutionOptions = {}
): Promise<BatchExecutionResult> {
  // Reject the complete batch before invoking solvers or notifying progress.
  validateBatchPlanningInput(input);

  const total = input.orders.length;
  const outcomes: BatchOrderOutcome[] = [];
  let plansProduced = 0;
  let unselected = 0;
  let errors = 0;

  const progress = (): BatchExecutionProgress => ({
    completed: outcomes.length,
    total,
    plansProduced,
    unselected,
    errors,
  });

  options.onProgress?.(progress());

  for (const [index, order] of input.orders.entries()) {
    if (options.signal?.aborted) break;

    let outcome: BatchOrderOutcome;
    try {
      const workflow = await planHaveBoxes(
        `batch-order-${index + 1}`,
        options.createSolver?.() ?? new BaselineSolver(),
        {
          items: order.items,
          cartons: input.cartons,
          objective: { kind: input.objective.kind },
          ...(input.dimensionalWeight !== undefined
            ? { dimensionalWeight: input.dimensionalWeight }
            : {}),
        }
      );

      if (workflow.planningResult.kind === 'not-planned') {
        outcome = {
          kind: 'unselected',
          orderId: order.orderId,
          selection: workflow.planningResult.selection,
        };
      } else if (workflow.inventoryUsage !== null) {
        outcome = {
          kind: 'plan',
          orderId: order.orderId,
          plan: workflow.planningResult.plan,
          alternatives: workflow.planningResult.alternatives,
          inventoryUsage: workflow.inventoryUsage,
        };
      } else {
        throw new Error('Verified plan is missing carton inventory usage.');
      }
    } catch (error) {
      // A failed order must not suppress subsequent independent orders.
      outcome = {
        kind: 'error',
        orderId: order.orderId,
        message: error instanceof Error ? error.message : 'Order planning failed.',
      };
    }

    outcomes.push(outcome);
    if (outcome.kind === 'plan') plansProduced++;
    else if (outcome.kind === 'unselected') unselected++;
    else errors++;

    // Keep user callbacks outside the catch above: callback errors are NOT
    // misreported as solver failures or silently swallowed.
    options.onProgress?.(progress());
  }

  return {
    status: outcomes.length === total ? 'completed' : 'cancelled',
    ...progress(),
    outcomes,
  };
}
