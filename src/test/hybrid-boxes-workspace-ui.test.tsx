import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace, {
  DEFAULT_WORKSPACE_VALUES,
  runHybridBoxesWorkspace,
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

describe('PackingWorkspace hybrid boxes mode', () => {
  it('renders the hybrid workflow mode with the existing inventory editor', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace initialMode="hybrid-boxes" />
    );

    expect(html).toContain(
      'Use What I Have, Then Tell Me What to Buy'
    );
    expect(html).toContain('Boxes you have');
    expect(html).toContain('Available quantity');
    expect(html).toContain('Add another box type');
    expect(html).toContain('Use existing boxes first.');
    expect(html).toContain('Calculate packing');
  });

  it('stops after existing inventory when it covers the complete request', async () => {
    const result = await runHybridBoxesWorkspace(
      {
        ...DEFAULT_WORKSPACE_VALUES,
        itemLengthMm: 20,
        itemWidthMm: 20,
        itemHeightMm: 20,
        itemQuantity: 1,
      },
      [carton('existing', 20, 20, 20, 1)]
    );

    expect(result.existingPlan.status).toBe('feasible');
    expect(
      result.existingPlan.metrics.placedItemCount
    ).toBe(1);
    expect(result.remainderItemCount).toBe(0);
    expect(result.remainderInstanceMapping).toEqual([]);
    expect(result.supplementalPlan).toBeNull();
    expect(
      result.supplementalPurchaseRecommendations
    ).toEqual([]);
    expect(result.replacementPlan).toBeNull();
    expect(
      result.replacementPurchaseRecommendations
    ).toEqual([]);
  });

  it('uses existing inventory first and buys only for the verified remainder', async () => {
    const result = await runHybridBoxesWorkspace(
      {
        ...DEFAULT_WORKSPACE_VALUES,
        itemLengthMm: 20,
        itemWidthMm: 20,
        itemHeightMm: 20,
        itemQuantity: 3,
      },
      [carton('limited', 20, 20, 20, 1)]
    );

    expect(result.existingPlan.status).toBe('partial');
    expect(
      result.existingPlan.metrics.placedItemCount
    ).toBe(1);
    expect(
      result.existingPlan.metrics.unplacedItemCount
    ).toBe(2);
    expect(result.remainderItemCount).toBe(2);

    expect(result.remainderInstanceMapping).toEqual([
      {
        itemId: 'workspace-item',
        supplementalInstanceIndex: 0,
        originalInstanceIndex: 1,
      },
      {
        itemId: 'workspace-item',
        supplementalInstanceIndex: 1,
        originalInstanceIndex: 2,
      },
    ]);

    expect(result.supplementalPlan?.status).toBe('feasible');
    expect(
      result.supplementalPlan?.metrics.placedItemCount
    ).toBe(2);
    expect(
      result.supplementalPlan?.metrics.unplacedItemCount
    ).toBe(0);
    expect(
      result.supplementalPurchaseRecommendations.length
    ).toBeGreaterThan(0);
  });

  it('uses supplemental purchase boxes for every item when existing inventory is zero', async () => {
    const result = await runHybridBoxesWorkspace(
      {
        ...DEFAULT_WORKSPACE_VALUES,
        itemLengthMm: 20,
        itemWidthMm: 20,
        itemHeightMm: 20,
        itemQuantity: 2,
      },
      [carton('empty-stock', 20, 20, 20, 0)]
    );

    expect(result.existingPlan.status).toBe('infeasible');
    expect(
      result.existingPlan.metrics.placedItemCount
    ).toBe(0);
    expect(
      result.existingPlan.metrics.unplacedItemCount
    ).toBe(2);

    expect(result.remainderItemCount).toBe(2);
    expect(result.supplementalPlan?.status).toBe('feasible');
    expect(
      result.supplementalPlan?.metrics.placedItemCount
    ).toBe(2);
    expect(
      result.supplementalPurchaseRecommendations.length
    ).toBeGreaterThan(0);
  });

  it('keeps the purchase-only replacement comparison separate from both hybrid stages', async () => {
    const result = await runHybridBoxesWorkspace(
      {
        ...DEFAULT_WORKSPACE_VALUES,
        itemLengthMm: 20,
        itemWidthMm: 20,
        itemHeightMm: 20,
        itemQuantity: 3,
      },
      [carton('limited', 20, 20, 20, 1)]
    );

    expect(result.supplementalPlan).not.toBeNull();
    expect(result.replacementPlan).not.toBeNull();

    expect(result.replacementPlan?.status).toBe('feasible');
    expect(
      result.replacementPlan?.metrics.placedItemCount
    ).toBe(3);

    expect(result.existingPlan.id).not.toBe(
      result.supplementalPlan?.id
    );
    expect(result.existingPlan.id).not.toBe(
      result.replacementPlan?.id
    );
    expect(result.supplementalPlan?.id).not.toBe(
      result.replacementPlan?.id
    );

    expect('plan' in result).toBe(false);
    expect('selectedPlan' in result).toBe(false);
  });

  it('rejects invalid existing inventory through canonical validation', async () => {
    await expect(
      runHybridBoxesWorkspace(
        DEFAULT_WORKSPACE_VALUES,
        [carton('invalid', 0, 100, 100, 1)]
      )
    ).rejects.toThrow();
  });
});
