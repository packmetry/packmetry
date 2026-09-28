import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingVisualization, {
  buildVisualizationModel,
} from '../components/PackingVisualization.js';
import type { PackedCarton } from '../core/domain/packed-carton.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';

function makePackedCarton(): PackedCarton {
  return {
    carton: {
      id: 'box-1',
      name: 'Personal box',
      internalDimensions: {
        length: 120,
        width: 100,
        height: 80,
      },
    },
    placements: [
      {
        itemId: 'workspace-item-1',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 20,
        width: 20,
        height: 20,
        rotation: 'LWH',
      },
      {
        itemId: 'workspace-item-1',
        instanceIndex: 1,
        x: 20,
        y: 0,
        z: 0,
        length: 20,
        width: 20,
        height: 20,
        rotation: 'LWH',
      },
      {
        itemId: 'workspace-item-2',
        instanceIndex: 0,
        x: 40,
        y: 0,
        z: 0,
        length: 30,
        width: 20,
        height: 10,
        rotation: 'LWH',
      },
    ],
    metrics: {
      itemCount: 3,
      itemVolumeMm3: 22_000,
      cartonVolumeMm3: 960_000,
      emptyVolumeMm3: 938_000,
      utilization: 22_000 / 960_000,
    },
  };
}

function makePlan(): PackingPlan {
  const packedCarton = makePackedCarton();

  return {
    id: 'personal-visualization-plan',
    status: 'feasible',
    objective: {
      kind: 'fewest-cartons',
    },
    cartons: [packedCarton],
    unplacedItems: [],
    metrics: {
      cartonCount: 1,
      placedItemCount: 3,
      unplacedItemCount: 0,
      itemVolumeMm3: 22_000,
      cartonVolumeMm3: 960_000,
      emptyVolumeMm3: 938_000,
      utilization: 22_000 / 960_000,
    },
    explanations: [],
    solverMeta: {
      solverId: 'packmetry-baseline',
      solverVersion: '1.0.0',
      durationMs: 1,
      deterministic: true,
    },
  };
}

describe('PackingVisualization personal item legend', () => {
  it('uses personal item names in the visualization model', () => {
    const model = buildVisualizationModel(
      makePackedCarton(),
      {
        'workspace-item-1': 'Books',
        'workspace-item-2': 'Desk lamp',
      }
    );

    expect(model.items[0]?.label).toBe('Books');
    expect(model.items[1]?.label).toBe('Books');
    expect(model.items[2]?.label).toBe('Desk lamp');
  });

  it('uses one stable color for every instance of the same item', () => {
    const model = buildVisualizationModel(
      makePackedCarton(),
      {
        'workspace-item-1': 'Books',
        'workspace-item-2': 'Desk lamp',
      }
    );

    expect(model.items[0]?.color).toBe(
      model.items[1]?.color
    );

    expect(model.items[0]?.color).not.toBe(
      model.items[2]?.color
    );
  });

  it('builds one legend entry per item with the packed quantity', () => {
    const model = buildVisualizationModel(
      makePackedCarton(),
      {
        'workspace-item-1': 'Books',
        'workspace-item-2': 'Desk lamp',
      }
    );

    expect(model.legend).toHaveLength(2);

    expect(model.legend[0]).toMatchObject({
      itemId: 'workspace-item-1',
      label: 'Books',
      quantity: 2,
    });

    expect(model.legend[1]).toMatchObject({
      itemId: 'workspace-item-2',
      label: 'Desk lamp',
      quantity: 1,
    });
  });

  it('renders personal item names in the visible 3D legend', () => {
    const html = renderToStaticMarkup(
      <PackingVisualization
        plan={makePlan()}
        itemLabels={{
          'workspace-item-1': 'Books',
          'workspace-item-2': 'Desk lamp',
        }}
      />
    );

    expect(html).toContain('Items in this box');
    expect(html).toContain('Books');
    expect(html).toContain('Desk lamp');
    expect(html).toContain('× 2');
    expect(html).toContain('× 1');

    expect(html).not.toContain(
      '>workspace-item-1<'
    );

    expect(html).not.toContain(
      '>workspace-item-2<'
    );
  });

  it('uses plain numbered fallback labels when names are unavailable', () => {
    const html = renderToStaticMarkup(
      <PackingVisualization plan={makePlan()} />
    );

    expect(html).toContain('Item 1');
    expect(html).toContain('Item 2');
  });
});