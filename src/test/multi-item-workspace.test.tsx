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
  lengthMm: number,
  widthMm: number,
  heightMm: number,
  quantity: number
): WorkspaceItemValues {
  return {
    id,
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

describe('PackingWorkspace multiple item types', () => {
  it('renders an item editor that can grow beyond one item', () => {
    const html = renderToStaticMarkup(<PackingWorkspace />);

    expect(html).toContain('Item 1');
    expect(html).toContain('Add another item');
    expect(html).toContain('Quantity');
  });

  it('plans different item types in need-boxes mode', async () => {
    const result = await runNeedBoxesWorkspaceItems([
      item('workspace-item-1', 20, 20, 20, 1),
      item('workspace-item-2', 30, 30, 30, 1),
    ]);

    expect(result.plan.status).toBe('feasible');
    expect(result.plan.metrics.placedItemCount).toBe(2);
    expect(result.plan.metrics.unplacedItemCount).toBe(0);
    expect(
      result.purchaseRecommendations.length
    ).toBeGreaterThan(0);
  });

  it('plans different item types against existing boxes', async () => {
    const result = await runHaveBoxesWorkspaceItems(
      [
        item('workspace-item-1', 20, 20, 20, 1),
        item('workspace-item-2', 40, 30, 20, 1),
      ],
      [
        carton(
          'existing-box',
          100,
          100,
          100,
          1
        ),
      ]
    );

    expect(result.plan.status).toBe('feasible');
    expect(result.plan.metrics.cartonCount).toBe(1);
    expect(result.plan.metrics.placedItemCount).toBe(2);
    expect(result.plan.metrics.unplacedItemCount).toBe(0);
  });

  it('preserves the correct item identity through the hybrid remainder', async () => {
    const result = await runHybridBoxesWorkspaceItems(
      [
        item('workspace-item-1', 20, 20, 20, 1),
        item('workspace-item-2', 40, 40, 40, 1),
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

    expect(
      result.existingPlan.metrics.placedItemCount
    ).toBe(1);

    expect(
      result.existingPlan.metrics.unplacedItemCount
    ).toBe(1);

    expect(result.remainderItemCount).toBe(1);

    expect(result.remainderInstanceMapping).toEqual([
      {
        itemId: 'workspace-item-2',
        supplementalInstanceIndex: 0,
        originalInstanceIndex: 0,
      },
    ]);

    expect(
      result.supplementalPlan?.status
    ).toBe('feasible');

    expect(
      result.supplementalPlan?.metrics.placedItemCount
    ).toBe(1);

    expect(
      result.supplementalPlan?.metrics.unplacedItemCount
    ).toBe(0);
  });

  it('accounts for quantities independently for each item type', async () => {
    const result = await runNeedBoxesWorkspaceItems([
      item('workspace-item-1', 20, 20, 20, 2),
      item('workspace-item-2', 30, 20, 10, 3),
    ]);

    expect(result.plan.status).toBe('feasible');
    expect(result.plan.metrics.placedItemCount).toBe(5);
    expect(result.plan.metrics.unplacedItemCount).toBe(0);
  });

  it('rejects invalid values on any item row through canonical validation', async () => {
    await expect(
      runNeedBoxesWorkspaceItems([
        item('workspace-item-1', 20, 20, 20, 1),
        item('workspace-item-2', 0, 30, 30, 1),
      ])
    ).rejects.toThrow();
  });
});