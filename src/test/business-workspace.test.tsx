import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BusinessWorkspace, {
  buildBusinessCartons,
  buildBusinessDimensionalWeightSettings,
  buildBusinessItems,
  businessCartonFromSavedCarton,
  businessProjectInputFromWorkspace,
  createBusinessItemLabels,
  runBusinessWorkspace,
  savedBusinessCartonInputFromBusinessCarton,
  type BusinessCartonValues,
  type BusinessDimensionalWeightValues,
  type BusinessProductValues,
} from '../components/BusinessWorkspace.js';

function product(
  overrides: Partial<BusinessProductValues> = {}
): BusinessProductValues {
  return {
    id: 'business-product-1',
    name: 'Ceramic mug',
    sku: 'MUG-001',
    lengthMm: 20,
    widthMm: 20,
    heightMm: 20,
    quantity: 1,
    unitWeightG: 500,
    ...overrides,
  };
}

function carton(
  overrides: Partial<BusinessCartonValues> = {}
): BusinessCartonValues {
  return {
    id: 'business-carton-1',
    name: 'Small shipper',
    cartonCode: 'BX-S',
    lengthMm: 100,
    widthMm: 100,
    heightMm: 100,
    quantityAvailable: 1,
    maxGrossWeightG: undefined,
    emptyBoxWeightG: undefined,
    costPerBox: undefined,
    ...overrides,
  };
}

function dimensionalWeightValues(
  overrides: Partial<BusinessDimensionalWeightValues> = {}
): BusinessDimensionalWeightValues {
  return {
    divisorValue: 1000,
    lengthUnit: 'cm',
    massUnit: 'kg',
    ...overrides,
  };
}

describe('BusinessWorkspace', () => {
  it('renders Business carton and dimensional-weight inputs', () => {
    const html =
      renderToStaticMarkup(
        <BusinessWorkspace />
      );

    expect(html).toContain(
      'Optimize packing against your carton inventory'
    );

    expect(html).toContain(
      'Product name'
    );

    expect(html).toContain(
      'SKU (optional)'
    );

    expect(html).toContain(
      'Unit weight (g, optional)'
    );

    expect(html).toContain(
      'Carton inventory'
    );

    expect(html).toContain(
      'Carton name'
    );

    expect(html).toContain(
      'Carton code'
    );

    expect(html).toContain(
      'External package dimensions'
    );

    expect(html).toContain(
      'External length'
    );

    expect(html).toContain(
      'External width'
    );

    expect(html).toContain(
      'External height'
    );

    expect(html).toContain(
      'Used for dimensional-weight analysis'
    );

    expect(html).toContain(
      'Dimensional weight'
    );

    expect(html).toContain(
      'DIM divisor value'
    );

    expect(html).toContain(
      'Divisor length unit'
    );

    expect(html).toContain(
      'Divisor mass unit'
    );

    expect(html).toContain(
      'Packmetry does not assume a carrier divisor'
    );

    expect(html).toContain(
      'Leave the divisor blank to disable DIM calculations'
    );

    expect(html).toContain(
      'Available quantity'
    );

    expect(html).toContain(
      'Max gross weight'
    );

    expect(html).toContain(
      'Empty box weight'
    );

    expect(html).toContain(
      'Carton cost'
    );

    expect(html).toContain(
      'Optimize packing'
    );
  });

  it('renders caller-supplied initial dimensional-weight settings', () => {
    const html =
      renderToStaticMarkup(
        <BusinessWorkspace
          initialDimensionalWeight={{
            divisorValue: 5000,
            lengthUnit: 'cm',
            massUnit: 'kg',
          }}
        />
      );

    expect(html).toContain(
      'value="5000"'
    );

    expect(html).toContain(
      '<option value="cm" selected="">Centimeters (cm)</option>'
    );

    expect(html).toContain(
      '<option value="kg" selected="">Kilograms (kg)</option>'
    );
  });

  it('maps business product identity and measurements into the canonical Item model', () => {
    const items =
      buildBusinessItems([
        product(),
      ]);

    expect(items).toHaveLength(1);

    expect(items[0]).toMatchObject({
      id: 'business-product-1',
      name: 'Ceramic mug',
      sku: 'MUG-001',
      dimensions: {
        length: 20,
        width: 20,
        height: 20,
      },
      quantity: 1,
      unitWeightG: 500,
      constraints: {
        rotationPolicy: 'any',
      },
    });
  });

  it('maps carton inventory and business metadata into the canonical Carton model', () => {
    const cartons =
      buildBusinessCartons([
        carton({
          quantityAvailable: 7,
          maxGrossWeightG: 5000,
          emptyBoxWeightG: 250,
          costPerBox: 1.75,
        }),
      ]);

    expect(cartons).toHaveLength(1);

    expect(cartons[0]).toMatchObject({
      id: 'business-carton-1',
      name: 'Small shipper',
      cartonCode: 'BX-S',
      internalDimensions: {
        length: 100,
        width: 100,
        height: 100,
      },
      quantityAvailable: 7,
      maxGrossWeightG: 5000,
      emptyBoxWeightG: 250,
      costPerBox: 1.75,
    });
  });

  it('maps complete external carton dimensions separately from internal dimensions', () => {
    const cartons =
      buildBusinessCartons([
        carton({
          lengthMm: 100,
          widthMm: 90,
          heightMm: 80,
          externalLengthMm: 110,
          externalWidthMm: 100,
          externalHeightMm: 90,
        }),
      ]);

    expect(cartons[0]).toMatchObject({
      internalDimensions: {
        length: 100,
        width: 90,
        height: 80,
      },
      externalDimensions: {
        length: 110,
        width: 100,
        height: 90,
      },
    });
  });

  it('keeps external carton dimensions unknown when all three are omitted', () => {
    const cartons =
      buildBusinessCartons([
        carton(),
      ]);

    expect(
      cartons[0]?.externalDimensions
    ).toBeUndefined();

    expect(
      cartons[0]?.internalDimensions
    ).toEqual({
      length: 100,
      width: 100,
      height: 100,
    });
  });

  it('rejects partial external carton dimensions instead of inferring missing values', () => {
    expect(() =>
      buildBusinessCartons([
        carton({
          externalLengthMm: 110,
          externalWidthMm: 100,
          externalHeightMm:
            undefined,
        }),
      ])
    ).toThrow(
      'Carton 1 external dimensions must include length, width, and height.'
    );
  });

  it('rejects invalid complete external dimensions through canonical carton validation', () => {
    expect(() =>
      buildBusinessCartons([
        carton({
          externalLengthMm: 110,
          externalWidthMm: -1,
          externalHeightMm: 90,
        }),
      ])
    ).toThrow();
  });

  it('keeps dimensional-weight settings absent when the divisor is blank', () => {
    const settings =
      buildBusinessDimensionalWeightSettings(
        dimensionalWeightValues({
          divisorValue:
            undefined,
        })
      );

    expect(
      settings
    ).toBeUndefined();
  });

  it('builds explicit unit-safe dimensional-weight settings without assuming a carrier preset', () => {
    const values =
      dimensionalWeightValues({
        divisorValue: 5000,
        lengthUnit: 'cm',
        massUnit: 'kg',
      });

    const settings =
      buildBusinessDimensionalWeightSettings(
        values
      );

    expect(
      settings
    ).toEqual({
      divisor: {
        value: 5000,
        lengthUnit: 'cm',
        massUnit: 'kg',
      },
    });

    expect(
      settings?.divisor
    ).not.toBe(values);
  });

  it('preserves alternate supported divisor units', () => {
    expect(
      buildBusinessDimensionalWeightSettings({
        divisorValue: 139,
        lengthUnit: 'in',
        massUnit: 'lb',
      })
    ).toEqual({
      divisor: {
        value: 139,
        lengthUnit: 'in',
        massUnit: 'lb',
      },
    });

    expect(
      buildBusinessDimensionalWeightSettings({
        divisorValue: 6000,
        lengthUnit: 'mm',
        massUnit: 'g',
      })
    ).toEqual({
      divisor: {
        value: 6000,
        lengthUnit: 'mm',
        massUnit: 'g',
      },
    });
  });

  it('rejects an invalid dimensional-weight divisor through canonical validation', () => {
    expect(() =>
      buildBusinessDimensionalWeightSettings(
        dimensionalWeightValues({
          divisorValue: 0,
        })
      )
    ).toThrow();

    expect(() =>
      buildBusinessDimensionalWeightSettings(
        dimensionalWeightValues({
          divisorValue: -1,
        })
      )
    ).toThrow();

    expect(() =>
      buildBusinessDimensionalWeightSettings(
        dimensionalWeightValues({
          divisorValue:
            Number.NaN,
        })
      )
    ).toThrow();
  });

  it('preserves external dimensions when converting a workspace carton for the saved carton library', () => {
    const input =
      savedBusinessCartonInputFromBusinessCarton(
        carton({
          externalLengthMm: 110,
          externalWidthMm: 105,
          externalHeightMm: 95,
        })
      );

    expect(input).toMatchObject({
      id: 'business-carton-1',
      lengthMm: 100,
      widthMm: 100,
      heightMm: 100,
      externalLengthMm: 110,
      externalWidthMm: 105,
      externalHeightMm: 95,
    });
  });

  it('preserves external dimensions when restoring a saved carton into the workspace', () => {
    const savedInput =
      savedBusinessCartonInputFromBusinessCarton(
        carton({
          externalLengthMm: 110,
          externalWidthMm: 105,
          externalHeightMm: 95,
        })
      );

    const restored =
      businessCartonFromSavedCarton(
        {
          ...savedInput,
          savedAt: 123,
        },
        []
      );

    expect(restored).toMatchObject({
      id: 'business-carton-1',
      libraryId:
        'business-carton-1',
      lengthMm: 100,
      widthMm: 100,
      heightMm: 100,
      externalLengthMm: 110,
      externalWidthMm: 105,
      externalHeightMm: 95,
    });
  });

  it('does not invent external dimensions during saved-carton conversion', () => {
    const savedInput =
      savedBusinessCartonInputFromBusinessCarton(
        carton()
      );

    expect(
      savedInput.externalLengthMm
    ).toBeUndefined();

    expect(
      savedInput.externalWidthMm
    ).toBeUndefined();

    expect(
      savedInput.externalHeightMm
    ).toBeUndefined();

    const restored =
      businessCartonFromSavedCarton(
        {
          ...savedInput,
          savedAt: 123,
        },
        []
      );

    expect(
      restored.externalLengthMm
    ).toBeUndefined();

    expect(
      restored.externalWidthMm
    ).toBeUndefined();

    expect(
      restored.externalHeightMm
    ).toBeUndefined();
  });

  it('preserves external carton dimensions and DIM settings in Business project snapshots', () => {
    const dimValues =
      dimensionalWeightValues({
        divisorValue: 5000,
        lengthUnit: 'cm',
        massUnit: 'kg',
      });

    const project =
      businessProjectInputFromWorkspace(
        'business-project-1',
        'DIM project',
        [
          product(),
        ],
        [
          carton({
            externalLengthMm: 120,
            externalWidthMm: 110,
            externalHeightMm: 105,
          }),
        ],
        'balanced',
        dimValues
      );

    expect(
      project.cartons[0]
    ).toMatchObject({
      lengthMm: 100,
      widthMm: 100,
      heightMm: 100,
      externalLengthMm: 120,
      externalWidthMm: 110,
      externalHeightMm: 105,
    });

    expect(
      project.dimensionalWeight
    ).toEqual({
      divisorValue: 5000,
      lengthUnit: 'cm',
      massUnit: 'kg',
    });

    expect(
      project.dimensionalWeight
    ).not.toBe(
      dimValues
    );
  });

  it('preserves a blank DIM divisor in Business project snapshots without inventing a carrier default', () => {
    const project =
      businessProjectInputFromWorkspace(
        'business-project-blank-dim',
        'Blank DIM project',
        [
          product(),
        ],
        [
          carton(),
        ],
        'balanced',
        dimensionalWeightValues({
          divisorValue:
            undefined,
          lengthUnit: 'in',
          massUnit: 'lb',
        })
      );

    expect(
      project.dimensionalWeight
    ).toEqual({
      divisorValue:
        undefined,
      lengthUnit: 'in',
      massUnit: 'lb',
    });
  });

  it('uses product name, then SKU, then a numbered fallback for result labels', () => {
    const labels =
      createBusinessItemLabels([
        product({
          id: 'named',
          name: 'Mug',
          sku: 'MUG',
        }),
        product({
          id: 'sku-only',
          name: ' ',
          sku: 'PLATE-2',
        }),
        product({
          id: 'fallback',
          name: '',
          sku: '',
        }),
      ]);

    expect(labels).toEqual({
      named: 'Mug',
      'sku-only': 'PLATE-2',
      fallback: 'Product 3',
    });
  });

  it('runs the existing verified packing engine for business inventory', async () => {
    const result =
      await runBusinessWorkspace(
        [
          product({
            id: 'mug',
            name: 'Mug',
            sku: 'MUG-001',
            quantity: 2,
          }),
          product({
            id: 'plate',
            name: 'Plate',
            sku: 'PLATE-001',
            lengthMm: 30,
            widthMm: 30,
            heightMm: 10,
            quantity: 1,
            unitWeightG: 300,
          }),
        ],
        [
          carton({
            id: 'stock-box',
            quantityAvailable: 2,
          }),
        ]
      );

    expect(
      result.plan.status
    ).toBe('feasible');

    expect(
      result.plan.metrics
        .placedItemCount
    ).toBe(3);

    expect(
      result.plan.metrics
        .unplacedItemCount
    ).toBe(0);

    expect(
      result.plan.objective.kind
    ).toBe('balanced');

    expect(
      result.plan.solverMeta
        .solverId
    ).toBe(
      'packmetry-baseline'
    );

    expect(
      result.inventoryUsage
        .usedCartons[0]
    ).toMatchObject({
      cartonId: 'stock-box',
      usedQuantity: 1,
      effectiveAvailability: 2,
      remainingQuantity: 1,
    });
  });

  it('produces canonical DIM metrics when explicit settings and external carton dimensions are supplied', async () => {
    const settings =
      buildBusinessDimensionalWeightSettings(
        dimensionalWeightValues()
      );

    expect(
      settings
    ).toBeDefined();

    const result =
      await runBusinessWorkspace(
        [
          product(),
        ],
        [
          carton({
            externalLengthMm: 100,
            externalWidthMm: 100,
            externalHeightMm: 100,
          }),
        ],
        'balanced',
        settings
      );

    expect(
      result.plan.metrics
        .totalDimWeightG
    ).toBe(1000);

    expect(
      result.plan.cartons[0]
        ?.metrics.dimWeightG
    ).toBe(1000);
  });

  it('does not produce DIM metrics merely because external carton dimensions exist', async () => {
    const result =
      await runBusinessWorkspace(
        [
          product(),
        ],
        [
          carton({
            externalLengthMm: 100,
            externalWidthMm: 100,
            externalHeightMm: 100,
          }),
        ]
      );

    expect(
      result.plan.metrics
        .totalDimWeightG
    ).toBeUndefined();

    expect(
      result.plan.cartons[0]
        ?.metrics.dimWeightG
    ).toBeUndefined();
  });

  it('keeps DIM metrics unknown when settings exist but the used carton has no external dimensions', async () => {
    const settings =
      buildBusinessDimensionalWeightSettings(
        dimensionalWeightValues()
      );

    const result =
      await runBusinessWorkspace(
        [
          product(),
        ],
        [
          carton(),
        ],
        'balanced',
        settings
      );

    expect(
      result.plan.metrics
        .totalDimWeightG
    ).toBeUndefined();

    expect(
      result.plan.cartons[0]
        ?.metrics.dimWeightG
    ).toBeUndefined();
  });

  it('produces chargeable weight only when actual gross and DIM weight are both known', async () => {
    const settings =
      buildBusinessDimensionalWeightSettings(
        dimensionalWeightValues()
      );

    const result =
      await runBusinessWorkspace(
        [
          product({
            unitWeightG: 500,
          }),
        ],
        [
          carton({
            externalLengthMm: 100,
            externalWidthMm: 100,
            externalHeightMm: 100,
            emptyBoxWeightG: 100,
          }),
        ],
        'balanced',
        settings
      );

    expect(
      result.plan.cartons[0]
        ?.metrics.grossWeightG
    ).toBe(600);

    expect(
      result.plan.cartons[0]
        ?.metrics.dimWeightG
    ).toBe(1000);

    expect(
      result.plan.cartons[0]
        ?.metrics.chargeableWeightG
    ).toBe(1000);

    expect(
      result.plan.metrics
        .totalChargeableWeightG
    ).toBe(1000);
  });

  it('respects business carton inventory quantity', async () => {
    const result =
      await runBusinessWorkspace(
        [
          product({
            quantity: 2,
            unitWeightG:
              undefined,
          }),
        ],
        [
          carton({
            lengthMm: 20,
            widthMm: 20,
            heightMm: 20,
            quantityAvailable: 1,
          }),
        ]
      );

    expect(
      result.plan.status
    ).toBe('partial');

    expect(
      result.plan.metrics
        .placedItemCount
    ).toBe(1);

    expect(
      result.plan.metrics
        .unplacedItemCount
    ).toBe(1);

    expect(
      result.plan
        .unplacedItems[0]
        ?.reason
    ).toBe(
      'inventory-exhausted'
    );
  });

  it('respects max gross weight when product and empty-box weights are known', async () => {
    const result =
      await runBusinessWorkspace(
        [
          product({
            unitWeightG: 500,
          }),
        ],
        [
          carton({
            maxGrossWeightG: 550,
            emptyBoxWeightG: 100,
          }),
        ]
      );

    expect(
      result.plan.status
    ).toBe(
      'infeasible'
    );

    expect(
      result.plan.metrics
        .placedItemCount
    ).toBe(0);

    expect(
      result.plan
        .unplacedItems[0]
        ?.reason
    ).toBe(
      'weight-limit'
    );
  });

  it('rejects invalid business product values through canonical validation', async () => {
    await expect(
      runBusinessWorkspace(
        [
          product({
            quantity: 0,
          }),
        ],
        [
          carton(),
        ]
      )
    ).rejects.toThrow();
  });

  it('rejects invalid carton business metadata through canonical validation', async () => {
    await expect(
      runBusinessWorkspace(
        [
          product(),
        ],
        [
          carton({
            costPerBox: -1,
          }),
        ]
      )
    ).rejects.toThrow();
  });

  it('rejects partial external dimensions before planning', async () => {
    await expect(
      runBusinessWorkspace(
        [
          product(),
        ],
        [
          carton({
            externalLengthMm: 110,
            externalWidthMm:
              undefined,
            externalHeightMm: 90,
          }),
        ]
      )
    ).rejects.toThrow(
      'Carton 1 external dimensions must include length, width, and height.'
    );
  });

  it('does not mutate caller-owned business form values or DIM settings', async () => {
    const products = [
      product(),
    ];

    const cartons = [
      carton({
        externalLengthMm: 110,
        externalWidthMm: 105,
        externalHeightMm: 95,
        costPerBox: 2,
      }),
    ];

    const settings =
      buildBusinessDimensionalWeightSettings(
        dimensionalWeightValues()
      )!;

    const beforeProducts =
      JSON.stringify(products);

    const beforeCartons =
      JSON.stringify(cartons);

    const beforeSettings =
      JSON.stringify(settings);

    buildBusinessItems(
      products
    );

    buildBusinessCartons(
      cartons
    );

    await runBusinessWorkspace(
      products,
      cartons,
      'balanced',
      settings
    );

    expect(
      JSON.stringify(products)
    ).toBe(beforeProducts);

    expect(
      JSON.stringify(cartons)
    ).toBe(beforeCartons);

    expect(
      JSON.stringify(settings)
    ).toBe(beforeSettings);
  });
});