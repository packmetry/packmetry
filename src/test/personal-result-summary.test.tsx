import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ResultSummary from '../components/ResultSummary.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';

function makePlan(): PackingPlan {
  return {
    id: 'personal-result-summary-plan',
    status: 'partial',
    objective: {
      kind: 'fewest-cartons',
    },
    cartons: [
      {
        carton: {
          id: 'box-1',
          name: 'Existing box',
          internalDimensions: {
            length: 100,
            width: 100,
            height: 100,
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
        ],
        metrics: {
          itemCount: 1,
          itemVolumeMm3: 8_000,
          cartonVolumeMm3: 1_000_000,
          emptyVolumeMm3: 992_000,
          utilization: 0.008,
        },
      },
    ],
    unplacedItems: [
      {
        itemId: 'workspace-item-2',
        instanceIndex: 0,
        reason: 'no-fitting-carton',
      },
      {
        itemId: 'workspace-item-2',
        instanceIndex: 1,
        reason: 'no-fitting-carton',
      },
    ],
    metrics: {
      cartonCount: 1,
      placedItemCount: 1,
      unplacedItemCount: 2,
      itemVolumeMm3: 8_000,
      cartonVolumeMm3: 1_000_000,
      emptyVolumeMm3: 992_000,
      utilization: 0.008,
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

describe('ResultSummary personal item names', () => {
  it('shows a personal item name instead of the raw internal item id', () => {
    const html = renderToStaticMarkup(
      <ResultSummary
        plan={makePlan()}
        itemLabels={{
          'workspace-item-1': 'Books',
          'workspace-item-2': 'Desk lamp',
        }}
      />
    );

    expect(html).toContain('Desk lamp #1');
    expect(html).toContain('Desk lamp #2');

    expect(html).not.toContain(
      'workspace-item-2 #1'
    );

    expect(html).not.toContain(
      'workspace-item-2 #2'
    );
  });

  it('uses a plain numbered fallback when no personal name exists', () => {
    const html = renderToStaticMarkup(
      <ResultSummary plan={makePlan()} />
    );

    expect(html).toContain('Item 2 #1');
    expect(html).toContain('Item 2 #2');

    expect(html).not.toContain(
      'workspace-item-2 #1'
    );
  });

  it('trims surrounding whitespace from personal item names', () => {
    const html = renderToStaticMarkup(
      <ResultSummary
        plan={makePlan()}
        itemLabels={{
          'workspace-item-2': '  Desk lamp  ',
        }}
      />
    );

    expect(html).toContain('Desk lamp #1');
    expect(html).not.toContain(
      '  Desk lamp  '
    );
  });

  it('keeps the canonical unpacked-item reason visible', () => {
    const html = renderToStaticMarkup(
      <ResultSummary
        plan={makePlan()}
        itemLabels={{
          'workspace-item-2': 'Desk lamp',
        }}
      />
    );

    expect(html).toContain(
      'No available box is large enough for this item.'
    );
  });
});