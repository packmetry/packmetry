import { describe, expect, it } from 'vitest';

import type { SolverMeta } from '../core/domain/plan-contracts.js';
import { constructPackingPlan } from '../core/domain/plan-construction.js';
import type { CandidateVerificationResult } from '../core/solver/integration.js';
import type {
  SolverCandidatePlan,
  SolverInput,
} from '../core/solver/contracts.js';

function makeInput(): SolverInput {
  return {
    items: [
      {
        id: 'item-1',
        dimensions: {
          length: 10,
          width: 20,
          height: 30,
        },
        quantity: 1,
        unitWeightG: 200,
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
        emptyBoxWeightG: 50,
        costPerBox: 3,
      },
    ],
    objective: {
      kind: 'fewest-cartons',
    },
  };
}

function makePlacedCandidate(
  status: SolverCandidatePlan['status'] = 'feasible'
): SolverCandidatePlan {
  return {
    status,
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
            width: 20,
            height: 30,
            rotation: 'LWH',
          },
        ],
      },
    ],
    unplacedItems: [],
  };
}

function verified(
  candidate: SolverCandidatePlan
): CandidateVerificationResult {
  return {
    candidate,
    verification: {
      valid: true,
      issues: [],
    },
  };
}

const solverMeta: SolverMeta = {
  solverId: 'test-solver',
  solverVersion: '1.0.0',
  durationMs: 12,
  deterministic: true,
};

describe('constructPackingPlan', () => {
  it('constructs canonical packed-carton and plan metrics', () => {
    const plan = constructPackingPlan(
      'plan-1',
      makeInput(),
      verified(makePlacedCandidate()),
      solverMeta
    );

    expect(plan.id).toBe('plan-1');
    expect(plan.status).toBe('feasible');
    expect(plan.objective).toEqual({
      kind: 'fewest-cartons',
    });
    expect(plan.explanations).toEqual([]);

    expect(plan.cartons).toHaveLength(1);
    expect(plan.cartons[0].metrics).toEqual({
      itemCount: 1,
      itemVolumeMm3: 6000,
      cartonVolumeMm3: 1_000_000,
      emptyVolumeMm3: 994_000,
      utilization: 0.006,
      contentsWeightG: 200,
      grossWeightG: 250,
    });

    expect(plan.metrics).toEqual({
      cartonCount: 1,
      placedItemCount: 1,
      unplacedItemCount: 0,
      itemVolumeMm3: 6000,
      cartonVolumeMm3: 1_000_000,
      emptyVolumeMm3: 994_000,
      utilization: 0.006,
      totalContentsWeightG: 200,
      totalGrossWeightG: 250,
      totalCartonCost: 3,
    });

    expect(plan.solverMeta).toEqual(solverMeta);
  });

  it('derives canonical status instead of copying candidate status', () => {
    const plan = constructPackingPlan(
      'plan-2',
      makeInput(),
      verified(makePlacedCandidate('infeasible')),
      solverMeta
    );

    expect(plan.status).toBe('feasible');
  });

  it('derives limit_reached from unplaced reasons', () => {
    const input = makeInput();

    const candidate: SolverCandidatePlan = {
      status: 'infeasible',
      cartons: [],
      unplacedItems: [
        {
          itemId: 'item-1',
          instanceIndex: 0,
          reason: 'solver-limit-reached',
        },
      ],
    };

    const plan = constructPackingPlan(
      'plan-3',
      input,
      verified(candidate),
      solverMeta
    );

    expect(plan.status).toBe('limit_reached');
    expect(plan.metrics.placedItemCount).toBe(0);
    expect(plan.metrics.unplacedItemCount).toBe(1);
  });

  it('omits unknown weight and cost totals', () => {
    const input = makeInput();

    delete input.items[0].unitWeightG;
    delete input.cartons[0].emptyBoxWeightG;
    delete input.cartons[0].costPerBox;

    const plan = constructPackingPlan(
      'plan-4',
      input,
      verified(makePlacedCandidate()),
      solverMeta
    );

    expect(plan.cartons[0].metrics.contentsWeightG).toBeUndefined();
    expect(plan.cartons[0].metrics.grossWeightG).toBeUndefined();
    expect(plan.metrics.totalContentsWeightG).toBeUndefined();
    expect(plan.metrics.totalGrossWeightG).toBeUndefined();
    expect(plan.metrics.totalCartonCost).toBeUndefined();
  });

  it('uses zero totals for an empty plan', () => {
    const input: SolverInput = {
      items: [],
      cartons: [],
      objective: {
        kind: 'balanced',
      },
    };

    const candidate: SolverCandidatePlan = {
      status: 'infeasible',
      cartons: [],
      unplacedItems: [],
    };

    const plan = constructPackingPlan(
      'empty-plan',
      input,
      verified(candidate),
      solverMeta
    );

    expect(plan.status).toBe('feasible');
    expect(plan.metrics).toEqual({
      cartonCount: 0,
      placedItemCount: 0,
      unplacedItemCount: 0,
      itemVolumeMm3: 0,
      cartonVolumeMm3: 0,
      emptyVolumeMm3: 0,
      utilization: 0,
      totalContentsWeightG: 0,
      totalGrossWeightG: 0,
      totalCartonCost: 0,
    });
  });

  it('rejects an invalid verified candidate', () => {
    const invalid: CandidateVerificationResult = {
      candidate: makePlacedCandidate(),
      verification: {
        valid: false,
        issues: [
          {
            code: 'boundary-violation',
            message: 'invalid',
          },
        ],
      },
    };

    expect(() =>
      constructPackingPlan(
        'plan-5',
        makeInput(),
        invalid,
        solverMeta
      )
    ).toThrow(
      'Cannot construct PackingPlan from invalid verified candidate'
    );
  });

  it('does not mutate or alias caller-owned input or candidate data', () => {
    const input = makeInput();
    const candidate = makePlacedCandidate();

    const inputBefore = JSON.stringify(input);
    const candidateBefore = JSON.stringify(candidate);
    const metaBefore = JSON.stringify(solverMeta);

    const plan = constructPackingPlan(
      'plan-6',
      input,
      verified(candidate),
      solverMeta
    );

    plan.cartons[0].placements[0].x = 5;
    plan.cartons[0].carton.internalDimensions.length = 999;
    plan.objective.kind = 'balanced';
    plan.solverMeta.durationMs = 999;

    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(JSON.stringify(candidate)).toBe(candidateBefore);
    expect(JSON.stringify(solverMeta)).toBe(metaBefore);
  });
});