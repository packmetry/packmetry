import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  renderToStaticMarkup,
} from 'react-dom/server';

import PackingWorkspace from '../components/PackingWorkspace.js';

import {
  PERSONAL_UNIT_PREFERENCE_KEY,
  isPersonalUnitPreference,
  readPersonalUnitPreference,
  writePersonalUnitPreference,
} from '../browser/personal-unit-preference.js';

describe(
  'Personal workspace unit preference',
  () => {
    it(
      'keeps metric as the server-rendered default',
      () => {
        const html =
          renderToStaticMarkup(
            <PackingWorkspace />
          );

        expect(
          html
        ).toContain(
          'Length (mm)'
        );

        expect(
          html
        ).toContain(
          'Weight per item (g) (optional)'
        );
      }
    );

    it(
      'preserves an explicit imperial initial unit system',
      () => {
        const html =
          renderToStaticMarkup(
            <PackingWorkspace
              initialUnitSystem="imperial"
            />
          );

        expect(
          html
        ).toContain(
          'Length (in)'
        );

        expect(
          html
        ).toContain(
          'Weight per item (oz) (optional)'
        );
      }
    );

    it(
      'recognizes only supported personal unit preferences',
      () => {
        expect(
          isPersonalUnitPreference(
            'metric'
          )
        ).toBe(true);

        expect(
          isPersonalUnitPreference(
            'imperial'
          )
        ).toBe(true);

        expect(
          isPersonalUnitPreference(
            'feet'
          )
        ).toBe(false);

        expect(
          isPersonalUnitPreference(
            null
          )
        ).toBe(false);
      }
    );

    it(
      'reads a saved imperial preference',
      () => {
        const storage = {
          getItem:
            vi.fn(
              () =>
                'imperial'
            ),

          setItem:
            vi.fn(),
        };

        expect(
          readPersonalUnitPreference(
            storage
          )
        ).toBe(
          'imperial'
        );

        expect(
          storage.getItem
        ).toHaveBeenCalledWith(
          PERSONAL_UNIT_PREFERENCE_KEY
        );
      }
    );

    it(
      'ignores an invalid saved preference',
      () => {
        const storage = {
          getItem:
            vi.fn(
              () =>
                'unsupported'
            ),

          setItem:
            vi.fn(),
        };

        expect(
          readPersonalUnitPreference(
            storage
          )
        ).toBeUndefined();
      }
    );

    it(
      'persists the selected unit preference under the stable browser key',
      () => {
        const storage = {
          getItem:
            vi.fn(
              () =>
                null
            ),

          setItem:
            vi.fn(),
        };

        expect(
          writePersonalUnitPreference(
            'imperial',
            storage
          )
        ).toBe(true);

        expect(
          storage.setItem
        ).toHaveBeenCalledWith(
          PERSONAL_UNIT_PREFERENCE_KEY,
          'imperial'
        );
      }
    );

    it(
      'fails safely when reading browser storage throws',
      () => {
        const storage = {
          getItem:
            vi.fn(
              () => {
                throw new Error(
                  'storage blocked'
                );
              }
            ),

          setItem:
            vi.fn(),
        };

        expect(
          readPersonalUnitPreference(
            storage
          )
        ).toBeUndefined();
      }
    );

    it(
      'fails safely when writing browser storage throws',
      () => {
        const storage = {
          getItem:
            vi.fn(
              () =>
                null
            ),

          setItem:
            vi.fn(
              () => {
                throw new Error(
                  'storage blocked'
                );
              }
            ),
        };

        expect(
          writePersonalUnitPreference(
            'metric',
            storage
          )
        ).toBe(false);
      }
    );
  }
);