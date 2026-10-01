import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  BUSINESS_CARTON_LIBRARY_DATABASE_NAME,
  BUSINESS_CARTON_LIBRARY_DATABASE_VERSION,
  BUSINESS_CARTON_LIBRARY_STORE_NAME,
  createSavedBusinessCarton,
  deleteSavedBusinessCarton,
  listSavedBusinessCartons,
  orderSavedBusinessCartons,
  saveBusinessCarton,
  type SavedBusinessCarton,
  type SavedBusinessCartonInput,
} from '../browser/business-carton-library.js';

function cartonInput(
  overrides: Partial<SavedBusinessCartonInput> = {}
): SavedBusinessCartonInput {
  return {
    id: 'business-carton-1',
    name: 'Small shipper',
    cartonCode: 'BX-S',
    lengthMm: 300,
    widthMm: 200,
    heightMm: 150,
    quantityAvailable: 12,
    maxGrossWeightG: 8_000,
    emptyBoxWeightG: 250,
    costPerBox: 1.25,
    ...overrides,
  };
}

function savedCarton(
  savedAt: number,
  overrides: Partial<SavedBusinessCartonInput> = {}
): SavedBusinessCarton {
  return createSavedBusinessCarton(
    cartonInput(overrides),
    savedAt
  );
}

describe(
  'Business saved carton library',
  () => {
    it(
      'uses the dedicated Business IndexedDB schema',
      () => {
        expect(
          BUSINESS_CARTON_LIBRARY_DATABASE_NAME
        ).toBe(
          'packmetry-business'
        );

        expect(
          BUSINESS_CARTON_LIBRARY_DATABASE_VERSION
        ).toBe(1);

        expect(
          BUSINESS_CARTON_LIBRARY_STORE_NAME
        ).toBe(
          'saved-cartons'
        );
      }
    );

    it(
      'creates a saved carton record with all Business carton fields',
      () => {
        const input =
          cartonInput();

        const saved =
          createSavedBusinessCarton(
            input,
            123
          );

        expect(saved).toEqual({
          ...input,
          savedAt: 123,
        });
      }
    );

    it(
      'preserves missing optional carton values as unknown',
      () => {
        const saved =
          createSavedBusinessCarton(
            cartonInput({
              maxGrossWeightG:
                undefined,
              emptyBoxWeightG:
                undefined,
              costPerBox:
                undefined,
            }),
            123
          );

        expect(
          saved.maxGrossWeightG
        ).toBeUndefined();

        expect(
          saved.emptyBoxWeightG
        ).toBeUndefined();

        expect(
          saved.costPerBox
        ).toBeUndefined();
      }
    );

    it(
      'does not mutate the caller carton definition',
      () => {
        const input =
          cartonInput();

        const snapshot = {
          ...input,
        };

        createSavedBusinessCarton(
          input,
          123
        );

        expect(input).toEqual(
          snapshot
        );
      }
    );

    it(
      'orders saved cartons newest first',
      () => {
        const ordered =
          orderSavedBusinessCartons([
            savedCarton(
              10,
              {
                id: 'old',
                name: 'Old',
              }
            ),
            savedCarton(
              30,
              {
                id: 'newest',
                name: 'Newest',
              }
            ),
            savedCarton(
              20,
              {
                id: 'middle',
                name: 'Middle',
              }
            ),
          ]);

        expect(
          ordered.map(
            carton => carton.id
          )
        ).toEqual([
          'newest',
          'middle',
          'old',
        ]);
      }
    );

    it(
      'keeps only the newest record for a duplicate carton id',
      () => {
        const ordered =
          orderSavedBusinessCartons([
            savedCarton(
              10,
              {
                id: 'same-carton',
                name: 'Older name',
              }
            ),
            savedCarton(
              20,
              {
                id: 'same-carton',
                name: 'Updated name',
              }
            ),
          ]);

        expect(
          ordered
        ).toHaveLength(1);

        expect(
          ordered[0]?.name
        ).toBe(
          'Updated name'
        );

        expect(
          ordered[0]?.savedAt
        ).toBe(20);
      }
    );

    it(
      'does not mutate the caller array while ordering',
      () => {
        const cartons = [
          savedCarton(
            10,
            {
              id: 'first',
            }
          ),
          savedCarton(
            20,
            {
              id: 'second',
            }
          ),
        ];

        const snapshot = [
          ...cartons,
        ];

        orderSavedBusinessCartons(
          cartons
        );

        expect(cartons).toEqual(
          snapshot
        );

        expect(
          cartons[0]
        ).toBe(
          snapshot[0]
        );
      }
    );

    it(
      'returns false when IndexedDB is explicitly unavailable for saving',
      async () => {
        await expect(
          saveBusinessCarton(
            cartonInput(),
            null
          )
        ).resolves.toBe(false);
      }
    );

    it(
      'returns an empty library when IndexedDB is explicitly unavailable',
      async () => {
        await expect(
          listSavedBusinessCartons(
            null
          )
        ).resolves.toEqual([]);
      }
    );

    it(
      'returns false when IndexedDB is explicitly unavailable for deletion',
      async () => {
        await expect(
          deleteSavedBusinessCarton(
            'business-carton-1',
            null
          )
        ).resolves.toBe(false);
      }
    );

    it(
      'does not impose an arbitrary recent-history limit on the saved library',
      () => {
        const cartons =
          Array.from(
            {
              length: 30,
            },
            (
              _value,
              index
            ) =>
              savedCarton(
                index,
                {
                  id:
                    `carton-${index}`,
                }
              )
          );

        expect(
          orderSavedBusinessCartons(
            cartons
          )
        ).toHaveLength(30);
      }
    );
  }
);
