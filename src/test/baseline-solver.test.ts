import { describe, expect, it } from 'vitest';

import type { SolverAdapter } from '../core/solver/contracts.js';
import { BaselineSolver } from '../core/solver/baseline.js';
import { verifyCandidatePlan } from '../core/verification/verifier.js';

import {
  PACKING_BENCHMARK_CASES,
  type PackingBenchmarkCase,
} from './benchmarks/cases.js';

function placedCount(
  testCase: PackingBenchmarkCase,
  candidate: Awaited<
    ReturnType<BaselineSolver['solve']>
  >['candidates'][number]
): number {
  void testCase;

  return candidate.cartons.reduce(
    (total, carton) =>
      total + carton.placements.length,
    0
  );
}

describe('BaselineSolver', () => {
  const solver: SolverAdapter = new BaselineSolver();

  for (const testCase of PACKING_BENCHMARK_CASES) {
    it(`solves benchmark: ${testCase.id}`, async () => {
      const output = await solver.solve(testCase.input);

      expect(output.candidates).toHaveLength(1);

      const candidate = output.candidates[0];

      expect(candidate.status).toBe(
        testCase.expected.status
      );

      expect(candidate.cartons).toHaveLength(
        testCase.expected.cartonCount
      );

      expect(
        placedCount(testCase, candidate)
      ).toBe(
        testCase.expected.placedItemCount
      );

      expect(candidate.unplacedItems).toHaveLength(
        testCase.expected.unplacedItemCount
      );

      if (
        testCase.expected.requiredRotation !== undefined
      ) {
        const firstPlacement =
          candidate.cartons[0]?.placements[0];

        expect(firstPlacement).toBeDefined();

        expect(firstPlacement?.rotation).toBe(
          testCase.expected.requiredRotation
        );
      }

      if (
        testCase.expected.unplacedReason !== undefined
      ) {
        expect(
          candidate.unplacedItems.map(
            item => item.reason
          )
        ).toContain(
          testCase.expected.unplacedReason
        );
      }
    });
  }

  it('produces independently valid candidates for all benchmarks', async () => {
    for (const testCase of PACKING_BENCHMARK_CASES) {
      const output = await solver.solve(testCase.input);

      const report = verifyCandidatePlan(
        testCase.input,
        output.candidates[0]
      );

      expect(
        report.valid,
        `${testCase.id}: ${JSON.stringify(report.issues)}`
      ).toBe(true);
    }
  });

  it('returns the locked solver metadata', async () => {
    const testCase = PACKING_BENCHMARK_CASES[0];

    const output = await solver.solve(testCase.input);

    expect(output.solverMeta.solverId).toBe(
      'packmetry-baseline'
    );

    expect(output.solverMeta.solverVersion).toBe('1');

    expect(output.solverMeta.deterministic).toBe(true);

    expect(output.solverMeta.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('produces deterministic candidate content', async () => {
    const testCase = PACKING_BENCHMARK_CASES.find(
      candidate =>
        candidate.id === 'deterministic-repeatability'
    );

    expect(testCase).toBeDefined();

    if (testCase === undefined) {
      return;
    }

    const first = await solver.solve(testCase.input);
    const second = await solver.solve(testCase.input);
    const third = await solver.solve(testCase.input);

    expect(second.candidates).toEqual(first.candidates);
    expect(third.candidates).toEqual(first.candidates);
  });

  it('does not mutate solver input', async () => {
    const testCase = PACKING_BENCHMARK_CASES.find(
      candidate => candidate.id === 'mixed-items'
    );

    expect(testCase).toBeDefined();

    if (testCase === undefined) {
      return;
    }

    const before = JSON.stringify(testCase.input);

    await solver.solve(testCase.input);

    expect(JSON.stringify(testCase.input)).toBe(before);
  });

  it('classifies a known overweight item as weight-limit', async () => {
    const base = PACKING_BENCHMARK_CASES.find(
      candidate => candidate.id === 'exact-fit'
    );

    expect(base).toBeDefined();

    if (base === undefined) {
      return;
    }

    const input = {
      ...base.input,
      items: base.input.items.map(item => ({
        ...item,
        unitWeightG: 1001,
      })),
      cartons: base.input.cartons.map(carton => ({
        ...carton,
        maxGrossWeightG: 1500,
        emptyBoxWeightG: 500,
      })),
    };

    const output = await solver.solve(input);
    const candidate = output.candidates[0];

    expect(candidate.status).toBe('infeasible');
    expect(candidate.cartons).toHaveLength(0);

    expect(candidate.unplacedItems).toEqual([
      {
        itemId: 'item',
        instanceIndex: 0,
        reason: 'weight-limit',
      },
    ]);
  });
});