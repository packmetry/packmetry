/**
 * Unit tests for canonical units and dimensions.
 *
 * @module test/units
 */

import { describe, it, expect } from 'vitest';
import type { CanonicalDimensions } from '../core/units/index.js';
import {
  // Length functions
  toMillimeters,
  fromMillimeters,
  getLengthConversionFactor,
  convertLength,

  // Mass functions
  toGrams,
  fromGrams,
  getMassConversionFactor,
  convertMass,

  // Dimension functions
  normalizeDimensions,
  convertDimensions,
  volumeMm3,
  validateDimensions,
  dimensionsEqual,

  // Validation
  ValidationError,
} from '../core/units/index.js';

describe('Length conversions', () => {
  describe('toMillimeters', () => {
    it('converts mm to mm', () => {
      expect(toMillimeters(100, 'mm')).toBe(100);
    });

    it('converts cm to mm', () => {
      expect(toMillimeters(10, 'cm')).toBe(100);
    });

    it('converts m to mm', () => {
      expect(toMillimeters(1, 'm')).toBe(1000);
    });

    it('converts inches to mm with exact factor', () => {
      // 1 inch = 25.4 mm (exact)
      expect(toMillimeters(1, 'in')).toBe(25.4);
      expect(toMillimeters(2, 'in')).toBe(50.8);
    });

    it('converts feet to mm with exact factor', () => {
      // 1 foot = 304.8 mm (exact: 12 * 25.4)
      expect(toMillimeters(1, 'ft')).toBe(304.8);
      expect(toMillimeters(2, 'ft')).toBe(609.6);
    });

    it('rejects non-finite values', () => {
      expect(() => toMillimeters(NaN, 'mm')).toThrow(ValidationError);
      expect(() => toMillimeters(Infinity, 'mm')).toThrow(ValidationError);
      expect(() => toMillimeters(-Infinity, 'mm')).toThrow(ValidationError);
    });
  });

  describe('fromMillimeters', () => {
    it('converts mm to mm', () => {
      expect(fromMillimeters(100, 'mm')).toBe(100);
    });

    it('converts mm to cm', () => {
      expect(fromMillimeters(1000, 'cm')).toBe(100);
    });

    it('converts mm to m', () => {
      expect(fromMillimeters(1000, 'm')).toBe(1);
    });

    it('converts mm to inches with exact factor', () => {
      expect(fromMillimeters(25.4, 'in')).toBe(1);
      expect(fromMillimeters(127, 'in')).toBe(5);
    });

    it('converts mm to feet with exact factor', () => {
      expect(fromMillimeters(304.8, 'ft')).toBe(1);
      expect(fromMillimeters(1524, 'ft')).toBe(5);
    });

    it('rejects non-finite values', () => {
      expect(() => fromMillimeters(NaN, 'mm')).toThrow(ValidationError);
      expect(() => fromMillimeters(Infinity, 'mm')).toThrow(ValidationError);
    });
  });

  describe('getLengthConversionFactor', () => {
    it('returns correct factors', () => {
      expect(getLengthConversionFactor('mm')).toBe(1);
      expect(getLengthConversionFactor('cm')).toBe(10);
      expect(getLengthConversionFactor('m')).toBe(1000);
      expect(getLengthConversionFactor('in')).toBe(25.4);
      expect(getLengthConversionFactor('ft')).toBe(304.8);
    });
  });

  describe('convertLength', () => {
    it('converts between units', () => {
      expect(convertLength(12, 'in', 'ft')).toBeCloseTo(1, 12);
      expect(convertLength(1, 'ft', 'in')).toBeCloseTo(12, 12);
      expect(convertLength(100, 'cm', 'm')).toBe(1);
      expect(convertLength(1, 'm', 'cm')).toBe(100);
    });

    it('preserves exact conversions', () => {
      expect(convertLength(1, 'in', 'mm')).toBe(25.4);
      expect(convertLength(25.4, 'mm', 'in')).toBeCloseTo(1, 12);
    });
  });
});

describe('Mass conversions', () => {
  describe('toGrams', () => {
    it('converts g to g', () => {
      expect(toGrams(100, 'g')).toBe(100);
    });

    it('converts kg to g', () => {
      expect(toGrams(1, 'kg')).toBe(1000);
    });

    it('converts ounces to grams with exact factor', () => {
      // 1 oz = 28.349523125 g (exact)
      expect(toGrams(1, 'oz')).toBe(28.349523125);
      expect(toGrams(2, 'oz')).toBe(56.69904625);
    });

    it('converts pounds to grams with exact factor', () => {
      // 1 lb = 453.59237 g (exact)
      expect(toGrams(1, 'lb')).toBe(453.59237);
      expect(toGrams(2, 'lb')).toBe(907.18474);
    });

    it('rejects non-finite values', () => {
      expect(() => toGrams(NaN, 'g')).toThrow(ValidationError);
      expect(() => toGrams(Infinity, 'g')).toThrow(ValidationError);
    });
  });

  describe('fromGrams', () => {
    it('converts g to g', () => {
      expect(fromGrams(100, 'g')).toBe(100);
    });

    it('converts g to kg', () => {
      expect(fromGrams(1000, 'kg')).toBe(1);
    });

    it('converts g to ounces with exact factor', () => {
      expect(fromGrams(28.349523125, 'oz')).toBe(1);
      expect(fromGrams(141.747615625, 'oz')).toBe(5);
    });

    it('converts g to pounds with exact factor', () => {
      expect(fromGrams(453.59237, 'lb')).toBe(1);
      expect(fromGrams(2267.96185, 'lb')).toBe(5);
    });

    it('rejects non-finite values', () => {
      expect(() => fromGrams(NaN, 'g')).toThrow(ValidationError);
      expect(() => fromGrams(Infinity, 'g')).toThrow(ValidationError);
    });
  });

  describe('getMassConversionFactor', () => {
    it('returns correct factors', () => {
      expect(getMassConversionFactor('g')).toBe(1);
      expect(getMassConversionFactor('kg')).toBe(1000);
      expect(getMassConversionFactor('oz')).toBe(28.349523125);
      expect(getMassConversionFactor('lb')).toBe(453.59237);
    });
  });

  describe('convertMass', () => {
    it('converts between units', () => {
      expect(convertMass(16, 'oz', 'lb')).toBe(1);
      expect(convertMass(1, 'lb', 'oz')).toBe(16);
      expect(convertMass(1000, 'g', 'kg')).toBe(1);
      expect(convertMass(1, 'kg', 'g')).toBe(1000);
    });

    it('preserves exact conversions', () => {
      expect(convertMass(1, 'lb', 'g')).toBe(453.59237);
      expect(convertMass(453.59237, 'g', 'lb')).toBe(1);
    });
  });
});

describe('Dimension operations', () => {
  describe('normalizeDimensions', () => {
    it('normalizes dimensions from cm to mm', () => {
      const result = normalizeDimensions(
        { length: 10, width: 20, height: 30 },
        'cm'
      );
      expect(result).toEqual({
        length: 100,
        width: 200,
        height: 300,
      });
    });

    it('normalizes dimensions from inches to mm', () => {
      const result = normalizeDimensions(
        { length: 1, width: 2, height: 3 },
        'in'
      );
      expect(result.length).toBeCloseTo(25.4, 10);
      expect(result.width).toBeCloseTo(50.8, 10);
      expect(result.height).toBeCloseTo(76.2, 10);
    });

    it('preserves axis order', () => {
      const input = { length: 100, width: 50, height: 25 };
      const result = normalizeDimensions(input, 'mm');
      expect(result.length).toBe(100);
      expect(result.width).toBe(50);
      expect(result.height).toBe(25);
    });

    it('rejects non-finite dimensions', () => {
      expect(() =>
        normalizeDimensions({ length: NaN, width: 10, height: 10 }, 'mm')
      ).toThrow(ValidationError);
      expect(() =>
        normalizeDimensions({ length: 10, width: Infinity, height: 10 }, 'mm')
      ).toThrow(ValidationError);
    });

    it('rejects zero or negative dimensions', () => {
      expect(() =>
        normalizeDimensions({ length: 0, width: 10, height: 10 }, 'mm')
      ).toThrow(ValidationError);
      expect(() =>
        normalizeDimensions({ length: -5, width: 10, height: 10 }, 'mm')
      ).toThrow(ValidationError);
    });
  });

  describe('convertDimensions', () => {
    const canonical: CanonicalDimensions = {
      length: 254,
      width: 508,
      height: 762,
    };

    it('converts canonical dimensions to cm', () => {
      const result = convertDimensions(canonical, 'cm');
      expect(result).toEqual({
        length: 25.4,
        width: 50.8,
        height: 76.2,
      });
    });

    it('converts canonical dimensions to inches', () => {
      const result = convertDimensions(canonical, 'in');
      expect(result).toEqual({
        length: 10,
        width: 20,
        height: 30,
      });
    });

    it('preserves axis order', () => {
      const input = { length: 100, width: 50, height: 25 };
      const result = convertDimensions(input, 'mm');
      expect(result.length).toBe(100);
      expect(result.width).toBe(50);
      expect(result.height).toBe(25);
    });
  });

  describe('volumeMm3', () => {
    it('calculates volume for 600×400×350 mm dimensions', () => {
      const dimensions: CanonicalDimensions = {
        length: 600,
        width: 400,
        height: 350,
      };
      expect(volumeMm3(dimensions)).toBe(600 * 400 * 350); // 84,000,000 mm³
      expect(volumeMm3(dimensions)).toBe(84_000_000);
    });

    it('rejects invalid dimensions', () => {
      expect(() =>
        volumeMm3({ length: 0, width: 10, height: 10 })
      ).toThrow(ValidationError);
      expect(() =>
        volumeMm3({ length: -5, width: 10, height: 10 })
      ).toThrow(ValidationError);
    });
  });

  describe('validateDimensions', () => {
    it('accepts valid dimensions', () => {
      expect(() =>
        validateDimensions({ length: 10, width: 20, height: 30 })
      ).not.toThrow();
    });

    it('rejects NaN dimensions', () => {
      expect(() =>
        validateDimensions({ length: NaN, width: 20, height: 30 })
      ).toThrow(ValidationError);
    });

    it('rejects infinite dimensions', () => {
      expect(() =>
        validateDimensions({ length: Infinity, width: 20, height: 30 })
      ).toThrow(ValidationError);
    });

    it('rejects zero dimensions', () => {
      expect(() =>
        validateDimensions({ length: 0, width: 20, height: 30 })
      ).toThrow(ValidationError);
    });

    it('rejects negative dimensions', () => {
      expect(() =>
        validateDimensions({ length: -5, width: 20, height: 30 })
      ).toThrow(ValidationError);
    });
  });

  describe('dimensionsEqual', () => {
    const base: CanonicalDimensions = {
      length: 100,
      width: 200,
      height: 300,
    };

    it('returns true for identical dimensions', () => {
      expect(dimensionsEqual(base, base)).toBe(true);
    });

    it('returns true for dimensions within tolerance', () => {
      const slightlyDifferent: CanonicalDimensions = {
        length: 100.0000001,
        width: 200.0000001,
        height: 300.0000001,
      };
      expect(dimensionsEqual(base, slightlyDifferent, 1e-6)).toBe(true);
    });

    it('returns false for dimensions outside tolerance', () => {
      const different: CanonicalDimensions = {
        length: 101,
        width: 200,
        height: 300,
      };
      expect(dimensionsEqual(base, different)).toBe(false);
    });
  });
});

describe('Metric↔imperial round trips', () => {
  it('round trips inch↔mm conversions', () => {
    const originalInches = 12.5;
    const mm = toMillimeters(originalInches, 'in');
    const inches = fromMillimeters(mm, 'in');
    expect(inches).toBeCloseTo(originalInches, 10);
  });

  it('round trips foot↔mm conversions', () => {
    const originalFeet = 3.75;
    const mm = toMillimeters(originalFeet, 'ft');
    const feet = fromMillimeters(mm, 'ft');
    expect(feet).toBeCloseTo(originalFeet, 10);
  });

  it('round trips pound↔gram conversions', () => {
    const originalPounds = 5.25;
    const grams = toGrams(originalPounds, 'lb');
    const pounds = fromGrams(grams, 'lb');
    expect(pounds).toBeCloseTo(originalPounds, 10);
  });

  it('round trips ounce↔gram conversions', () => {
    const originalOunces = 8.75;
    const grams = toGrams(originalOunces, 'oz');
    const ounces = fromGrams(grams, 'oz');
    expect(ounces).toBeCloseTo(originalOunces, 10);
  });
});