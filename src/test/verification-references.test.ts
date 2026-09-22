import { describe, expect, it } from 'vitest';
import type {
  SolverCandidatePlan,
  SolverInput,
} from '../core/solver/contracts.js';
import type { ItemPlacement } from '../core/domain/result.js';
import { collectReferenceAndQuantityIssues } from '../core/verification/references.js';

describe('collectReferenceAndQuantityIssues', () => {
  function createPlacement(
    itemId: string,
    instanceIndex: number
  ): ItemPlacement {
    return {
      itemId,
      instanceIndex,
      x: 0,
      y: 0,
      z: 0,
      length: 100,
      width: 50,
      height: 30,
      rotation: 'LWH',
    };
  }

  const input: SolverInput = {
    items: [
      {
        id: 'item-1',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 3,
        constraints: {
          rotationPolicy: 'any',
          fragile: false,
          paddingAllowanceMm: 0,
          spacingAllowanceMm: 0,
          stackable: true,
        },
      },
      {
        id: 'item-2',
        dimensions: { length: 200, width: 100, height: 50 },
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
        id: 'carton-1',
        internalDimensions: {
          length: 300,
          width: 200,
          height: 100,
        },
      },
      {
        id: 'carton-2',
        internalDimensions: {
          length: 400,
          width: 300,
          height: 200,
        },
      },
    ],
    objective: { kind: 'fewest-cartons' },
  };

  function createAllPlacedCandidate(
    extraPlacements: ItemPlacement[] = [],
    cartonId = 'carton-1'
  ): SolverCandidatePlan {
    return {
      status: 'feasible',
      cartons: [
        {
          cartonId,
          placements: [
            createPlacement('item-1', 0),
            createPlacement('item-1', 1),
            createPlacement('item-1', 2),
            createPlacement('item-2', 0),
            createPlacement('item-2', 1),
            ...extraPlacements,
          ],
        },
      ],
      unplacedItems: [],
    };
  }

  it('valid all-placed => []', () => {
    const candidate = createAllPlacedCandidate();

    expect(
      collectReferenceAndQuantityIssues(input, candidate)
    ).toEqual([]);
  });

  it('valid placed + unplaced => []', () => {
    const candidate: SolverCandidatePlan = {
      status: 'partial',
      cartons: [
        {
          cartonId: 'carton-1',
          placements: [
            createPlacement('item-1', 0),
            createPlacement('item-2', 0),
          ],
        },
      ],
      unplacedItems: [
        {
          itemId: 'item-1',
          instanceIndex: 1,
          reason: 'no-fitting-carton',
        },
        {
          itemId: 'item-1',
          instanceIndex: 2,
          reason: 'no-fitting-carton',
        },
        {
          itemId: 'item-2',
          instanceIndex: 1,
          reason: 'no-fitting-carton',
        },
      ],
    };

    expect(
      collectReferenceAndQuantityIssues(input, candidate)
    ).toEqual([]);
  });

  it('unknown carton', () => {
    const candidate = createAllPlacedCandidate([], 'missing-carton');

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'unknown-carton',
        cartonId: 'missing-carton',
        cartonIndex: 0,
      }),
    ]);
  });

  it('unknown placement item', () => {
    const candidate = createAllPlacedCandidate([
      createPlacement('missing-item', 0),
    ]);

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'unknown-item',
        itemId: 'missing-item',
        instanceIndex: 0,
        cartonId: 'carton-1',
        cartonIndex: 0,
      }),
    ]);
  });

  it('unknown unplaced item', () => {
    const candidate = createAllPlacedCandidate();

    candidate.unplacedItems = [
      {
        itemId: 'missing-item',
        instanceIndex: 0,
        reason: 'no-fitting-carton',
      },
    ];

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'unknown-item',
        itemId: 'missing-item',
        instanceIndex: 0,
      }),
    ]);
  });

  it('negative instanceIndex', () => {
    const candidate = createAllPlacedCandidate([
      createPlacement('item-1', -1),
    ]);

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'invalid-instance',
        itemId: 'item-1',
        instanceIndex: -1,
      }),
    ]);
  });

  it('fractional instanceIndex', () => {
    const candidate = createAllPlacedCandidate([
      createPlacement('item-1', 1.5),
    ]);

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'invalid-instance',
        itemId: 'item-1',
        instanceIndex: 1.5,
      }),
    ]);
  });

  it('out-of-range instanceIndex', () => {
    const candidate = createAllPlacedCandidate([
      createPlacement('item-1', 3),
    ]);

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'invalid-instance',
        itemId: 'item-1',
        instanceIndex: 3,
      }),
    ]);
  });

  it('missing requested instance => exactly one quantity-mismatch', () => {
    const candidate: SolverCandidatePlan = {
      status: 'feasible',
      cartons: [
        {
          cartonId: 'carton-1',
          placements: [
            createPlacement('item-1', 0),
            createPlacement('item-1', 2),
            createPlacement('item-2', 0),
            createPlacement('item-2', 1),
          ],
        },
      ],
      unplacedItems: [],
    };

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'quantity-mismatch',
        itemId: 'item-1',
        instanceIndex: 1,
      }),
    ]);
  });

  it('duplicate placement instance => exactly one quantity-mismatch', () => {
    const candidate = createAllPlacedCandidate([
      createPlacement('item-1', 0),
    ]);

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'quantity-mismatch',
        itemId: 'item-1',
        instanceIndex: 0,
      }),
    ]);
  });

  it('same instance placed + unplaced => exactly one quantity-mismatch', () => {
    const candidate = createAllPlacedCandidate();

    candidate.unplacedItems = [
      {
        itemId: 'item-1',
        instanceIndex: 0,
        reason: 'no-fitting-carton',
      },
    ];

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'quantity-mismatch',
        itemId: 'item-1',
        instanceIndex: 0,
      }),
    ]);
  });

  it('invalid-instance record does not create quantity-mismatch', () => {
    const candidate = createAllPlacedCandidate();

    candidate.unplacedItems = [
      {
        itemId: 'item-2',
        instanceIndex: 99,
        reason: 'no-fitting-carton',
      },
    ];

    const issues =
      collectReferenceAndQuantityIssues(input, candidate);

    expect(
      issues.filter(issue => issue.code === 'invalid-instance')
    ).toHaveLength(1);

    expect(
      issues.filter(issue => issue.code === 'quantity-mismatch')
    ).toHaveLength(0);
  });

  it('multiple items and quantities are fully accounted', () => {
    const candidate: SolverCandidatePlan = {
      status: 'partial',
      cartons: [
        {
          cartonId: 'carton-1',
          placements: [
            createPlacement('item-1', 0),
            createPlacement('item-2', 0),
          ],
        },
        {
          cartonId: 'carton-2',
          placements: [
            createPlacement('item-1', 1),
            createPlacement('item-2', 1),
          ],
        },
      ],
      unplacedItems: [
        {
          itemId: 'item-1',
          instanceIndex: 2,
          reason: 'no-fitting-carton',
        },
      ],
    };

    expect(
      collectReferenceAndQuantityIssues(input, candidate)
    ).toEqual([]);
  });

  it('input and candidate are not mutated', () => {
    const candidate = createAllPlacedCandidate();

    const inputBefore = JSON.stringify(input);
    const candidateBefore = JSON.stringify(candidate);

    collectReferenceAndQuantityIssues(input, candidate);

    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(JSON.stringify(candidate)).toBe(candidateBefore);
  });
});