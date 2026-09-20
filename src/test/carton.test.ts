import { describe, it, expect } from 'vitest';
import { createCarton, validateCarton, cartonInternalVolumeMm3 } from '../core/domain/carton.js';
import { ValidationError } from '../core/units/types.js';

describe('Carton domain model', () => {
  describe('createCarton', () => {
    it('creates a valid minimal carton', () => {
      const carton = createCarton({
        id: 'carton-123',
        internalDimensions: { length: 300, width: 200, height: 150 },
      });

      expect(carton.id).toBe('carton-123');
      expect(carton.internalDimensions).toEqual({ length: 300, width: 200, height: 150 });
      expect(carton.name).toBeUndefined();
      expect(carton.quantityAvailable).toBeUndefined();
      expect(carton.cartonCode).toBeUndefined();
      expect(carton.maxGrossWeightG).toBeUndefined();
      expect(carton.emptyBoxWeightG).toBeUndefined();
      expect(carton.costPerBox).toBeUndefined();
      expect(carton.stockQuantity).toBeUndefined();
      expect(carton.supplier).toBeUndefined();
      expect(carton.externalDimensions).toBeUndefined();
      expect(carton.notes).toBeUndefined();
    });

    it('creates a valid business carton with all optional fields', () => {
      const carton = createCarton({
        id: 'business-box-456',
        name: 'Large Shipping Box',
        internalDimensions: { length: 600, width: 400, height: 350 },
        quantityAvailable: 10,
        cartonCode: 'LSB-600x400x350',
        maxGrossWeightG: 20000,
        emptyBoxWeightG: 500,
        costPerBox: 2.5,
        stockQuantity: 25,
        supplier: 'BoxCo Inc.',
        externalDimensions: { length: 610, width: 410, height: 360 },
        notes: 'Double-wall corrugated',
      });

      expect(carton.id).toBe('business-box-456');
      expect(carton.name).toBe('Large Shipping Box');
      expect(carton.internalDimensions).toEqual({ length: 600, width: 400, height: 350 });
      expect(carton.quantityAvailable).toBe(10);
      expect(carton.cartonCode).toBe('LSB-600x400x350');
      expect(carton.maxGrossWeightG).toBe(20000);
      expect(carton.emptyBoxWeightG).toBe(500);
      expect(carton.costPerBox).toBe(2.5);
      expect(carton.stockQuantity).toBe(25);
      expect(carton.supplier).toBe('BoxCo Inc.');
      expect(carton.externalDimensions).toEqual({ length: 610, width: 410, height: 360 });
      expect(carton.notes).toBe('Double-wall corrugated');
    });

    it('preserves axis order', () => {
      const dimensions = { length: 300, width: 200, height: 100 };
      const carton = createCarton({
        id: 'axis-test',
        internalDimensions: dimensions,
      });

      expect(carton.internalDimensions.length).toBe(300);
      expect(carton.internalDimensions.width).toBe(200);
      expect(carton.internalDimensions.height).toBe(100);
    });

    it('clones dimension objects and does not mutate input', () => {
      const internalDimensions = { length: 300, width: 200, height: 100 };
      const externalDimensions = { length: 310, width: 210, height: 110 };
      const input = {
        id: 'clone-test',
        internalDimensions,
        externalDimensions,
      };

      const carton = createCarton(input);

      // Modify original objects
      internalDimensions.length = 999;
      externalDimensions.length = 999;

      // Carton should have original values
      expect(carton.internalDimensions.length).toBe(300);
      expect(carton.externalDimensions!.length).toBe(310);
    });

    describe('validation failures', () => {
      it('rejects blank id', () => {
        expect(() =>
          createCarton({
            id: '',
            internalDimensions: { length: 100, width: 100, height: 100 },
          })
        ).toThrow('Carton id must be a non‑empty string');
        expect(() =>
          createCarton({
            id: '   ',
            internalDimensions: { length: 100, width: 100, height: 100 },
          })
        ).toThrow('Carton id must be a non‑empty string');
        expect(() =>
          createCarton({
            id: 123 as any,
            internalDimensions: { length: 100, width: 100, height: 100 },
          })
        ).toThrow('Carton id must be a non‑empty string');
      });

      it.each([
        [{ length: 0, width: 100, height: 100 }, 'Length must be greater than zero'],
        [{ length: -10, width: 100, height: 100 }, 'Length must be greater than zero'],
        [{ length: 100, width: -5, height: 100 }, 'Width must be greater than zero'],
        [{ length: 100, width: 100, height: NaN }, 'Height must be a finite number'],
        [{ length: Infinity, width: 100, height: 100 }, 'Length must be a finite number'],
      ])('rejects invalid internal dimensions %j', (dimensions, expectedError) => {
        expect(() =>
          createCarton({
            id: 'test',
            internalDimensions: dimensions as any,
          })
        ).toThrow(expectedError);
      });

      describe('quantityAvailable validation', () => {
        it('accepts 0 as valid quantityAvailable', () => {
          const carton = createCarton({
            id: 'test',
            internalDimensions: { length: 100, width: 100, height: 100 },
            quantityAvailable: 0,
          });
          expect(carton.quantityAvailable).toBe(0);
        });

        it.each([
          [-1, 'quantityAvailable must be ≥ 0'],
          [0.5, 'quantityAvailable must be an integer'],
          [NaN, 'quantityAvailable must be a finite number'],
          [Infinity, 'quantityAvailable must be a finite number'],
        ])('rejects invalid quantityAvailable %s', (value, expectedError) => {
          expect(() =>
            createCarton({
              id: 'test',
              internalDimensions: { length: 100, width: 100, height: 100 },
              quantityAvailable: value,
            })
          ).toThrow(expectedError);
        });

        it('undefined quantityAvailable remains unlimited', () => {
          const carton = createCarton({
            id: 'test',
            internalDimensions: { length: 100, width: 100, height: 100 },
          });
          expect(carton.quantityAvailable).toBeUndefined();
        });
      });

      describe('stockQuantity validation', () => {
        it('accepts 0 as valid stockQuantity', () => {
          const carton = createCarton({
            id: 'test',
            internalDimensions: { length: 100, width: 100, height: 100 },
            stockQuantity: 0,
          });
          expect(carton.stockQuantity).toBe(0);
        });

        it.each([
          [-5, 'stockQuantity must be ≥ 0'],
          [2.3, 'stockQuantity must be an integer'],
          [NaN, 'stockQuantity must be a finite number'],
          [Infinity, 'stockQuantity must be a finite number'],
        ])('rejects invalid stockQuantity %s', (value, expectedError) => {
          expect(() =>
            createCarton({
              id: 'test',
              internalDimensions: { length: 100, width: 100, height: 100 },
              stockQuantity: value,
            })
          ).toThrow(expectedError);
        });
      });

      describe('weight validations', () => {
        it.each([
          [0, 'maxGrossWeightG must be > 0'],
          [-100, 'maxGrossWeightG must be > 0'],
          [NaN, 'maxGrossWeightG must be a finite number'],
          [Infinity, 'maxGrossWeightG must be a finite number'],
        ])('rejects invalid maxGrossWeightG %s', (value, expectedError) => {
          expect(() =>
            createCarton({
              id: 'test',
              internalDimensions: { length: 100, width: 100, height: 100 },
              maxGrossWeightG: value,
            })
          ).toThrow(expectedError);
        });

        it.each([
          [0, 'emptyBoxWeightG must be > 0'],
          [-50, 'emptyBoxWeightG must be > 0'],
          [NaN, 'emptyBoxWeightG must be a finite number'],
          [Infinity, 'emptyBoxWeightG must be a finite number'],
        ])('rejects invalid emptyBoxWeightG %s', (value, expectedError) => {
          expect(() =>
            createCarton({
              id: 'test',
              internalDimensions: { length: 100, width: 100, height: 100 },
              emptyBoxWeightG: value,
            })
          ).toThrow(expectedError);
        });
      });

      describe('costPerBox validation', () => {
        it('accepts 0 as valid costPerBox', () => {
          const carton = createCarton({
            id: 'test',
            internalDimensions: { length: 100, width: 100, height: 100 },
            costPerBox: 0,
          });
          expect(carton.costPerBox).toBe(0);
        });

        it.each([
          [-0.01, 'costPerBox must be ≥ 0'],
          [NaN, 'costPerBox must be a finite number'],
          [Infinity, 'costPerBox must be a finite number'],
        ])('rejects invalid costPerBox %s', (value, expectedError) => {
          expect(() =>
            createCarton({
              id: 'test',
              internalDimensions: { length: 100, width: 100, height: 100 },
              costPerBox: value,
            })
          ).toThrow(expectedError);
        });
      });

      it('rejects invalid externalDimensions', () => {
        expect(() =>
          createCarton({
            id: 'test',
            internalDimensions: { length: 100, width: 100, height: 100 },
            externalDimensions: { length: -10, width: 100, height: 100 },
          })
        ).toThrow('Length must be greater than zero');
      });
    });
  });

  describe('validateCarton', () => {
    it('validates a valid carton directly', () => {
      const carton = {
        id: 'valid-carton',
        internalDimensions: { length: 100, width: 100, height: 100 },
        quantityAvailable: 5,
        maxGrossWeightG: 1000,
        emptyBoxWeightG: 50,
        costPerBox: 2.5,
        stockQuantity: 10,
        externalDimensions: { length: 110, width: 110, height: 110 },
      };

      expect(() => validateCarton(carton)).not.toThrow();
    });

    it('throws on invalid carton', () => {
      const invalidCarton = {
        id: '',
        internalDimensions: { length: 100, width: 100, height: 100 },
      };

      expect(() => validateCarton(invalidCarton)).toThrow('Carton id must be a non‑empty string');
    });
  });

  describe('cartonInternalVolumeMm3', () => {
    it('calculates correct internal volume', () => {
      const carton = createCarton({
        id: 'volume-test',
        internalDimensions: { length: 600, width: 400, height: 350 },
      });

      const volume = cartonInternalVolumeMm3(carton);
      // 600 × 400 × 350 = 84,000,000 mm³
      expect(volume).toBe(600 * 400 * 350);
      expect(volume).toBe(84_000_000);
    });

    it('throws on invalid dimensions', () => {
      const carton = {
        id: 'invalid-volume',
        internalDimensions: { length: NaN, width: 100, height: 100 },
      } as any;

      expect(() => cartonInternalVolumeMm3(carton)).toThrow();
    });
  });
});