/**
 * Dimension operations for Packmetry.
 *
 * @module units/dimensions
 */

import type { CanonicalDimensions, Dimensions, LengthUnit } from './types.js';
import { ValidationError } from './types.js';
import { toMillimeters, fromMillimeters } from './length.js';

/**
 * Normalize dimensions from any supported unit to canonical millimeters.
 *
 * @param dimensions - The dimensions in the specified unit
 * @param unit - The unit of the input dimensions
 * @returns Canonical dimensions in millimeters
 * @throws {ValidationError} If any dimension is not finite, <= 0, or unit is invalid
 */
export function normalizeDimensions(
  dimensions: Dimensions,
  unit: LengthUnit
): CanonicalDimensions {
  validateDimensions(dimensions);

  return {
    length: toMillimeters(dimensions.length, unit),
    width: toMillimeters(dimensions.width, unit),
    height: toMillimeters(dimensions.height, unit),
  };
}

/**
 * Convert canonical dimensions from millimeters to any supported unit.
 *
 * @param canonicalDimensions - Dimensions in millimeters
 * @param unit - The desired output unit
 * @returns Dimensions in the specified unit
 * @throws {ValidationError} If any dimension is not finite, <= 0, or unit is invalid
 */
export function convertDimensions(
  canonicalDimensions: CanonicalDimensions,
  unit: LengthUnit
): Dimensions {
  validateCanonicalDimensions(canonicalDimensions);

  return {
    length: fromMillimeters(canonicalDimensions.length, unit),
    width: fromMillimeters(canonicalDimensions.width, unit),
    height: fromMillimeters(canonicalDimensions.height, unit),
  };
}

/**
 * Calculate the volume of canonical dimensions in cubic millimeters.
 *
 * @param dimensions - Canonical dimensions in millimeters
 * @returns Volume in cubic millimeters (mm³)
 * @throws {ValidationError} If any dimension is not finite or <= 0
 */
export function volumeMm3(dimensions: CanonicalDimensions): number {
  validateCanonicalDimensions(dimensions);

  return dimensions.length * dimensions.width * dimensions.height;
}

/**
 * Validate that dimensions are finite numbers and greater than zero.
 * Preserves axis order (does not sort).
 *
 * @param dimensions - Dimensions to validate
 * @throws {ValidationError} If any dimension is not finite or <= 0
 */
export function validateDimensions(dimensions: Dimensions): void {
  const { length, width, height } = dimensions;

  if (typeof length !== 'number' || !Number.isFinite(length)) {
    throw new ValidationError(`Length must be a finite number, got: ${length}`);
  }
  if (typeof width !== 'number' || !Number.isFinite(width)) {
    throw new ValidationError(`Width must be a finite number, got: ${width}`);
  }
  if (typeof height !== 'number' || !Number.isFinite(height)) {
    throw new ValidationError(`Height must be a finite number, got: ${height}`);
  }

  if (length <= 0) {
    throw new ValidationError(`Length must be greater than zero, got: ${length}`);
  }
  if (width <= 0) {
    throw new ValidationError(`Width must be greater than zero, got: ${width}`);
  }
  if (height <= 0) {
    throw new ValidationError(`Height must be greater than zero, got: ${height}`);
  }
}

/**
 * Validate that canonical dimensions are finite numbers and greater than zero.
 *
 * @param dimensions - Canonical dimensions in millimeters to validate
 * @throws {ValidationError} If any dimension is not finite or <= 0
 */
export function validateCanonicalDimensions(dimensions: CanonicalDimensions): void {
  validateDimensions(dimensions);
}

/**
 * Check if two canonical dimensions sets are equal within tolerance.
 *
 * @param a - First dimensions
 * @param b - Second dimensions
 * @param tolerance - Maximum allowable difference (default: 1e-10)
 * @returns True if dimensions are equal within tolerance
 */
export function dimensionsEqual(
  a: CanonicalDimensions,
  b: CanonicalDimensions,
  tolerance: number = 1e-10
): boolean {
  return (
    Math.abs(a.length - b.length) < tolerance &&
    Math.abs(a.width - b.width) < tolerance &&
    Math.abs(a.height - b.height) < tolerance
  );
}