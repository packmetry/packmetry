import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  BUSINESS_OBJECTIVE_PREFERENCE_KEY,
  BUSINESS_OBJECTIVE_PREFERENCES,
  isBusinessObjectivePreference,
  readBusinessObjectivePreference,
  writeBusinessObjectivePreference,
  type BusinessObjectivePreference,
} from '../browser/business-objective-preference.js';

describe(
  'Business objective preference',
  () => {
    it(
      'defines exactly the currently supported Business objectives',
      () => {
        expect(
          BUSINESS_OBJECTIVE_PREFERENCES
        ).toEqual([
          'balanced',
          'fewest-cartons',
          'least-wasted-volume',
        ]);
      }
    );

    it.each<
      BusinessObjectivePreference
    >([
      'balanced',
      'fewest-cartons',
      'least-wasted-volume',
    ])(
      'recognizes the supported %s preference',
      preference => {
        expect(
          isBusinessObjectivePreference(
            preference
          )
        ).toBe(true);
      }
    );

    it(
      'rejects objectives not exposed by the Business workspace',
      () => {
        expect(
          isBusinessObjectivePreference(
            'min-carton-cost'
          )
        ).toBe(false);

        expect(
          isBusinessObjectivePreference(
            'easier-to-carry'
          )
        ).toBe(false);

        expect(
          isBusinessObjectivePreference(
            'existing-inventory-first'
          )
        ).toBe(false);

        expect(
          isBusinessObjectivePreference(
            'min-dim-weight'
          )
        ).toBe(false);

        expect(
          isBusinessObjectivePreference(
            null
          )
        ).toBe(false);
      }
    );

    it(
      'uses the stable Business browser-storage key',
      () => {
        expect(
          BUSINESS_OBJECTIVE_PREFERENCE_KEY
        ).toBe(
          'packmetry.business.objective'
        );
      }
    );

    it.each<
      BusinessObjectivePreference
    >([
      'balanced',
      'fewest-cartons',
      'least-wasted-volume',
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
          readBusinessObjectivePreference(
            storage
          )
        ).toBe(
          preference
        );

        expect(
          storage.getItem
        ).toHaveBeenCalledWith(
          BUSINESS_OBJECTIVE_PREFERENCE_KEY
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
          readBusinessObjectivePreference(
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
                'min-carton-cost'
            ),

          setItem:
            vi.fn(),
        };

        expect(
          readBusinessObjectivePreference(
            storage
          )
        ).toBeUndefined();
      }
    );

    it.each<
      BusinessObjectivePreference
    >([
      'balanced',
      'fewest-cartons',
      'least-wasted-volume',
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
          writeBusinessObjectivePreference(
            preference,
            storage
          )
        ).toBe(true);

        expect(
          storage.setItem
        ).toHaveBeenCalledWith(
          BUSINESS_OBJECTIVE_PREFERENCE_KEY,
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
          readBusinessObjectivePreference(
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
          writeBusinessObjectivePreference(
            'balanced',
            storage
          )
        ).toBe(false);
      }
    );

    it(
      'fails safely when browser storage is unavailable',
      () => {
        expect(
          readBusinessObjectivePreference(
            undefined
          )
        ).toBeUndefined();

        expect(
          writeBusinessObjectivePreference(
            'balanced',
            undefined
          )
        ).toBe(false);
      }
    );
  }
);
