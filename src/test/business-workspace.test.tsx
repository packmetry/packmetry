import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BusinessWorkspace, {
  buildBusinessCartons,
  buildBusinessItems,
  createBusinessItemLabels,
  runBusinessWorkspace,
  type BusinessCartonValues,
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

describe('BusinessWorkspace', () => {
  it('renders the first manual Business UX slice', () => {
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
      'Available quantity'
    );
    expect(html).toContain(
      'Max gross weight (g, optional)'
    );
    expect(html).toContain(
      'Empty box weight (g, optional)'
    );
    expect(html).toContain(
      'Carton cost (optional)'
    );
    expect(html).toContain(
      'Optimize packing'
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

    expect(result.plan.status).toBe(
      'feasible'
    );
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
      result.plan.solverMeta.solverId
    ).toBe('packmetry-baseline');

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

    expect(result.plan.status).toBe(
      'partial'
    );
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

    expect(result.plan.status).toBe(
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
    ).toBe('weight-limit');
  });

  it('rejects invalid business product values through canonical validation', async () => {
    await expect(
      runBusinessWorkspace(
        [
          product({
            quantity: 0,
          }),
        ],
        [carton()]
      )
    ).rejects.toThrow();
  });

  it('rejects invalid carton business metadata through canonical validation', async () => {
    await expect(
      runBusinessWorkspace(
        [product()],
        [
          carton({
            costPerBox: -1,
          }),
        ]
      )
    ).rejects.toThrow();
  });

  it('does not mutate caller-owned business form values', () => {
    const products = [
      product(),
    ];
    const cartons = [
      carton({
        costPerBox: 2,
      }),
    ];

    const beforeProducts =
      JSON.stringify(products);
    const beforeCartons =
      JSON.stringify(cartons);

    buildBusinessItems(products);
    buildBusinessCartons(cartons);

    expect(
      JSON.stringify(products)
    ).toBe(beforeProducts);

    expect(
      JSON.stringify(cartons)
    ).toBe(beforeCartons);
  });
});
