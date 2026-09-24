import { describe, expect, it } from 'vitest';

import type { ObjectiveKind } from '../core/domain/objectives.js';
import type { UnplacedItem } from '../core/domain/plan-contracts.js';
import type { ItemPlacement } from '../core/domain/result.js';
import type {
  SolverCandidatePlan,
  SolverInput,
} from '../core/solver/contracts.js';
import type { CandidateVerificationResult } from '../core/solver/integration.js';
import { selectVerifiedCandidate } from '../core/solver/selection.js';

function makeInput(
  objective: ObjectiveKind = 'balanced'
): SolverInput {
  return {
    items: [
      {
        id: 'item-a',
        dimensions: {
          length: 10,
          width: 10,
          height: 10,
        },
        quantity: 10,
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
        id: 'small',
        internalDimensions: {
          length: 20,
          width: 20,
          height: 20,
        },
        emptyBoxWeightG: 50,
        costPerBox: 1,
      },
      {
        id: 'medium',
        internalDimensions: {
          length: 30,
          width: 30,
          height: 30,
        },
        emptyBoxWeightG: 100,
        costPerBox: 2,
      },
      {
        id: 'large',
        internalDimensions: {
          length: 40,
          width: 40,
          height: 40,
        },
        emptyBoxWeightG: 200,
        costPerBox: 4,
      },
    ],
    objective: {
      kind: objective,
    },
  };
}

function placement(
  instanceIndex: number,
  x = 0,
  itemId = 'item-a'
): ItemPlacement {
  return {
    itemId,
    instanceIndex,
    x,
    y: 0,
    z: 0,
    length: 10,
    width: 10,
    height: 10,
    rotation: 'LWH',
  };
}

function candidate(
  cartons: Array<{
    cartonId: string;
    placements: ItemPlacement[];
  }>,
  unplacedItems: UnplacedItem[] = [],
  status: SolverCandidatePlan['status'] = 'feasible'
): SolverCandidatePlan {
  return {
    status,
    cartons,
    unplacedItems,
  };
}

function verified(
  candidatePlan: SolverCandidatePlan,
  valid = true
): CandidateVerificationResult {
  return {
    candidate: candidatePlan,
    verification: {
      valid,
      issues: valid
        ? []
        : [
            {
              code: 'boundary-violation',
              message: 'invalid candidate',
            },
          ],
    },
  };
}

function oneLargeBoxTwoItems(): SolverCandidatePlan {
  return candidate([
    {
      cartonId: 'large',
      placements: [
        placement(0, 0),
        placement(1, 10),
      ],
    },
  ]);
}

function twoSmallBoxesTwoItems(): SolverCandidatePlan {
  return candidate([
    {
      cartonId: 'small',
      placements: [placement(0)],
    },
    {
      cartonId: 'small',
      placements: [placement(1)],
    },
  ]);
}

describe('selectVerifiedCandidate', () => {
  it('returns no-valid-candidate when verification rejects every candidate', () => {
    const result = selectVerifiedCandidate(
      makeInput(),
      [
        verified(oneLargeBoxTwoItems(), false),
        verified(twoSmallBoxesTwoItems(), false),
      ]
    );

    expect(result).toEqual({
      kind: 'no-valid-candidate',
    });
  });

  it('excludes invalid candidates from selection', () => {
    const result = selectVerifiedCandidate(
      makeInput('fewest-cartons'),
      [
        verified(oneLargeBoxTwoItems(), false),
        verified(twoSmallBoxesTwoItems()),
      ]
    );

    expect(result).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 1,
      rankedCandidateIndexes: [1],
    });
  });

  it('maximizes placed-item coverage before applying the objective', () => {
    const lowerCoverage = candidate([
      {
        cartonId: 'small',
        placements: [placement(0)],
      },
    ]);

    const higherCoverage = twoSmallBoxesTwoItems();

    const result = selectVerifiedCandidate(
      makeInput('fewest-cartons'),
      [
        verified(lowerCoverage),
        verified(higherCoverage),
      ]
    );

    expect(result).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 1,
      rankedCandidateIndexes: [1],
    });
  });

  it('minimizes unplaced count after maximizing placed count', () => {
    const moreUnplaced = candidate(
      [
        {
          cartonId: 'small',
          placements: [placement(0)],
        },
      ],
      [
        {
          itemId: 'item-a',
          instanceIndex: 1,
          reason: 'solver-limit-reached',
        },
        {
          itemId: 'item-a',
          instanceIndex: 2,
          reason: 'solver-limit-reached',
        },
      ]
    );

    const fewerUnplaced = candidate(
      [
        {
          cartonId: 'medium',
          placements: [placement(0)],
        },
      ],
      [
        {
          itemId: 'item-a',
          instanceIndex: 1,
          reason: 'solver-limit-reached',
        },
      ]
    );

    const result = selectVerifiedCandidate(
      makeInput('least-wasted-volume'),
      [
        verified(moreUnplaced),
        verified(fewerUnplaced),
      ]
    );

    expect(result).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 1,
      rankedCandidateIndexes: [1],
    });
  });

  it('ranks fewest-cartons by carton count before wasted volume', () => {
    const result = selectVerifiedCandidate(
      makeInput('fewest-cartons'),
      [
        verified(twoSmallBoxesTwoItems()),
        verified(oneLargeBoxTwoItems()),
      ]
    );

    expect(result).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 1,
      rankedCandidateIndexes: [1, 0],
    });
  });

  it('uses original solver order as the final deterministic tie-break', () => {
    const first = oneLargeBoxTwoItems();
    const second = oneLargeBoxTwoItems();

    const result = selectVerifiedCandidate(
      makeInput('balanced'),
      [verified(first), verified(second)]
    );

    expect(result).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 0,
      rankedCandidateIndexes: [0, 1],
    });
  });

  it('ranks least-wasted-volume by absolute empty volume first', () => {
    const small = candidate([
      {
        cartonId: 'small',
        placements: [placement(0)],
      },
    ]);

    const medium = candidate([
      {
        cartonId: 'medium',
        placements: [placement(0)],
      },
    ]);

    const result = selectVerifiedCandidate(
      makeInput('least-wasted-volume'),
      [verified(medium), verified(small)]
    );

    expect(result).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 1,
      rankedCandidateIndexes: [1, 0],
    });
  });

  it('ranks min-carton-cost by known total carton cost', () => {
    const result = selectVerifiedCandidate(
      makeInput('min-carton-cost'),
      [
        verified(oneLargeBoxTwoItems()),
        verified(twoSmallBoxesTwoItems()),
      ]
    );

    expect(result).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 1,
      rankedCandidateIndexes: [1, 0],
    });
  });

  it('returns insufficient-data when a best-coverage carton cost is unknown', () => {
    const input = makeInput('min-carton-cost');
    delete input.cartons[2]!.costPerBox;

    const result = selectVerifiedCandidate(
      input,
      [
        verified(oneLargeBoxTwoItems()),
        verified(twoSmallBoxesTwoItems()),
      ]
    );

    expect(result).toEqual({
      kind: 'insufficient-data',
      objective: 'min-carton-cost',
      missingMetric: 'carton-cost',
    });
  });

  it('does not let missing cost on a lower-coverage candidate block selection', () => {
    const input = makeInput('min-carton-cost');
    delete input.cartons[2]!.costPerBox;

    const lowerCoverage = candidate([
      {
        cartonId: 'large',
        placements: [placement(0)],
      },
    ]);

    const result = selectVerifiedCandidate(
      input,
      [
        verified(lowerCoverage),
        verified(twoSmallBoxesTwoItems()),
      ]
    );

    expect(result).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 1,
      rankedCandidateIndexes: [1],
    });
  });

  it('ranks easier-to-carry by the heaviest individual carton first', () => {
    const result = selectVerifiedCandidate(
      makeInput('easier-to-carry'),
      [
        verified(oneLargeBoxTwoItems()),
        verified(twoSmallBoxesTwoItems()),
      ]
    );

    expect(result).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 1,
      rankedCandidateIndexes: [1, 0],
    });
  });

  it('returns insufficient-data when best-coverage gross weight is unknown', () => {
    const input = makeInput('easier-to-carry');
    delete input.items[0]!.unitWeightG;

    const result = selectVerifiedCandidate(
      input,
      [
        verified(oneLargeBoxTwoItems()),
        verified(twoSmallBoxesTwoItems()),
      ]
    );

    expect(result).toEqual({
      kind: 'insufficient-data',
      objective: 'easier-to-carry',
      missingMetric: 'gross-weight',
    });
  });

  it('returns objective-unsupported for existing-inventory-first', () => {
    const result = selectVerifiedCandidate(
      makeInput('existing-inventory-first'),
      [verified(oneLargeBoxTwoItems())]
    );

    expect(result).toEqual({
      kind: 'objective-unsupported',
      objective: 'existing-inventory-first',
    });
  });

  it('returns objective-unsupported for min-dim-weight', () => {
    const result = selectVerifiedCandidate(
      makeInput('min-dim-weight'),
      [verified(oneLargeBoxTwoItems())]
    );

    expect(result).toEqual({
      kind: 'objective-unsupported',
      objective: 'min-dim-weight',
    });
  });

  it('does not use solver candidate status as ranking authority', () => {
    const moreComplete = oneLargeBoxTwoItems();
    moreComplete.status = 'infeasible';

    const lessComplete = candidate(
      [
        {
          cartonId: 'small',
          placements: [placement(0)],
        },
      ],
      [
        {
          itemId: 'item-a',
          instanceIndex: 1,
          reason: 'no-fitting-carton',
        },
      ],
      'feasible'
    );

    const result = selectVerifiedCandidate(
      makeInput('fewest-cartons'),
      [verified(lessComplete), verified(moreComplete)]
    );

    expect(result).toMatchObject({
      kind: 'selected',
      selectedCandidateIndex: 1,
      rankedCandidateIndexes: [1],
    });
  });

  it('treats zero-carton cost and gross weight as known zero', () => {
    const emptyCandidate = candidate([]);

    expect(
      selectVerifiedCandidate(
        makeInput('min-carton-cost'),
        [verified(emptyCandidate)]
      )
    ).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 0,
      rankedCandidateIndexes: [0],
    });

    expect(
      selectVerifiedCandidate(
        makeInput('easier-to-carry'),
        [verified(emptyCandidate)]
      )
    ).toEqual({
      kind: 'selected',
      selectedCandidateIndex: 0,
      rankedCandidateIndexes: [0],
    });
  });

  it('throws on an unknown carton reference in a verified candidate', () => {
    const bad = candidate([
      {
        cartonId: 'missing-carton',
        placements: [placement(0)],
      },
    ]);

    expect(() =>
      selectVerifiedCandidate(
        makeInput(),
        [verified(bad)]
      )
    ).toThrow(
      'Verified candidate references unknown carton: missing-carton'
    );
  });

  it('throws on an unknown item reference in a verified candidate', () => {
    const bad = candidate([
      {
        cartonId: 'small',
        placements: [
          placement(0, 0, 'missing-item'),
        ],
      },
    ]);

    expect(() =>
      selectVerifiedCandidate(
        makeInput(),
        [verified(bad)]
      )
    ).toThrow(
      'Verified candidate references unknown item: missing-item'
    );
  });

  it('does not mutate input, candidates, or return an aliased ranking array', () => {
    const input = makeInput('balanced');
    const candidates = [
      verified(oneLargeBoxTwoItems()),
      verified(twoSmallBoxesTwoItems()),
    ];

    const inputBefore = JSON.stringify(input);
    const candidatesBefore = JSON.stringify(candidates);

    const result = selectVerifiedCandidate(
      input,
      candidates
    );

    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(JSON.stringify(candidates)).toBe(candidatesBefore);

    if (result.kind !== 'selected') {
      throw new Error('Expected a selected result');
    }

    result.rankedCandidateIndexes[0] = 999;

    expect(JSON.stringify(candidates)).toBe(candidatesBefore);
  });
});
