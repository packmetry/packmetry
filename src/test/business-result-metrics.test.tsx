import { describe, expect, it } from 'vitest';

import {
  buildBusinessResultMetrics,
  formatBusinessCartonCost,
  formatBusinessStockImpact,
  runBusinessWorkspace,
  type BusinessCartonValues,
  type BusinessProductValues,
} from '../components/BusinessWorkspace.js';
import type { HaveBoxesInventoryUsage } from '../core/workflows/index.js';

function product(
  overrides: Partial<BusinessProductValues> = {}
): BusinessProductValues {
  return {
    id: 'business-product-1',
    name: 'Mug',
    sku: 'MUG-001',
    lengthMm: 20,
    widthMm: 20,
    heightMm: 20,
    quantity: 2,
    unitWeightG: 500,
    rotationPolicy: 'any',
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
    lengthMm: 20,
    widthMm: 20,
    heightMm: 20,
    quantityAvailable: 3,
    maxGrossWeightG: undefined,
    emptyBoxWeightG: 100,
    costPerBox: 1.25,
    ...overrides,
  };
}

describe('BusinessWorkspace result metrics', () => {
  it('uses canonical gross weight and carton cost metrics without recalculating them', async () => {
    const result =
      await runBusinessWorkspace(
        [product()],
        [carton()]
      );

    const metrics =
      buildBusinessResultMetrics(
        result.plan,
        result.inventoryUsage
      );

    expect(
      result.plan.metrics
        .totalGrossWeightG
    ).toBe(1200);

    expect(
      result.plan.metrics
        .totalCartonCost
    ).toBe(2.5);

    expect(metrics).toEqual({
      grossPackedWeightG: 1200,
      totalCartonCost: 2.5,
      usedCartonCount: 2,
      remainingCartonCount: 1,
    });
  });

  it('summarizes stock impact from canonical inventory usage', async () => {
    const result =
      await runBusinessWorkspace(
        [product()],
        [
          carton({
            quantityAvailable: 4,
          }),
        ]
      );

    const metrics =
      buildBusinessResultMetrics(
        result.plan,
        result.inventoryUsage
      );

    expect(
      metrics.usedCartonCount
    ).toBe(2);

    expect(
      metrics.remainingCartonCount
    ).toBe(2);

    expect(
      formatBusinessStockImpact(
        metrics
      )
    ).toBe(
      '2 used · 2 remaining'
    );
  });

  it('keeps gross packed weight unavailable when product weight is missing', async () => {
    const result =
      await runBusinessWorkspace(
        [
          product({
            unitWeightG:
              undefined,
          }),
        ],
        [carton()]
      );

    const metrics =
      buildBusinessResultMetrics(
        result.plan,
        result.inventoryUsage
      );

    expect(
      result.plan.metrics
        .totalGrossWeightG
    ).toBeUndefined();

    expect(
      metrics.grossPackedWeightG
    ).toBeUndefined();
  });

  it('keeps gross packed weight unavailable when empty carton weight is missing', async () => {
    const result =
      await runBusinessWorkspace(
        [product()],
        [
          carton({
            emptyBoxWeightG:
              undefined,
          }),
        ]
      );

    const metrics =
      buildBusinessResultMetrics(
        result.plan,
        result.inventoryUsage
      );

    expect(
      result.plan.metrics
        .totalGrossWeightG
    ).toBeUndefined();

    expect(
      metrics.grossPackedWeightG
    ).toBeUndefined();
  });

  it('keeps carton cost unavailable when canonical carton cost is incomplete', async () => {
    const result =
      await runBusinessWorkspace(
        [product()],
        [
          carton({
            costPerBox:
              undefined,
          }),
        ]
      );

    const metrics =
      buildBusinessResultMetrics(
        result.plan,
        result.inventoryUsage
      );

    expect(
      result.plan.metrics
        .totalCartonCost
    ).toBeUndefined();

    expect(
      metrics.totalCartonCost
    ).toBeUndefined();

    expect(
      formatBusinessCartonCost(
        metrics.totalCartonCost
      )
    ).toBe('Not provided');
  });

  it('formats known carton cost without inventing a currency', () => {
    expect(
      formatBusinessCartonCost(
        12
      )
    ).toBe(
      '12 entered cost units'
    );

    expect(
      formatBusinessCartonCost(
        12.5
      )
    ).toBe(
      '12.5 entered cost units'
    );
  });

  it('does not invent remaining stock when availability is unknown', async () => {
    const result =
      await runBusinessWorkspace(
        [product()],
        [carton()]
      );

    const firstUsage =
      result.inventoryUsage
        .usedCartons[0]!;

    const unknownInventoryUsage:
      HaveBoxesInventoryUsage = {
        usedCartons: [
          {
            cartonId:
              firstUsage.cartonId,
            carton:
              firstUsage.carton,
            usedQuantity:
              firstUsage.usedQuantity,
          },
        ],
        unusedCartons: [],
      };

    const metrics =
      buildBusinessResultMetrics(
        result.plan,
        unknownInventoryUsage
      );

    expect(
      metrics.remainingCartonCount
    ).toBeUndefined();

    expect(
      formatBusinessStockImpact(
        metrics
      )
    ).toBe(
      '2 used · remaining stock not fully known'
    );
  });

  it('preserves zero carton cost as a known canonical value', async () => {
    const result =
      await runBusinessWorkspace(
        [product()],
        [
          carton({
            costPerBox: 0,
          }),
        ]
      );

    const metrics =
      buildBusinessResultMetrics(
        result.plan,
        result.inventoryUsage
      );

    expect(
      metrics.totalCartonCost
    ).toBe(0);

    expect(
      formatBusinessCartonCost(
        metrics.totalCartonCost
      )
    ).toBe(
      '0 entered cost units'
    );
  });
});
