import { describe, expect, it } from 'vitest';
import type { RotationPolicy } from '../core/domain/constraints.js';
import type {
  ItemPlacement,
  PlacementRotation,
} from '../core/domain/result.js';
import type {
  SolverCandidatePlan,
  SolverInput,
} from '../core/solver/contracts.js';
import { collectGeometryIssues } from '../core/verification/geometry.js';

describe('collectGeometryIssues', () => {
  const input: SolverInput = {
    items: [
      {
        id: 'item-1',
        dimensions: {
          length: 10,
          width: 20,
          height: 30,
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
      {
        id: 'item-2',
        dimensions: {
          length: 20,
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
        id: 'carton-1',
        internalDimensions: {
          length: 100,
          width: 100,
          height: 100,
        },
      },
      {
        id: 'carton-2',
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

  function createPlacement(
    overrides: Partial<ItemPlacement> = {}
  ): ItemPlacement {
    return {
      itemId: 'item-1',
      instanceIndex: 0,
      x: 0,
      y: 0,
      z: 0,
      length: 10,
      width: 20,
      height: 30,
      rotation: 'LWH',
      ...overrides,
    };
  }

  function createCandidate(
    placements: ItemPlacement[],
    cartonId = 'carton-1'
  ): SolverCandidatePlan {
    return {
      status: 'feasible',
      cartons: [
        {
          cartonId,
          placements,
        },
      ],
      unplacedItems: [],
    };
  }

  function inputWithPolicy(
    policy: RotationPolicy
  ): SolverInput {
    return {
      ...input,
      items: input.items.map(item =>
        item.id === 'item-1'
          ? {
              ...item,
              constraints: {
                ...item.constraints,
                rotationPolicy: policy,
              },
            }
          : item
      ),
    };
  }

  const rotations: Array<
    [
      PlacementRotation,
      {
        length: number;
        width: number;
        height: number;
      },
    ]
  > = [
    ['LWH', { length: 10, width: 20, height: 30 }],
    ['WLH', { length: 20, width: 10, height: 30 }],
    ['LHW', { length: 10, width: 30, height: 20 }],
    ['HLW', { length: 30, width: 10, height: 20 }],
    ['WHL', { length: 20, width: 30, height: 10 }],
    ['HWL', { length: 30, width: 20, height: 10 }],
  ];

  it('accepts valid geometry', () => {
    const candidate = createCandidate([
      createPlacement(),
    ]);

    expect(
      collectGeometryIssues(input, candidate)
    ).toEqual([]);
  });

  it('accepts exact dimension mapping for all six rotations', () => {
    for (const [rotation, dimensions] of rotations) {
      const candidate = createCandidate([
        createPlacement({
          rotation,
          ...dimensions,
        }),
      ]);

      expect(
        collectGeometryIssues(input, candidate)
      ).toEqual([]);
    }
  });

  it('rejects placement dimensions that do not match rotation', () => {
    const candidate = createCandidate([
      createPlacement({
        length: 11,
      }),
    ]);

    const issues =
      collectGeometryIssues(input, candidate);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'rotation-violation',
      itemId: 'item-1',
      instanceIndex: 0,
      cartonId: 'carton-1',
      cartonIndex: 0,
    });
  });

  it('enforces exact rotation-policy mapping', () => {
    const allowed: Record<
      RotationPolicy,
      readonly PlacementRotation[]
    > = {
      any: [
        'LWH',
        'WLH',
        'LHW',
        'HLW',
        'WHL',
        'HWL',
      ],
      upright: ['LWH', 'WLH'],
      'vertical-axis-only': ['LWH', 'WLH'],
      fixed: ['LWH'],
    };

    const policies: RotationPolicy[] = [
      'any',
      'upright',
      'vertical-axis-only',
      'fixed',
    ];

    for (const policy of policies) {
      const policyInput = inputWithPolicy(policy);

      for (const [rotation, dimensions] of rotations) {
        const candidate = createCandidate([
          createPlacement({
            rotation,
            ...dimensions,
          }),
        ]);

        const rotationIssues = collectGeometryIssues(
          policyInput,
          candidate
        ).filter(
          issue => issue.code === 'rotation-violation'
        );

        expect(rotationIssues).toHaveLength(
          allowed[policy].includes(rotation) ? 0 : 1
        );
      }
    }
  });

  it('allows minimum coordinate within tolerance', () => {
    const candidate = createCandidate([
      createPlacement({
        x: -0.5e-10,
      }),
    ]);

    expect(
      collectGeometryIssues(input, candidate)
    ).toEqual([]);
  });

  it('allows maximum coordinate within tolerance', () => {
    const candidate = createCandidate([
      createPlacement({
        x: 90 + 0.5e-10,
      }),
    ]);

    expect(
      collectGeometryIssues(input, candidate)
    ).toEqual([]);
  });

  it('rejects coordinate below negative tolerance', () => {
    const candidate = createCandidate([
      createPlacement({
        x: -2e-10,
      }),
    ]);

    const issues =
      collectGeometryIssues(input, candidate);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'boundary-violation',
      itemId: 'item-1',
      instanceIndex: 0,
    });
  });

  it('rejects placement beyond carton maximum tolerance', () => {
    const candidate = createCandidate([
      createPlacement({
        x: 90 + 2e-10,
      }),
    ]);

    const issues =
      collectGeometryIssues(input, candidate);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'boundary-violation',
      cartonId: 'carton-1',
      cartonIndex: 0,
    });
  });

  it('detects overlap on all three axes', () => {
    const candidate = createCandidate([
      createPlacement(),
      createPlacement({
        itemId: 'item-2',
        instanceIndex: 0,
        x: 5,
        y: 5,
        z: 5,
        length: 20,
        width: 10,
        height: 10,
      }),
    ]);

    const issues =
      collectGeometryIssues(input, candidate);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'overlap',
      cartonId: 'carton-1',
      cartonIndex: 0,
    });
  });

  it('does not treat touching faces as overlap', () => {
    const candidate = createCandidate([
      createPlacement(),
      createPlacement({
        itemId: 'item-2',
        instanceIndex: 0,
        x: 10,
        y: 0,
        z: 0,
        length: 20,
        width: 10,
        height: 10,
      }),
    ]);

    expect(
      collectGeometryIssues(input, candidate)
    ).toEqual([]);
  });

  it('does not treat overlap within tolerance as overlap', () => {
    const candidate = createCandidate([
      createPlacement(),
      createPlacement({
        itemId: 'item-2',
        instanceIndex: 0,
        x: 10 - 0.5e-10,
        y: 0,
        z: 0,
        length: 20,
        width: 10,
        height: 10,
      }),
    ]);

    expect(
      collectGeometryIssues(input, candidate)
    ).toEqual([]);
  });

  it('detects overlap greater than tolerance', () => {
    const candidate = createCandidate([
      createPlacement(),
      createPlacement({
        itemId: 'item-2',
        instanceIndex: 0,
        x: 10 - 2e-10,
        y: 0,
        z: 0,
        length: 20,
        width: 10,
        height: 10,
      }),
    ]);

    const issues =
      collectGeometryIssues(input, candidate);

    expect(
      issues.filter(issue => issue.code === 'overlap')
    ).toHaveLength(1);
  });

  it('does not compare placements across different cartons', () => {
    const first = createPlacement();

    const second = createPlacement({
      itemId: 'item-2',
      instanceIndex: 0,
      length: 20,
      width: 10,
      height: 10,
    });

    const candidate: SolverCandidatePlan = {
      status: 'feasible',
      cartons: [
        {
          cartonId: 'carton-1',
          placements: [first],
        },
        {
          cartonId: 'carton-2',
          placements: [second],
        },
      ],
      unplacedItems: [],
    };

    expect(
      collectGeometryIssues(input, candidate)
    ).toEqual([]);
  });

  it('does not mutate input or candidate', () => {
    const candidate = createCandidate([
      createPlacement(),
    ]);

    const inputBefore = JSON.stringify(input);
    const candidateBefore = JSON.stringify(candidate);

    collectGeometryIssues(input, candidate);

    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(JSON.stringify(candidate)).toBe(
      candidateBefore
    );
  });
});