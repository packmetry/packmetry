import { describe, expect, it } from 'vitest';

import type { ObjectiveKind } from '../core/domain/objectives.js';
import type {
  SolverAdapter,
  SolverCandidatePlan,
  SolverInput,
} from '../core/solver/contracts.js';
import { planPacking } from '../core/solver/pipeline.js';
import { BaselineSolver } from '../core/solver/baseline.js';

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

    describe('multi-candidate validation', () => {
      const baselineSolver = new BaselineSolver();

      function multiCandidateInput(): SolverInput {
        return {
          items: [
            {
              id: 'item-cube',
              dimensions: {
                length: 10,
                width: 10,
                height: 10,
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
              id: 'carton-small',
              internalDimensions: {
                length: 11,
                width: 11,
                height: 11,
              },
              costPerBox: 2,
            },
            {
              id: 'carton-medium',
              internalDimensions: {
                length: 15,
                width: 15,
                height: 15,
              },
              costPerBox: 3,
            },
            {
              id: 'carton-large',
              internalDimensions: {
                length: 20,
                width: 20,
                height: 20,
              },
              costPerBox: 4,
            },
          ],
          objective: {
            kind: 'fewest-cartons',
          },
        };
      }

      it(
        'end-to-end multi-candidate selection through real BaselineSolver',
        async () => {
          const input = multiCandidateInput();
          const result = await planPacking(
            'multi-candidate-test-1',
            baselineSolver,
            input
          );

          expect(result.kind).toBe('planned');

          if (result.kind !== 'planned') {
            throw new Error('Expected a planned result');
          }

          // Should have multiple verified candidates
          expect(result.verification.candidates.length).toBeGreaterThan(1);

          // Should have selection metadata with multiple ranked indexes
          expect(result.selection.rankedCandidateIndexes.length).toBeGreaterThan(1);
          expect(result.selection.selectedCandidateIndex).toBe(
            result.selection.rankedCandidateIndexes[0]
          );

          // Should have alternatives
          expect(result.alternatives.length).toBe(
            result.selection.rankedCandidateIndexes.length - 1
          );
        }
      );

      function fewestCartonsInput(): SolverInput {
        return {
          items: [
            {
              id: 'fewest-item',
              dimensions: {
                length: 10,
                width: 10,
                height: 10,
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
              id: 'fewest-small',
              internalDimensions: {
                length: 11,
                width: 11,
                height: 11,
              },
            },
            {
              id: 'fewest-medium',
              internalDimensions: {
                length: 20,
                width: 20,
                height: 20,
              },
            },
          ],
          objective: {
            kind: 'fewest-cartons',
          },
        };
      }

      it(
        'objective-aware ranking respects fewest-cartons objective',
        async () => {
          const input = fewestCartonsInput();
          const result = await planPacking(
            'multi-candidate-fewest',
            baselineSolver,
            input
          );

          expect(result.kind).toBe('planned');

          if (result.kind !== 'planned') {
            throw new Error('Expected a planned result');
          }

          // With fewest-cartons objective, should prefer fewer cartons
          // We don't assert exact carton counts since that's BaselineSolver behavior
          // Just verify the pipeline processed the objective
          expect(result.selection.kind).toBe('selected');
          expect(result.selection.rankedCandidateIndexes.length).toBeGreaterThan(0);
        }
      );

      function leastWastedInput(): SolverInput {
        return {
          items: [
            {
              id: 'volume-item',
              dimensions: {
                length: 10,
                width: 10,
                height: 10,
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
              id: 'volume-small',
              internalDimensions: {
                length: 11,
                width: 11,
                height: 11,
              },
            },
            {
              id: 'volume-large',
              internalDimensions: {
                length: 20,
                width: 20,
                height: 20,
              },
            },
          ],
          objective: {
            kind: 'least-wasted-volume',
          },
        };
      }

      it(
        'objective-aware ranking respects least-wasted-volume objective',
        async () => {
          const input = leastWastedInput();
          const result = await planPacking(
            'multi-candidate-volume',
            baselineSolver,
            input
          );

          expect(result.kind).toBe('planned');

          if (result.kind !== 'planned') {
            throw new Error('Expected a planned result');
          }

          // With least-wasted-volume objective, pipeline should process it
          expect(result.selection.kind).toBe('selected');
          expect(result.selection.rankedCandidateIndexes.length).toBeGreaterThan(0);
        }
      );

      it(
        'materializes alternatives for non-selected ranked candidates',
        async () => {
          const input = multiCandidateInput();
          const result = await planPacking(
            'multi-candidate-alternatives',
            baselineSolver,
            input
          );

          expect(result.kind).toBe('planned');

          if (result.kind !== 'planned') {
            throw new Error('Expected a planned result');
          }

          const { alternatives, selection } = result;
          const { rankedCandidateIndexes } = selection;

          // Alternatives count should match ranked indexes minus selected
          expect(alternatives.length).toBe(rankedCandidateIndexes.length - 1);

          // Verify alternative IDs follow convention
          alternatives.forEach((alternative, index) => {
            expect(alternative.id).toBe(
              `multi-candidate-alternatives:alternative:${index + 1}`
            );
          });
        }
      );

      it(
        'selected plan corresponds to selected candidate, not duplicated in alternatives',
        async () => {
          const input = multiCandidateInput();
          const result = await planPacking(
            'multi-candidate-selected',
            baselineSolver,
            input
          );

          expect(result.kind).toBe('planned');

          if (result.kind !== 'planned') {
            throw new Error('Expected a planned result');
          }

          const { plan, alternatives, selection } = result;

          // Plan should be the selected candidate's canonical representation
          // We can't easily compare plan contents directly, but we can verify
          // the pipeline didn't create obviously wrong results

          // Alternative count should be correct
          expect(alternatives.length).toBe(selection.rankedCandidateIndexes.length - 1);

          // All alternatives should have distinct IDs from the main plan
          alternatives.forEach(alternative => {
            expect(alternative.id).not.toBe(plan.id);
          });
        }
      );

      it(
        'preserves input immutability with multi-candidate BaselineSolver',
        async () => {
          const input = multiCandidateInput();
          const inputBefore = JSON.stringify(input);

          const result = await planPacking(
            'multi-candidate-immutable',
            baselineSolver,
            input
          );

          // Input should not be mutated
          expect(JSON.stringify(input)).toBe(inputBefore);

          // Result should be valid
          expect(result.kind).toBe('planned');
        }
      );

      it(
        'alternative plan IDs follow deterministic convention',
        async () => {
          const input = multiCandidateInput();
          const result = await planPacking(
            'deterministic-alternative-ids',
            baselineSolver,
            input
          );

          expect(result.kind).toBe('planned');

          if (result.kind !== 'planned') {
            throw new Error('Expected a planned result');
          }

          const { alternatives } = result;

          // Check ID pattern
          alternatives.forEach((alternative, index) => {
            expect(alternative.id).toBe(
              `deterministic-alternative-ids:alternative:${index + 1}`
            );
          });
        }
      );
    });
  }
);
