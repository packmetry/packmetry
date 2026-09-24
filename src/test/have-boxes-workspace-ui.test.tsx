import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace, {
  DEFAULT_WORKSPACE_VALUES,
  runHaveBoxesWorkspace,
  type WorkspaceCartonValues,
} from '../components/PackingWorkspace.js';

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

describe('PackingWorkspace have-boxes mode', () => {
  it('renders the multiple existing-box inventory editor', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace initialMode="have-boxes" />
    );

expect(html).toContain('I Already Have Boxes');
    expect(html).toContain('Boxes you have');
    expect(html).toContain('Box type 1');
    expect(html).toContain('Available quantity');
    expect(html).toContain('Add another box type');
    expect(html).toContain('Inventory limits are enforced.');
  });

  it('plans against multiple existing box types', async () => {
    const result = await runHaveBoxesWorkspace(
      {
        ...DEFAULT_WORKSPACE_VALUES,
        itemLengthMm: 20,
        itemWidthMm: 20,
        itemHeightMm: 20,
        itemQuantity: 2,
      },
      [
        carton('small', 20, 20, 20, 1),
        carton('large', 40, 40, 40, 1),
      ]
    );

    expect(result.plan.status).toBe('feasible');
    expect(result.plan.metrics.cartonCount).toBe(2);
    expect(result.plan.metrics.placedItemCount).toBe(2);
    expect(result.plan.metrics.unplacedItemCount).toBe(0);

    expect(
      result.inventoryUsage.usedCartons.map(entry => ({
        cartonId: entry.cartonId,
        usedQuantity: entry.usedQuantity,
      }))
    ).toEqual([
      {
        cartonId: 'small',
        usedQuantity: 1,
      },
      {
        cartonId: 'large',
        usedQuantity: 1,
      },
    ]);
  });

  it('reports unused existing box types separately', async () => {
    const result = await runHaveBoxesWorkspace(
      {
        ...DEFAULT_WORKSPACE_VALUES,
        itemLengthMm: 20,
        itemWidthMm: 20,
        itemHeightMm: 20,
        itemQuantity: 2,
      },
      [
        carton('small', 20, 20, 20, 1),
        carton('medium', 40, 40, 40, 1),
        carton('unused-large', 100, 100, 100, 1),
      ]
    );

    expect(
      result.inventoryUsage.unusedCartons.map(
        entry => entry.cartonId
      )
    ).toEqual(['unused-large']);
  });

  it('enforces the available quantity entered for a box type', async () => {
    const result = await runHaveBoxesWorkspace(
      {
        ...DEFAULT_WORKSPACE_VALUES,
        itemLengthMm: 20,
        itemWidthMm: 20,
        itemHeightMm: 20,
        itemQuantity: 2,
      },
      [carton('limited', 20, 20, 20, 1)]
    );

    expect(result.plan.status).toBe('partial');
    expect(result.plan.metrics.cartonCount).toBe(1);
    expect(result.plan.metrics.placedItemCount).toBe(1);
    expect(result.plan.metrics.unplacedItemCount).toBe(1);
    expect(result.plan.unplacedItems[0]?.reason).toBe(
      'inventory-exhausted'
    );

    expect(
      result.inventoryUsage.usedCartons[0]
    ).toMatchObject({
      cartonId: 'limited',
      usedQuantity: 1,
      effectiveAvailability: 1,
      remainingQuantity: 0,
    });
  });

  it('treats zero available quantity as unavailable and does not buy replacements', async () => {
    const result = await runHaveBoxesWorkspace(
      {
        ...DEFAULT_WORKSPACE_VALUES,
        itemLengthMm: 20,
        itemWidthMm: 20,
        itemHeightMm: 20,
        itemQuantity: 1,
      },
      [carton('zero-stock', 20, 20, 20, 0)]
    );

    expect(result.plan.status).toBe('infeasible');
    expect(result.plan.metrics.cartonCount).toBe(0);
    expect(result.plan.metrics.placedItemCount).toBe(0);
    expect(result.plan.metrics.unplacedItemCount).toBe(1);
    expect(result.plan.unplacedItems[0]?.reason).toBe(
      'inventory-exhausted'
    );

    expect(result.inventoryUsage.usedCartons).toEqual([]);
    expect(
      result.inventoryUsage.unusedCartons[0]
    ).toMatchObject({
      cartonId: 'zero-stock',
      usedQuantity: 0,
      effectiveAvailability: 0,
      remainingQuantity: 0,
    });
  });

  it('rejects invalid existing-box values through canonical validation', async () => {
    await expect(
      runHaveBoxesWorkspace(
        DEFAULT_WORKSPACE_VALUES,
        [carton('invalid', 0, 100, 100, 1)]
      )
    ).rejects.toThrow();
  });
});
