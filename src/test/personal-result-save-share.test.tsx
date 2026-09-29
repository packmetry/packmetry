import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  renderToStaticMarkup,
} from 'react-dom/server';

import ResultSummary from '../components/ResultSummary.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';

import {
  packingPlanFilename,
  savePackingPlan,
  serializePackingPlan,
  sharePackingPlan,
} from '../browser/packing-plan-actions.js';

function makePlan(): PackingPlan {
  return {
    id:
      'personal-plan-1',

    status:
      'feasible',

    objective: {
      kind:
        'fewest-cartons',
    },

    cartons: [
      {
        carton: {
          id:
            'box-1',

          name:
            'Recommended box',

          internalDimensions: {
            length:
              100,
            width:
              100,
            height:
              100,
          },
        },

        placements: [
          {
            itemId:
              'workspace-item-1',

            instanceIndex:
              0,

            x:
              0,
            y:
              0,
            z:
              0,

            length:
              80,
            width:
              80,
            height:
              80,

            rotation:
              'LWH',
          },
        ],

        metrics: {
          itemCount:
            1,

          itemVolumeMm3:
            512_000,

          cartonVolumeMm3:
            1_000_000,

          emptyVolumeMm3:
            488_000,

          utilization:
            0.512,
        },
      },
    ],

    unplacedItems:
      [],

    metrics: {
      cartonCount:
        1,

      placedItemCount:
        1,

      unplacedItemCount:
        0,

      itemVolumeMm3:
        512_000,

      cartonVolumeMm3:
        1_000_000,

      emptyVolumeMm3:
        488_000,

      utilization:
        0.512,
    },

    explanations:
      [],

    solverMeta: {
      solverId:
        'packmetry-baseline',

      solverVersion:
        '1.0.0',

      durationMs:
        1,

      deterministic:
        true,
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(
  'Personal result Save and Share actions',
  () => {
    it(
      'renders Save plan and Share plan without a Print action',
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
          'Save plan'
        );

        expect(
          html
        ).toContain(
          'Share plan'
        );

        expect(
          html
        ).not.toContain(
          'Print'
        );
      }
    );

    it(
      'serializes the canonical PackingPlan as JSON',
      () => {
        const plan =
          makePlan();

        const serialized =
          serializePackingPlan(
            plan
          );

        expect(
          JSON.parse(
            serialized
          )
        ).toEqual(
          plan
        );
      }
    );

    it(
      'creates a stable JSON filename from the plan ID',
      () => {
        expect(
          packingPlanFilename(
            makePlan()
          )
        ).toBe(
          'packmetry-personal-plan-1.json'
        );
      }
    );

    it(
      'downloads the canonical plan as JSON when browser download APIs are available',
      () => {
        const click =
          vi.fn();

        const remove =
          vi.fn();

        const appendChild =
          vi.fn();

        const anchor = {
          href:
            '',

          download:
            '',

          style: {
            display:
              '',
          },

          click,

          remove,
        };

        const createElement =
          vi.fn(
            () =>
              anchor
          );

        const createObjectURL =
          vi.fn(
            () =>
              'blob:packing-plan'
          );

        const revokeObjectURL =
          vi.fn();

        vi.stubGlobal(
          'document',
          {
            createElement,

            body: {
              appendChild,
            },
          }
        );

        vi.stubGlobal(
          'Blob',
          class {
            constructor(
              ..._args: unknown[]
            ) {}
          }
        );

        vi.stubGlobal(
          'URL',
          {
            createObjectURL,
            revokeObjectURL,
          }
        );

        expect(
          savePackingPlan(
            makePlan()
          )
        ).toBe(
          true
        );

        expect(
          createElement
        ).toHaveBeenCalledWith(
          'a'
        );

        expect(
          anchor.download
        ).toBe(
          'packmetry-personal-plan-1.json'
        );

        expect(
          anchor.href
        ).toBe(
          'blob:packing-plan'
        );

        expect(
          appendChild
        ).toHaveBeenCalledWith(
          anchor
        );

        expect(
          click
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          remove
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          revokeObjectURL
        ).toHaveBeenCalledWith(
          'blob:packing-plan'
        );
      }
    );

    it(
      'uses native sharing when the Web Share API is available',
      async () => {
        const share =
          vi.fn(
            async () =>
              undefined
          );

        const writeText =
          vi.fn(
            async () =>
              undefined
          );

        vi.stubGlobal(
          'navigator',
          {
            share,

            clipboard: {
              writeText,
            },
          }
        );

        const result =
          await sharePackingPlan(
            makePlan()
          );

        expect(
          result
        ).toBe(
          'shared'
        );

        expect(
          share
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          writeText
        ).not.toHaveBeenCalled();
      }
    );

    it(
      'copies the plan to the clipboard when native sharing is unavailable',
      async () => {
        const writeText =
          vi.fn(
            async () =>
              undefined
          );

        vi.stubGlobal(
          'navigator',
          {
            clipboard: {
              writeText,
            },
          }
        );

        const plan =
          makePlan();

        const result =
          await sharePackingPlan(
            plan
          );

        expect(
          result
        ).toBe(
          'copied'
        );

        expect(
          writeText
        ).toHaveBeenCalledWith(
          serializePackingPlan(
            plan
          )
        );
      }
    );

    it(
      'does not copy automatically when the user cancels native sharing',
      async () => {
        const error =
          new Error(
            'cancelled'
          );

        error.name =
          'AbortError';

        const share =
          vi.fn(
            async () => {
              throw error;
            }
          );

        const writeText =
          vi.fn(
            async () =>
              undefined
          );

        vi.stubGlobal(
          'navigator',
          {
            share,

            clipboard: {
              writeText,
            },
          }
        );

        const result =
          await sharePackingPlan(
            makePlan()
          );

        expect(
          result
        ).toBe(
          'cancelled'
        );

        expect(
          writeText
        ).not.toHaveBeenCalled();
      }
    );

    it(
      'reports unavailable when neither sharing nor clipboard support exists',
      async () => {
        vi.stubGlobal(
          'navigator',
          {}
        );

        const result =
          await sharePackingPlan(
            makePlan()
          );

        expect(
          result
        ).toBe(
          'unavailable'
        );
      }
    );
  }
);