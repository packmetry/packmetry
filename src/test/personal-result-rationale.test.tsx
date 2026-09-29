import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ResultSummary, {
  describeObjectiveRationale,
} from '../components/ResultSummary.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';

function makePlan(
  objective: PackingPlan['objective']['kind'] =
    'fewest-cartons'
): PackingPlan {
  return {
    id: 'personal-result-rationale-plan',
    status: 'feasible',

    objective: {
      kind: objective,
    },

    cartons: [
      {
        carton: {
          id: 'box-1',
          name: 'Recommended box',
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
      durationMs: 1,
      deterministic: true,
    },
  };
}

describe('ResultSummary personal selection rationale', () => {
  it('shows why the personal plan was chosen', () => {
    const html = renderToStaticMarkup(
      <ResultSummary
        plan={makePlan()}
      />
    );

    expect(html).toContain(
      'Why this plan?'
    );

    expect(html).toContain(
      'Chosen for your packing goal'
    );

    expect(html).toContain(
      'This plan prioritizes using fewer boxes'
    );
  });

  it('describes the balanced objective in plain language', () => {
    expect(
      describeObjectiveRationale(
        'balanced'
      )
    ).toBe(
      'This plan prioritizes fewer boxes first, then less empty space and higher space utilization.'
    );
  });

  it('describes the fewest-cartons objective in plain language', () => {
    expect(
      describeObjectiveRationale(
        'fewest-cartons'
      )
    ).toBe(
      'This plan prioritizes using fewer boxes, then breaks ties using less empty space and higher space utilization.'
    );
  });

  it('describes the least-wasted-volume objective in plain language', () => {
    expect(
      describeObjectiveRationale(
        'least-wasted-volume'
      )
    ).toBe(
      'This plan prioritizes less empty space, then smaller total box volume, fewer boxes, and higher space utilization.'
    );
  });

  it('describes the easier-to-carry objective in plain language', () => {
    expect(
      describeObjectiveRationale(
        'easier-to-carry'
      )
    ).toBe(
      'This plan prioritizes a lower heaviest-box weight, then lower total packed weight, fewer boxes, and less empty space.'
    );
  });

  it('describes the existing-inventory-first objective without inventing unsupported ranking behavior', () => {
    expect(
      describeObjectiveRationale(
        'existing-inventory-first'
      )
    ).toBe(
      'This plan records using existing box inventory first as its packing objective.'
    );
  });

  it('describes the min-dim-weight objective without inventing unsupported ranking behavior', () => {
    expect(
      describeObjectiveRationale(
        'min-dim-weight'
      )
    ).toBe(
      'This plan records minimizing dimensional-weight impact as its packing objective.'
    );
  });

  it('describes the min-carton-cost objective in plain language', () => {
    expect(
      describeObjectiveRationale(
        'min-carton-cost'
      )
    ).toBe(
      'This plan prioritizes lower box cost, then fewer boxes and less empty space.'
    );
  });
});