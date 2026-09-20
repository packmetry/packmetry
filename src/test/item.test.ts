import { describe, it, expect } from 'vitest';
import { createItem, validateItem, itemUnitVolumeMm3, itemTotalVolumeMm3, itemTotalWeightG } from '../core/domain/item.js';
import { ValidationError } from '../core/units/types.js';

describe('Item domain model', () => {
  describe('createItem', () => {
    it('creates a valid minimal item', () => {
      const item = createItem({
        id: 'item-123',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 1,
      });

      expect(item.id).toBe('item-123');
      expect(item.dimensions).toEqual({ length: 100, width: 50, height: 30 });
      expect(item.quantity).toBe(1);
      expect(item.name).toBeUndefined();
      expect(item.sku).toBeUndefined();
      expect(item.unitWeightG).toBeUndefined();
    });

    it('creates a valid business item with name/SKU/weight', () => {
      const item = createItem({
        id: 'product-456',
        name: 'Coffee Maker',
        sku: 'CM-2024',
        dimensions: { length: 200, width: 150, height: 100 },
        quantity: 3,
        unitWeightG: 2500,
      });

      expect(item.id).toBe('product-456');
      expect(item.name).toBe('Coffee Maker');
      expect(item.sku).toBe('CM-2024');
      expect(item.dimensions).toEqual({ length: 200, width: 150, height: 100 });
      expect(item.quantity).toBe(3);
      expect(item.unitWeightG).toBe(2500);
    });

    it('preserves axis order', () => {
      const dimensions = { length: 300, width: 200, height: 100 };
      const item = createItem({
        id: 'axis-test',
        dimensions,
        quantity: 2,
      });

      expect(item.dimensions.length).toBe(300);
      expect(item.dimensions.width).toBe(200);
      expect(item.dimensions.height).toBe(100);
      expect(item.dimensions).toEqual(dimensions);
    });

    it('does not mutate input object', () => {
      const input = {
        id: 'no-mutate',
        dimensions: { length: 10, width: 20, height: 30 },
        quantity: 1,
      };
      const originalDimensions = { ...input.dimensions };

      const item = createItem(input);

      // Original input should be unchanged
      expect(input.dimensions).toEqual(originalDimensions);
      expect(item).not.toBe(input);
      expect(item.dimensions).not.toBe(input.dimensions);
    });

    it('throws for blank id', () => {
      expect(() =>
        createItem({
          id: '',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 1,
        })
      ).toThrow(ValidationError);

      expect(() =>
        createItem({
          id: '   ',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 1,
        })
      ).toThrow(ValidationError);
    });

    it('throws for invalid quantity: 0', () => {
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 0,
        })
      ).toThrow(ValidationError);
    });

    it('throws for invalid quantity: negative', () => {
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: -5,
        })
      ).toThrow(ValidationError);
    });

    it('throws for invalid quantity: fractional', () => {
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 2.5,
        })
      ).toThrow(ValidationError);
    });

    it('throws for invalid quantity: NaN', () => {
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: NaN,
        })
      ).toThrow(ValidationError);
    });

    it('throws for invalid quantity: Infinity', () => {
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: Infinity,
        })
      ).toThrow(ValidationError);
    });

    it('throws for invalid dimensions', () => {
      // Zero dimension
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 0, width: 50, height: 30 },
          quantity: 1,
        })
      ).toThrow(ValidationError);

      // Negative dimension
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: -50, height: 30 },
          quantity: 1,
        })
      ).toThrow(ValidationError);

      // NaN dimension
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: NaN, height: 30 },
          quantity: 1,
        })
      ).toThrow(ValidationError);
    });

    it('throws for invalid supplied weight: <= 0', () => {
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 1,
          unitWeightG: 0,
        })
      ).toThrow(ValidationError);

      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 1,
          unitWeightG: -100,
        })
      ).toThrow(ValidationError);
    });

    it('throws for invalid supplied weight: NaN', () => {
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 1,
          unitWeightG: NaN,
        })
      ).toThrow(ValidationError);
    });

    it('throws for invalid supplied weight: Infinity', () => {
      expect(() =>
        createItem({
          id: 'test',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 1,
          unitWeightG: Infinity,
        })
      ).toThrow(ValidationError);
    });
  });

  describe('validateItem', () => {
    it('validates a proper item', () => {
      const item = {
        id: 'valid-item',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 2,
        unitWeightG: 500,
      };

      expect(() => validateItem(item)).not.toThrow();
    });

    it('throws for invalid item', () => {
      expect(() =>
        validateItem({
          id: '',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 1,
        })
      ).toThrow(ValidationError);
    });
  });

  describe('itemUnitVolumeMm3', () => {
    it('calculates unit volume correctly', () => {
      const item = createItem({
        id: 'volume-test',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 1,
      });

      expect(itemUnitVolumeMm3(item)).toBe(100 * 50 * 30);
    });

    it('throws for invalid dimensions', () => {
      const invalidItem = {
        id: 'invalid',
        dimensions: { length: 0, width: 50, height: 30 },
        quantity: 1,
      };

      expect(() => itemUnitVolumeMm3(invalidItem as any)).toThrow(ValidationError);
    });
  });

  describe('itemTotalVolumeMm3', () => {
    it('calculates total volume = unit volume × quantity', () => {
      const item = createItem({
        id: 'total-volume',
        dimensions: { length: 200, width: 100, height: 50 },
        quantity: 3,
      });

      const unitVolume = 200 * 100 * 50;
      const totalVolume = unitVolume * 3;

      expect(itemTotalVolumeMm3(item)).toBe(totalVolume);
    });

    it('validates item before calculation', () => {
      const invalidItem = {
        id: 'invalid',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: -1, // Invalid quantity
      };

      expect(() => itemTotalVolumeMm3(invalidItem as any)).toThrow(ValidationError);
    });
  });

  describe('itemTotalWeightG', () => {
    it('returns undefined when unit weight is missing', () => {
      const item = createItem({
        id: 'no-weight',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 2,
      });

      expect(itemTotalWeightG(item)).toBeUndefined();
    });

    it('calculates total weight = unit weight × quantity', () => {
      const item = createItem({
        id: 'with-weight',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 4,
        unitWeightG: 250,
      });

      expect(itemTotalWeightG(item)).toBe(250 * 4);
    });

    it('throws for invalid unit weight when present', () => {
      const item = {
        id: 'invalid-weight',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 2,
        unitWeightG: -100,
      };

      expect(() => itemTotalWeightG(item as any)).toThrow(ValidationError);
    });

    it('validates item before calculation', () => {
      const invalidItem = {
        id: '',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 2,
        unitWeightG: 100,
      };

      expect(() => itemTotalWeightG(invalidItem as any)).toThrow(ValidationError);
    });
  });
});