import { describe, expect, it } from 'vitest';

import { validateItem } from '../core/domain/item.js';
import { validateCarton } from '../core/domain/carton.js';
import { validateOptimizationObjective } from '../core/domain/objectives.js';
import { getRotatedDimensions } from '../core/domain/result.js';

import { PACKING_BENCHMARK_CASES } from './benchmarks/cases.js';

describe('packing benchmark corpus', () => {
  it('contains the locked v1 benchmark set', () => {
    expect(PACKING_BENCHMARK_CASES).toHaveLength(14);
  });

  it('uses unique benchmark ids', () => {
    const ids = PACKING_BENCHMARK_CASES.map(testCase => testCase.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains structurally valid solver inputs', () => {
    for (const testCase of PACKING_BENCHMARK_CASES) {
      for (const item of testCase.input.items) {
        expect(() => validateItem(item)).not.toThrow();
      }

      for (const carton of testCase.input.cartons) {
        expect(() => validateCarton(carton)).not.toThrow();
      }

      expect(() =>
        validateOptimizationObjective(testCase.input.objective)
      ).not.toThrow();
    }
  });

  it('accounts for every requested item instance', () => {
    for (const testCase of PACKING_BENCHMARK_CASES) {
      const requested = testCase.input.items.reduce(
        (total, item) => total + item.quantity,
        0
      );

      expect(
        testCase.expected.placedItemCount +
          testCase.expected.unplacedItemCount
      ).toBe(requested);
    }
  });

  it('uses internally consistent expected statuses', () => {
    for (const testCase of PACKING_BENCHMARK_CASES) {
      const expected = testCase.expected;

      if (expected.status === 'feasible') {
        expect(expected.unplacedItemCount).toBe(0);
      }

      if (expected.status === 'partial') {
        expect(expected.placedItemCount).toBeGreaterThan(0);
        expect(expected.unplacedItemCount).toBeGreaterThan(0);
      }

      if (expected.status === 'infeasible') {
        expect(expected.placedItemCount).toBe(0);
      }

      expect(expected.cartonCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('provides an unplaced reason whenever items are expected unplaced', () => {
    for (const testCase of PACKING_BENCHMARK_CASES) {
      if (testCase.expected.unplacedItemCount > 0) {
        expect(testCase.expected.unplacedReason).toBeDefined();
      }
    }
  });

  it('locks required rotation cases to dimensions that fit the target carton', () => {
    for (const testCase of PACKING_BENCHMARK_CASES) {
      const rotation = testCase.expected.requiredRotation;

      if (rotation === undefined) {
        continue;
      }

      const firstItem = testCase.input.items[0];
      const firstCarton = testCase.input.cartons[0];

      expect(firstItem).toBeDefined();
      expect(firstCarton).toBeDefined();

      const rotated = getRotatedDimensions(
        firstItem.dimensions,
        rotation
      );

      expect(rotated.length).toBeLessThanOrEqual(
        firstCarton.internalDimensions.length
      );
      expect(rotated.width).toBeLessThanOrEqual(
        firstCarton.internalDimensions.width
      );
      expect(rotated.height).toBeLessThanOrEqual(
        firstCarton.internalDimensions.height
      );
    }
  });

  it('contains a deterministic repeatability benchmark', () => {
    const repeatCase = PACKING_BENCHMARK_CASES.find(
      testCase => testCase.expected.repeatRuns !== undefined
    );

    expect(repeatCase).toBeDefined();
    expect(repeatCase?.expected.repeatRuns).toBeGreaterThanOrEqual(2);
  });
});