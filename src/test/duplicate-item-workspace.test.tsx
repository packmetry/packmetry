import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace, {
  duplicateWorkspaceItem,
  type WorkspaceItemValues,
} from '../components/PackingWorkspace.js';

function item(
  id: string,
  overrides: Partial<WorkspaceItemValues> = {}
): WorkspaceItemValues {
  return {
    id,
    name: 'Table lamp',
    lengthMm: 70,
    widthMm: 70,
    heightMm: 45,
    quantity: 2,
    unitWeightG: 650,
    ...overrides,
  };
}

describe('PackingWorkspace duplicate item', () => {
  it('shows a Duplicate action for workspace items', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace />
    );

    expect(html).toContain('Duplicate');
  });

  it('duplicates all editable item values', () => {
    const source = item('workspace-item-1');

    const duplicated =
      duplicateWorkspaceItem(
        [source],
        source.id
      );

    expect(duplicated).toHaveLength(2);

    expect(duplicated[1]).toMatchObject({
      name: 'Table lamp',
      lengthMm: 70,
      widthMm: 70,
      heightMm: 45,
      quantity: 2,
      unitWeightG: 650,
    });
  });

  it('assigns the duplicated item a new stable internal id', () => {
    const duplicated =
      duplicateWorkspaceItem(
        [
          item('workspace-item-1'),
          item('workspace-item-2'),
        ],
        'workspace-item-1'
      );

    expect(
      duplicated.map(entry => entry.id)
    ).toEqual([
      'workspace-item-1',
      'workspace-item-3',
      'workspace-item-2',
    ]);
  });

  it('inserts the duplicate immediately after the source item', () => {
    const duplicated =
      duplicateWorkspaceItem(
        [
          item('workspace-item-1', {
            name: 'Books',
          }),
          item('workspace-item-2', {
            name: 'Shoes',
          }),
        ],
        'workspace-item-1'
      );

    expect(
      duplicated.map(entry => entry.name)
    ).toEqual([
      'Books',
      'Books',
      'Shoes',
    ]);
  });

  it('keeps generating unique ids when items are duplicated repeatedly', () => {
    const first =
      duplicateWorkspaceItem(
        [
          item('workspace-item-1'),
          item('workspace-item-2'),
        ],
        'workspace-item-1'
      );

    const second =
      duplicateWorkspaceItem(
        first,
        'workspace-item-3'
      );

    expect(
      second.map(entry => entry.id)
    ).toEqual([
      'workspace-item-1',
      'workspace-item-3',
      'workspace-item-4',
      'workspace-item-2',
    ]);

    expect(
      new Set(
        second.map(entry => entry.id)
      ).size
    ).toBe(second.length);
  });

  it('does not mutate the original item objects', () => {
    const source = item(
      'workspace-item-1'
    );

    const duplicated =
      duplicateWorkspaceItem(
        [source],
        source.id
      );

    expect(duplicated[0]).not.toBe(
      source
    );

    expect(duplicated[1]).not.toBe(
      source
    );

    expect(source.id).toBe(
      'workspace-item-1'
    );
  });
});