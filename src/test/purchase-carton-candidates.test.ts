import { describe, expect, it } from 'vitest';

import {
  validateCarton,
} from '../core/domain/carton.js';
import {
  createItem,
  type Item,
} from '../core/domain/item.js';
import {
  generatePurchaseCartonCandidates,
} from '../core/workflows/purchase-carton-candidates.js';

function makeItem(
  id: string,
  dimensions: {
    length: number;
    width: number;
    height: number;
  },
  quantity = 1
): Item {
  return createItem({
    id,
    dimensions,
    quantity,
  });
}

describe('generatePurchaseCartonCandidates', () => {
  it('rejects an empty item set', () => {
    expect(() =>
      generatePurchaseCartonCandidates([])
    ).toThrow(
      'Purchase carton candidate generation requires at least one item'
    );
  });

  it('validates caller-supplied items before generating cartons', () => {
    const invalidItem = {
      id: 'invalid',
      dimensions: {
        length: 0,
        width: 20,
        height: 20,
      },
      quantity: 1,
      constraints: {
        rotationPolicy: 'any',
        fragile: false,
        paddingAllowanceMm: 0,
        spacingAllowanceMm: 0,
        stackable: true,
      },
    } as Item;

    expect(() =>
      generatePurchaseCartonCandidates([invalidItem])
    ).toThrow();
  });

  it('deduplicates the three axis layouts for a single item', () => {
    const candidates = generatePurchaseCartonCandidates([
      makeItem(
        'item-a',
        {
          length: 80,
          width: 50,
          height: 30,
        }
      ),
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      id: 'purchase-carton-1',
      name: 'Recommended box 1',
      internalDimensions: {
        length: 80,
        width: 50,
        height: 30,
      },
    });
  });

  it('generates deterministic length, width, and height row candidates', () => {
    const candidates = generatePurchaseCartonCandidates([
      makeItem(
        'large',
        {
          length: 80,
          width: 40,
          height: 20,
        }
      ),
      makeItem(
        'small',
        {
          length: 20,
          width: 10,
          height: 10,
        },
        2
      ),
    ]);

    expect(
      candidates.map(carton => carton.internalDimensions)
    ).toEqual([
      {
        length: 120,
        width: 40,
        height: 20,
      },
      {
        length: 80,
        width: 60,
        height: 20,
      },
      {
        length: 80,
        width: 40,
        height: 40,
      },
    ]);
  });

  it('accounts for item quantity when sizing every axis layout', () => {
    const candidates = generatePurchaseCartonCandidates([
      makeItem(
        'cube',
        {
          length: 20,
          width: 20,
          height: 20,
        },
        5
      ),
    ]);

    expect(
      candidates.map(carton => carton.internalDimensions)
    ).toEqual([
      {
        length: 100,
        width: 20,
        height: 20,
      },
      {
        length: 20,
        width: 100,
        height: 20,
      },
      {
        length: 20,
        width: 20,
        height: 100,
      },
    ]);
  });

  it('returns cartons that satisfy the canonical carton contract', () => {
    const candidates = generatePurchaseCartonCandidates([
      makeItem(
        'item-a',
        {
          length: 25,
          width: 15,
          height: 10,
        },
        3
      ),
      makeItem(
        'item-b',
        {
          length: 40,
          width: 20,
          height: 12,
        },
        2
      ),
    ]);

    expect(candidates.length).toBeGreaterThan(0);

    for (const carton of candidates) {
      expect(() => validateCarton(carton)).not.toThrow();
    }
  });

  it('uses deterministic unique generated carton ids', () => {
    const candidates = generatePurchaseCartonCandidates([
      makeItem(
        'item-a',
        {
          length: 30,
          width: 20,
          height: 10,
        },
        2
      ),
    ]);

    expect(candidates.map(carton => carton.id)).toEqual([
      'purchase-carton-1',
      'purchase-carton-2',
      'purchase-carton-3',
    ]);

    expect(
      new Set(candidates.map(carton => carton.id)).size
    ).toBe(candidates.length);
  });

  it('does not invent commercial, stock, weight, or external metadata', () => {
    const [carton] = generatePurchaseCartonCandidates([
      makeItem(
        'item-a',
        {
          length: 80,
          width: 50,
          height: 30,
        }
      ),
    ]);

    expect(carton).toBeDefined();

    expect(carton?.quantityAvailable).toBeUndefined();
    expect(carton?.stockQuantity).toBeUndefined();
    expect(carton?.costPerBox).toBeUndefined();
    expect(carton?.emptyBoxWeightG).toBeUndefined();
    expect(carton?.maxGrossWeightG).toBeUndefined();
    expect(carton?.supplier).toBeUndefined();
    expect(carton?.externalDimensions).toBeUndefined();
    expect(carton?.cartonCode).toBeUndefined();
  });

  it('is deterministic for identical normalized input', () => {
    const items = [
      makeItem(
        'item-a',
        {
          length: 45,
          width: 30,
          height: 20,
        },
        3
      ),
      makeItem(
        'item-b',
        {
          length: 25,
          width: 15,
          height: 10,
        },
        2
      ),
    ];

    expect(
      generatePurchaseCartonCandidates(items)
    ).toEqual(
      generatePurchaseCartonCandidates(items)
    );
  });

  it('does not mutate or alias caller-owned item data', () => {
    const items = [
      makeItem(
        'item-a',
        {
          length: 60,
          width: 40,
          height: 20,
        },
        2
      ),
    ];

    const before = JSON.stringify(items);

    const candidates =
      generatePurchaseCartonCandidates(items);

    expect(JSON.stringify(items)).toBe(before);

    candidates[0]!.internalDimensions.length = 999;

    expect(items[0]!.dimensions.length).toBe(60);
  });
});
