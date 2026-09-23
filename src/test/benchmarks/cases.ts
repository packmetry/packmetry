import type { CanonicalDimensions } from '../../core/units/types.js';
import type { Item } from '../../core/domain/item.js';
import type { Carton } from '../../core/domain/carton.js';
import type {
  ObjectiveKind,
  OptimizationObjective,
} from '../../core/domain/objectives.js';
import type { RotationPolicy } from '../../core/domain/constraints.js';
import type {
  PlacementRotation,
  PlanStatus,
} from '../../core/domain/result.js';
import type { UnplacedReason } from '../../core/domain/plan-contracts.js';
import type { SolverInput } from '../../core/solver/contracts.js';

export interface BenchmarkExpectation {
  status: PlanStatus;
  cartonCount: number;
  placedItemCount: number;
  unplacedItemCount: number;
  requiredRotation?: PlacementRotation;
  unplacedReason?: UnplacedReason;
  repeatRuns?: number;
}

export interface PackingBenchmarkCase {
  id: string;
  description: string;
  input: SolverInput;
  expected: BenchmarkExpectation;
}

function item(
  id: string,
  dimensions: CanonicalDimensions,
  quantity = 1,
  rotationPolicy: RotationPolicy = 'any',
  unitWeightG?: number
): Item {
  return {
    id,
    dimensions: { ...dimensions },
    quantity,
    unitWeightG,
    constraints: {
      rotationPolicy,
      fragile: false,
      paddingAllowanceMm: 0,
      spacingAllowanceMm: 0,
      stackable: true,
    },
  };
}

type CartonOptions = Partial<
  Pick<
    Carton,
    | 'quantityAvailable'
    | 'stockQuantity'
    | 'maxGrossWeightG'
    | 'emptyBoxWeightG'
    | 'costPerBox'
  >
>;

function carton(
  id: string,
  internalDimensions: CanonicalDimensions,
  options: CartonOptions = {}
): Carton {
  return {
    id,
    internalDimensions: { ...internalDimensions },
    ...options,
  };
}

function input(
  items: Item[],
  cartons: Carton[],
  kind: ObjectiveKind = 'fewest-cartons'
): SolverInput {
  const objective: OptimizationObjective = { kind };

  return {
    items,
    cartons,
    objective,
  };
}

export const PACKING_BENCHMARK_CASES: readonly PackingBenchmarkCase[] = [
  {
    id: 'exact-fit',
    description: 'One item exactly fills one carton.',
    input: input(
      [item('item', { length: 100, width: 100, height: 100 })],
      [carton('box', { length: 100, width: 100, height: 100 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 1,
      unplacedItemCount: 0,
      requiredRotation: 'LWH',
    },
  },
  {
    id: 'impossible-fit',
    description: 'Item is larger than the carton in every orientation.',
    input: input(
      [item('item', { length: 101, width: 101, height: 101 })],
      [carton('box', { length: 100, width: 100, height: 100 })]
    ),
    expected: {
      status: 'infeasible',
      cartonCount: 0,
      placedItemCount: 0,
      unplacedItemCount: 1,
      unplacedReason: 'no-fitting-carton',
    },
  },
  {
    id: 'rotation-required',
    description: 'Item fits only after an allowed horizontal rotation.',
    input: input(
      [item('item', { length: 120, width: 80, height: 40 })],
      [carton('box', { length: 80, width: 120, height: 40 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 1,
      unplacedItemCount: 0,
      requiredRotation: 'WLH',
    },
  },
  {
    id: 'rotation-forbidden',
    description: 'Required rotation is forbidden by fixed orientation.',
    input: input(
      [
        item(
          'item',
          { length: 120, width: 80, height: 40 },
          1,
          'fixed'
        ),
      ],
      [carton('box', { length: 80, width: 120, height: 40 })]
    ),
    expected: {
      status: 'infeasible',
      cartonCount: 0,
      placedItemCount: 0,
      unplacedItemCount: 1,
      unplacedReason: 'constraint-conflict',
    },
  },
  {
    id: 'identical-eight',
    description: 'Eight identical cubes exactly fill a larger cube.',
    input: input(
      [item('cube', { length: 50, width: 50, height: 50 }, 8)],
      [carton('box', { length: 100, width: 100, height: 100 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 8,
      unplacedItemCount: 0,
    },
  },
  {
    id: 'mixed-items',
    description: 'Two different rectangular items share one carton.',
    input: input(
      [
        item('a', { length: 100, width: 50, height: 50 }),
        item('b', { length: 100, width: 50, height: 50 }),
      ],
      [carton('box', { length: 100, width: 100, height: 50 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 2,
      unplacedItemCount: 0,
    },
  },
  {
    id: 'two-cartons-required',
    description: 'Two large cubes require two carton instances.',
    input: input(
      [item('cube', { length: 60, width: 60, height: 60 }, 2)],
      [
        carton(
          'box',
          { length: 100, width: 100, height: 100 },
          { quantityAvailable: 2 }
        ),
      ]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 2,
      placedItemCount: 2,
      unplacedItemCount: 0,
    },
  },
  {
    id: 'weight-forces-split',
    description: 'Gross weight limit permits only one item per carton.',
    input: input(
      [
        item(
          'weighted',
          { length: 40, width: 40, height: 40 },
          2,
          'any',
          1000
        ),
      ],
      [
        carton(
          'box',
          { length: 100, width: 100, height: 100 },
          {
            quantityAvailable: 2,
            maxGrossWeightG: 1500,
            emptyBoxWeightG: 500,
          }
        ),
      ]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 2,
      placedItemCount: 2,
      unplacedItemCount: 0,
    },
  },
  {
    id: 'inventory-exhausted',
    description: 'Only one carton exists for two carton-sized items.',
    input: input(
      [item('item', { length: 100, width: 100, height: 100 }, 2)],
      [
        carton(
          'box',
          { length: 100, width: 100, height: 100 },
          { quantityAvailable: 1 }
        ),
      ]
    ),
    expected: {
      status: 'partial',
      cartonCount: 1,
      placedItemCount: 1,
      unplacedItemCount: 1,
      unplacedReason: 'inventory-exhausted',
    },
  },
  {
    id: 'upright-only-rotation',
    description: 'Upright item may rotate around the vertical axis.',
    input: input(
      [
        item(
          'item',
          { length: 80, width: 120, height: 40 },
          1,
          'upright'
        ),
      ],
      [carton('box', { length: 120, width: 80, height: 40 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 1,
      unplacedItemCount: 0,
      requiredRotation: 'WLH',
    },
  },
  {
    id: 'long-thin-item',
    description: 'Long thin item fits without dimensional shortcuts.',
    input: input(
      [item('item', { length: 200, width: 20, height: 20 })],
      [carton('box', { length: 200, width: 40, height: 40 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 1,
      unplacedItemCount: 0,
    },
  },
  {
    id: 'flat-stack',
    description: 'Five flat items exactly consume carton height.',
    input: input(
      [item('flat', { length: 100, width: 100, height: 10 }, 5)],
      [carton('box', { length: 100, width: 100, height: 50 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 5,
      unplacedItemCount: 0,
    },
  },
  {
    id: 'empty-input',
    description: 'No requested items requires no cartons.',
    input: input(
      [],
      [carton('box', { length: 100, width: 100, height: 100 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 0,
      placedItemCount: 0,
      unplacedItemCount: 0,
    },
  },
  {
    id: 'deterministic-repeatability',
    description: 'Simple multi-item case must repeat deterministically.',
    input: input(
      [item('cube', { length: 40, width: 40, height: 40 }, 3)],
      [carton('box', { length: 100, width: 100, height: 100 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 3,
      unplacedItemCount: 0,
      repeatRuns: 3,
    },
  },
  {
    id: 'highly-different-item-sizes',
    description: 'Large item with many small items.',
    input: input(
      [
        item('large', { length: 80, width: 80, height: 80 }, 1),
        item('small', { length: 20, width: 20, height: 20 }, 5),
      ],
      [carton('box', { length: 100, width: 100, height: 100 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 6,
      unplacedItemCount: 0,
    },
  },
  {
    id: 'many-small-items',
    description: 'Many small cubic items.',
    input: input(
      [item('cube', { length: 20, width: 20, height: 20 }, 50)],
      [carton('box', { length: 100, width: 100, height: 100 })]
    ),
    expected: {
      status: 'feasible',
      cartonCount: 1,
      placedItemCount: 50,
      unplacedItemCount: 0,
    },
  },
] as const;