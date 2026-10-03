import { describe, expect, it } from 'vitest';

import type { SolverAdapter, SolverInput } from '../core/solver/contracts.js';
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

function alternativeInput(): SolverInput {
  return {
    items: [
      {
        id: 'cube',
        dimensions: {
          length: 60,
          width: 60,
          height: 60,
        },
        quantity: 2,
        constraints: {
          rotationPolicy: 'any',
          fragile: false,
          paddingAllowanceMm: 0,
          spacingAllowanceMm: 0,
          stackable: true,
        },
      },
    ],
    cartons: [
      {
        id: 'medium',
        internalDimensions: {
          length: 80,
          width: 60,
          height: 60,
        },
      },
      {
        id: 'small',
        internalDimensions: {
          length: 60,
          width: 60,
          height: 60,
        },
      },
      {
        id: 'large',
        internalDimensions: {
          length: 150,
          width: 60,
          height: 60,
        },
      },
    ],
    objective: {
      kind: 'fewest-cartons',
    },
  };
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

      for (const candidate of output.candidates) {
        const report = verifyCandidatePlan(
          testCase.input,
          candidate
        );

        expect(
          report.valid,
          `${testCase.id}: ${JSON.stringify(report.issues)}`
        ).toBe(true);
      }
    }
  });

  it('returns the locked solver metadata', async () => {
    const testCase = PACKING_BENCHMARK_CASES[0];

    const output = await solver.solve(testCase.input);

    expect(output.solverMeta.solverId).toBe(
      'packmetry-baseline'
    );

    expect(output.solverMeta.solverVersion).toBe('2');

    expect(output.solverMeta.deterministic).toBe(true);

    expect(output.solverMeta.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('produces deterministic candidate content', async () => {
    const input = alternativeInput();

    const first = await solver.solve(input);
    const second = await solver.solve(input);
    const third = await solver.solve(input);

    expect(second.candidates).toEqual(first.candidates);
    expect(third.candidates).toEqual(first.candidates);
  });

  it('does not mutate solver input', async () => {
    const input = alternativeInput();
    const before = JSON.stringify(input);

    await solver.solve(input);

    expect(JSON.stringify(input)).toBe(before);
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

  it('generates bounded deterministic alternatives from carton-order strategies', async () => {
    const output = await solver.solve(
      alternativeInput()
    );

    expect(output.candidates).toHaveLength(3);

    expect(
      output.candidates.map(candidate =>
        candidate.cartons.map(
          carton => carton.cartonId
        )
      )
    ).toEqual([
      ['medium', 'medium'],
      ['small', 'small'],
      ['large'],
    ]);
  });

  it('preserves the original input-order plan as candidate zero', async () => {
    const input = alternativeInput();

    const output = await solver.solve(input);

    expect(
      output.candidates[0]?.cartons.map(
        carton => carton.cartonId
      )
    ).toEqual([
      'medium',
      'medium',
    ]);
  });

  it('deduplicates identical candidate content while preserving first occurrence', async () => {
    const base = PACKING_BENCHMARK_CASES.find(
      candidate => candidate.id === 'exact-fit'
    );

    expect(base).toBeDefined();

    if (base === undefined) {
      return;
    }

    const output = await solver.solve(
      base.input
    );

    expect(output.candidates).toHaveLength(1);
  });

  it('generates the same candidate set regardless of objective kind', async () => {
    const input = alternativeInput();

    const fewest = await solver.solve(input);

    const leastWaste = await solver.solve({
      ...input,
      objective: {
        kind: 'least-wasted-volume',
      },
    });

    expect(
      leastWaste.candidates
    ).toEqual(
      fewest.candidates
    );
  });

  it('keeps every generated alternative independently verifiable', async () => {
    const input = alternativeInput();
    const output = await solver.solve(input);

    expect(output.candidates.length).toBeGreaterThan(1);

    for (const candidate of output.candidates) {
      const report = verifyCandidatePlan(
        input,
        candidate
      );

      expect(
        report.valid,
        JSON.stringify(report.issues)
      ).toBe(true);
    }
  });
});
