import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace, {
  runHaveBoxesWorkspaceItems,
  runHybridBoxesWorkspaceItems,
  runNeedBoxesWorkspaceItems,
  type WorkspaceCartonValues,
  type WorkspaceItemValues,
} from '../components/PackingWorkspace.js';

function item(
  id: string,
  name: string | undefined,
  lengthMm: number,
  widthMm: number,
  heightMm: number,
  quantity: number
): WorkspaceItemValues {
  return {
    id,
    name,
    lengthMm,
    widthMm,
    heightMm,
    quantity,
  };
}

function carton(
  id: string,
  lengthMm: number,
  widthMm: number,
  heightMm: number,
  quantityAvailable: number
): WorkspaceCartonValues {
  return {
    id,
    lengthMm,
    widthMm,
    heightMm,
    quantityAvailable,
  };
}

function placedItemIds(
  result: Awaited<ReturnType<typeof runNeedBoxesWorkspaceItems>>
): string[] {
  return result.plan.cartons.flatMap(packedCarton =>
    packedCarton.placements.map(placement => placement.itemId)
  );
}

describe('PackingWorkspace personal item names', () => {
  it('shows an optional plain-language item name field without SKU jargon', () => {
    const html = renderToStaticMarkup(<PackingWorkspace />);

    expect(html).toContain('Item name (optional)');
    expect(html).toContain('placeholder="e.g. Books"');
    expect(html).not.toContain('SKU');
  });

  it('uses simple numbered item labels instead of item-type jargon', () => {
    const html = renderToStaticMarkup(<PackingWorkspace />);

    expect(html).toContain('Item 1');
    expect(html).not.toContain('Item type 1');
  });

  it('keeps stable item ids independent from duplicate human-readable names', async () => {
    const result = await runNeedBoxesWorkspaceItems([
      item('workspace-item-1', 'Books', 20, 20, 20, 1),
      item('workspace-item-2', 'Books', 30, 30, 30, 1),
    ]);

    expect(result.plan.status).toBe('feasible');

    expect(
      [...new Set(placedItemIds(result))].sort()
    ).toEqual([
      'workspace-item-1',
      'workspace-item-2',
    ]);
  });

  it('allows a personal item name to remain blank', async () => {
    const result = await runNeedBoxesWorkspaceItems([
      item('workspace-item-1', '', 20, 20, 20, 1),
    ]);

    expect(result.plan.status).toBe('feasible');
    expect(result.plan.metrics.placedItemCount).toBe(1);

    expect(placedItemIds(result)).toEqual([
      'workspace-item-1',
    ]);
  });

  it('does not let item names change the packing calculation', async () => {
    const named = await runNeedBoxesWorkspaceItems([
      item('workspace-item-1', 'Books', 20, 20, 20, 2),
      item('workspace-item-2', 'Desk lamp', 30, 20, 10, 1),
    ]);

    const renamed = await runNeedBoxesWorkspaceItems([
      item('workspace-item-1', 'Kitchen things', 20, 20, 20, 2),
      item('workspace-item-2', 'Gift', 30, 20, 10, 1),
    ]);

    expect(named.plan.metrics).toEqual(
      renamed.plan.metrics
    );

    expect(named.purchaseRecommendations).toEqual(
      renamed.purchaseRecommendations
    );

    expect(placedItemIds(named).sort()).toEqual(
      placedItemIds(renamed).sort()
    );
  });

  it('preserves stable item identity through existing-box and hybrid planning', async () => {
    const existing = await runHaveBoxesWorkspaceItems(
      [
        item(
          'workspace-item-1',
          'Small books',
          20,
          20,
          20,
          1
        ),
        item(
          'workspace-item-2',
          'Table lamp',
          40,
          40,
          40,
          1
        ),
      ],
      [carton('existing-box', 100, 100, 100, 1)]
    );

    expect(existing.plan.status).toBe('feasible');

    const existingIds = existing.plan.cartons.flatMap(
      packedCarton =>
        packedCarton.placements.map(
          placement => placement.itemId
        )
    );

    expect([...new Set(existingIds)].sort()).toEqual([
      'workspace-item-1',
      'workspace-item-2',
    ]);

    const hybrid = await runHybridBoxesWorkspaceItems(
      [
        item(
          'workspace-item-1',
          'Small books',
          20,
          20,
          20,
          1
        ),
        item(
          'workspace-item-2',
          'Table lamp',
          40,
          40,
          40,
          1
        ),
      ],
      [
        carton(
          'small-existing-box',
          20,
          20,
          20,
          1
        ),
      ]
    );

    expect(hybrid.remainderItemCount).toBe(1);

    expect(hybrid.remainderInstanceMapping).toEqual([
      {
        itemId: 'workspace-item-2',
        supplementalInstanceIndex: 0,
        originalInstanceIndex: 0,
      },
    ]);
  });
});