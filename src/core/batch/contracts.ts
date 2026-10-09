import type { Item } from '../domain/item.js';
import { validateItem } from '../domain/item.js';
import type { Carton } from '../domain/carton.js';
import { validateCarton } from '../domain/carton.js';
import type { ObjectiveKind, OptimizationObjective } from '../domain/objectives.js';
import { validateOptimizationObjective } from '../domain/objectives.js';
import type { DimensionalWeightSettings } from '../units/dimensional-weight.js';
import { validateDimensionalWeightSettings } from '../units/dimensional-weight.js';
import { ValidationError } from '../units/types.js';

/** Initial defensive limits for a browser-local batch (not performance guarantees). */
export const BATCH_V1_LIMITS = {
  maxOrders: 25,
  maxCartonTypes: 30,
  maxItemRowsPerOrder: 50,
  maxItemInstancesPerOrder: 200,
  maxTotalItemInstances: 1000,
} as const;

export type BatchObjectiveKind = Extract<
  ObjectiveKind,
  'balanced' | 'fewest-cartons' | 'least-wasted-volume' | 'min-dim-weight'
>;

/** Each order is independently planned against the same supplied carton choices. */
export interface BatchOrderInput {
  orderId: string;
  items: readonly Item[];
}

/**
 * Canonical, unit-normalized batch input. CSV parsing and UI state are separate.
 *
 * Carton availability is a PER-ORDER limit, not shared stock consumption.
 * This contract does not reserve/decrement inventory between orders or
 * promise that aggregate carton demand is currently in stock.
 */
export interface BatchPlanningInput {
  orders: readonly BatchOrderInput[];
  cartons: readonly Carton[];
  objective: { kind: BatchObjectiveKind };
  dimensionalWeight?: DimensionalWeightSettings;
}

const BUSINESS_BATCH_OBJECTIVES = new Set<string>([
  'balanced',
  'fewest-cartons',
  'least-wasted-volume',
  'min-dim-weight',
]);

function fail(message: string): never {
  throw new ValidationError(`Batch: ${message}`);
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function uniqueId(value: unknown, label: string, seen: Set<string>): void {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label} must be a non-empty string.`);
  }
  const id = value.trim();
  if (seen.has(id)) {
    fail(`${label} is duplicated: ${id}.`);
  }
  seen.add(id);
}

function requireArray(
  value: unknown,
  label: string,
  maxLength: number
): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    fail(`${label} must contain at least one entry.`);
  }
  if (value.length > maxLength) {
    fail(`${label} exceeds the ${maxLength}-entry browser batch limit.`);
  }
}

function validateDomain(
  value: unknown,
  label: string,
  validator: (value: never) => void
): void {
  if (!record(value)) {
    fail(`${label} must be an object.`);
  }
  try {
    validator(value as never);
  } catch (error) {
    fail(`${label} is invalid: ${error instanceof Error ? error.message : 'validation failed'}`);
  }
}

/**
 * Validate before any worker processing or workspace mutation.
 * No objects are cloned or changed by this validation step.
 */
export function validateBatchPlanningInput(
  value: unknown
): asserts value is BatchPlanningInput {
  if (!record(value)) {
    fail('input must be an object.');
  }

  requireArray(value.orders, 'orders', BATCH_V1_LIMITS.maxOrders);
  requireArray(value.cartons, 'cartons', BATCH_V1_LIMITS.maxCartonTypes);

  const orderIds = new Set<string>();
  let totalInstances = 0;

  for (const [orderIndex, candidate] of value.orders.entries()) {
    const label = `order ${orderIndex + 1}`;
    if (!record(candidate)) {
      fail(`${label} must be an object.`);
    }
    uniqueId(candidate.orderId, `${label} orderId`, orderIds);
    requireArray(
      candidate.items,
      `${label} items`,
      BATCH_V1_LIMITS.maxItemRowsPerOrder
    );

    const itemIds = new Set<string>();
    let orderInstances = 0;
    for (const [itemIndex, item] of candidate.items.entries()) {
      const itemLabel = `${label} item ${itemIndex + 1}`;
      validateDomain(item, itemLabel, validateItem);
      // The existing domain validator accepts integer values above MAX_SAFE_INTEGER.
      // A batch must never expand imprecise or unbounded instance counts.
      if (!Number.isSafeInteger((item as Item).quantity)) {
        fail(`${itemLabel} quantity must be a safe whole number.`);
      }
      uniqueId((item as Item).id, `${itemLabel} id`, itemIds);
      const quantity = (item as Item).quantity;
      if (quantity > BATCH_V1_LIMITS.maxItemInstancesPerOrder - orderInstances) {
        fail(`${label} exceeds the ${BATCH_V1_LIMITS.maxItemInstancesPerOrder}-instance per-order limit.`);
      }
      orderInstances += quantity;
    }
    if (orderInstances > BATCH_V1_LIMITS.maxTotalItemInstances - totalInstances) {
      fail(`total instances exceed the ${BATCH_V1_LIMITS.maxTotalItemInstances}-instance batch limit.`);
    }
    totalInstances += orderInstances;
  }

  const cartonIds = new Set<string>();
  for (const [index, carton] of value.cartons.entries()) {
    const label = `carton ${index + 1}`;
    validateDomain(carton, label, validateCarton);
    uniqueId((carton as Carton).id, `${label} id`, cartonIds);
    const quantity = (carton as Carton).quantityAvailable;
    const stock = (carton as Carton).stockQuantity;
    if (
      (quantity !== undefined && !Number.isSafeInteger(quantity)) ||
      (stock !== undefined && !Number.isSafeInteger(stock))
    ) {
      fail(`${label} availability must be a safe whole number.`);
    }
  }

  validateDomain(value.objective, 'objective', validateOptimizationObjective);
  const kind = (value.objective as OptimizationObjective).kind;
  if (!BUSINESS_BATCH_OBJECTIVES.has(kind)) {
    fail(`objective ${kind} is not supported by the Business batch workflow.`);
  }

  if (value.dimensionalWeight !== undefined) {
    validateDomain(
      value.dimensionalWeight,
      'dimensionalWeight',
      validateDimensionalWeightSettings
    );
  }

  if (kind === 'min-dim-weight') {
    if (value.dimensionalWeight === undefined) {
      fail('min-dim-weight requires explicit dimensionalWeight settings.');
    }
    for (const [index, carton] of value.cartons.entries()) {
      const typed = carton as Carton;
      const available = typed.quantityAvailable !== 0 && typed.stockQuantity !== 0;
      if (available && typed.externalDimensions === undefined) {
        fail(`carton ${index + 1} needs external dimensions for min-dim-weight.`);
      }
    }
  }
}
