import { describe, expect, it } from 'vitest';
import type { ItemPlacement } from '../core/domain/result.js';
import type {
  SolverCandidatePlan,
  SolverInput,
} from '../core/solver/contracts.js';
import { verifyCandidatePlan } from '../core/verification/verifier.js';

describe('verifyCandidatePlan', () => {
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
        unitWeightG: 1000,
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
        maxGrossWeightG: 1500,
        emptyBoxWeightG: 500,
        quantityAvailable: 2,
        stockQuantity: 2,
      },
    ],
    objective: {
      kind: 'fewest-cartons',
    },
  };

  function placement(
    overrides: Partial<ItemPlacement> = {}
  ): ItemPlacement {
    return {
      itemId: 'item-1',
      instanceIndex: 0,
      x: 0,
      y: 0,
      z: 0,
      length: 10,
      width: 10,
      height: 10,
      rotation: 'LWH',
      ...overrides,
    };
  }

  function validCandidate(): SolverCandidatePlan {
    return {
      status: 'feasible',
      cartons: [
        {
          cartonId: 'carton-1',
          placements: [placement()],
        },
      ],
      unplacedItems: [],
    };
  }

  it('returns valid report for valid candidate', () => {
    expect(
      verifyCandidatePlan(input, validCandidate())
    ).toEqual({
      valid: true,
      issues: [],
    });
  });

  it('includes reference verification issues', () => {
    const candidate = validCandidate();

    candidate.cartons.push({
      cartonId: 'missing-carton',
      placements: [],
    });

    const report = verifyCandidatePlan(input, candidate);

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: 'unknown-carton',
        cartonId: 'missing-carton',
        cartonIndex: 1,
      }),
    ]);
  });

  it('includes geometry verification issues', () => {
    const candidate: SolverCandidatePlan = {
      status: 'feasible',
      cartons: [
        {
          cartonId: 'carton-1',
          placements: [
            placement({
              x: 95,
            }),
          ],
        },
      ],
      unplacedItems: [],
    };

    const report = verifyCandidatePlan(input, candidate);

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: 'boundary-violation',
        itemId: 'item-1',
        instanceIndex: 0,
        cartonId: 'carton-1',
        cartonIndex: 0,
      }),
    ]);
  });

  it('includes weight verification issues', () => {
    const heavyInput: SolverInput = {
      ...input,
      items: input.items.map(item => ({
        ...item,
        unitWeightG: 1001,
      })),
    };

    const report = verifyCandidatePlan(
      heavyInput,
      validCandidate()
    );

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: 'weight-limit',
        cartonId: 'carton-1',
        cartonIndex: 0,
      }),
    ]);
  });

  it('includes inventory verification issues', () => {
    const candidate: SolverCandidatePlan = {
      status: 'partial',
      cartons: [
        {
          cartonId: 'carton-1',
          placements: [],
        },
        {
          cartonId: 'carton-1',
          placements: [],
        },
        {
          cartonId: 'carton-1',
          placements: [],
        },
      ],
      unplacedItems: [
        {
          itemId: 'item-1',
          instanceIndex: 0,
          reason: 'no-fitting-carton',
        },
      ],
    };

    const report = verifyCandidatePlan(input, candidate);

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: 'inventory-overuse',
        cartonId: 'carton-1',
        cartonIndex: 2,
      }),
    ]);
  });

  it('combines verifier slices in deterministic order', () => {
    const heavyInput: SolverInput = {
      ...input,
      items: input.items.map(item => ({
        ...item,
        unitWeightG: 1001,
      })),
    };

    const candidate: SolverCandidatePlan = {
      status: 'feasible',
      cartons: [
        {
          cartonId: 'carton-1',
          placements: [
            placement({
              x: 95,
            }),
          ],
        },
        {
          cartonId: 'missing-carton',
          placements: [],
        },
      ],
      unplacedItems: [],
    };

    const report = verifyCandidatePlan(
      heavyInput,
      candidate
    );

    expect(report.valid).toBe(false);
    expect(
      report.issues.map(issue => issue.code)
    ).toEqual([
      'unknown-carton',
      'boundary-violation',
      'weight-limit',
    ]);
  });

  it('valid always matches whether issues are empty', () => {
    const validReport = verifyCandidatePlan(
      input,
      validCandidate()
    );

    expect(validReport.valid).toBe(
      validReport.issues.length === 0
    );

    const invalidCandidate: SolverCandidatePlan = {
      status: 'feasible',
      cartons: [],
      unplacedItems: [],
    };

    const invalidReport = verifyCandidatePlan(
      input,
      invalidCandidate
    );

    expect(invalidReport.valid).toBe(
      invalidReport.issues.length === 0
    );

    expect(invalidReport.valid).toBe(false);
  });

  it('does not mutate input or candidate', () => {
    const candidate = validCandidate();

    const inputBefore = JSON.stringify(input);
    const candidateBefore = JSON.stringify(candidate);

    verifyCandidatePlan(input, candidate);

    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(JSON.stringify(candidate)).toBe(
      candidateBefore
    );
  });
});