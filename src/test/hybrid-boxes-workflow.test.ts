import { describe, expect, it } from 'vitest';

import { createCarton } from '../core/domain/carton.js';
import { createItem } from '../core/domain/item.js';
import {
  BaselineSolver,
  type SolverAdapter,
  type SolverInput,
  type SolverOutput,
} from '../core/solver/index.js';
import {
  planHybridBoxes,
  type HybridBoxesWorkflowInput,
} from '../core/workflows/hybrid-boxes.js';

function makeItem(quantity = 3) {
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

function makeExistingCarton(
  quantityAvailable: number,
  costPerBox?: number
) {
  return createCarton({
    id: 'existing-box',
    name: 'Existing box',
    internalDimensions: {
      length: 20,
      width: 20,
      height: 20,
    },
    quantityAvailable,
    ...(costPerBox !== undefined
      ? { costPerBox }
      : {}),
  });
}

function makeInput(
  quantity = 3,
  available = 1
): HybridBoxesWorkflowInput {
  return {
    items: [makeItem(quantity)],
    cartons: [makeExistingCarton(available)],
    objective: {
      kind: 'fewest-cartons',
    },
  };
}

class CapturingBaselineSolver implements SolverAdapter {
  readonly inputs: SolverInput[] = [];

  private readonly delegate = new BaselineSolver();

  async solve(input: SolverInput): Promise<SolverOutput> {
    this.inputs.push({
      items: input.items.map(item => ({
        ...item,
        dimensions: {
          ...item.dimensions,
        },
        constraints: {
          ...item.constraints,
        },
      })),
      cartons: input.cartons.map(carton => ({
        ...carton,
        internalDimensions: {
          ...carton.internalDimensions,
        },
        ...(carton.externalDimensions !== undefined
          ? {
              externalDimensions: {
                ...carton.externalDimensions,
              },
            }
          : {}),
      })),
      objective: {
        kind: input.objective.kind,
      },
    });

    return this.delegate.solve(input);
  }
}

describe('planHybridBoxes', () => {
  it('stops after existing inventory when the canonical existing plan is complete', async () => {
    const solver = new CapturingBaselineSolver();

    const result = await planHybridBoxes(
      'hybrid-complete',
      solver,
      makeInput(1, 1)
    );

    expect(result.kind).toBe('hybrid');
    expect(result.existing.planningResult.kind).toBe(
      'planned'
    );

    if (
      result.existing.planningResult.kind !== 'planned'
    ) {
      throw new Error('Expected a planned existing result');
    }

    expect(
      result.existing.planningResult.plan.status
    ).toBe('feasible');
    expect(result.remainderItems).toEqual([]);
    expect(result.remainderInstanceMapping).toEqual([]);
    expect(result.supplemental).toBeNull();
    expect(result.replacementAlternative).toBeNull();
    expect(solver.inputs).toHaveLength(1);
  });

  it('plans existing inventory first, then only the verified remainder, then a separate replacement alternative', async () => {
    const solver = new CapturingBaselineSolver();

    const result = await planHybridBoxes(
      'hybrid-stages',
      solver,
      makeInput(3, 1)
    );

    expect(solver.inputs).toHaveLength(3);

    expect(solver.inputs[0]?.items[0]?.quantity).toBe(3);
    expect(
      solver.inputs[0]?.cartons.map(carton => carton.id)
    ).toEqual(['existing-box']);

    expect(solver.inputs[1]?.items[0]?.quantity).toBe(2);
    expect(
      solver.inputs[1]?.cartons.every(carton =>
        carton.id.startsWith('purchase-carton-')
      )
    ).toBe(true);

    expect(solver.inputs[2]?.items[0]?.quantity).toBe(3);
    expect(
      solver.inputs[2]?.cartons.every(carton =>
        carton.id.startsWith('purchase-carton-')
      )
    ).toBe(true);

    expect(result.existing.planningResult.kind).toBe(
      'planned'
    );
    expect(result.supplemental?.planningResult.kind).toBe(
      'planned'
    );
    expect(
      result.replacementAlternative?.planningResult.kind
    ).toBe('planned');
  });

  it('builds deterministic supplemental-to-original instance mapping from canonical unplaced items', async () => {
    const result = await planHybridBoxes(
      'hybrid-mapping',
      new BaselineSolver(),
      makeInput(3, 1)
    );

    expect(result.remainderItems).toHaveLength(1);
    expect(result.remainderItems[0]?.id).toBe('item-a');
    expect(result.remainderItems[0]?.quantity).toBe(2);

    expect(result.remainderInstanceMapping).toEqual([
      {
        itemId: 'item-a',
        supplementalInstanceIndex: 0,
        originalInstanceIndex: 1,
      },
      {
        itemId: 'item-a',
        supplementalInstanceIndex: 1,
        originalInstanceIndex: 2,
      },
    ]);
  });

  it('uses supplemental purchase planning for all items when existing inventory is zero', async () => {
    const result = await planHybridBoxes(
      'hybrid-zero-existing',
      new BaselineSolver(),
      makeInput(2, 0)
    );

    expect(result.existing.planningResult.kind).toBe(
      'planned'
    );

    if (
      result.existing.planningResult.kind !== 'planned'
    ) {
      throw new Error('Expected a planned existing result');
    }

    expect(
      result.existing.planningResult.plan.status
    ).toBe('infeasible');
    expect(
      result.existing.planningResult.plan.metrics
        .placedItemCount
    ).toBe(0);
    expect(
      result.existing.planningResult.plan.metrics
        .unplacedItemCount
    ).toBe(2);

    expect(result.remainderItems[0]?.quantity).toBe(2);
    expect(result.supplemental?.planningResult.kind).toBe(
      'planned'
    );

    if (
      result.supplemental?.planningResult.kind !==
      'planned'
    ) {
      throw new Error(
        'Expected a planned supplemental result'
      );
    }

    expect(
      result.supplemental.planningResult.plan.metrics
        .placedItemCount
    ).toBe(2);
    expect(
      result.supplemental.planningResult.plan.metrics
        .unplacedItemCount
    ).toBe(0);
  });

  it('derives supplemental purchase recommendations only from the remainder plan', async () => {
    const result = await planHybridBoxes(
      'hybrid-supplemental-recommendations',
      new BaselineSolver(),
      makeInput(3, 1)
    );

    expect(result.supplemental).not.toBeNull();
    expect(
      result.supplemental?.purchaseRecommendations
    ).toHaveLength(1);

    expect(
      result.supplemental?.purchaseRecommendations[0]
        ?.quantity
    ).toBe(1);

    expect(
      result.supplemental?.planningResult.kind
    ).toBe('planned');

    if (
      result.supplemental?.planningResult.kind !==
      'planned'
    ) {
      throw new Error(
        'Expected a planned supplemental result'
      );
    }

    expect(
      result.supplemental.planningResult.plan.metrics
        .placedItemCount
    ).toBe(2);

    expect(
      Object.values(
        result.supplemental.cartonProvenance
      )
    ).toEqual(
      expect.arrayContaining([
        'purchase-recommendation',
      ])
    );
  });

  it('keeps the complete replacement plan separate and does not choose an automatic winner', async () => {
    const result = await planHybridBoxes(
      'hybrid-replacement',
      new BaselineSolver(),
      makeInput(3, 1)
    );

    expect(
      result.replacementAlternative?.planningResult.kind
    ).toBe('planned');

    if (
      result.replacementAlternative?.planningResult.kind !==
      'planned'
    ) {
      throw new Error(
        'Expected a planned replacement result'
      );
    }

    expect(
      result.replacementAlternative.planningResult.plan
        .metrics.placedItemCount
    ).toBe(3);

    expect(
      result.existing.planningResult.kind
    ).toBe('planned');

    if (
      result.existing.planningResult.kind !== 'planned'
    ) {
      throw new Error('Expected a planned existing result');
    }

    expect(
      result.existing.planningResult.plan.id
    ).not.toBe(
      result.replacementAlternative.planningResult.plan.id
    );

    expect('plan' in result).toBe(false);
    expect('selectedPlan' in result).toBe(false);
  });

  it('preserves a normal not-planned existing result and does not run later stages', async () => {
    const solver = new CapturingBaselineSolver();

    const result = await planHybridBoxes(
      'hybrid-unsupported',
      solver,
      {
        items: [makeItem(1)],
        cartons: [makeExistingCarton(1)],
        objective: {
          kind: 'existing-inventory-first',
        },
      }
    );

    expect(result.existing.planningResult).toMatchObject({
      kind: 'not-planned',
      selection: {
        kind: 'objective-unsupported',
        objective: 'existing-inventory-first',
      },
    });

    expect(result.remainderItems).toEqual([]);
    expect(result.remainderInstanceMapping).toEqual([]);
    expect(result.supplemental).toBeNull();
    expect(result.replacementAlternative).toBeNull();
    expect(solver.inputs).toHaveLength(1);
  });

  it('preserves insufficient-data results from generated-carton stages without changing the objective', async () => {
    const result = await planHybridBoxes(
      'hybrid-cost',
      new BaselineSolver(),
      {
        items: [makeItem(2)],
        cartons: [makeExistingCarton(1, 1.5)],
        objective: {
          kind: 'min-carton-cost',
        },
      }
    );

    expect(result.existing.planningResult.kind).toBe(
      'planned'
    );

    expect(result.supplemental?.planningResult).toMatchObject({
      kind: 'not-planned',
      selection: {
        kind: 'insufficient-data',
        objective: 'min-carton-cost',
        missingMetric: 'carton-cost',
      },
    });

    expect(
      result.replacementAlternative?.planningResult
    ).toMatchObject({
      kind: 'not-planned',
      selection: {
        kind: 'insufficient-data',
        objective: 'min-carton-cost',
        missingMetric: 'carton-cost',
      },
    });
  });

  it('does not expose caller-owned items or cartons to solver mutation', async () => {
    const input = makeInput(2, 1);
    const before = JSON.stringify(input);

    const mutatingSolver: SolverAdapter = {
      solve: async solverInput => {
        solverInput.items[0]!.dimensions.length = 999;
        solverInput.items[0]!.constraints.fragile = true;
        solverInput.cartons[0]!.internalDimensions.length =
          999;
        solverInput.cartons[0]!.quantityAvailable = 999;

        throw new Error('hybrid mutating solver stopped');
      },
    };

    await expect(
      planHybridBoxes(
        'hybrid-no-alias',
        mutatingSolver,
        input
      )
    ).rejects.toThrow('hybrid mutating solver stopped');

    expect(JSON.stringify(input)).toBe(before);
    expect(input.items[0]!.dimensions.length).toBe(20);
    expect(
      input.cartons[0]!.internalDimensions.length
    ).toBe(20);
    expect(
      input.cartons[0]!.quantityAvailable
    ).toBe(1);
  });

  it('requires both original items and supplied existing cartons through the existing-inventory stage', async () => {
    await expect(
      planHybridBoxes(
        'hybrid-no-items',
        new BaselineSolver(),
        {
          items: [],
          cartons: [makeExistingCarton(1)],
          objective: {
            kind: 'fewest-cartons',
          },
        }
      )
    ).rejects.toThrow(
      'Have boxes workflow requires at least one item'
    );

    await expect(
      planHybridBoxes(
        'hybrid-no-cartons',
        new BaselineSolver(),
        {
          items: [makeItem(1)],
          cartons: [],
          objective: {
            kind: 'fewest-cartons',
          },
        }
      )
    ).rejects.toThrow(
      'Have boxes workflow requires at least one carton'
    );
  });
});
