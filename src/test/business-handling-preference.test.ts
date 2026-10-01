import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  BUSINESS_HANDLING_PREFERENCE_KEY,
  BUSINESS_HANDLING_PREFERENCES,
  isBusinessHandlingPreference,
  readBusinessHandlingPreference,
  writeBusinessHandlingPreference,
  type BusinessHandlingPreference,
} from '../browser/business-handling-preference.js';

describe(
  'Business handling preference',
  () => {
    it(
      'defines exactly the currently supported Business handling policies',
      () => {
        expect(
          BUSINESS_HANDLING_PREFERENCES
        ).toEqual([
          'any',
          'upright',
          'fixed',
        ]);
      }
    );

    it.each<
      BusinessHandlingPreference
    >([
      'any',
      'upright',
      'fixed',
    ])(
      'recognizes the supported %s preference',
      preference => {
        expect(
          isBusinessHandlingPreference(
            preference
          )
        ).toBe(true);
      }
    );

    it(
      'rejects handling policies not exposed by the Business workspace',
      () => {
        expect(
          isBusinessHandlingPreference(
            'vertical-axis-only'
          )
        ).toBe(false);

        expect(
          isBusinessHandlingPreference(
            'fragile'
          )
        ).toBe(false);

        expect(
          isBusinessHandlingPreference(
            ''
          )
        ).toBe(false);

        expect(
          isBusinessHandlingPreference(
            null
          )
        ).toBe(false);

        expect(
          isBusinessHandlingPreference(
            1
          )
        ).toBe(false);
      }
    );

    it(
      'uses the stable Business browser-storage key',
      () => {
        expect(
          BUSINESS_HANDLING_PREFERENCE_KEY
        ).toBe(
          'packmetry.business.handling'
        );
      }
    );

    it.each<
      BusinessHandlingPreference
    >([
      'any',
      'upright',
      'fixed',
    ])(
      'reads the saved %s preference',
      preference => {
        const storage = {
          getItem:
            vi.fn(
              () =>
                preference
            ),

          setItem:
            vi.fn(),
        };

        expect(
          readBusinessHandlingPreference(
            storage
          )
        ).toBe(
          preference
        );

        expect(
          storage.getItem
        ).toHaveBeenCalledWith(
          BUSINESS_HANDLING_PREFERENCE_KEY
        );
      }
    );

    it(
      'returns undefined when no preference has been saved',
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
          readBusinessHandlingPreference(
            storage
          )
        ).toBeUndefined();
      }
    );

    it(
      'ignores an invalid or stale saved preference',
      () => {
        const storage = {
          getItem:
            vi.fn(
              () =>
                'vertical-axis-only'
            ),

          setItem:
            vi.fn(),
        };

        expect(
          readBusinessHandlingPreference(
            storage
          )
        ).toBeUndefined();
      }
    );

    it.each<
      BusinessHandlingPreference
    >([
      'any',
      'upright',
      'fixed',
    ])(
      'persists the selected %s preference under the stable key',
      preference => {
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
          writeBusinessHandlingPreference(
            preference,
            storage
          )
        ).toBe(true);

        expect(
          storage.setItem
        ).toHaveBeenCalledWith(
          BUSINESS_HANDLING_PREFERENCE_KEY,
          preference
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
          readBusinessHandlingPreference(
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
          writeBusinessHandlingPreference(
            'any',
            storage
          )
        ).toBe(false);
      }
    );

    it(
      'fails safely when browser storage is unavailable',
      () => {
        expect(
          readBusinessHandlingPreference(
            undefined
          )
        ).toBeUndefined();

        expect(
          writeBusinessHandlingPreference(
            'any',
            undefined
          )
        ).toBe(false);
      }
    );
  }
);
