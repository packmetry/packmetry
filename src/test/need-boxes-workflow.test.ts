import { describe, expect, it } from 'vitest';

import { createItem } from '../core/domain/item.js';
import type { OptimizationObjective } from '../core/domain/objectives.js';
import {
  BaselineSolver,
  type SolverAdapter,
  type SolverCandidatePlan,
  type SolverInput,
  type SolverOutput,
} from '../core/solver/index.js';
import {
  planNeedBoxes,
  type NeedBoxesWorkflowInput,
} from '../core/workflows/need-boxes.js';

function makeInput(
  objective: OptimizationObjective = {
    kind: 'fewest-cartons',
  }
): NeedBoxesWorkflowInput {
  return {
    items: [
      createItem({
        id: 'item-a',
        name: 'Item A',
        dimensions: {
          length: 20,
          width: 20,
          height: 20,
        },
        quantity: 5,
      }),
    ],
    objective,
  };
}

class CapturingBaselineSolver implements SolverAdapter {
  receivedInput: SolverInput | undefined;

  private readonly delegate = new BaselineSolver();

  async solve(input: SolverInput): Promise<SolverOutput> {
    this.receivedInput = input;
    return this.delegate.solve(input);
  }
}

function twoCartonSolver(): SolverAdapter {
  return {
    solve: async input => {
      const carton = input.cartons[0];
      const item = input.items[0];

      if (!carton || !item) {
        throw new Error('Expected generated carton and item');
      }

      const candidate: SolverCandidatePlan = {
        status: 'feasible',
        cartons: [
          {
            cartonId: carton.id,
            placements: [
              {
                itemId: item.id,
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
            cartonId: carton.id,
            placements: [
              {
                itemId: item.id,
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

      return {
        candidates: [candidate],
        solverMeta: {
          solverId: 'need-boxes-two-carton-test',
          solverVersion: '1',
          durationMs: 0,
          deterministic: true,
        },
      };
    },
  };
}

describe('planNeedBoxes', () => {
  it('plans successfully without caller-supplied cartons', async () => {
    const result = await planNeedBoxes(
      'need-boxes-basic',
      new BaselineSolver(),
      makeInput()
    );

    expect(result.kind).toBe('need-boxes');
    expect(result.generatedCartons.length).toBeGreaterThan(0);
    expect(result.planningResult.kind).toBe('planned');

    if (result.planningResult.kind !== 'planned') {
      throw new Error('Expected a planned result');
    }

    expect(result.planningResult.plan.status).toBe('feasible');
    expect(
      result.planningResult.plan.metrics.placedItemCount
    ).toBe(5);
    expect(
      result.planningResult.plan.metrics.unplacedItemCount
    ).toBe(0);
  });

  it('derives the canonical plan id from the workflow id', async () => {
    const result = await planNeedBoxes(
      'workflow-123',
      new BaselineSolver(),
      makeInput()
    );

    expect(result.planningResult.kind).toBe('planned');

    if (result.planningResult.kind !== 'planned') {
      throw new Error('Expected a planned result');
    }

    expect(result.planningResult.plan.id).toBe(
      'workflow-123:need'
    );
  });

  it('passes generated cartons into the canonical planning pipeline', async () => {
    const solver = new CapturingBaselineSolver();

    const result = await planNeedBoxes(
      'need-boxes-capture',
      solver,
      makeInput()
    );

    expect(solver.receivedInput).toBeDefined();
    expect(
      solver.receivedInput?.cartons
    ).toEqual(result.generatedCartons);

    expect(
      solver.receivedInput?.cartons.map(
        carton => carton.id
      )
    ).toEqual([
      'purchase-carton-1',
      'purchase-carton-2',
      'purchase-carton-3',
    ]);
  });

  it('marks every generated carton as a purchase recommendation', async () => {
    const result = await planNeedBoxes(
      'need-boxes-provenance',
      new BaselineSolver(),
      makeInput()
    );

    expect(result.cartonProvenance).toEqual({
      'purchase-carton-1': 'purchase-recommendation',
      'purchase-carton-2': 'purchase-recommendation',
      'purchase-carton-3': 'purchase-recommendation',
    });
  });

  it('derives purchase quantity from verified canonical plan usage', async () => {
    const input: NeedBoxesWorkflowInput = {
      items: [
        createItem({
          id: 'item-a',
          dimensions: {
            length: 10,
            width: 10,
            height: 10,
          },
          quantity: 2,
        }),
      ],
      objective: {
        kind: 'fewest-cartons',
      },
    };

    const result = await planNeedBoxes(
      'need-boxes-quantity',
      twoCartonSolver(),
      input
    );

    expect(result.planningResult.kind).toBe('planned');

    if (result.planningResult.kind !== 'planned') {
      throw new Error('Expected a planned result');
    }

    expect(result.planningResult.plan.metrics.cartonCount).toBe(
      2
    );

    expect(result.purchaseRecommendations).toEqual([
      {
        cartonId: 'purchase-carton-1',
        carton: result.generatedCartons[0],
        quantity: 2,
      },
    ]);
  });

  it('returns no purchase recommendation when canonical planning is not planned', async () => {
    const result = await planNeedBoxes(
      'need-boxes-cost',
      new BaselineSolver(),
      makeInput({
        kind: 'min-carton-cost',
      })
    );

    expect(result.planningResult).toMatchObject({
      kind: 'not-planned',
      selection: {
        kind: 'insufficient-data',
        objective: 'min-carton-cost',
        missingMetric: 'carton-cost',
      },
    });

    expect(result.purchaseRecommendations).toEqual([]);
  });

  it('preserves unsupported objective results without silently changing objective', async () => {
    const result = await planNeedBoxes(
      'need-boxes-unsupported',
      new BaselineSolver(),
      makeInput({
        kind: 'existing-inventory-first',
      })
    );

    expect(result.planningResult).toMatchObject({
      kind: 'not-planned',
      selection: {
        kind: 'objective-unsupported',
        objective: 'existing-inventory-first',
      },
    });

    expect(result.purchaseRecommendations).toEqual([]);
  });

  it('does not invent commercial metadata on recommended cartons', async () => {
    const result = await planNeedBoxes(
      'need-boxes-metadata',
      new BaselineSolver(),
      makeInput()
    );

    for (const carton of result.generatedCartons) {
      expect(carton.quantityAvailable).toBeUndefined();
      expect(carton.stockQuantity).toBeUndefined();
      expect(carton.costPerBox).toBeUndefined();
      expect(carton.emptyBoxWeightG).toBeUndefined();
      expect(carton.maxGrossWeightG).toBeUndefined();
      expect(carton.supplier).toBeUndefined();
      expect(carton.externalDimensions).toBeUndefined();
    }
  });

  it('does not expose caller-owned item objects to the solver', async () => {
    const input = makeInput();
    const before = JSON.stringify(input);

    const mutatingSolver: SolverAdapter = {
      solve: async solverInput => {
        solverInput.items[0]!.dimensions.length = 999;
        solverInput.items[0]!.constraints.fragile = true;

        throw new Error('mutating solver stopped');
      },
    };

    await expect(
      planNeedBoxes(
        'need-boxes-no-alias',
        mutatingSolver,
        input
      )
    ).rejects.toThrow('mutating solver stopped');

    expect(JSON.stringify(input)).toBe(before);
    expect(input.items[0]!.dimensions.length).toBe(20);
    expect(input.items[0]!.constraints.fragile).toBe(false);
  });

  it('rejects an empty item set through candidate generation', async () => {
    await expect(
      planNeedBoxes(
        'need-boxes-empty',
        new BaselineSolver(),
        {
          items: [],
          objective: {
            kind: 'fewest-cartons',
          },
        }
      )
    ).rejects.toThrow(
      'Purchase carton candidate generation requires at least one item'
    );
  });
});
