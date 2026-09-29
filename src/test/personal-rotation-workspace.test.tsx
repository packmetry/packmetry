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
  options: {
    allowRotation?: boolean;
    keepUpright?: boolean;
  } = {}
): WorkspaceItemValues {
  return {
    id,
    name: 'Books',
    lengthMm: 80,
    widthMm: 40,
    heightMm: 20,
    quantity: 1,
    allowRotation:
      options.allowRotation ?? true,
    keepUpright:
      options.keepUpright ?? false,
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

describe('PackingWorkspace personal Allow rotation preference', () => {
  it('renders Allow rotation as a handling preference', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace />
    );

    expect(html).toContain(
      'Handling preferences'
    );

    expect(html).toContain(
      'Allow rotation'
    );

    expect(html).toContain(
      'Keep upright'
    );
  });

  it('allows rotation by default', async () => {
    const result =
      await runHaveBoxesWorkspaceItems(
        [
          item(
            'workspace-item-1'
          ),
        ],
        [
          carton(
            40,
            80,
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
  });

  it('prevents a rotated-only fit when rotation is disabled', async () => {
    const result =
      await runHaveBoxesWorkspaceItems(
        [
          item(
            'workspace-item-1',
            {
              allowRotation: false,
            }
          ),
        ],
        [
          carton(
            40,
            80,
            20
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

  it('keeps fixed orientation even when Keep upright is also selected', async () => {
    const result =
      await runHaveBoxesWorkspaceItems(
        [
          item(
            'workspace-item-1',
            {
              allowRotation: false,
              keepUpright: true,
            }
          ),
        ],
        [
          carton(
            40,
            80,
            20
          ),
        ]
      );

    expect(
      result.plan.status
    ).toBe('infeasible');

    expect(
      result.plan.unplacedItems[0]
        ?.reason
    ).toBe(
      'constraint-conflict'
    );
  });

  it('still permits horizontal turning when Keep upright is enabled and rotation is allowed', async () => {
    const result =
      await runHaveBoxesWorkspaceItems(
        [
          item(
            'workspace-item-1',
            {
              allowRotation: true,
              keepUpright: true,
            }
          ),
        ],
        [
          carton(
            40,
            80,
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
  });

  it('preserves Allow rotation when an item is duplicated', () => {
    const duplicated =
      duplicateWorkspaceItem(
        [
          item(
            'workspace-item-1',
            {
              allowRotation: false,
            }
          ),
        ],
        'workspace-item-1'
      );

    expect(
      duplicated
    ).toHaveLength(2);

    expect(
      duplicated[0]?.allowRotation
    ).toBe(false);

    expect(
      duplicated[1]?.allowRotation
    ).toBe(false);
  });
});