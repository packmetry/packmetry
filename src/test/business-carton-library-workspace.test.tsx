import { readFileSync } from 'node:fs';

import { renderToStaticMarkup } from 'react-dom/server';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  createSavedBusinessCarton,
  type SavedBusinessCarton,
} from '../browser/business-carton-library.js';
import BusinessWorkspace, {
  SavedBusinessCartonLibrary,
  businessCartonFromSavedCarton,
  savedBusinessCartonInputFromBusinessCarton,
  type BusinessCartonValues,
} from '../components/BusinessWorkspace.js';

const workspaceSource =
  readFileSync(
    new URL(
      '../components/BusinessWorkspace.tsx',
      import.meta.url
    ),
    'utf8'
  );

function savedCarton(
  overrides:
    Partial<SavedBusinessCarton> = {}
): SavedBusinessCarton {
  const {
    savedAt = 100,
    ...inputOverrides
  } = overrides;

  return createSavedBusinessCarton(
    {
      id: 'library-carton-1',
      name: 'Medium mailer',
      cartonCode: 'BX-M',
      lengthMm: 400,
      widthMm: 300,
      heightMm: 200,
      quantityAvailable: 15,
      maxGrossWeightG: 12_000,
      emptyBoxWeightG: 350,
      costPerBox: 1.75,
      ...inputOverrides,
    },
    savedAt
  );
}

function currentCarton(
  id: string
): BusinessCartonValues {
  return {
    id,
    name: '',
    cartonCode: '',
    lengthMm: 100,
    widthMm: 100,
    heightMm: 100,
    quantityAvailable: 1,
    maxGrossWeightG: undefined,
    emptyBoxWeightG: undefined,
    costPerBox: undefined,
  };
}

describe(
  'BusinessWorkspace saved carton library integration',
  () => {
    it(
      'renders the saved-carton controls and browser-only privacy message',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace />
          );

        expect(html).toContain(
          'Save to library'
        );

        expect(html).toContain(
          'Saved carton library'
        );

        expect(html).toContain(
          'Your saved cartons stay in this browser.'
        );

        expect(html).toContain(
          'No saved cartons yet.'
        );
      }
    );

    it(
      'renders a saved carton with explicit use and delete actions',
      () => {
        const html =
          renderToStaticMarkup(
            <SavedBusinessCartonLibrary
              cartons={[
                savedCarton(),
              ]}
              message={null}
              onUse={vi.fn()}
              onDelete={vi.fn()}
            />
          );

        expect(html).toContain(
          'Medium mailer'
        );

        expect(html).toContain(
          '400 × 300 × 200 mm'
        );

        expect(html).toContain(
          'Qty 15'
        );

        expect(html).toContain(
          'BX-M'
        );

        expect(html).toContain(
          'Use carton'
        );

        expect(html).toContain(
          'Delete saved'
        );
      }
    );

    it(
      'preserves the saved carton id when it does not collide with current inventory',
      () => {
        const carton =
          businessCartonFromSavedCarton(
            savedCarton(),
            [
              currentCarton(
                'business-carton-1'
              ),
            ]
          );

        expect(carton.id).toBe(
          'library-carton-1'
        );
      }
    );

    it(
      'allocates a fresh workspace carton id when a saved id already exists in the order',
      () => {
        const carton =
          businessCartonFromSavedCarton(
            savedCarton({
              id:
                'business-carton-1',
            }),
            [
              currentCarton(
                'business-carton-1'
              ),
              currentCarton(
                'business-carton-2'
              ),
            ]
          );

        expect(carton.id).toBe(
          'business-carton-3'
        );
      }
    );

    it(
      'keeps the saved-library identity when a workspace id must change',
      () => {
        const carton =
          businessCartonFromSavedCarton(
            savedCarton({
              id:
                'business-carton-1',
            }),
            [
              currentCarton(
                'business-carton-1'
              ),
            ]
          );

        expect(carton.id).toBe(
          'business-carton-2'
        );

        expect(
          carton.libraryId
        ).toBe(
          'business-carton-1'
        );

        expect(
          savedBusinessCartonInputFromBusinessCarton(
            {
              ...carton,
              name:
                'Updated mailer',
            }
          )
        ).toMatchObject({
          id:
            'business-carton-1',
          name:
            'Updated mailer',
        });
      }
    );

    it(
      'copies every persisted carton value into the current Business carton shape',
      () => {
        const carton =
          businessCartonFromSavedCarton(
            savedCarton(),
            []
          );

        expect(carton).toEqual({
          id: 'library-carton-1',
          libraryId:
            'library-carton-1',
          name: 'Medium mailer',
          cartonCode: 'BX-M',
          lengthMm: 400,
          widthMm: 300,
          heightMm: 200,
          quantityAvailable: 15,
          maxGrossWeightG: 12_000,
          emptyBoxWeightG: 350,
          costPerBox: 1.75,
        });
      }
    );

    it(
      'loads the saved carton library on mount without replacing current carton form state',
      () => {
        expect(
          workspaceSource
        ).toContain(
          'listSavedBusinessCartons()'
        );

        expect(
          workspaceSource
        ).toContain(
          'setSavedCartons('
        );

        expect(
          workspaceSource
        ).not.toContain(
          'setCartons(loadedCartons'
        );
      }
    );

    it(
      'wires current carton saving through the existing persistence module',
      () => {
        expect(
          workspaceSource
        ).toContain(
          'savedBusinessCartonInputFromBusinessCarton('
        );

        expect(
          workspaceSource
        ).toContain(
          'saveBusinessCarton('
        );

        expect(
          workspaceSource
        ).toContain(
          'createSavedBusinessCarton('
        );

        expect(
          workspaceSource
        ).toContain(
          'Carton saved in this browser.'
        );
      }
    );

    it(
      'wires saved-carton deletion through the existing persistence module',
      () => {
        expect(
          workspaceSource
        ).toContain(
          'deleteSavedBusinessCarton('
        );

        expect(
          workspaceSource
        ).toContain(
          'Saved carton deleted from this browser.'
        );

        expect(
          workspaceSource
        ).toContain(
          'Could not delete this saved carton in this browser.'
        );
      }
    );

    it(
      'adds a chosen saved carton to the current order instead of replacing the order inventory',
      () => {
        expect(
          workspaceSource
        ).toContain(
          'setCartons(current => ['
        );

        expect(
          workspaceSource
        ).toContain(
          '...current,'
        );

        expect(
          workspaceSource
        ).toContain(
          'businessCartonFromSavedCarton('
        );

        expect(
          workspaceSource
        ).toContain(
          'Saved carton added to this order.'
        );
      }
    );

    it(
      'keeps carton-library integration separate from later persistence slices',
      () => {
        expect(
          workspaceSource
        ).not.toContain(
          'business-project'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'saved-product-catalog'
        );
      }
    );
  }
);
