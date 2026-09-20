/**
 * Optimization objectives domain model for Packmetry.
 *
 * @module domain/objectives
 */

import { ValidationError } from '../units/types.js';

/**
 * Canonical optimization objective kinds.
 *
 * Maps human goals from the specification to canonical identifiers.
 */
export type ObjectiveKind =
  | 'balanced'
  | 'fewest-cartons'
  | 'least-wasted-volume'
  | 'easier-to-carry'
  | 'existing-inventory-first'
  | 'min-dim-weight'
  | 'min-carton-cost';

/**
 * A validated optimization objective.
 *
 * Currently only stores the objective kind; weighted objectives are future.
 */
export interface OptimizationObjective {
  /** The canonical objective kind. */
  kind: ObjectiveKind;
}

/**
 * All valid objective kinds in canonical order.
 */
export const VALID_OBJECTIVE_KINDS: readonly ObjectiveKind[] = [
  'balanced',
  'fewest-cartons',
  'least-wasted-volume',
  'easier-to-carry',
  'existing-inventory-first',
  'min-dim-weight',
  'min-carton-cost',
] as const;

/**
 * Default objective kind.
 */
export const DEFAULT_OBJECTIVE_KIND: ObjectiveKind = 'balanced';

/**
 * Create a validated optimization objective.
 *
 * @param kind - The objective kind
 * @returns A validated optimization objective
 * @throws {ValidationError} If kind is invalid
 */
export function createOptimizationObjective(kind: ObjectiveKind): OptimizationObjective {
  validateOptimizationObjective({ kind });
  return { kind };
}

/**
 * Validate an optimization objective.
 *
 * @param objective - The objective to validate
 * @throws {ValidationError} If objective or its kind is invalid
 */
export function validateOptimizationObjective(objective: { kind: unknown }): void {
  if (objective === null || typeof objective !== 'object') {
    throw new ValidationError('Optimization objective must be an object');
  }

  if (!('kind' in objective)) {
    throw new ValidationError('Optimization objective must have a kind property');
  }

  const kind = objective.kind;
  if (typeof kind !== 'string') {
    throw new ValidationError('Optimization objective kind must be a string');
  }

  if (!isValidObjectiveKind(kind)) {
    throw new ValidationError(
      `Invalid optimization objective kind: ${kind}. ` +
      `Valid kinds are: ${VALID_OBJECTIVE_KINDS.join(', ')}`
    );
  }
}

/**
 * Check if a string is a valid objective kind.
 *
 * @param candidate - The candidate string to check
 * @returns True if candidate is a valid objective kind
 */
export function isValidObjectiveKind(candidate: string): candidate is ObjectiveKind {
  // Type-safe check: candidate must be exactly one of the valid kinds
  return VALID_OBJECTIVE_KINDS.some((validKind) => validKind === candidate);
}