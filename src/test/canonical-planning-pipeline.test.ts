import { describe, expect, it } from 'vitest';

import type { ObjectiveKind } from '../core/domain/objectives.js';
import type {
  SolverAdapter,
  SolverCandidatePlan,
  SolverInput,
} from '../core/solver/contracts.js';
import { planPacking } from '../core/solver/pipeline.js';

function makeInput(
  objective: ObjectiveKind = 'fewest-cartons'
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
        quantity: 2,
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
        id: 'large',
        internalDimensions: {
          length: 40,
          width: 40,
          height: 40,
        },
        emptyBoxWeightG: 100,
        costPerBox: 4,
      },
    ],
    objective: {
      kind: objective,
    },
  };
}

function twoSmallBoxes(): SolverCandidatePlan {
  return {
    status: 'feasible',
    cartons: [
      {
        cartonId: 'small',
        placements: [
          {
            itemId: 'item-a',
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
      {
        cartonId: 'small',
        placements: [
          {
            itemId: 'item-a',
            instanceIndex: 1,
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

function oneLargeBox(): SolverCandidatePlan {
  return {
    status: 'feasible',
    cartons: [
      {
        cartonId: 'large',
        placements: [
          {
            itemId: 'item-a',
            instanceIndex: 0,
            x: 0,
            y: 0,
            z: 0,
            length: 10,
            width: 10,
            height: 10,
            rotation: 'LWH',
          },
          {
            itemId: 'item-a',
            instanceIndex: 1,
            x: 10,
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

function invalidLargeBox(): SolverCandidatePlan {
  const candidate =
    oneLargeBox();

  candidate.cartons[0]!
    .placements[1]!.x = 35;

  return candidate;
}

function makeSolver(
  candidates:
    SolverCandidatePlan[],
  onSolve?: (
    input: SolverInput
  ) => void
): SolverAdapter {
  return {
    solve: async input => {
      onSolve?.(
        input
      );

      return {
        candidates,
        solverMeta: {
          solverId:
            'pipeline-test-solver',
          solverVersion:
            '1',
          durationMs: 7,
          deterministic:
            true,
        },
      };
    },
  };
}

describe(
  'planPacking',
  () => {
    it(
      'runs solve, verify, select, and canonical construction in order',
      async () => {
        const input =
          makeInput();
        const first =
          twoSmallBoxes();
        const second =
          oneLargeBox();
        let solveCalls = 0;

        const result =
          await planPacking(
            'plan-pipeline-1',
            makeSolver(
              [
                first,
                second,
              ],
              receivedInput => {
                solveCalls += 1;
                expect(
                  receivedInput
                ).toBe(
                  input
                );
              }
            ),
            input
          );

        expect(
          solveCalls
        ).toBe(1);
        expect(
          result.kind
        ).toBe(
          'planned'
        );

        if (
          result.kind !==
          'planned'
        ) {
          throw new Error(
            'Expected a planned result'
          );
        }

        expect(
          result.selection
        ).toEqual({
          kind: 'selected',
          selectedCandidateIndex: 1,
          rankedCandidateIndexes: [
            1,
            0,
          ],
        });

        expect(
          result.verification
            .candidates
        ).toHaveLength(
          2
        );
        expect(
          result.verification
            .candidates[0]!
            .candidate
        ).toBe(
          first
        );
        expect(
          result.verification
            .candidates[1]!
            .candidate
        ).toBe(
          second
        );
        expect(
          result.verification
            .candidates[0]!
            .verification
            .valid
        ).toBe(
          true
        );
        expect(
          result.verification
            .candidates[1]!
            .verification
            .valid
        ).toBe(
          true
        );

        expect(
          result.plan.id
        ).toBe(
          'plan-pipeline-1'
        );
        expect(
          result.plan.cartons
        ).toHaveLength(
          1
        );
        expect(
          result.plan
            .cartons[0]!
            .carton.id
        ).toBe(
          'large'
        );
        expect(
          result.plan
            .metrics
            .cartonCount
        ).toBe(
          1
        );
        expect(
          result.plan
            .metrics
            .placedItemCount
        ).toBe(
          2
        );
        expect(
          result.plan.solverMeta
        ).toEqual({
          solverId:
            'pipeline-test-solver',
          solverVersion:
            '1',
          durationMs: 7,
          deterministic:
            true,
        });

        expect(
          result.alternatives
        ).toHaveLength(
          1
        );
        expect(
          result.alternatives[0]!
            .id
        ).toBe(
          'plan-pipeline-1:alternative:1'
        );
        expect(
          result.alternatives[0]!
            .cartons
        ).toHaveLength(
          2
        );
        expect(
          result.alternatives[0]!
            .cartons.map(
              carton =>
                carton.carton.id
            )
        ).toEqual([
          'small',
          'small',
        ]);
      }
    );

    it(
      'materializes every non-selected ranked candidate as a canonical alternative in rank order',
      async () => {
        const first =
          twoSmallBoxes();
        const second =
          oneLargeBox();
        const third =
          oneLargeBox();

        const result =
          await planPacking(
            'ranked-plans',
            makeSolver([
              first,
              second,
              third,
            ]),
            makeInput(
              'fewest-cartons'
            )
          );

        expect(
          result.kind
        ).toBe(
          'planned'
        );

        if (
          result.kind !==
          'planned'
        ) {
          throw new Error(
            'Expected a planned result'
          );
        }

        expect(
          result.selection
            .rankedCandidateIndexes
        ).toEqual([
          1,
          2,
          0,
        ]);

        expect(
          result.plan.id
        ).toBe(
          'ranked-plans'
        );

        expect(
          result.alternatives.map(
            plan =>
              plan.id
          )
        ).toEqual([
          'ranked-plans:alternative:1',
          'ranked-plans:alternative:2',
        ]);

        expect(
          result.alternatives[0]!
            .cartons
        ).toHaveLength(
          1
        );
        expect(
          result.alternatives[0]!
            .cartons[0]!
            .carton.id
        ).toBe(
          'large'
        );

        expect(
          result.alternatives[1]!
            .cartons
        ).toHaveLength(
          2
        );
        expect(
          result.alternatives[1]!
            .cartons.map(
              carton =>
                carton.carton.id
            )
        ).toEqual([
          'small',
          'small',
        ]);

        for (
          const alternative
          of result.alternatives
        ) {
          expect(
            alternative
              .objective
              .kind
          ).toBe(
            'fewest-cartons'
          );
          expect(
            alternative
              .solverMeta
          ).toEqual(
            result.plan
              .solverMeta
          );
        }
      }
    );

    it(
      'returns not-planned and retains diagnostics when no candidate verifies',
      async () => {
        const input =
          makeInput();
        const invalid =
          invalidLargeBox();
        let solveCalls = 0;

        const result =
          await planPacking(
            'plan-no-valid',
            makeSolver(
              [
                invalid,
              ],
              () => {
                solveCalls += 1;
              }
            ),
            input
          );

        expect(
          solveCalls
        ).toBe(1);
        expect(
          result.kind
        ).toBe(
          'not-planned'
        );

        if (
          result.kind !==
          'not-planned'
        ) {
          throw new Error(
            'Expected a not-planned result'
          );
        }

        expect(
          result.selection
        ).toEqual({
          kind:
            'no-valid-candidate',
        });

        expect(
          result.verification
            .candidates
        ).toHaveLength(
          1
        );
        expect(
          result.verification
            .candidates[0]!
            .candidate
        ).toBe(
          invalid
        );
        expect(
          result.verification
            .candidates[0]!
            .verification
            .valid
        ).toBe(
          false
        );
        expect(
          result.verification
            .candidates[0]!
            .verification
            .issues.map(
              issue =>
                issue.code
            )
        ).toContain(
          'boundary-violation'
        );
        expect(
          'plan' in result
        ).toBe(
          false
        );
        expect(
          'alternatives' in
            result
        ).toBe(
          false
        );
      }
    );

    it(
      'returns objective-unsupported without falling back or rerunning the solver',
      async () => {
        const input =
          makeInput(
            'existing-inventory-first'
          );
        let solveCalls = 0;

        const result =
          await planPacking(
            'plan-unsupported',
            makeSolver(
              [
                oneLargeBox(),
              ],
              () => {
                solveCalls += 1;
              }
            ),
            input
          );

        expect(
          solveCalls
        ).toBe(1);
        expect(
          result
        ).toMatchObject({
          kind:
            'not-planned',
          selection: {
            kind:
              'objective-unsupported',
            objective:
              'existing-inventory-first',
          },
        });
        expect(
          'plan' in result
        ).toBe(
          false
        );
      }
    );

    it(
      'returns insufficient-data without treating unknown carton cost as zero',
      async () => {
        const input =
          makeInput(
            'min-carton-cost'
          );

        delete input
          .cartons[1]!
          .costPerBox;

        let solveCalls = 0;

        const result =
          await planPacking(
            'plan-missing-cost',
            makeSolver(
              [
                oneLargeBox(),
              ],
              () => {
                solveCalls += 1;
              }
            ),
            input
          );

        expect(
          solveCalls
        ).toBe(1);
        expect(
          result
        ).toMatchObject({
          kind:
            'not-planned',
          selection: {
            kind:
              'insufficient-data',
            objective:
              'min-carton-cost',
            missingMetric:
              'carton-cost',
          },
        });
        expect(
          'plan' in result
        ).toBe(
          false
        );
      }
    );

    it(
      'preserves invalid candidates while excluding them from canonical alternatives',
      async () => {
        const input =
          makeInput(
            'fewest-cartons'
          );
        const invalid =
          invalidLargeBox();
        const valid =
          oneLargeBox();

        const result =
          await planPacking(
            'plan-invalid-retained',
            makeSolver([
              invalid,
              valid,
            ]),
            input
          );

        expect(
          result.kind
        ).toBe(
          'planned'
        );

        if (
          result.kind !==
          'planned'
        ) {
          throw new Error(
            'Expected a planned result'
          );
        }

        expect(
          result.selection
            .selectedCandidateIndex
        ).toBe(
          1
        );
        expect(
          result.selection
            .rankedCandidateIndexes
        ).toEqual([
          1,
        ]);

        expect(
          result.verification
            .candidates[0]!
            .candidate
        ).toBe(
          invalid
        );
        expect(
          result.verification
            .candidates[0]!
            .verification
            .valid
        ).toBe(
          false
        );
        expect(
          result.verification
            .candidates[1]!
            .candidate
        ).toBe(
          valid
        );
        expect(
          result.verification
            .candidates[1]!
            .verification
            .valid
        ).toBe(
          true
        );

        expect(
          result.plan
            .cartons[0]!
            .carton.id
        ).toBe(
          'large'
        );
        expect(
          result.alternatives
        ).toEqual(
          []
        );
      }
    );

    it(
      'passes the caller supplied primary plan id through unchanged and uses deterministic alternative ids',
      async () => {
        const result =
          await planPacking(
            'caller-owned-plan-id',
            makeSolver([
              oneLargeBox(),
              twoSmallBoxes(),
            ]),
            makeInput()
          );

        expect(
          result.kind
        ).toBe(
          'planned'
        );

        if (
          result.kind !==
          'planned'
        ) {
          throw new Error(
            'Expected a planned result'
          );
        }

        expect(
          result.plan.id
        ).toBe(
          'caller-owned-plan-id'
        );
        expect(
          result.alternatives.map(
            plan =>
              plan.id
          )
        ).toEqual([
          'caller-owned-plan-id:alternative:1',
        ]);
      }
    );

    it(
      'returns an empty alternatives array when only one ranked candidate exists',
      async () => {
        const result =
          await planPacking(
            'single-candidate',
            makeSolver([
              oneLargeBox(),
            ]),
            makeInput()
          );

        expect(
          result.kind
        ).toBe(
          'planned'
        );

        if (
          result.kind !==
          'planned'
        ) {
          throw new Error(
            'Expected a planned result'
          );
        }

        expect(
          result.selection
            .rankedCandidateIndexes
        ).toEqual([
          0,
        ]);
        expect(
          result.alternatives
        ).toEqual(
          []
        );
      }
    );

    it(
      'does not mutate or alias input, solver-owned candidates, or canonical alternatives',
      async () => {
        const input =
          makeInput();
        const first =
          twoSmallBoxes();
        const second =
          oneLargeBox();
        const candidates = [
          first,
          second,
        ];

        const inputBefore =
          JSON.stringify(
            input
          );
        const candidatesBefore =
          JSON.stringify(
            candidates
          );

        const result =
          await planPacking(
            'plan-immutability',
            makeSolver(
              candidates
            ),
            input
          );

        expect(
          result.kind
        ).toBe(
          'planned'
        );

        if (
          result.kind !==
          'planned'
        ) {
          throw new Error(
            'Expected a planned result'
          );
        }

        expect(
          JSON.stringify(
            input
          )
        ).toBe(
          inputBefore
        );
        expect(
          JSON.stringify(
            candidates
          )
        ).toBe(
          candidatesBefore
        );

        result.plan
          .cartons[0]!
          .placements[0]!
          .x = 777;

        result.alternatives[0]!
          .cartons[0]!
          .placements[0]!
          .x = 999;

        expect(
          JSON.stringify(
            input
          )
        ).toBe(
          inputBefore
        );
        expect(
          JSON.stringify(
            candidates
          )
        ).toBe(
          candidatesBefore
        );
      }
    );

    it(
      'propagates unexpected solver failures',
      async () => {
        const solver:
          SolverAdapter = {
            solve:
              async () => {
                throw new Error(
                  'pipeline solver failed'
                );
              },
          };

        await expect(
          planPacking(
            'plan-error',
            solver,
            makeInput()
          )
        ).rejects.toThrow(
          'pipeline solver failed'
        );
      }
    );
  }
);
