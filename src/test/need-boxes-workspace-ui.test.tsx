import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace, {
  DEFAULT_WORKSPACE_VALUES,
  runNeedBoxesWorkspace,
} from '../components/PackingWorkspace.js';

describe('PackingWorkspace need-boxes mode', () => {
  it('renders I Need Boxes as the default workflow mode', () => {
    const html = renderToStaticMarkup(<PackingWorkspace />);

    expect(html).toContain('I Need Boxes');
    expect(html).toContain('I Already Have a Box');
    expect(html).toContain('No box dimensions needed.');
    expect(html).toContain('Calculate packing');
  });

  it('plans successfully without using caller box dimensions', async () => {
    const result = await runNeedBoxesWorkspace({
      ...DEFAULT_WORKSPACE_VALUES,
      itemLengthMm: 20,
      itemWidthMm: 20,
      itemHeightMm: 20,
      itemQuantity: 5,
      cartonLengthMm: 1,
      cartonWidthMm: 1,
      cartonHeightMm: 1,
    });

    expect(result.plan.status).toBe('feasible');
    expect(result.plan.metrics.cartonCount).toBe(1);
    expect(result.plan.metrics.placedItemCount).toBe(5);
    expect(result.plan.metrics.unplacedItemCount).toBe(0);
  });

  it('returns a purchase recommendation from canonical plan usage', async () => {
    const result = await runNeedBoxesWorkspace({
      ...DEFAULT_WORKSPACE_VALUES,
      itemLengthMm: 20,
      itemWidthMm: 20,
      itemHeightMm: 20,
      itemQuantity: 5,
    });

    expect(result.purchaseRecommendations).toHaveLength(1);

    expect(result.purchaseRecommendations[0]).toMatchObject({
      cartonId: 'purchase-carton-1',
      quantity: 1,
      carton: {
        internalDimensions: {
          length: 100,
          width: 20,
          height: 20,
        },
      },
    });
  });

  it('keeps the recommendation independent of legacy box fields', async () => {
    const first = await runNeedBoxesWorkspace({
      ...DEFAULT_WORKSPACE_VALUES,
      itemLengthMm: 30,
      itemWidthMm: 20,
      itemHeightMm: 10,
      itemQuantity: 2,
      cartonLengthMm: 40,
      cartonWidthMm: 40,
      cartonHeightMm: 40,
    });

    const second = await runNeedBoxesWorkspace({
      ...DEFAULT_WORKSPACE_VALUES,
      itemLengthMm: 30,
      itemWidthMm: 20,
      itemHeightMm: 10,
      itemQuantity: 2,
      cartonLengthMm: 999,
      cartonWidthMm: 888,
      cartonHeightMm: 777,
    });

    expect(first.purchaseRecommendations).toEqual(
      second.purchaseRecommendations
    );
    expect(first.plan.metrics).toEqual(second.plan.metrics);
  });

  it('rejects invalid item input through canonical validation', async () => {
    await expect(
      runNeedBoxesWorkspace({
        ...DEFAULT_WORKSPACE_VALUES,
        itemQuantity: 0,
      })
    ).rejects.toThrow();
  });
});
