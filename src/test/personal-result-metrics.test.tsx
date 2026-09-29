import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ResultSummary, {
  formatEmptySpace,
  formatPackedWeight,
} from '../components/ResultSummary.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';

function makePlan(
  totalContentsWeightG?: number,
  emptyVolumeMm3 = 488_000
): PackingPlan {
  return {
    id: 'personal-result-metrics-plan',

    status: 'feasible',

    objective: {
      kind: 'fewest-cartons',
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
          emptyVolumeMm3,
          utilization: 0.512,

          ...(totalContentsWeightG !== undefined
            ? {
                contentsWeightG:
                  totalContentsWeightG,
              }
            : {}),
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
      emptyVolumeMm3,
      utilization: 0.512,

      ...(totalContentsWeightG !== undefined
        ? {
            totalContentsWeightG,
          }
        : {}),
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

describe(
  'ResultSummary personal result metrics',
  () => {
    it(
      'shows packed weight when canonical weight data is available',
      () => {
        const html =
          renderToStaticMarkup(
            <ResultSummary
              plan={
                makePlan(1500)
              }
            />
          );

        expect(
          html
        ).toContain(
          'Packed weight'
        );

        expect(
          html
        ).toContain(
          '1.5 kg'
        );
      }
    );

    it(
      'does not invent packed weight when canonical weight data is unavailable',
      () => {
        const html =
          renderToStaticMarkup(
            <ResultSummary
              plan={
                makePlan()
              }
            />
          );

        expect(
          html
        ).toContain(
          'Packed weight'
        );

        expect(
          html
        ).toContain(
          'Not provided'
        );
      }
    );

    it(
      'shows canonical empty volume as a human-readable empty-space metric',
      () => {
        const html =
          renderToStaticMarkup(
            <ResultSummary
              plan={
                makePlan(
                  500,
                  488_000
                )
              }
            />
          );

        expect(
          html
        ).toContain(
          'Empty space'
        );

        expect(
          html
        ).toContain(
          '488 cm³'
        );
      }
    );

    it(
      'formats larger empty space in litres',
      () => {
        expect(
          formatEmptySpace(
            1_500_000
          )
        ).toBe(
          '1.5 L'
        );
      }
    );

    it(
      'formats sub-kilogram packed weight in grams',
      () => {
        expect(
          formatPackedWeight(
            750
          )
        ).toBe(
          '750 g'
        );
      }
    );

    it(
      'reports missing packed weight honestly',
      () => {
        expect(
          formatPackedWeight(
            undefined
          )
        ).toBe(
          'Not provided'
        );
      }
    );
  }
);