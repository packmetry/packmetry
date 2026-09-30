import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  renderToStaticMarkup,
} from 'react-dom/server';

import {
  RecentPersonalItems,
} from '../components/PackingWorkspace.js';
import {
  createRecentPersonalItem,
  listRecentPersonalItems,
  MAX_RECENT_PERSONAL_ITEMS,
  orderRecentPersonalItems,
  recentPersonalItemFingerprint,
  saveRecentPersonalItems,
  type RecentPersonalItem,
  type RecentPersonalItemInput,
} from '../browser/personal-recent-items.js';

function itemInput(
  overrides: Partial<RecentPersonalItemInput> = {}
): RecentPersonalItemInput {
  return {
    name: 'Books',
    lengthMm: 80,
    widthMm: 60,
    heightMm: 40,
    quantity: 2,
    unitWeightG: 500,
    keepUpright: false,
    allowRotation: true,
    ...overrides,
  };
}

function recentItem(
  savedAt: number,
  overrides: Partial<RecentPersonalItemInput> = {}
): RecentPersonalItem {
  return createRecentPersonalItem(
    itemInput(overrides),
    savedAt
  );
}

describe(
  'Personal recent items',
  () => {
    it(
      'creates a recent item without mutating canonical item values',
      () => {
        const input =
          itemInput();

        const created =
          createRecentPersonalItem(
            input,
            123
          );

        expect(created).toMatchObject({
          ...input,
          savedAt: 123,
        });

        expect(created.fingerprint).toBe(
          recentPersonalItemFingerprint(
            input
          )
        );

        expect(input).toEqual(
          itemInput()
        );
      }
    );

    it(
      'uses a stable fingerprint that ignores per-plan quantity',
      () => {
        expect(
          recentPersonalItemFingerprint(
            itemInput({
              quantity: 1,
            })
          )
        ).toBe(
          recentPersonalItemFingerprint(
            itemInput({
              quantity: 9,
            })
          )
        );
      }
    );

    it(
      'orders recent items newest first',
      () => {
        const ordered =
          orderRecentPersonalItems([
            recentItem(10, {
              name: 'Old',
            }),
            recentItem(30, {
              name: 'Newest',
            }),
            recentItem(20, {
              name: 'Middle',
            }),
          ]);

        expect(
          ordered.map(
            item => item.name
          )
        ).toEqual([
          'Newest',
          'Middle',
          'Old',
        ]);
      }
    );

    it(
      'keeps only the newest duplicate item definition',
      () => {
        const older =
          recentItem(10, {
            quantity: 1,
          });

        const newer =
          recentItem(20, {
            quantity: 5,
          });

        const ordered =
          orderRecentPersonalItems([
            older,
            newer,
          ]);

        expect(ordered).toHaveLength(1);
        expect(ordered[0]?.quantity).toBe(5);
        expect(ordered[0]?.savedAt).toBe(20);
      }
    );

    it(
      'limits recent items to the configured maximum',
      () => {
        const items = Array.from(
          {
            length:
              MAX_RECENT_PERSONAL_ITEMS +
              5,
          },
          (_, index) =>
            recentItem(index, {
              name: `Item ${index}`,
              lengthMm:
                80 + index,
            })
        );

        expect(
          orderRecentPersonalItems(
            items
          )
        ).toHaveLength(
          MAX_RECENT_PERSONAL_ITEMS
        );
      }
    );

    it(
      'does not mutate the caller item array while ordering',
      () => {
        const items = [
          recentItem(10, {
            name: 'First',
          }),
          recentItem(20, {
            name: 'Second',
          }),
        ];

        const snapshot =
          [...items];

        orderRecentPersonalItems(
          items
        );

        expect(items).toEqual(
          snapshot
        );
      }
    );

    it(
      'returns false when IndexedDB is explicitly unavailable for saving',
      async () => {
        await expect(
          saveRecentPersonalItems(
            [itemInput()],
            null
          )
        ).resolves.toBe(false);
      }
    );

    it(
      'returns an empty list when IndexedDB is explicitly unavailable',
      async () => {
        await expect(
          listRecentPersonalItems(
            null
          )
        ).resolves.toEqual([]);
      }
    );

    it(
      'renders recent item count and browser-only persistence notice',
      () => {
        const html =
          renderToStaticMarkup(
            <RecentPersonalItems
              items={[
                recentItem(10),
              ]}
              unitSystem="metric"
              onAdd={vi.fn()}
            />
          );

        expect(html).toContain(
          'Recent items (1)'
        );

        expect(html).toContain(
          'Your recent items stay in this browser.'
        );
      }
    );

    it(
      'renders human-readable canonical item details',
      () => {
        const html =
          renderToStaticMarkup(
            <RecentPersonalItems
              items={[
                recentItem(10),
              ]}
              unitSystem="metric"
              onAdd={vi.fn()}
            />
          );

        expect(html).toContain(
          'Books'
        );
        expect(html).toContain(
          '80 × 60 × 40 mm'
        );
        expect(html).toContain(
          'Qty 2'
        );
        expect(html).toContain(
          '500 g'
        );
        expect(html).toContain(
          'Add item'
        );
      }
    );

    it(
      'renders recent dimensions in the selected imperial UI units',
      () => {
        const html =
          renderToStaticMarkup(
            <RecentPersonalItems
              items={[
                recentItem(10, {
                  lengthMm: 25.4,
                  widthMm: 50.8,
                  heightMm: 76.2,
                  unitWeightG:
                    28.349523125,
                }),
              ]}
              unitSystem="imperial"
              onAdd={vi.fn()}
            />
          );

        expect(html).toContain(
          '1 × 2 × 3 in'
        );
        expect(html).toContain(
          '1 oz'
        );
      }
    );

    it(
      'returns no markup when there are no recent items',
      () => {
        const html =
          renderToStaticMarkup(
            <RecentPersonalItems
              items={[]}
              unitSystem="metric"
              onAdd={vi.fn()}
            />
          );

        expect(html).toBe('');
      }
    );
  }
);
