import { describe, it, expect } from 'vitest';
import { validatePackingPlan, type PackingPlan } from '../core/domain/packing-plan.js';
import { ValidationError } from '../core/units/types.js';

describe('PackingPlan domain model', () => {
  const validPlan: PackingPlan = {
    id: 'plan-123',
    status: 'feasible',
    objective: { kind: 'balanced' },
    cartons: [],
    unplacedItems: [],
    metrics: {
      cartonCount: 0,
      placedItemCount: 0,
      unplacedItemCount: 0,
      itemVolumeMm3: 0,
      cartonVolumeMm3: 0,
      emptyVolumeMm3: 0,
      utilization: 0,
    },
    explanations: [],
    solverMeta: {
      solverId: 'test-solver',
      durationMs: 100,
      deterministic: true,
    },
  };

  describe('validatePackingPlan', () => {
    it('accepts valid complete PackingPlan', () => {
      expect(() => validatePackingPlan(validPlan)).not.toThrow();
    });

    it.each(['feasible', 'partial', 'infeasible', 'limit_reached'])('accepts valid status: %s', (status) => {
      const plan = { ...validPlan, status: status as PackingPlan['status'] };
      expect(() => validatePackingPlan(plan)).not.toThrow();
    });

    it('rejects invalid status', () => {
      const plan = { ...validPlan, status: 'invalid-status' };
      expect(() => validatePackingPlan(plan as never)).toThrow(ValidationError);
    });

    it('rejects non-string id', () => {
      const plan = { ...validPlan, id: 123 };
      expect(() => validatePackingPlan(plan as never)).toThrow('PackingPlan.id must be a string');
    });

    it('rejects missing objective', () => {
      const plan = { ...validPlan, objective: undefined as never };
      expect(() => validatePackingPlan(plan)).toThrow('PackingPlan.objective is required');
    });

    it('rejects invalid objective', () => {
      const plan = { ...validPlan, objective: { kind: 'invalid-kind' } };
      expect(() => validatePackingPlan(plan as never)).toThrow(ValidationError);
    });

    it('rejects missing cartons', () => {
      const plan = { ...validPlan, cartons: undefined as never };
      expect(() => validatePackingPlan(plan)).toThrow('PackingPlan.cartons is required');
    });

    it('rejects non-array cartons', () => {
      const plan = { ...validPlan, cartons: 'not-an-array' };
      expect(() => validatePackingPlan(plan as never)).toThrow('PackingPlan.cartons must be an array');
    });

    it('rejects missing unplacedItems', () => {
      const plan = { ...validPlan, unplacedItems: undefined as never };
      expect(() => validatePackingPlan(plan)).toThrow('PackingPlan.unplacedItems is required');
    });

    it('rejects non-array unplacedItems', () => {
      const plan = { ...validPlan, unplacedItems: 'not-an-array' };
      expect(() => validatePackingPlan(plan as never)).toThrow('PackingPlan.unplacedItems must be an array');
    });

    it('rejects missing metrics', () => {
      const plan = { ...validPlan, metrics: undefined as never };
      expect(() => validatePackingPlan(plan)).toThrow('PackingPlan.metrics is required');
    });

    it('rejects missing explanations', () => {
      const plan = { ...validPlan, explanations: undefined as never };
      expect(() => validatePackingPlan(plan)).toThrow('PackingPlan.explanations is required');
    });

    it('rejects non-array explanations', () => {
      const plan = { ...validPlan, explanations: 'not-an-array' };
      expect(() => validatePackingPlan(plan as never)).toThrow('PackingPlan.explanations must be an array');
    });

    it('rejects missing solverMeta', () => {
      const plan = { ...validPlan, solverMeta: undefined as never };
      expect(() => validatePackingPlan(plan)).toThrow('PackingPlan.solverMeta is required');
    });

    it('rejects invalid PackedCarton', () => {
      const plan = { ...validPlan, cartons: [{} as never] };
      expect(() => validatePackingPlan(plan)).toThrow(ValidationError);
    });

    it('rejects invalid UnplacedItem', () => {
      const plan = { ...validPlan, unplacedItems: [{} as never] };
      expect(() => validatePackingPlan(plan)).toThrow(ValidationError);
    });

    it('rejects invalid PlanMetrics', () => {
      const plan = { ...validPlan, metrics: {} as never };
      expect(() => validatePackingPlan(plan)).toThrow(ValidationError);
    });

    it('rejects invalid Explanation', () => {
      const plan = { ...validPlan, explanations: [{} as never] };
      expect(() => validatePackingPlan(plan)).toThrow(ValidationError);
    });

    it('rejects invalid SolverMeta', () => {
      const plan = { ...validPlan, solverMeta: {} as never };
      expect(() => validatePackingPlan(plan)).toThrow(ValidationError);
    });

    it('rejects null or non-object', () => {
      expect(() => validatePackingPlan(null)).toThrow('PackingPlan must be an object');
      expect(() => validatePackingPlan('not-an-object')).toThrow('PackingPlan must be an object');
      expect(() => validatePackingPlan(123)).toThrow('PackingPlan must be an object');
    });
  });
});