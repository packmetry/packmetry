import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  renderToStaticMarkup,
} from 'react-dom/server';

import {
  RecentPersonalPlans,
} from '../components/PackingWorkspace.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';

import {
  MAX_RECENT_PERSONAL_PLANS,
  createRecentPersonalPlan,
  listRecentPersonalPlans,
  orderRecentPersonalPlans,
  saveRecentPersonalPlan,
} from '../browser/personal-recent-plans.js';

function makePlan({
  id = 'recent-plan',
  cartonCount = 1,
  placedItemCount = 2,
  utilization = 0.625,
}: {
  id?: string;
  cartonCount?: number;
  placedItemCount?: number;
  utilization?: number;
} = {}): PackingPlan {
  const cartonVolumeMm3 =
    cartonCount * 1_000_000;

  const itemVolumeMm3 =
    cartonVolumeMm3 *
    utilization;

  return {
    id,

    status: 'feasible',

    objective: {
      kind: 'fewest-cartons',
    },

    cartons: [],

    unplacedItems: [],

    metrics: {
      cartonCount,
      placedItemCount,
      unplacedItemCount: 0,
      itemVolumeMm3,
      cartonVolumeMm3,
      emptyVolumeMm3:
        cartonVolumeMm3 -
        itemVolumeMm3,
      utilization,
    },

    explanations: [],

    solverMeta: {
      solverId:
        'packmetry-baseline',

      solverVersion:
        '1.0.0',

      durationMs: 1,

      deterministic: true,
    },
  };
}

describe(
  'Personal recent packing plans',
  () => {
    it(
      'creates a recent-plan record without changing the canonical plan',
      () => {
        const plan =
          makePlan();

        const record =
          createRecentPersonalPlan(
            plan,
            'have-boxes',
            1234
          );

        expect(
          record.plan
        ).toBe(
          plan
        );

        expect(
          record.mode
        ).toBe(
          'have-boxes'
        );

        expect(
          record.savedAt
        ).toBe(
          1234
        );
      }
    );

    it(
      'orders recent plans newest first',
      () => {
        const older =
          createRecentPersonalPlan(
            makePlan({
              id: 'older',
            }),
            'need-boxes',
            100
          );

        const newer =
          createRecentPersonalPlan(
            makePlan({
              id: 'newer',
            }),
            'have-boxes',
            300
          );

        const middle =
          createRecentPersonalPlan(
            makePlan({
              id: 'middle',
            }),
            'hybrid-boxes',
            200
          );

        expect(
          orderRecentPersonalPlans(
            [
              older,
              newer,
              middle,
            ]
          ).map(
            record =>
              record.plan.id
          )
        ).toEqual(
          [
            'newer',
            'middle',
            'older',
          ]
        );
      }
    );

    it(
      'limits recent plans to the configured maximum',
      () => {
        const records =
          Array.from(
            {
              length:
                MAX_RECENT_PERSONAL_PLANS +
                4,
            },
            (
              _value,
              index
            ) =>
              createRecentPersonalPlan(
                makePlan({
                  id: `plan-${index}`,
                }),
                'need-boxes',
                index
              )
          );

        const ordered =
          orderRecentPersonalPlans(
            records
          );

        expect(
          ordered
        ).toHaveLength(
          MAX_RECENT_PERSONAL_PLANS
        );

        expect(
          ordered[0]?.plan.id
        ).toBe(
          `plan-${
            MAX_RECENT_PERSONAL_PLANS +
            3
          }`
        );
      }
    );

    it(
      'does not mutate the caller array while ordering',
      () => {
        const first =
          createRecentPersonalPlan(
            makePlan({
              id: 'first',
            }),
            'need-boxes',
            100
          );

        const second =
          createRecentPersonalPlan(
            makePlan({
              id: 'second',
            }),
            'need-boxes',
            200
          );

        const input = [
          first,
          second,
        ];

        const snapshot = [
          ...input,
        ];

        orderRecentPersonalPlans(
          input
        );

        expect(
          input
        ).toEqual(
          snapshot
        );

        expect(
          input[0]
        ).toBe(
          first
        );
      }
    );

    it(
      'fails safely when IndexedDB saving is unavailable',
      async () => {
        await expect(
          saveRecentPersonalPlan(
            makePlan(),
            'need-boxes',
            null
          )
        ).resolves.toBe(
          false
        );
      }
    );

    it(
      'returns an empty history when IndexedDB is unavailable',
      async () => {
        await expect(
          listRecentPersonalPlans(
            null
          )
        ).resolves.toEqual(
          []
        );
      }
    );

    it(
      'renders the recent plan count',
      () => {
        const html =
          renderToStaticMarkup(
            <RecentPersonalPlans
              plans={[
                createRecentPersonalPlan(
                  makePlan(),
                  'need-boxes',
                  100
                ),
              ]}
              onOpen={() => {}}
            />
          );

        expect(
          html
        ).toContain(
          'Recent plans (1)'
        );
      }
    );

    it(
      'explains that recent plans stay in this browser',
      () => {
        const html =
          renderToStaticMarkup(
            <RecentPersonalPlans
              plans={[
                createRecentPersonalPlan(
                  makePlan(),
                  'need-boxes',
                  100
                ),
              ]}
              onOpen={() => {}}
            />
          );

        expect(
          html
        ).toContain(
          'Your recent plans stay in this browser.'
        );
      }
    );

    it(
      'renders a View plan action',
      () => {
        const html =
          renderToStaticMarkup(
            <RecentPersonalPlans
              plans={[
                createRecentPersonalPlan(
                  makePlan(),
                  'need-boxes',
                  100
                ),
              ]}
              onOpen={() => {}}
            />
          );

        expect(
          html
        ).toContain(
          'View plan'
        );
      }
    );

    it(
      'renders human-readable mode and canonical plan metrics',
      () => {
        const html =
          renderToStaticMarkup(
            <RecentPersonalPlans
              plans={[
                createRecentPersonalPlan(
                  makePlan({
                    cartonCount:
                      2,
                    placedItemCount:
                      3,
                    utilization:
                      0.625,
                  }),
                  'hybrid-boxes',
                  100
                ),
              ]}
              onOpen={() => {}}
            />
          );

        expect(
          html
        ).toContain(
          'Use mine + buy rest'
        );

        expect(
          html
        ).toContain(
          '2 boxes'
        );

        expect(
          html
        ).toContain(
          '3 items'
        );

        expect(
          html
        ).toContain(
          '62.5% used'
        );
      }
    );

    it(
      'renders nothing when there are no recent plans',
      () => {
        const html =
          renderToStaticMarkup(
            <RecentPersonalPlans
              plans={[]}
              onOpen={() => {}}
            />
          );

        expect(
          html
        ).toBe(
          ''
        );
      }
    );
  }
);
