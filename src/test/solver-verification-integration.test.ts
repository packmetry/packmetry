import { describe, expect, it } from 'vitest';

import { BaselineSolver } from '../core/solver/baseline.js';
import type {
  SolverAdapter,
  SolverCandidatePlan,
  SolverInput,
} from '../core/solver/contracts.js';
import { solveAndVerify } from '../core/solver/integration.js';

const input: SolverInput = {
  items: [
    {
      id: 'item-1',
      dimensions: {
        length: 10,
        width: 10,
        height: 10,
      },
      quantity: 1,
      unitWeightG: 100,
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
      id: 'carton-1',
      internalDimensions: {
        length: 100,
        width: 100,
        height: 100,
      },
    },
  ],
  objective: {
    kind: 'fewest-cartons',
  },
};

function validCandidate(): SolverCandidatePlan {
  return {
    status: 'feasible',
    cartons: [
      {
        cartonId: 'carton-1',
        placements: [
          {
            itemId: 'item-1',
            instanceIndex: 0,
            x: 0,
            y: 0,
            z: 0,
            length: 10,
            width: 10,
            height: 10,
            rotation: 'LWH',
          },
        ],
      },
    ],
    unplacedItems: [],
  };
}

function invalidCandidate(): SolverCandidatePlan {
  const candidate = validCandidate();

  candidate.cartons[0].placements[0].x = 95;

  return candidate;
}

describe('solveAndVerify', () => {
  it('runs the solver once and verifies its candidate', async () => {
    const candidate = validCandidate();
    const solverMeta = {
      solverId: 'mock-solver',
      solverVersion: '1',
      durationMs: 5,
      deterministic: true,
    };

    let solveCalls = 0;

    const solver: SolverAdapter = {
      solve: async receivedInput => {
        solveCalls++;
        expect(receivedInput).toBe(input);

        return {
          candidates: [candidate],
          solverMeta,
        };
      },
    };

    const result = await solveAndVerify(solver, input);

    expect(solveCalls).toBe(1);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].candidate).toBe(candidate);
    expect(result.candidates[0].verification).toEqual({
      valid: true,
      issues: [],
    });
    expect(result.solverMeta).toBe(solverMeta);
  });

  it('preserves candidate order and retains invalid candidates', async () => {
    const first = invalidCandidate();
    const second = validCandidate();

    const solver: SolverAdapter = {
      solve: async () => ({
        candidates: [first, second],
        solverMeta: {
          solverId: 'multi-candidate',
          durationMs: 1,
          deterministic: true,
        },
      }),
    };

    const result = await solveAndVerify(solver, input);

    expect(result.candidates).toHaveLength(2);

    expect(result.candidates[0].candidate).toBe(first);
    expect(result.candidates[0].verification.valid).toBe(false);
    expect(
      result.candidates[0].verification.issues.map(
        issue => issue.code
      )
    ).toContain('boundary-violation');

    expect(result.candidates[1].candidate).toBe(second);
    expect(result.candidates[1].verification).toEqual({
      valid: true,
      issues: [],
    });
  });

  it('does not mutate input or solver output', async () => {
    const candidate = validCandidate();

    const solverMeta = {
      solverId: 'immutability-test',
      durationMs: 2,
      deterministic: true,
    };

    const solver: SolverAdapter = {
      solve: async () => ({
        candidates: [candidate],
        solverMeta,
      }),
    };

    const inputBefore = JSON.stringify(input);
    const candidateBefore = JSON.stringify(candidate);
    const solverMetaBefore = JSON.stringify(solverMeta);

    await solveAndVerify(solver, input);

    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(JSON.stringify(candidate)).toBe(candidateBefore);
    expect(JSON.stringify(solverMeta)).toBe(solverMetaBefore);
  });

  it('propagates unexpected solver failures', async () => {
    const solver: SolverAdapter = {
      solve: async () => {
        throw new Error('solver failed');
      },
    };

    await expect(
      solveAndVerify(solver, input)
    ).rejects.toThrow('solver failed');
  });

  it('integrates BaselineSolver with independent verification', async () => {
    const result = await solveAndVerify(
      new BaselineSolver(),
      input
    );

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].verification.valid).toBe(true);
    expect(result.candidates[0].verification.issues).toEqual([]);
    expect(result.solverMeta.solverId).toBe(
      'packmetry-baseline'
    );
  });
});