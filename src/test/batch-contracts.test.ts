import { describe, expect, it } from 'vitest';
import { createItem } from '../core/domain/item.js';
import { createCarton } from '../core/domain/carton.js';
import {
  BATCH_V1_LIMITS,
  validateBatchPlanningInput,
  type BatchPlanningInput,
} from '../core/batch/contracts.js';

function item(id = 'item-1', quantity = 2) {
  return createItem({
    id,
    name: 'Test item',
    dimensions: { length: 20, width: 30, height: 40 },
    quantity,
  });
}

function carton(id = 'carton-1', options: {
  quantityAvailable?: number;
  stockQuantity?: number;
  external?: boolean;
} = {}) {
  return createCarton({
    id,
    internalDimensions: { length: 100, width: 100, height: 100 },
    ...(options.quantityAvailable !== undefined
      ? { quantityAvailable: options.quantityAvailable } : {}),
    ...(options.stockQuantity !== undefined
      ? { stockQuantity: options.stockQuantity } : {}),
    ...(options.external ? {
      externalDimensions: { length: 110, width: 110, height: 110 },
    } : {}),
  });
}

function batch(overrides: Partial<BatchPlanningInput> = {}): BatchPlanningInput {
  return {
    orders: [
      { orderId: 'order-A', items: [item()] },
      { orderId: 'order-B', items: [item()] },
    ],
    cartons: [carton()],
    objective: { kind: 'balanced' },
    ...overrides,
  };
}

function accepts(value: unknown) {
  expect(() => validateBatchPlanningInput(value)).not.toThrow();
}

function rejects(value: unknown, message: RegExp) {
  expect(() => validateBatchPlanningInput(value)).toThrow(message);
}

describe('Phase 15 batch planning input contract', () => {
  it('defines explicit conservative browser limits', () => {
    expect(BATCH_V1_LIMITS).toEqual({
      maxOrders: 25,
      maxCartonTypes: 30,
      maxItemRowsPerOrder: 50,
      maxItemInstancesPerOrder: 200,
      maxTotalItemInstances: 1000,
    });
  });

  it('accepts distinct orders with independently reused item IDs and shared carton choices', () => {
    accepts(batch());
  });

  it('does not mutate caller-owned data', () => {
    const input = batch({
      orders: [{ orderId: 'original', items: [item()] }],
    });
    const before = JSON.stringify(input);
    accepts(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('requires a structured input with orders and cartons', () => {
    rejects(null, /input must be an object/);
    rejects({}, /orders must contain/);
    rejects(batch({ orders: [] }), /orders must contain/);
    rejects(batch({ cartons: [] }), /cartons must contain/);
  });

  it('rejects duplicate or blank order IDs and accepts reused item IDs across orders', () => {
    rejects(batch({ orders: [
      { orderId: 'same', items: [item()] },
      { orderId: ' same ', items: [item()] },
    ] }), /orderId is duplicated/);
    rejects(batch({ orders: [{ orderId: ' ', items: [item()] }] }), /orderId must be a non-empty/);
    accepts(batch());
  });

  it('rejects empty, malformed, or duplicate item rows within one order', () => {
    rejects(batch({ orders: [{ orderId: 'o', items: [] }] }), /items must contain/);
    rejects(batch({ orders: [{ orderId: 'o', items: [null as never] }] }), /item 1 must be an object/);
    rejects(batch({ orders: [{ orderId: 'o', items: [item(), item()] }] }), /item 2 id is duplicated/);
    rejects(batch({ orders: [{ orderId: 'o', items: [{ ...item('valid', 1), id: ' ' }] }] }), /item 1 is invalid: Item id must be a non/);
  });

  it('uses canonical domain validation for dimensions and weights', () => {
    const broken = { ...item(), dimensions: { length: -1, width: 2, height: 3 } };
    rejects(batch({ orders: [{ orderId: 'o', items: [broken] }] }), /item 1 is invalid/);
    const missingWeight = item();
    expect(missingWeight.unitWeightG).toBeUndefined();
    accepts(batch({ orders: [{ orderId: 'o', items: [missingWeight] }] }));
  });

  it('requires safe quantity integers even if the domain accepts a larger integer', () => {
    const huge = { ...item(), quantity: Number.MAX_SAFE_INTEGER + 1 };
    rejects(batch({ orders: [{ orderId: 'o', items: [huge] }] }), /quantity must be a safe whole number/);
  });

  it('enforces per-order item instance limits', () => {
    accepts(batch({ orders: [{ orderId: 'o', items: [item('i', 200)] }] }));
    rejects(batch({ orders: [{ orderId: 'o', items: [item('i', 201)] }] }), /per-order limit/);
    rejects(batch({ orders: [{ orderId: 'o', items: [item('a', 150), item('b', 51)] }] }), /per-order limit/);
  });

  it('enforces the total item instance limit without overflow', () => {
    const orders = Array.from({ length: 6 }, (_, index) => ({
      orderId: `o-${index}`,
      items: [item('item', 200)],
    }));
    rejects(batch({ orders }), /total instances exceed/);
  });

  it('enforces order, item-row, and carton-type limits', () => {
    rejects(batch({ orders: Array.from({ length: 26 }, (_, i) => ({
      orderId: `o-${i}`, items: [item('i', 1)],
    })) }), /orders exceeds the 25-entry/);
    rejects(batch({ orders: [{ orderId: 'o', items: Array.from({ length: 51 }, (_, i) => item(`i-${i}`, 1)) }] }), /items exceeds the 50-entry/);
    rejects(batch({ cartons: Array.from({ length: 31 }, (_, i) => carton(`c-${i}`)) }), /cartons exceeds the 30-entry/);
  });

  it('requires distinct valid carton IDs, but accepts zero inventory', () => {
    rejects(batch({ cartons: [carton('a'), carton(' a ')] }), /carton 2 id is duplicated/);
    rejects(batch({ cartons: [{ ...carton(), internalDimensions: { length: 0, width: 1, height: 1 } }] }), /carton 1 is invalid/);
    accepts(batch({ cartons: [carton('empty', { quantityAvailable: 0 })] }));
  });

  it('rejects unsafe integer stock counts', () => {
    rejects(batch({ cartons: [{ ...carton(), quantityAvailable: Number.MAX_SAFE_INTEGER + 1 }] }), /availability must be a safe/);
    rejects(batch({ cartons: [{ ...carton(), stockQuantity: Number.MAX_SAFE_INTEGER + 1 }] }), /availability must be a safe/);
  });

  it('accepts Business objectives but rejects unsupported domain-only kinds', () => {
    for (const kind of ['balanced', 'fewest-cartons', 'least-wasted-volume'] as const) {
      accepts(batch({ objective: { kind } }));
    }
    rejects(batch({ objective: { kind: 'easier-to-carry' as 'balanced' } }), /not supported/);
    rejects(batch({ objective: { kind: 'bogus' as 'balanced' } }), /objective is invalid/);
  });

  it('validates explicit DIM settings without inventing a divisor', () => {
    const dims = { divisor: { value: 5000, lengthUnit: 'cm' as const, massUnit: 'kg' as const } };
    accepts(batch({ dimensionalWeight: dims }));
    rejects(batch({ dimensionalWeight: { divisor: { ...dims.divisor, value: 0 } } }), /dimensionalWeight is invalid/);
    rejects(batch({ objective: { kind: 'min-dim-weight' } }), /requires explicit dimensionalWeight/);
    rejects(batch({ objective: { kind: 'min-dim-weight' }, dimensionalWeight: dims }), /external dimensions/);
    accepts(batch({ objective: { kind: 'min-dim-weight' }, dimensionalWeight: dims, cartons: [carton('external', { external: true })] }));
  });

  it('does not require external DIM sizes for genuinely unavailable carton types', () => {
    const dims = { divisor: { value: 139, lengthUnit: 'in' as const, massUnit: 'lb' as const } };
    accepts(batch({
      objective: { kind: 'min-dim-weight' },
      dimensionalWeight: dims,
      cartons: [carton('unavailable', { stockQuantity: 0 })],
    }));
  });
});
