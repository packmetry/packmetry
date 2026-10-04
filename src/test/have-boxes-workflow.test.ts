import { describe, expect, it } from 'vitest';

import { createCarton } from '../core/domain/carton.js';
import { createItem } from '../core/domain/item.js';
import type { OptimizationObjective } from '../core/domain/objectives.js';
import {
  BaselineSolver,
  type SolverAdapter,
  type SolverInput,
  type SolverOutput,
} from '../core/solver/index.js';
import {
  planHaveBoxes,
  type HaveBoxesWorkflowInput,
} from '../core/workflows/have-boxes.js';

function makeItem(quantity = 1) {
  return createItem({
    id: 'item-a',
    name: 'Item A',
    dimensions: {
      length: 20,
      width: 20,
      height: 20,
    },
    quantity,
  });
}

function makeCarton(
  id: string,
  size: number,
  options: {
    quantityAvailable?: number;
    stockQuantity?: number;
    externalSize?: number;
  } = {}
) {
  return createCarton({
    id,
    name: id,
    internalDimensions: {
      length: size,
      width: size,
      height: size,
    },
    ...(options.quantityAvailable !== undefined
      ? {
          quantityAvailable:
            options.quantityAvailable,
        }
      : {}),
    ...(options.stockQuantity !== undefined
      ? {
          stockQuantity:
            options.stockQuantity,
        }
      : {}),
    ...(options.externalSize !== undefined
      ? {
          externalDimensions: {
            length:
              options.externalSize,
            width:
              options.externalSize,
            height:
              options.externalSize,
          },
        }
      : {}),
  });
}

function makeInput(
  objective: OptimizationObjective = {
    kind: 'fewest-cartons',
  }
): HaveBoxesWorkflowInput {
  return {
    items: [makeItem()],
    cartons: [
      makeCarton(
        'existing-box',
        20
      ),
    ],
    objective,
  };
}

function makeMultiCandidateInput(): HaveBoxesWorkflowInput {
  return {
    items: [
      createItem({
        id: 'multi-item',
        name: 'Multi Candidate Item',
        dimensions: {
          length: 10,
          width: 10,
          height: 10,
        },
        quantity: 2,
      }),
    ],
    cartons: [
      makeCarton(
        'multi-small',
        11
      ),
      makeCarton(
        'multi-medium',
        15
      ),
      makeCarton(
        'multi-large',
        20
      ),
    ],
    objective: {
      kind: 'fewest-cartons',
    },
  };
}

class CapturingBaselineSolver implements SolverAdapter {
  receivedInput:
    SolverInput | undefined;

  private readonly delegate =
    new BaselineSolver();

  async solve(
    input: SolverInput
  ): Promise<SolverOutput> {
    this.receivedInput = input;

    return this.delegate.solve(
      input
    );
  }
}

describe('planHaveBoxes', () => {
  it(
    'requires at least one item and at least one supplied carton',
    async () => {
      await expect(
        planHaveBoxes(
          'have-boxes-no-items',
          new BaselineSolver(),
          {
            items: [],
            cartons: [
              makeCarton(
                'box',
                20
              ),
            ],
            objective: {
              kind:
                'fewest-cartons',
            },
          }
        )
      ).rejects.toThrow(
        'Have boxes workflow requires at least one item'
      );

      await expect(
        planHaveBoxes(
          'have-boxes-no-cartons',
          new BaselineSolver(),
          {
            items: [
              makeItem(),
            ],
            cartons: [],
            objective: {
              kind:
                'fewest-cartons',
            },
          }
        )
      ).rejects.toThrow(
        'Have boxes workflow requires at least one carton'
      );
    }
  );

  it(
    'plans only against supplied cartons and derives the canonical plan id',
    async () => {
      const solver =
        new CapturingBaselineSolver();

      const input:
        HaveBoxesWorkflowInput = {
          items: [
            makeItem(2),
          ],
          cartons: [
            makeCarton(
              'small-existing',
              20,
              {
                quantityAvailable:
                  1,
              }
            ),
            makeCarton(
              'large-existing',
              40,
              {
                quantityAvailable:
                  1,
              }
            ),
          ],
          objective: {
            kind:
              'fewest-cartons',
          },
        };

      const result =
        await planHaveBoxes(
          'workflow-123',
          solver,
          input
        );

      expect(
        result.kind
      ).toBe('have-boxes');

      expect(
        solver.receivedInput
          ?.cartons
      ).toEqual(
        result.suppliedCartons
      );

      expect(
        solver.receivedInput
          ?.cartons.map(
            carton =>
              carton.id
          )
      ).toEqual([
        'small-existing',
        'large-existing',
      ]);

      expect(
        result.planningResult
          .kind
      ).toBe('planned');

      if (
        result.planningResult
          .kind !== 'planned'
      ) {
        throw new Error(
          'Expected a planned result'
        );
      }

      expect(
        result.planningResult
          .plan.id
      ).toBe(
        'workflow-123:have'
      );

      expect(
        result.planningResult
          .plan.cartons.every(
            packed =>
              packed.carton.id ===
                'small-existing' ||
              packed.carton.id ===
                'large-existing'
          )
      ).toBe(true);
    }
  );

  it(
    'forwards dimensional-weight settings into the planning pipeline',
    async () => {
      const solver =
        new CapturingBaselineSolver();

      const dimensionalWeight = {
        divisor: {
          value: 1000,
          lengthUnit:
            'cm' as const,
          massUnit:
            'kg' as const,
        },
      };

      const result =
        await planHaveBoxes(
          'have-boxes-dim',
          solver,
          {
            items: [
              makeItem(),
            ],
            cartons: [
              makeCarton(
                'dim-box',
                20,
                {
                  externalSize:
                    100,
                }
              ),
            ],
            objective: {
              kind:
                'fewest-cartons',
            },
            dimensionalWeight,
          }
        );

      expect(
        solver.receivedInput
          ?.dimensionalWeight
      ).toEqual(
        dimensionalWeight
      );

      expect(
        solver.receivedInput
          ?.dimensionalWeight
      ).not.toBe(
        dimensionalWeight
      );

      expect(
        solver.receivedInput
          ?.dimensionalWeight
          ?.divisor
      ).not.toBe(
        dimensionalWeight
          .divisor
      );

      expect(
        result.planningResult
          .kind
      ).toBe('planned');

      if (
        result.planningResult
          .kind !== 'planned'
      ) {
        throw new Error(
          'Expected a planned result'
        );
      }

      expect(
        result.planningResult
          .plan.metrics
          .totalDimWeightG
      ).toBe(1000);

      expect(
        result.planningResult
          .plan.cartons[0]
          ?.metrics
          .dimWeightG
      ).toBe(1000);
    }
  );

  it(
    'keeps dimensional-weight planning context absent when not configured',
    async () => {
      const solver =
        new CapturingBaselineSolver();

      await planHaveBoxes(
        'have-boxes-no-dim',
        solver,
        makeInput()
      );

      expect(
        solver.receivedInput
          ?.dimensionalWeight
      ).toBeUndefined();
    }
  );

  it(
    'marks every supplied carton as existing inventory',
    async () => {
      const result =
        await planHaveBoxes(
          'have-boxes-provenance',
          new BaselineSolver(),
          {
            items: [
              makeItem(),
            ],
            cartons: [
              makeCarton(
                'box-a',
                20
              ),
              makeCarton(
                'box-b',
                40
              ),
            ],
            objective: {
              kind:
                'fewest-cartons',
            },
          }
        );

      expect(
        result.cartonProvenance
      ).toEqual({
        'box-a':
          'existing-inventory',
        'box-b':
          'existing-inventory',
      });
    }
  );

  it(
    'reports used and unused supplied carton types from the canonical plan',
    async () => {
      const result =
        await planHaveBoxes(
          'have-boxes-usage',
          new BaselineSolver(),
          {
            items: [
              makeItem(3),
            ],
            cartons: [
              makeCarton(
                'small',
                20,
                {
                  quantityAvailable:
                    1,
                }
              ),
              makeCarton(
                'medium',
                40,
                {
                  quantityAvailable:
                    2,
                }
              ),
              makeCarton(
                'unused-large',
                100,
                {
                  quantityAvailable:
                    1,
                }
              ),
            ],
            objective: {
              kind:
                'fewest-cartons',
            },
          }
        );

      expect(
        result.inventoryUsage
      ).not.toBeNull();

      expect(
        result.inventoryUsage
          ?.usedCartons.map(
            usage => ({
              cartonId:
                usage.cartonId,
              usedQuantity:
                usage.usedQuantity,
            })
          )
      ).toEqual([
        {
          cartonId:
            'unused-large',
          usedQuantity: 1,
        },
      ]);

      expect(
        result.inventoryUsage
          ?.unusedCartons.map(
            usage =>
              usage.cartonId
          )
      ).toEqual([
        'small',
        'medium',
      ]);
    }
  );

  it(
    'respects quantityAvailable as an existing inventory limit',
    async () => {
      const result =
        await planHaveBoxes(
          'have-boxes-quantity-limit',
          new BaselineSolver(),
          {
            items: [
              makeItem(2),
            ],
            cartons: [
              makeCarton(
                'limited-box',
                20,
                {
                  quantityAvailable:
                    1,
                }
              ),
            ],
            objective: {
              kind:
                'fewest-cartons',
            },
          }
        );

      expect(
        result.planningResult
          .kind
      ).toBe('planned');

      if (
        result.planningResult
          .kind !== 'planned'
      ) {
        throw new Error(
          'Expected a planned result'
        );
      }

      expect(
        result.planningResult
          .plan.status
      ).toBe('partial');

      expect(
        result.planningResult
          .plan.metrics
          .placedItemCount
      ).toBe(1);

      expect(
        result.planningResult
          .plan.metrics
          .unplacedItemCount
      ).toBe(1);

      expect(
        result.inventoryUsage
          ?.usedCartons[0]
      ).toMatchObject({
        cartonId:
          'limited-box',
        usedQuantity: 1,
        effectiveAvailability:
          1,
        remainingQuantity: 0,
      });
    }
  );

  it(
    'uses the stricter value when quantityAvailable and stockQuantity are both defined',
    async () => {
      const result =
        await planHaveBoxes(
          'have-boxes-stricter-limit',
          new BaselineSolver(),
          {
            items: [
              makeItem(3),
            ],
            cartons: [
              makeCarton(
                'dual-limit-box',
                20,
                {
                  quantityAvailable:
                    5,
                  stockQuantity:
                    2,
                }
              ),
            ],
            objective: {
              kind:
                'fewest-cartons',
            },
          }
        );

      expect(
        result.planningResult
          .kind
      ).toBe('planned');

      if (
        result.planningResult
          .kind !== 'planned'
      ) {
        throw new Error(
          'Expected a planned result'
        );
      }

      expect(
        result.planningResult
          .plan.status
      ).toBe('partial');

      expect(
        result.planningResult
          .plan.unplacedItems
      ).toEqual([
        {
          itemId: 'item-a',
          instanceIndex: 2,
          reason:
            'inventory-exhausted',
        },
      ]);

      expect(
        result.inventoryUsage
          ?.usedCartons[0]
      ).toMatchObject({
        cartonId:
          'dual-limit-box',
        usedQuantity: 2,
        effectiveAvailability:
          2,
        remainingQuantity: 0,
      });
    }
  );

  it(
    'treats a supplied carton as unbounded when no availability field is defined',
    async () => {
      const result =
        await planHaveBoxes(
          'have-boxes-unbounded',
          new BaselineSolver(),
          {
            items: [
              makeItem(3),
            ],
            cartons: [
              makeCarton(
                'unbounded-box',
                20
              ),
            ],
            objective: {
              kind:
                'fewest-cartons',
            },
          }
        );

      expect(
        result.planningResult
          .kind
      ).toBe('planned');

      if (
        result.planningResult
          .kind !== 'planned'
      ) {
        throw new Error(
          'Expected a planned result'
        );
      }

      expect(
        result.planningResult
          .plan.status
      ).toBe('feasible');

      expect(
        result.planningResult
          .plan.metrics
          .cartonCount
      ).toBe(3);

      expect(
        result.inventoryUsage
          ?.usedCartons[0]
      ).toEqual({
        cartonId:
          'unbounded-box',
        carton:
          result.suppliedCartons[0],
        usedQuantity: 3,
      });
    }
  );

  it(
    'does not ignore zero availability or silently switch to purchase cartons',
    async () => {
      const result =
        await planHaveBoxes(
          'have-boxes-zero',
          new BaselineSolver(),
          {
            items: [
              makeItem(),
            ],
            cartons: [
              makeCarton(
                'zero-box',
                20,
                {
                  quantityAvailable:
                    0,
                }
              ),
            ],
            objective: {
              kind:
                'fewest-cartons',
            },
          }
        );

      expect(
        result.planningResult
          .kind
      ).toBe('planned');

      if (
        result.planningResult
          .kind !== 'planned'
      ) {
        throw new Error(
          'Expected a planned result'
        );
      }

      expect(
        result.planningResult
          .plan.status
      ).toBe(
        'infeasible'
      );

      expect(
        result.planningResult
          .plan.unplacedItems
      ).toEqual([
        {
          itemId: 'item-a',
          instanceIndex: 0,
          reason:
            'inventory-exhausted',
        },
      ]);

      expect(
        result.inventoryUsage
          ?.usedCartons
      ).toEqual([]);

      expect(
        result.inventoryUsage
          ?.unusedCartons[0]
      ).toMatchObject({
        cartonId:
          'zero-box',
        usedQuantity: 0,
        effectiveAvailability:
          0,
        remainingQuantity: 0,
      });

      expect(
        'purchaseRecommendations' in
          result
      ).toBe(false);
    }
  );

  it(
    'preserves normal not-planned objective results without fabricating inventory usage',
    async () => {
      const result =
        await planHaveBoxes(
          'have-boxes-unsupported',
          new BaselineSolver(),
          makeInput({
            kind:
              'existing-inventory-first',
          })
        );

      expect(
        result.planningResult
      ).toMatchObject({
        kind: 'not-planned',
        selection: {
          kind:
            'objective-unsupported',
          objective:
            'existing-inventory-first',
        },
      });

      expect(
        result.inventoryUsage
      ).toBeNull();
    }
  );

  it(
    'does not expose caller-owned item, carton, or DIM settings objects to the solver',
    async () => {
      const input:
        HaveBoxesWorkflowInput = {
          items: [
            makeItem(),
          ],
          cartons: [
            makeCarton(
              'original-box',
              20,
              {
                quantityAvailable:
                  1,
                stockQuantity:
                  1,
                externalSize:
                  25,
              }
            ),
          ],
          objective: {
            kind:
              'fewest-cartons',
          },
          dimensionalWeight: {
            divisor: {
              value: 1000,
              lengthUnit: 'cm',
              massUnit: 'kg',
            },
          },
        };

      const before =
        JSON.stringify(input);

      const mutatingSolver:
        SolverAdapter = {
          solve:
            async solverInput => {
              solverInput
                .items[0]!
                .dimensions
                .length = 999;

              solverInput
                .items[0]!
                .constraints
                .fragile = true;

              solverInput
                .cartons[0]!
                .internalDimensions
                .length = 999;

              solverInput
                .cartons[0]!
                .quantityAvailable =
                999;

              solverInput
                .cartons[0]!
                .externalDimensions!
                .length = 999;

              solverInput
                .dimensionalWeight!
                .divisor
                .value = 999;

              throw new Error(
                'mutating solver stopped'
              );
            },
        };

      await expect(
        planHaveBoxes(
          'have-boxes-no-alias',
          mutatingSolver,
          input
        )
      ).rejects.toThrow(
        'mutating solver stopped'
      );

      expect(
        JSON.stringify(input)
      ).toBe(before);

      expect(
        input.items[0]!
          .dimensions.length
      ).toBe(20);

      expect(
        input.cartons[0]!
          .internalDimensions
          .length
      ).toBe(20);

      expect(
        input.cartons[0]!
          .quantityAvailable
      ).toBe(1);

      expect(
        input.cartons[0]!
          .externalDimensions
          ?.length
      ).toBe(25);

      expect(
        input
          .dimensionalWeight
          ?.divisor.value
      ).toBe(1000);
    }
  );

  describe(
    'multi-candidate workflow integration',
    () => {
      it(
        'propagates canonical alternatives from the planning pipeline',
        async () => {
          const result =
            await planHaveBoxes(
              'have-boxes-multi',
              new BaselineSolver(),
              makeMultiCandidateInput()
            );

          expect(
            result
              .planningResult
              .kind
          ).toBe('planned');

          if (
            result
              .planningResult
              .kind !==
            'planned'
          ) {
            throw new Error(
              'Expected a planned result'
            );
          }

          expect(
            result
              .planningResult
              .verification
              .candidates
              .length
          ).toBeGreaterThan(
            1
          );

          expect(
            result
              .planningResult
              .selection
              .rankedCandidateIndexes
              .length
          ).toBeGreaterThan(
            1
          );

          expect(
            result
              .planningResult
              .selection
              .selectedCandidateIndex
          ).toBe(
            result
              .planningResult
              .selection
              .rankedCandidateIndexes[0]
          );

          expect(
            result
              .planningResult
              .alternatives
              .length
          ).toBe(
            result
              .planningResult
              .selection
              .rankedCandidateIndexes
              .length -
              1
          );

          expect(
            result
              .planningResult
              .plan.id
          ).toBe(
            'have-boxes-multi:have'
          );
        }
      );

      it(
        'derives inventory usage only from the selected canonical plan',
        async () => {
          const result =
            await planHaveBoxes(
              'have-boxes-inventory-selected',
              new BaselineSolver(),
              makeMultiCandidateInput()
            );

          expect(
            result
              .planningResult
              .kind
          ).toBe('planned');

          if (
            result
              .planningResult
              .kind !==
            'planned'
          ) {
            throw new Error(
              'Expected a planned result'
            );
          }

          expect(
            result.inventoryUsage
          ).not.toBeNull();

          if (
            result.inventoryUsage ===
            null
          ) {
            throw new Error(
              'Expected inventory usage'
            );
          }

          const selectedUsage =
            new Map<
              string,
              number
            >();

          for (
            const packedCarton of
              result
                .planningResult
                .plan.cartons
          ) {
            const cartonId =
              packedCarton
                .carton.id;

            selectedUsage.set(
              cartonId,
              (
                selectedUsage.get(
                  cartonId
                ) ?? 0
              ) + 1
            );
          }

          const workflowUsage = [
            ...result
              .inventoryUsage
              .usedCartons,
            ...result
              .inventoryUsage
              .unusedCartons,
          ];

          for (
            const suppliedCarton of
              result
                .suppliedCartons
          ) {
            const usage =
              workflowUsage.find(
                entry =>
                  entry
                    .cartonId ===
                  suppliedCarton
                    .id
              );

            expect(
              usage
            ).toBeDefined();

            expect(
              usage
                ?.usedQuantity
            ).toBe(
              selectedUsage.get(
                suppliedCarton.id
              ) ?? 0
            );
          }

          const alternativeCartonIds =
            new Set(
              result
                .planningResult
                .alternatives
                .flatMap(
                  alternative =>
                    alternative
                      .cartons.map(
                        packedCarton =>
                          packedCarton
                            .carton
                            .id
                      )
                )
            );

          const alternativeOnlyCartonIds =
            [
              ...alternativeCartonIds,
            ].filter(
              cartonId =>
                !selectedUsage.has(
                  cartonId
                )
            );

          expect(
            alternativeOnlyCartonIds
              .length
          ).toBeGreaterThan(
            0
          );

          for (
            const cartonId of
              alternativeOnlyCartonIds
          ) {
            const usage =
              workflowUsage.find(
                entry =>
                  entry
                    .cartonId ===
                  cartonId
              );

            expect(
              usage
                ?.usedQuantity
            ).toBe(0);
          }
        }
      );

      it(
        'keeps the selected plan distinct from alternatives and preserves deterministic alternative ids',
        async () => {
          const result =
            await planHaveBoxes(
              'have-boxes-alternative-ids',
              new BaselineSolver(),
              makeMultiCandidateInput()
            );

          expect(
            result
              .planningResult
              .kind
          ).toBe('planned');

          if (
            result
              .planningResult
              .kind !==
            'planned'
          ) {
            throw new Error(
              'Expected a planned result'
            );
          }

          const {
            plan,
            alternatives,
            selection,
          } =
            result
              .planningResult;

          expect(
            plan.id
          ).toBe(
            'have-boxes-alternative-ids:have'
          );

          expect(
            alternatives.length
          ).toBe(
            selection
              .rankedCandidateIndexes
              .length -
              1
          );

          alternatives.forEach(
            (
              alternative,
              index
            ) => {
              expect(
                alternative.id
              ).toBe(
                `have-boxes-alternative-ids:have:alternative:${index + 1}`
              );

              expect(
                alternative.id
              ).not.toBe(
                plan.id
              );
            }
          );

          expect(
            alternatives.some(
              alternative =>
                alternative.id ===
                plan.id
            )
          ).toBe(false);
        }
      );

      it(
        'preserves caller input during a real multi-candidate workflow run',
        async () => {
          const input =
            makeMultiCandidateInput();

          const before =
            JSON.stringify(
              input
            );

          const result =
            await planHaveBoxes(
              'have-boxes-multi-immutable',
              new BaselineSolver(),
              input
            );

          expect(
            result
              .planningResult
              .kind
          ).toBe('planned');

          expect(
            JSON.stringify(
              input
            )
          ).toBe(before);

          expect(
            input
              .items[0]!
              .dimensions
          ).toEqual({
            length: 10,
            width: 10,
            height: 10,
          });

          expect(
            input
              .cartons.map(
                carton =>
                  carton.id
              )
          ).toEqual([
            'multi-small',
            'multi-medium',
            'multi-large',
          ]);
        }
      );
    }
  );
});