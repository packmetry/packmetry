import { describe, expect, it } from 'vitest';
import { createItem } from '../core/domain/item.js';
import { createCarton } from '../core/domain/carton.js';
import { BaselineSolver } from '../core/solver/baseline.js';
import type { SolverAdapter } from '../core/solver/contracts.js';
import {
  executeBatchPlanning,
  type BatchExecutionProgress,
} from '../core/batch/execute.js';
import type { BatchPlanningInput } from '../core/batch/contracts.js';

const item = (id = 'item-1') => createItem({
  id,
  dimensions: { length: 20, width: 20, height: 20 },
  quantity: 1,
});
const carton = () => createCarton({
  id: 'box-1',
  internalDimensions: { length: 40, width: 40, height: 40 },
  quantityAvailable: 1,
});
const batch = (count = 2): BatchPlanningInput => ({
  orders: Array.from({ length: count }, (_, index) => ({
    orderId: `order-${index + 1}`,
    items: [item()],
  })),
  cartons: [carton()],
  objective: { kind: 'balanced' },
});

describe('Phase 15 batch execution foundation', () => {
  it('produces independent verified per-order canonical plans in input order', async () => {
    const input = batch();
    const snapshot = JSON.stringify(input);
    const result = await executeBatchPlanning(input);
    expect(result).toMatchObject({
      status: 'completed', completed: 2, total: 2,
      plansProduced: 2, unselected: 0, errors: 0,
    });
    expect(result.outcomes.map(value => value.orderId)).toEqual(['order-1', 'order-2']);
    for (const outcome of result.outcomes) {
      expect(outcome.kind).toBe('plan');
      if (outcome.kind !== 'plan') throw new Error('Expected canonical plan.');
      expect(outcome.plan.status).toBe('feasible');
      expect(outcome.plan.cartons).toHaveLength(1);
      expect(outcome.inventoryUsage.usedCartons[0]?.usedQuantity).toBe(1);
      expect(outcome.inventoryUsage.usedCartons[0]?.remainingQuantity).toBe(0);
    }
    // The same one-carton inventory is independently available per order.
    // It has NOT been reserved or subtracted across the batch.
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('emits initial and per-order snapshots without mutating prior snapshots', async () => {
    const updates: BatchExecutionProgress[] = [];
    const result = await executeBatchPlanning(batch(3), {
      onProgress: progress => updates.push(progress),
    });
    expect(updates.map(progress => progress.completed)).toEqual([0, 1, 2, 3]);
    expect(updates.map(progress => progress.total)).toEqual([3, 3, 3, 3]);
    expect(updates[0]).toEqual({
      completed: 0, total: 3, plansProduced: 0, unselected: 0, errors: 0,
    });
    expect(updates[3]).toEqual({
      completed: 3, total: 3, plansProduced: 3, unselected: 0, errors: 0,
    });
    expect(result.completed).toBe(3);
    expect(updates[0]?.completed).toBe(0);
  });

  it('rejects invalid input before creating a solver or emitting progress', async () => {
    let calls = 0;
    await expect(executeBatchPlanning({ ...batch(), orders: [] }, {
      createSolver: () => { calls++; return new BaselineSolver(); },
      onProgress: () => { calls++; },
    })).rejects.toThrow(/orders must contain/);
    expect(calls).toBe(0);
  });

  it('honors cancellation before the first order without executing it', async () => {
    let calls = 0;
    const updates: BatchExecutionProgress[] = [];
    const result = await executeBatchPlanning(batch(), {
      signal: { aborted: true },
      createSolver: () => { calls++; return new BaselineSolver(); },
      onProgress: p => updates.push(p),
    });
    expect(result).toMatchObject({
      status: 'cancelled', completed: 0, total: 2, plansProduced: 0,
    });
    expect(result.outcomes).toEqual([]);
    expect(calls).toBe(0);
    expect(updates).toHaveLength(1);
  });

  it('cooperatively cancels between orders, preserving completed results', async () => {
    const signal = { aborted: false };
    const result = await executeBatchPlanning(batch(3), {
      signal,
      onProgress: progress => {
        if (progress.completed === 1) signal.aborted = true;
      },
    });
    expect(result).toMatchObject({
      status: 'cancelled', completed: 1, total: 3,
      plansProduced: 1, unselected: 0, errors: 0,
    });
    expect(result.outcomes[0]?.orderId).toBe('order-1');
  });

  it('isolates an order-level solver failure and continues with later orders', async () => {
    let created = 0;
    const result = await executeBatchPlanning(batch(), {
      createSolver: () => {
        created++;
        if (created === 1) throw new Error('solver unavailable');
        return new BaselineSolver();
      },
    });
    expect(result).toMatchObject({
      status: 'completed', completed: 2, total: 2,
      plansProduced: 1, unselected: 0, errors: 1,
    });
    expect(result.outcomes[0]).toEqual({
      kind: 'error', orderId: 'order-1', message: 'solver unavailable',
    });
    expect(result.outcomes[1]?.kind).toBe('plan');
  });

  it('does not call progress exceptions solver errors', async () => {
    await expect(executeBatchPlanning(batch(), {
      onProgress: progress => {
        if (progress.completed === 1) throw new Error('progress failure');
      },
    })).rejects.toThrow('progress failure');
  });

  it('retains explicit unselected results instead of labeling them as feasible', async () => {
    const solver: SolverAdapter = {
      async solve(input) {
        const baseline = await new BaselineSolver().solve(input);
        return { ...baseline, candidates: [] };
      },
    };
    const result = await executeBatchPlanning(batch(1), {
      createSolver: () => solver,
    });
    expect(result).toMatchObject({
      status: 'completed', completed: 1, total: 1,
      plansProduced: 0, unselected: 1, errors: 0,
    });
    expect(result.outcomes[0]).toMatchObject({
      kind: 'unselected', orderId: 'order-1',
      selection: { kind: 'no-valid-candidate' },
    });
  });
});
