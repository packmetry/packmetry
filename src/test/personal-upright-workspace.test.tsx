import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace, {
  duplicateWorkspaceItem,
  runHaveBoxesWorkspaceItems,
  type WorkspaceCartonValues,
  type WorkspaceItemValues,
} from '../components/PackingWorkspace.js';

function item(
  id: string,
  keepUpright = false
): WorkspaceItemValues {
  return {
    id,
    name: 'Table lamp',
    lengthMm: 80,
    widthMm: 40,
    heightMm: 20,
    quantity: 1,
    keepUpright,
  };
}

function carton(
  lengthMm: number,
  widthMm: number,
  heightMm: number
): WorkspaceCartonValues {
  return {
    id: 'workspace-carton-1',
    lengthMm,
    widthMm,
    heightMm,
    quantityAvailable: 1,
  };
}

describe('PackingWorkspace personal Keep upright preference', () => {
  it('renders Keep upright as an optional handling preference', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace />
    );

    expect(html).toContain(
      'Handling preferences'
    );

    expect(html).toContain(
      'Keep upright'
    );

    expect(html).toContain(
      'type="checkbox"'
    );
  });

  it('keeps unrestricted rotation as the default', async () => {
    const result =
      await runHaveBoxesWorkspaceItems(
        [
          item(
            'workspace-item-1'
          ),
        ],
        [
          carton(
            80,
            20,
            40
          ),
        ]
      );

    expect(
      result.plan.status
    ).toBe('feasible');

    expect(
      result.plan.metrics.placedItemCount
    ).toBe(1);

    expect(
      result.plan.metrics.unplacedItemCount
    ).toBe(0);
  });

  it('prevents a sideways-only fit when Keep upright is enabled', async () => {
    const result =
      await runHaveBoxesWorkspaceItems(
        [
          item(
            'workspace-item-1',
            true
          ),
        ],
        [
          carton(
            80,
            20,
            40
          ),
        ]
      );

    expect(
      result.plan.status
    ).toBe('infeasible');

    expect(
      result.plan.metrics.placedItemCount
    ).toBe(0);

    expect(
      result.plan.metrics.unplacedItemCount
    ).toBe(1);

    expect(
      result.plan.unplacedItems
    ).toEqual([
      expect.objectContaining({
        itemId:
          'workspace-item-1',
        instanceIndex: 0,
        reason:
          'constraint-conflict',
      }),
    ]);
  });

  it('still packs an upright-compatible item when Keep upright is enabled', async () => {
    const result =
      await runHaveBoxesWorkspaceItems(
        [
          item(
            'workspace-item-1',
            true
          ),
        ],
        [
          carton(
            80,
            40,
            20
          ),
        ]
      );

    expect(
      result.plan.status
    ).toBe('feasible');

    expect(
      result.plan.metrics.placedItemCount
    ).toBe(1);

    expect(
      result.plan.metrics.unplacedItemCount
    ).toBe(0);
  });

  it('preserves Keep upright when an item is duplicated', () => {
    const duplicated =
      duplicateWorkspaceItem(
        [
          item(
            'workspace-item-1',
            true
          ),
        ],
        'workspace-item-1'
      );

    expect(
      duplicated
    ).toHaveLength(2);

    expect(
      duplicated[0]?.keepUpright
    ).toBe(true);

    expect(
      duplicated[1]?.keepUpright
    ).toBe(true);
  });

  it('keeps the original item independent from its duplicate', () => {
    const source =
      item(
        'workspace-item-1',
        true
      );

    const duplicated =
      duplicateWorkspaceItem(
        [source],
        source.id
      );

    expect(
      duplicated[0]
    ).not.toBe(source);

    expect(
      duplicated[1]
    ).not.toBe(source);

    expect(
      source.keepUpright
    ).toBe(true);
  });
});