/**
 * Mass unit conversions for Packmetry.
 *
 * @module units/mass
 */

import type { MassUnit } from './types.js';
import { ValidationError } from './types.js';

/**
 * Convert a mass value from any supported unit to grams.
 *
 * @param value - The mass value to convert
 * @param unit - The unit of the input value
 * @returns The mass in grams
 * @throws {ValidationError} If value is not finite or unit is invalid
 */
export function toGrams(value: number, unit: MassUnit): number {
  validateNumber(value, 'Mass value');

  const conversionFactor = getMassConversionFactor(unit);
  return value * conversionFactor;
}

/**
 * Convert a mass value from grams to any supported unit.
 *
 * @param valueG - The mass value in grams
 * @param unit - The desired output unit
 * @returns The mass in the specified unit
 * @throws {ValidationError} If valueG is not finite or unit is invalid
 */
export function fromGrams(valueG: number, unit: MassUnit): number {
  validateNumber(valueG, 'Mass value in grams');

  const conversionFactor = getMassConversionFactor(unit);
  return valueG / conversionFactor;
}

/**
 * Get the conversion factor to grams for a given mass unit.
 *
 * @param unit - The mass unit
 * @returns Conversion factor to grams (multiply value by this to get g)
 * @throws {ValidationError} If unit is invalid
 */
export function getMassConversionFactor(unit: MassUnit): number {
  switch (unit) {
    case 'g':
      return 1;
    case 'kg':
      return 1000;
    case 'oz':
      // 1 ounce = 28.349523125 grams (exact)
      return 28.349523125;
    case 'lb':
      // 1 pound = 453.59237 grams (exact)
      return 453.59237;
    default:
      throw new ValidationError(`Invalid mass unit: ${unit}`);
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
 * Convenience function to convert between any two mass units.
 *
 * @param value - The mass value to convert
 * @param fromUnit - The unit of the input value
 * @param toUnit - The desired output unit
 * @returns The mass in the target unit
 * @throws {ValidationError} If value is not finite or units are invalid
 */
export function convertMass(
  value: number,
  fromUnit: MassUnit,
  toUnit: MassUnit
): number {
  const grams = toGrams(value, fromUnit);
  return fromGrams(grams, toUnit);
}