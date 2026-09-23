import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace, {
  DEFAULT_WORKSPACE_VALUES,
  runPackingWorkspace,
} from '../components/PackingWorkspace.js';

describe('PackingWorkspace', () => {
  it('renders the minimal manual packing workspace', () => {
    const html = renderToStaticMarkup(<PackingWorkspace />);

    expect(html).toContain('Pack an item into a box');
    expect(html).toContain('Calculate packing');
    expect(html).toContain('Run a calculation to see the verified result.');
  });

  it('solves and constructs a verified feasible plan', async () => {
    const plan = await runPackingWorkspace({
      ...DEFAULT_WORKSPACE_VALUES,
      itemLengthMm: 100,
      itemWidthMm: 100,
      itemHeightMm: 100,
      cartonLengthMm: 100,
      cartonWidthMm: 100,
      cartonHeightMm: 100,
    });

    expect(plan.status).toBe('feasible');
    expect(plan.metrics.cartonCount).toBe(1);
    expect(plan.metrics.placedItemCount).toBe(1);
    expect(plan.metrics.unplacedItemCount).toBe(0);
    expect(plan.metrics.utilization).toBe(1);
    expect(plan.solverMeta.solverId).toBe('packmetry-baseline');
  });

  it('returns an infeasible canonical result when the item cannot fit', async () => {
    const plan = await runPackingWorkspace({
      ...DEFAULT_WORKSPACE_VALUES,
      itemLengthMm: 120,
      itemWidthMm: 120,
      itemHeightMm: 120,
      cartonLengthMm: 100,
      cartonWidthMm: 100,
      cartonHeightMm: 100,
    });

    expect(plan.status).toBe('infeasible');
    expect(plan.metrics.cartonCount).toBe(0);
    expect(plan.metrics.placedItemCount).toBe(0);
    expect(plan.metrics.unplacedItemCount).toBe(1);
    expect(plan.unplacedItems[0]?.reason).toBe('no-fitting-carton');
  });

  it('supports multiple item instances', async () => {
    const plan = await runPackingWorkspace({
      ...DEFAULT_WORKSPACE_VALUES,
      itemLengthMm: 20,
      itemWidthMm: 20,
      itemHeightMm: 20,
      itemQuantity: 5,
      cartonLengthMm: 100,
      cartonWidthMm: 100,
      cartonHeightMm: 100,
    });

    expect(plan.status).toBe('feasible');
    expect(plan.metrics.cartonCount).toBe(1);
    expect(plan.metrics.placedItemCount).toBe(5);
  });

  it('rejects invalid manual input through canonical validation', async () => {
    await expect(
      runPackingWorkspace({
        ...DEFAULT_WORKSPACE_VALUES,
        itemQuantity: 0,
      })
    ).rejects.toThrow();
  });
});
