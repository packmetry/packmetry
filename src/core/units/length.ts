/**
 * Length unit conversions for Packmetry.
 *
 * @module units/length
 */

import type { LengthUnit } from './types.js';
import { ValidationError } from './types.js';

/**
 * Convert a length value from any supported unit to millimeters.
 *
 * @param value - The length value to convert
 * @param unit - The unit of the input value
 * @returns The length in millimeters
 * @throws {ValidationError} If value is not finite or unit is invalid
 */
export function toMillimeters(value: number, unit: LengthUnit): number {
  validateNumber(value, 'Length value');

  const conversionFactor = getLengthConversionFactor(unit);
  return value * conversionFactor;
}

/**
 * Convert a length value from millimeters to any supported unit.
 *
 * @param valueMm - The length value in millimeters
 * @param unit - The desired output unit
 * @returns The length in the specified unit
 * @throws {ValidationError} If valueMm is not finite or unit is invalid
 */
export function fromMillimeters(valueMm: number, unit: LengthUnit): number {
  validateNumber(valueMm, 'Length value in millimeters');

  const conversionFactor = getLengthConversionFactor(unit);
  return valueMm / conversionFactor;
}

/**
 * Get the conversion factor to millimeters for a given length unit.
 *
 * @param unit - The length unit
 * @returns Conversion factor to millimeters (multiply value by this to get mm)
 * @throws {ValidationError} If unit is invalid
 */
export function getLengthConversionFactor(unit: LengthUnit): number {
  switch (unit) {
    case 'mm':
      return 1;
    case 'cm':
      return 10;
    case 'm':
      return 1000;
    case 'in':
      // 1 inch = 25.4 millimeters (exact)
      return 25.4;
    case 'ft':
      // 1 foot = 304.8 millimeters (exact: 12 * 25.4)
      return 304.8;
    default:
      throw new ValidationError(`Invalid length unit: ${unit}`);
  }
}

/**
 * Validate that a number is finite and numeric.
 *
 * @param value - The number to validate
 * @param name - Name of the value for error messages
 * @throws {ValidationError} If value is not finite
 */
function validateNumber(value: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${name} must be a finite number, got: ${value}`);
  }
}

/**
 * Convenience function to convert between any two length units.
 *
 * @param value - The length value to convert
 * @param fromUnit - The unit of the input value
 * @param toUnit - The desired output unit
 * @returns The length in the target unit
 * @throws {ValidationError} If value is not finite or units are invalid
 */
export function convertLength(
  value: number,
  fromUnit: LengthUnit,
  toUnit: LengthUnit
): number {
  const mm = toMillimeters(value, fromUnit);
  return fromMillimeters(mm, toUnit);
}