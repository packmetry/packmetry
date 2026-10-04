/**
 * Supporting contracts for packing result types.
 *
 * @module domain/plan-contracts
 */

import { ValidationError } from '../units/types.js';

/**
 * Enumeration of reasons why an item could not be placed.
 */
export type UnplacedReason =
  | 'no-fitting-carton'
  | 'inventory-exhausted'
  | 'weight-limit'
  | 'constraint-conflict'
  | 'solver-limit-reached';

/**
 * Represents an item instance that could not be placed.
 */
export interface UnplacedItem {
  /** Identifier of the item type (matches catalog) */
  itemId: string;
  /** Zero-based index distinguishing multiple instances of the same item */
  instanceIndex: number;
  /** Specific reason why this instance was not placed */
  reason: UnplacedReason;
}

/**
 * Metrics for a single packed carton.
 */
export interface CartonMetrics {
  /** Number of items placed in this carton */
  itemCount: number;
  /** Total volume of placed items (mm³) */
  itemVolumeMm3: number;
  /** Internal volume of the carton (mm³) */
  cartonVolumeMm3: number;
  /** Unused volume in carton (mm³) */
  emptyVolumeMm3: number;
  /** Item volume ÷ carton volume (0 to 1 inclusive) */
  utilization: number;
  /** Optional total weight of contents (grams) */
  contentsWeightG?: number;
  /** Optional total actual weight including carton tare (grams) */
  grossWeightG?: number;
  /** Optional dimensional weight derived from external carton dimensions (grams) */
  dimWeightG?: number;
  /** Optional greater of actual gross and dimensional weight (grams) */
  chargeableWeightG?: number;
}

/**
 * Metrics for the complete packing plan.
 */
export interface PlanMetrics {
  /** Total number of cartons in the plan */
  cartonCount: number;
  /** Total items successfully placed */
  placedItemCount: number;
  /** Total items that could not be placed */
  unplacedItemCount: number;
  /** Total volume of all placed items (mm³) */
  itemVolumeMm3: number;
  /** Total volume of all cartons used (mm³) */
  cartonVolumeMm3: number;
  /** Total unused volume across all cartons (mm³) */
  emptyVolumeMm3: number;
  /** Overall utilization (0 to 1 inclusive) */
  utilization: number;
  /** Optional total weight of all placed items (grams) */
  totalContentsWeightG?: number;
  /** Optional total actual weight including all carton tares (grams) */
  totalGrossWeightG?: number;
  /** Optional total dimensional weight across all cartons (grams) */
  totalDimWeightG?: number;
  /** Optional total estimated chargeable weight across all cartons (grams) */
  totalChargeableWeightG?: number;
  /** Optional total cost of cartons used */
  totalCartonCost?: number;
}

/**
 * Severity level for explanations.
 */
export type ExplanationLevel = 'info' | 'warning';

/**
 * Human-readable explanation about the result.
 */
export interface Explanation {
  /** Machine-readable identifier */
  code: string;
  /** Human-readable description */
  message: string;
  /** Severity of the explanation */
  level: ExplanationLevel;
}

/**
 * Metadata about the solver that produced the result.
 */
export interface SolverMeta {
  /** Identifier of the solver algorithm */
  solverId: string;
  /** Optional version identifier */
  solverVersion?: string;
  /** Processing time in milliseconds */
  durationMs: number;
  /** Whether results are reproducible with same inputs */
  deterministic: boolean;
}

/**
 * Validates an UnplacedReason value.
 * @param value - The value to validate
 * @throws {ValidationError} If value is not a valid UnplacedReason
 */
export function validateUnplacedReason(
  value: unknown
): asserts value is UnplacedReason {
  const validReasons: UnplacedReason[] = [
    'no-fitting-carton',
    'inventory-exhausted',
    'weight-limit',
    'constraint-conflict',
    'solver-limit-reached',
  ];

  if (
    typeof value !== 'string' ||
    !validReasons.includes(
      value as UnplacedReason
    )
  ) {
    throw new ValidationError(
      `Invalid UnplacedReason: '${value}'. Must be one of: ${validReasons
        .map(reason => `'${reason}'`)
        .join(', ')}`
    );
  }
}

/**
 * Validates an UnplacedItem object.
 * @param value - The object to validate
 * @throws {ValidationError} If any validation fails
 */
export function validateUnplacedItem(
  value: unknown
): asserts value is UnplacedItem {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    throw new ValidationError(
      'UnplacedItem must be an object'
    );
  }

  const item =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof item.itemId !==
    'string'
  ) {
    throw new ValidationError(
      'UnplacedItem.itemId must be a string'
    );
  }

  if (
    typeof item.instanceIndex !==
      'number' ||
    !Number.isFinite(
      item.instanceIndex
    )
  ) {
    throw new ValidationError(
      'UnplacedItem.instanceIndex must be a finite number'
    );
  }

  if (
    !Number.isInteger(
      item.instanceIndex
    )
  ) {
    throw new ValidationError(
      'UnplacedItem.instanceIndex must be an integer'
    );
  }

  if (
    item.instanceIndex < 0
  ) {
    throw new ValidationError(
      `UnplacedItem.instanceIndex must be ≥ 0, got: ${item.instanceIndex}`
    );
  }

  validateUnplacedReason(
    item.reason
  );
}

function validateOptionalNonNegativeMetric(
  metrics: Record<string, unknown>,
  key: string,
  label: string
): void {
  const value =
    metrics[key];

  if (
    value === undefined
  ) {
    return;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    throw new ValidationError(
      `${label} must be a finite number when provided`
    );
  }

  if (
    value < 0
  ) {
    throw new ValidationError(
      `${label} must be ≥ 0 when provided, got: ${value}`
    );
  }
}

/**
 * Validates a CartonMetrics object.
 * @param value - The object to validate
 * @throws {ValidationError} If any validation fails
 */
export function validateCartonMetrics(
  value: unknown
): asserts value is CartonMetrics {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    throw new ValidationError(
      'CartonMetrics must be an object'
    );
  }

  const metrics =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof metrics.itemCount !==
      'number' ||
    !Number.isFinite(
      metrics.itemCount
    )
  ) {
    throw new ValidationError(
      'CartonMetrics.itemCount must be a finite number'
    );
  }

  if (
    !Number.isInteger(
      metrics.itemCount
    )
  ) {
    throw new ValidationError(
      'CartonMetrics.itemCount must be an integer'
    );
  }

  if (
    metrics.itemCount < 0
  ) {
    throw new ValidationError(
      `CartonMetrics.itemCount must be ≥ 0, got: ${metrics.itemCount}`
    );
  }

  if (
    typeof metrics.itemVolumeMm3 !==
      'number' ||
    !Number.isFinite(
      metrics.itemVolumeMm3
    )
  ) {
    throw new ValidationError(
      'CartonMetrics.itemVolumeMm3 must be a finite number'
    );
  }

  if (
    metrics.itemVolumeMm3 < 0
  ) {
    throw new ValidationError(
      `CartonMetrics.itemVolumeMm3 must be ≥ 0, got: ${metrics.itemVolumeMm3}`
    );
  }

  if (
    typeof metrics.cartonVolumeMm3 !==
      'number' ||
    !Number.isFinite(
      metrics.cartonVolumeMm3
    )
  ) {
    throw new ValidationError(
      'CartonMetrics.cartonVolumeMm3 must be a finite number'
    );
  }

  if (
    metrics.cartonVolumeMm3 < 0
  ) {
    throw new ValidationError(
      `CartonMetrics.cartonVolumeMm3 must be ≥ 0, got: ${metrics.cartonVolumeMm3}`
    );
  }

  if (
    typeof metrics.emptyVolumeMm3 !==
      'number' ||
    !Number.isFinite(
      metrics.emptyVolumeMm3
    )
  ) {
    throw new ValidationError(
      'CartonMetrics.emptyVolumeMm3 must be a finite number'
    );
  }

  if (
    metrics.emptyVolumeMm3 < 0
  ) {
    throw new ValidationError(
      `CartonMetrics.emptyVolumeMm3 must be ≥ 0, got: ${metrics.emptyVolumeMm3}`
    );
  }

  if (
    typeof metrics.utilization !==
      'number' ||
    !Number.isFinite(
      metrics.utilization
    )
  ) {
    throw new ValidationError(
      'CartonMetrics.utilization must be a finite number'
    );
  }

  if (
    metrics.utilization < 0 ||
    metrics.utilization > 1
  ) {
    throw new ValidationError(
      `CartonMetrics.utilization must be between 0 and 1 inclusive, got: ${metrics.utilization}`
    );
  }

  validateOptionalNonNegativeMetric(
    metrics,
    'contentsWeightG',
    'CartonMetrics.contentsWeightG'
  );

  validateOptionalNonNegativeMetric(
    metrics,
    'grossWeightG',
    'CartonMetrics.grossWeightG'
  );

  validateOptionalNonNegativeMetric(
    metrics,
    'dimWeightG',
    'CartonMetrics.dimWeightG'
  );

  validateOptionalNonNegativeMetric(
    metrics,
    'chargeableWeightG',
    'CartonMetrics.chargeableWeightG'
  );
}

/**
 * Validates a PlanMetrics object.
 * @param value - The object to validate
 * @throws {ValidationError} If any validation fails
 */
export function validatePlanMetrics(
  value: unknown
): asserts value is PlanMetrics {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    throw new ValidationError(
      'PlanMetrics must be an object'
    );
  }

  const metrics =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof metrics.cartonCount !==
      'number' ||
    !Number.isFinite(
      metrics.cartonCount
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.cartonCount must be a finite number'
    );
  }

  if (
    !Number.isInteger(
      metrics.cartonCount
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.cartonCount must be an integer'
    );
  }

  if (
    metrics.cartonCount < 0
  ) {
    throw new ValidationError(
      `PlanMetrics.cartonCount must be ≥ 0, got: ${metrics.cartonCount}`
    );
  }

  if (
    typeof metrics.placedItemCount !==
      'number' ||
    !Number.isFinite(
      metrics.placedItemCount
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.placedItemCount must be a finite number'
    );
  }

  if (
    !Number.isInteger(
      metrics.placedItemCount
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.placedItemCount must be an integer'
    );
  }

  if (
    metrics.placedItemCount < 0
  ) {
    throw new ValidationError(
      `PlanMetrics.placedItemCount must be ≥ 0, got: ${metrics.placedItemCount}`
    );
  }

  if (
    typeof metrics.unplacedItemCount !==
      'number' ||
    !Number.isFinite(
      metrics.unplacedItemCount
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.unplacedItemCount must be a finite number'
    );
  }

  if (
    !Number.isInteger(
      metrics.unplacedItemCount
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.unplacedItemCount must be an integer'
    );
  }

  if (
    metrics.unplacedItemCount < 0
  ) {
    throw new ValidationError(
      `PlanMetrics.unplacedItemCount must be ≥ 0, got: ${metrics.unplacedItemCount}`
    );
  }

  if (
    typeof metrics.itemVolumeMm3 !==
      'number' ||
    !Number.isFinite(
      metrics.itemVolumeMm3
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.itemVolumeMm3 must be a finite number'
    );
  }

  if (
    metrics.itemVolumeMm3 < 0
  ) {
    throw new ValidationError(
      `PlanMetrics.itemVolumeMm3 must be ≥ 0, got: ${metrics.itemVolumeMm3}`
    );
  }

  if (
    typeof metrics.cartonVolumeMm3 !==
      'number' ||
    !Number.isFinite(
      metrics.cartonVolumeMm3
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.cartonVolumeMm3 must be a finite number'
    );
  }

  if (
    metrics.cartonVolumeMm3 < 0
  ) {
    throw new ValidationError(
      `PlanMetrics.cartonVolumeMm3 must be ≥ 0, got: ${metrics.cartonVolumeMm3}`
    );
  }

  if (
    typeof metrics.emptyVolumeMm3 !==
      'number' ||
    !Number.isFinite(
      metrics.emptyVolumeMm3
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.emptyVolumeMm3 must be a finite number'
    );
  }

  if (
    metrics.emptyVolumeMm3 < 0
  ) {
    throw new ValidationError(
      `PlanMetrics.emptyVolumeMm3 must be ≥ 0, got: ${metrics.emptyVolumeMm3}`
    );
  }

  if (
    typeof metrics.utilization !==
      'number' ||
    !Number.isFinite(
      metrics.utilization
    )
  ) {
    throw new ValidationError(
      'PlanMetrics.utilization must be a finite number'
    );
  }

  if (
    metrics.utilization < 0 ||
    metrics.utilization > 1
  ) {
    throw new ValidationError(
      `PlanMetrics.utilization must be between 0 and 1 inclusive, got: ${metrics.utilization}`
    );
  }

  validateOptionalNonNegativeMetric(
    metrics,
    'totalContentsWeightG',
    'PlanMetrics.totalContentsWeightG'
  );

  validateOptionalNonNegativeMetric(
    metrics,
    'totalGrossWeightG',
    'PlanMetrics.totalGrossWeightG'
  );

  validateOptionalNonNegativeMetric(
    metrics,
    'totalDimWeightG',
    'PlanMetrics.totalDimWeightG'
  );

  validateOptionalNonNegativeMetric(
    metrics,
    'totalChargeableWeightG',
    'PlanMetrics.totalChargeableWeightG'
  );

  validateOptionalNonNegativeMetric(
    metrics,
    'totalCartonCost',
    'PlanMetrics.totalCartonCost'
  );
}

/**
 * Validates an ExplanationLevel value.
 * @param value - The value to validate
 * @throws {ValidationError} If value is not a valid ExplanationLevel
 */
export function validateExplanationLevel(
  value: unknown
): asserts value is ExplanationLevel {
  const validLevels: ExplanationLevel[] = [
    'info',
    'warning',
  ];

  if (
    typeof value !== 'string' ||
    !validLevels.includes(
      value as ExplanationLevel
    )
  ) {
    throw new ValidationError(
      `Invalid ExplanationLevel: '${value}'. Must be one of: ${validLevels
        .map(level => `'${level}'`)
        .join(', ')}`
    );
  }
}

/**
 * Validates an Explanation object.
 * @param value - The object to validate
 * @throws {ValidationError} If any validation fails
 */
export function validateExplanation(
  value: unknown
): asserts value is Explanation {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    throw new ValidationError(
      'Explanation must be an object'
    );
  }

  const explanation =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof explanation.code !==
    'string'
  ) {
    throw new ValidationError(
      'Explanation.code must be a string'
    );
  }

  if (
    explanation.code === ''
  ) {
    throw new ValidationError(
      'Explanation.code must be a non-empty string'
    );
  }

  if (
    typeof explanation.message !==
    'string'
  ) {
    throw new ValidationError(
      'Explanation.message must be a string'
    );
  }

  if (
    explanation.message === ''
  ) {
    throw new ValidationError(
      'Explanation.message must be a non-empty string'
    );
  }

  validateExplanationLevel(
    explanation.level
  );
}

/**
 * Validates a SolverMeta object.
 * @param value - The object to validate
 * @throws {ValidationError} If any validation fails
 */
export function validateSolverMeta(
  value: unknown
): asserts value is SolverMeta {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    throw new ValidationError(
      'SolverMeta must be an object'
    );
  }

  const meta =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof meta.solverId !==
    'string'
  ) {
    throw new ValidationError(
      'SolverMeta.solverId must be a string'
    );
  }

  if (
    meta.solverId === ''
  ) {
    throw new ValidationError(
      'SolverMeta.solverId must be a non-empty string'
    );
  }

  if (
    meta.solverVersion !==
    undefined
  ) {
    if (
      typeof meta.solverVersion !==
      'string'
    ) {
      throw new ValidationError(
        'SolverMeta.solverVersion must be a string when provided'
      );
    }

    if (
      meta.solverVersion === ''
    ) {
      throw new ValidationError(
        'SolverMeta.solverVersion must be a non-empty string when provided'
      );
    }
  }

  if (
    typeof meta.durationMs !==
      'number' ||
    !Number.isFinite(
      meta.durationMs
    )
  ) {
    throw new ValidationError(
      'SolverMeta.durationMs must be a finite number'
    );
  }

  if (
    meta.durationMs < 0
  ) {
    throw new ValidationError(
      `SolverMeta.durationMs must be ≥ 0, got: ${meta.durationMs}`
    );
  }

  if (
    typeof meta.deterministic !==
    'boolean'
  ) {
    throw new ValidationError(
      'SolverMeta.deterministic must be a boolean'
    );
  }
}