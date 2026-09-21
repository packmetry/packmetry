/**
 * PackingPlan domain model for Packmetry.
 *
 * Canonical result model for packing solutions.
 *
 * @module domain/packing-plan
 */

import type { PlanStatus } from './result.js';
import type { OptimizationObjective } from './objectives.js';
import type { PackedCarton } from './packed-carton.js';
import type { UnplacedItem, PlanMetrics, Explanation, SolverMeta } from './plan-contracts.js';

import { ValidationError } from '../units/types.js';
import { validateOptimizationObjective } from './objectives.js';
import { validatePackedCarton } from './packed-carton.js';
import { validateUnplacedItem, validatePlanMetrics, validateExplanation, validateSolverMeta } from './plan-contracts.js';

/**
 * Packing plan representing a complete packing solution.
 */
export interface PackingPlan {
  /** Unique identifier for this packing plan. */
  id: string;

  /** Feasibility status of the plan. */
  status: PlanStatus;

  /** Optimization objective used to generate this plan. */
  objective: OptimizationObjective;

  /** Cartons that have been packed. */
  cartons: PackedCarton[];

  /** Items that could not be placed. */
  unplacedItems: UnplacedItem[];

  /** Overall metrics for the plan. */
  metrics: PlanMetrics;

  /** Human-readable explanations about the result. */
  explanations: Explanation[];

  /** Metadata about the solver that produced this plan. */
  solverMeta: SolverMeta;
}

/**
 * Valid status values for a PackingPlan.
 */
const VALID_STATUSES: readonly PlanStatus[] = [
  'feasible',
  'partial',
  'infeasible',
  'limit_reached',
] as const;

/**
 * Validates a PackingPlan object.
 *
 * @param value - The value to validate
 * @throws {ValidationError} If any validation fails
 */
export function validatePackingPlan(value: unknown): asserts value is PackingPlan {
  // 1. require object
  if (value === null || typeof value !== 'object') {
    throw new ValidationError('PackingPlan must be an object');
  }

  const plan = value as Record<string, unknown>;

  // 2. id must be string (master spec only says string, no non-empty/trim rule)
  if (typeof plan.id !== 'string') {
    throw new ValidationError('PackingPlan.id must be a string');
  }

  // 3. status must be exactly: feasible, partial, infeasible, limit_reached
  if (typeof plan.status !== 'string') {
    throw new ValidationError('PackingPlan.status must be a string');
  }
  if (!VALID_STATUSES.includes(plan.status as PlanStatus)) {
    throw new ValidationError(
      `Invalid PackingPlan.status: '${plan.status}'. Must be one of: ${VALID_STATUSES.map(s => `'${s}'`).join(', ')}`
    );
  }

  // 4. validate objective with existing validateOptimizationObjective()
  if (!plan.objective) {
    throw new ValidationError('PackingPlan.objective is required');
  }
  validateOptimizationObjective(plan.objective as { kind: unknown });

  // 5. cartons must be array; validate each with validatePackedCarton()
  if (!plan.cartons) {
    throw new ValidationError('PackingPlan.cartons is required');
  }
  if (!Array.isArray(plan.cartons)) {
    throw new ValidationError('PackingPlan.cartons must be an array');
  }
  for (let i = 0; i < plan.cartons.length; i++) {
    try {
      validatePackedCarton(plan.cartons[i]);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`PackingPlan.cartons[${i}] is invalid: ${error.message}`);
      }
      throw error;
    }
  }

  // 6. unplacedItems must be array; validate each with validateUnplacedItem()
  if (!plan.unplacedItems) {
    throw new ValidationError('PackingPlan.unplacedItems is required');
  }
  if (!Array.isArray(plan.unplacedItems)) {
    throw new ValidationError('PackingPlan.unplacedItems must be an array');
  }
  for (let i = 0; i < plan.unplacedItems.length; i++) {
    try {
      validateUnplacedItem(plan.unplacedItems[i]);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`PackingPlan.unplacedItems[${i}] is invalid: ${error.message}`);
      }
      throw error;
    }
  }

  // 7. validate metrics with validatePlanMetrics()
  if (!plan.metrics) {
    throw new ValidationError('PackingPlan.metrics is required');
  }
  validatePlanMetrics(plan.metrics);

  // 8. explanations must be array; validate each with validateExplanation()
  if (!plan.explanations) {
    throw new ValidationError('PackingPlan.explanations is required');
  }
  if (!Array.isArray(plan.explanations)) {
    throw new ValidationError('PackingPlan.explanations must be an array');
  }
  for (let i = 0; i < plan.explanations.length; i++) {
    try {
      validateExplanation(plan.explanations[i]);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`PackingPlan.explanations[${i}] is invalid: ${error.message}`);
      }
      throw error;
    }
  }

  // 9. validate solverMeta with validateSolverMeta()
  if (!plan.solverMeta) {
    throw new ValidationError('PackingPlan.solverMeta is required');
  }
  validateSolverMeta(plan.solverMeta);
}