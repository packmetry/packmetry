import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace, {
  runNeedBoxesWorkspaceItems,
  type WorkspaceItemValues,
} from '../components/PackingWorkspace.js';

function item(
  id: string,
  unitWeightG?: number
): WorkspaceItemValues {
  return {
    id,
    name: 'Books',
    lengthMm: 20,
    widthMm: 20,
    heightMm: 20,
    quantity: 1,
    ...(unitWeightG !== undefined
      ? { unitWeightG }
      : {}),
  };
}

describe('PackingWorkspace optional personal item weight', () => {
  it('renders an optional weight-per-item field in grams', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace />
    );

    expect(html).toContain(
      'Weight per item (g) (optional)'
    );

    expect(html).toContain(
      'placeholder="e.g. 500"'
    );
  });

  it('allows item weight to remain blank', async () => {
    const result =
      await runNeedBoxesWorkspaceItems([
        item('workspace-item-1'),
      ]);

    expect(result.plan.status).toBe(
      'feasible'
    );

    expect(
      result.plan.metrics.placedItemCount
    ).toBe(1);

    expect(
      result.plan.metrics.unplacedItemCount
    ).toBe(0);
  });

  it('accepts a valid optional item weight', async () => {
    const result =
      await runNeedBoxesWorkspaceItems([
        item('workspace-item-1', 500),
      ]);

    expect(result.plan.status).toBe(
      'feasible'
    );

    expect(
      result.plan.metrics.placedItemCount
    ).toBe(1);

    expect(
      result.plan.metrics.unplacedItemCount
    ).toBe(0);
  });

  it('rejects zero item weight through canonical validation', async () => {
    await expect(
      runNeedBoxesWorkspaceItems([
        item('workspace-item-1', 0),
      ])
    ).rejects.toThrow();
  });

  it('rejects negative item weight through canonical validation', async () => {
    await expect(
      runNeedBoxesWorkspaceItems([
        item('workspace-item-1', -100),
      ])
    ).rejects.toThrow();
  });
});