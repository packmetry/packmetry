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
      name: 'Demo Box',
      internalDimensions: {
        length: 100,
        width: 80,
        height: 60,
      },
    },
    placements: [
      {
        itemId: 'item-1',
        instanceIndex: 0,
        x: 10,
        y: 20,
        z: 5,
        length: 30,
        width: 20,
        height: 10,
        rotation: 'LWH',
      },
    ],
    metrics: {
      itemCount: 1,
      itemVolumeMm3: 6_000,
      cartonVolumeMm3: 480_000,
      emptyVolumeMm3: 474_000,
      utilization: 0.0125,
    },
  };
}

function makePlan(
  cartons: PackedCarton[] = [makePackedCarton()]
): PackingPlan {
  const placedItemCount = cartons.reduce(
    (total, carton) => total + carton.placements.length,
    0
  );

  return {
    id: 'plan-1',
    status: cartons.length > 0 ? 'feasible' : 'infeasible',
    objective: {
      kind: 'fewest-cartons',
    },
    cartons,
    unplacedItems:
      cartons.length > 0
        ? []
        : [
            {
              itemId: 'item-1',
              instanceIndex: 0,
              reason: 'no-fitting-carton',
            },
          ],
    metrics: {
      cartonCount: cartons.length,
      placedItemCount,
      unplacedItemCount: cartons.length > 0 ? 0 : 1,
      itemVolumeMm3: cartons.length > 0 ? 6_000 : 0,
      cartonVolumeMm3: cartons.length > 0 ? 480_000 : 0,
      emptyVolumeMm3: cartons.length > 0 ? 474_000 : 0,
      utilization: cartons.length > 0 ? 0.0125 : 0,
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

describe('PackingVisualization', () => {
  it('maps canonical carton dimensions into Three.js axes', () => {
    const model = buildVisualizationModel(makePackedCarton());

    expect(model.sizeX).toBe(100);
    expect(model.sizeY).toBe(60);
    expect(model.sizeZ).toBe(80);
  });

  it('centers a placement correctly inside the carton', () => {
    const model = buildVisualizationModel(makePackedCarton());
    const item = model.items[0];

    expect(item).toBeDefined();
    expect(item?.centerX).toBe(-25);
    expect(item?.centerY).toBe(-20);
    expect(item?.centerZ).toBe(-10);
    expect(item?.sizeX).toBe(30);
    expect(item?.sizeY).toBe(10);
    expect(item?.sizeZ).toBe(20);
  });

  it('preserves item identity in the visualization model', () => {
    const model = buildVisualizationModel(makePackedCarton());

    expect(model.items[0]).toMatchObject({
      key: 'item-1-0',
      itemId: 'item-1',
      instanceIndex: 0,
    });
  });

  it('renders the visualization shell for a packed plan', () => {
    const html = renderToStaticMarkup(
      <PackingVisualization plan={makePlan()} />
    );

    expect(html).toContain('3D packing view');
    expect(html).toContain('Box 1 — Demo Box');
    expect(html).toContain('Drag to rotate · Scroll to zoom');
    expect(html).toContain(
      'The wireframe is the inside of the box.'
    );
  });

  it('renders a useful empty state when no carton was packed', () => {
    const html = renderToStaticMarkup(
      <PackingVisualization plan={makePlan([])} />
    );

    expect(html).toContain('No packed box to visualize.');
    expect(html).toContain(
      'A 3D view will appear when the verified plan contains at least one packed box.'
    );
  });
});
