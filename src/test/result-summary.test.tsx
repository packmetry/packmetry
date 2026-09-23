import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ResultSummary, {
  describeUnplacedReason,
} from '../components/ResultSummary.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';

function makePlan(
  overrides: Partial<PackingPlan> = {}
): PackingPlan {
  return {
    id: 'plan-1',
    status: 'feasible',
    objective: {
      kind: 'fewest-cartons',
    },
    cartons: [
      {
        carton: {
          id: 'box-1',
          name: 'Test Box',
          internalDimensions: {
            length: 100,
            width: 100,
            height: 100,
          },
        },
        placements: [
          {
            itemId: 'item-1',
            instanceIndex: 0,
            x: 0,
            y: 0,
            z: 0,
            length: 80,
            width: 80,
            height: 80,
            rotation: 'LWH',
          },
        ],
        metrics: {
          itemCount: 1,
          itemVolumeMm3: 512_000,
          cartonVolumeMm3: 1_000_000,
          emptyVolumeMm3: 488_000,
          utilization: 0.512,
        },
      },
    ],
    unplacedItems: [],
    metrics: {
      cartonCount: 1,
      placedItemCount: 1,
      unplacedItemCount: 0,
      itemVolumeMm3: 512_000,
      cartonVolumeMm3: 1_000_000,
      emptyVolumeMm3: 488_000,
      utilization: 0.512,
    },
    explanations: [],
    solverMeta: {
      solverId: 'packmetry-baseline',
      solverVersion: '1.0.0',
      durationMs: 4,
      deterministic: true,
    },
    ...overrides,
  };
}

describe('ResultSummary', () => {
  it('renders a clear feasible summary', () => {
    const html = renderToStaticMarkup(
      <ResultSummary plan={makePlan()} />
    );

    expect(html).toContain('Everything fits.');
    expect(html).toContain('Boxes used');
    expect(html).toContain('Items packed');
    expect(html).toContain('51.2%');
    expect(html).toContain('Box 1 — Test Box');
    expect(html).toContain('100 × 100 × 100 mm');
    expect(html).toContain(
      'Independently verified by the Packmetry core.'
    );
  });

  it('explains an infeasible result and unplaced item', () => {
    const plan = makePlan({
      status: 'infeasible',
      cartons: [],
      unplacedItems: [
        {
          itemId: 'item-1',
          instanceIndex: 0,
          reason: 'no-fitting-carton',
        },
      ],
      metrics: {
        cartonCount: 0,
        placedItemCount: 0,
        unplacedItemCount: 1,
        itemVolumeMm3: 0,
        cartonVolumeMm3: 0,
        emptyVolumeMm3: 0,
        utilization: 0,
      },
    });

    const html = renderToStaticMarkup(
      <ResultSummary plan={plan} />
    );

    expect(html).toContain(
      'This box setup cannot pack the items.'
    );
    expect(html).toContain('Items not packed');
    expect(html).toContain('item-1 #1');
    expect(html).toContain(
      'No available box is large enough for this item.'
    );
  });

  it('renders partial status copy', () => {
    const html = renderToStaticMarkup(
      <ResultSummary
        plan={makePlan({
          status: 'partial',
        })}
      />
    );

    expect(html).toContain('Some items still need a box.');
  });

  it('renders solver-limit status copy', () => {
    const html = renderToStaticMarkup(
      <ResultSummary
        plan={makePlan({
          status: 'limit_reached',
        })}
      />
    );

    expect(html).toContain(
      'Packing stopped before a complete answer.'
    );
  });

  it('renders canonical explanations when present', () => {
    const html = renderToStaticMarkup(
      <ResultSummary
        plan={makePlan({
          explanations: [
            {
              code: 'test-note',
              message: 'This is a packing note.',
              level: 'info',
            },
          ],
        })}
      />
    );

    expect(html).toContain('Notes');
    expect(html).toContain('This is a packing note.');
  });

  it('maps every unplaced reason to plain language', () => {
    expect(
      describeUnplacedReason('no-fitting-carton')
    ).toBe('No available box is large enough for this item.');

    expect(
      describeUnplacedReason('inventory-exhausted')
    ).toBe(
      'There are not enough available boxes to place this item.'
    );

    expect(describeUnplacedReason('weight-limit')).toBe(
      'Placing this item would exceed a box weight limit.'
    );

    expect(
      describeUnplacedReason('constraint-conflict')
    ).toBe(
      'This item conflicts with the current packing constraints.'
    );

    expect(
      describeUnplacedReason('solver-limit-reached')
    ).toBe(
      'The solver stopped before it could place this item.'
    );
  });
});