import { describe, expect, it } from 'vitest';
import type { ItemPlacement } from '../core/domain/result.js';
import type {
  SolverCandidateCarton,
  SolverCandidatePlan,
  SolverInput,
} from '../core/solver/contracts.js';
import { collectLimitIssues } from '../core/verification/limits.js';

describe('collectLimitIssues', () => {
  const input: SolverInput = {
    items: [
      {
        id: 'light',
        dimensions: {
          length: 10,
          width: 10,
          height: 10,
        },
        quantity: 3,
        unitWeightG: 1000,
        constraints: {
          rotationPolicy: 'any',
          fragile: false,
          paddingAllowanceMm: 0,
          spacingAllowanceMm: 0,
          stackable: true,
        },
      },
      {
        id: 'heavy',
        dimensions: {
          length: 10,
          width: 10,
          height: 10,
        },
        quantity: 1,
        unitWeightG: 2500,
        constraints: {
          rotationPolicy: 'any',
          fragile: false,
          paddingAllowanceMm: 0,
          spacingAllowanceMm: 0,
          stackable: true,
        },
      },
      {
        id: 'unknown-weight',
        dimensions: {
          length: 10,
          width: 10,
          height: 10,
        },
        quantity: 1,
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
        id: 'weight-carton',
        internalDimensions: {
          length: 100,
          width: 100,
          height: 100,
        },
        maxGrossWeightG: 3500,
        emptyBoxWeightG: 500,
      },
      {
        id: 'unknown-box-weight',
        internalDimensions: {
          length: 100,
          width: 100,
          height: 100,
        },
        maxGrossWeightG: 3000,
      },
      {
        id: 'empty-heavy-carton',
        internalDimensions: {
          length: 100,
          width: 100,
          height: 100,
        },
        maxGrossWeightG: 400,
        emptyBoxWeightG: 500,
      },
      {
        id: 'quantity-carton',
        internalDimensions: {
          length: 100,
          width: 100,
          height: 100,
        },
        quantityAvailable: 2,
      },
      {
        id: 'stock-carton',
        internalDimensions: {
          length: 100,
          width: 100,
          height: 100,
        },
        stockQuantity: 1,
      },
      {
        id: 'both-carton',
        internalDimensions: {
          length: 100,
          width: 100,
          height: 100,
        },
        quantityAvailable: 3,
        stockQuantity: 1,
      },
      {
        id: 'unlimited-carton',
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

  function placement(
    itemId: string,
    instanceIndex = 0
  ): ItemPlacement {
    return {
      itemId,
      instanceIndex,
      x: 0,
      y: 0,
      z: 0,
      length: 10,
      width: 10,
      height: 10,
      rotation: 'LWH',
    };
  }

  function carton(
    cartonId: string,
    placements: ItemPlacement[] = []
  ): SolverCandidateCarton {
    return {
      cartonId,
      placements,
    };
  }

  function candidate(
    cartons: SolverCandidateCarton[]
  ): SolverCandidatePlan {
    return {
      status: 'feasible',
      cartons,
      unplacedItems: [],
    };
  }

  it('accepts gross weight exactly at maximum', () => {
    const plan = candidate([
      carton('weight-carton', [
        placement('light', 0),
        placement('light', 1),
        placement('light', 2),
      ]),
    ]);

    expect(collectLimitIssues(input, plan)).toEqual([]);
  });

  it('detects gross weight above maximum', () => {
    const plan = candidate([
      carton('weight-carton', [
        placement('heavy'),
        placement('light'),
      ]),
    ]);

    const issues = collectLimitIssues(input, plan);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'weight-limit',
      cartonId: 'weight-carton',
      cartonIndex: 0,
    });
  });

  it('does not claim weight violation when an item weight is unknown', () => {
    const plan = candidate([
      carton('weight-carton', [
        placement('heavy'),
        placement('light'),
        placement('unknown-weight'),
      ]),
    ]);

    expect(collectLimitIssues(input, plan)).toEqual([]);
  });

  it('does not assume missing empty box weight is zero', () => {
    const plan = candidate([
      carton('unknown-box-weight', [
        placement('heavy'),
        placement('light'),
      ]),
    ]);

    expect(collectLimitIssues(input, plan)).toEqual([]);
  });

  it('detects overweight empty carton when gross weight is known', () => {
    const plan = candidate([
      carton('empty-heavy-carton'),
    ]);

    const issues = collectLimitIssues(input, plan);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'weight-limit',
      cartonId: 'empty-heavy-carton',
      cartonIndex: 0,
    });
  });

  it('allows usage exactly at quantityAvailable', () => {
    const plan = candidate([
      carton('quantity-carton'),
      carton('quantity-carton'),
    ]);

    expect(collectLimitIssues(input, plan)).toEqual([]);
  });

  it('detects quantityAvailable overuse', () => {
    const plan = candidate([
      carton('quantity-carton'),
      carton('quantity-carton'),
      carton('quantity-carton'),
    ]);

    const issues = collectLimitIssues(input, plan);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'inventory-overuse',
      cartonId: 'quantity-carton',
      cartonIndex: 2,
    });
  });

  it('detects stockQuantity overuse', () => {
    const plan = candidate([
      carton('stock-carton'),
      carton('stock-carton'),
    ]);

    const issues = collectLimitIssues(input, plan);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'inventory-overuse',
      cartonId: 'stock-carton',
      cartonIndex: 1,
    });
  });

  it('allows usage satisfying both inventory bounds', () => {
    const plan = candidate([
      carton('both-carton'),
    ]);

    expect(collectLimitIssues(input, plan)).toEqual([]);
  });

  it('uses the stricter bound when both inventory bounds exist', () => {
    const plan = candidate([
      carton('both-carton'),
      carton('both-carton'),
    ]);

    const issues = collectLimitIssues(input, plan);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'inventory-overuse',
      cartonId: 'both-carton',
      cartonIndex: 1,
    });
  });

  it('treats undefined inventory bounds as unlimited', () => {
    const plan = candidate([
      carton('unlimited-carton'),
      carton('unlimited-carton'),
      carton('unlimited-carton'),
      carton('unlimited-carton'),
    ]);

    expect(collectLimitIssues(input, plan)).toEqual([]);
  });

  it('does not count unknown cartons toward known inventory', () => {
    const plan = candidate([
      carton('missing-carton'),
      carton('missing-carton'),
      carton('missing-carton'),
    ]);

    expect(collectLimitIssues(input, plan)).toEqual([]);
  });

  it('does not mutate input or candidate', () => {
    const plan = candidate([
      carton('weight-carton', [
        placement('light'),
      ]),
      carton('quantity-carton'),
    ]);

    const inputBefore = JSON.stringify(input);
    const candidateBefore = JSON.stringify(plan);

    collectLimitIssues(input, plan);

    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(JSON.stringify(plan)).toBe(candidateBefore);
  });
});