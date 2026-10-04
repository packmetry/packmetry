/**
 * Dimensional-weight calculations for Packmetry.
 *
 * DIM calculations are intentionally separate from physical packing weight.
 * The divisor carries explicit length-unit and mass-unit semantics.
 *
 * @module units/dimensional-weight
 */

import type {
  CanonicalDimensions,
  LengthUnit,
  MassUnit,
} from './types.js';

import {
  isLengthUnit,
  isMassUnit,
  ValidationError,
} from './types.js';

import {
  convertDimensions,
  validateCanonicalDimensions,
} from './dimensions.js';

import {
  toGrams,
} from './mass.js';

/**
 * Defines the unit semantics of a dimensional-weight divisor.
 *
 * Example shape:
 * - value: cubic length units per one mass unit
 * - lengthUnit: unit used for length × width × height
 * - massUnit: mass unit produced by volume / divisor
 *
 * No numeric divisor is globally authoritative in Packmetry.
 */
export interface DimensionalWeightDivisor {
  /** Positive finite divisor value. */
  value: number;

  /** Length unit used by all three dimensions in the formula. */
  lengthUnit: LengthUnit;

  /** Mass unit produced by dividing volume by the divisor. */
  massUnit: MassUnit;
}

/**
 * Validate a dimensional-weight divisor.
 *
 * @param value - Candidate divisor value
 * @throws {ValidationError} If the divisor or its units are invalid
 */
export function validateDimensionalWeightDivisor(
  value: unknown
): asserts value is DimensionalWeightDivisor {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    throw new ValidationError(
      'Dimensional-weight divisor must be an object'
    );
  }

  const divisor =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof divisor.value !==
      'number' ||
    !Number.isFinite(
      divisor.value
    )
  ) {
    throw new ValidationError(
      'Dimensional-weight divisor value must be a finite number'
    );
  }

  if (
    divisor.value <= 0
  ) {
    throw new ValidationError(
      `Dimensional-weight divisor value must be > 0, got: ${divisor.value}`
    );
  }

  if (
    typeof divisor.lengthUnit !==
      'string' ||
    !isLengthUnit(
      divisor.lengthUnit
    )
  ) {
    throw new ValidationError(
      `Invalid dimensional-weight length unit: ${String(
        divisor.lengthUnit
      )}`
    );
  }

  if (
    typeof divisor.massUnit !==
      'string' ||
    !isMassUnit(
      divisor.massUnit
    )
  ) {
    throw new ValidationError(
      `Invalid dimensional-weight mass unit: ${String(
        divisor.massUnit
      )}`
    );
  }
}

/**
 * Calculate dimensional weight in canonical grams.
 *
 * The supplied package dimensions are canonical millimeters.
 * They are converted into the divisor's length unit before:
 *
 * volume =
 *   length × width × height
 *
 * dimensionalWeight =
 *   volume / divisor
 *
 * The resulting mass is then converted into grams.
 *
 * This function performs no carrier billing rounding.
 *
 * @param dimensionsMm - Package dimensions in canonical millimeters
 * @param divisor - Explicit dimensional-weight divisor and unit semantics
 * @returns Dimensional weight in grams
 * @throws {ValidationError} If dimensions or divisor are invalid
 */
export function calculateDimensionalWeightG(
  dimensionsMm: CanonicalDimensions,
  divisor: DimensionalWeightDivisor
): number {
  validateCanonicalDimensions(
    dimensionsMm
  );

  validateDimensionalWeightDivisor(
    divisor
  );

  const convertedDimensions =
    convertDimensions(
      dimensionsMm,
      divisor.lengthUnit
    );

  const volume =
    convertedDimensions.length *
    convertedDimensions.width *
    convertedDimensions.height;

  const dimensionalWeight =
    volume /
    divisor.value;

  return toGrams(
    dimensionalWeight,
    divisor.massUnit
  );
}

/**
 * Calculate the base chargeable-weight estimate in grams.
 *
 * Under ADR-012, chargeable weight is the greater of:
 * - known actual gross packed weight; and
 * - known dimensional weight.
 *
 * This function does not model carrier-specific rounding, minimums,
 * pricing, service rules, or shipping charges.
 *
 * @param grossWeightG - Actual gross packed mass in grams
 * @param dimWeightG - Dimensional weight in grams
 * @returns Greater of actual gross weight and dimensional weight
 * @throws {ValidationError} If either value is invalid
 */
export function calculateChargeableWeightG(
  grossWeightG: number,
  dimWeightG: number
): number {
  validateNonNegativeWeight(
    grossWeightG,
    'Gross weight'
  );

  validateNonNegativeWeight(
    dimWeightG,
    'Dimensional weight'
  );

  return Math.max(
    grossWeightG,
    dimWeightG
  );
}

/**
 * Validate a canonical derived weight.
 */
function validateNonNegativeWeight(
  valueG: number,
  name: string
): void {
  if (
    typeof valueG !==
      'number' ||
    !Number.isFinite(
      valueG
    )
  ) {
    throw new ValidationError(
      `${name} must be a finite number, got: ${valueG}`
    );
  }

  if (
    valueG < 0
  ) {
    throw new ValidationError(
      `${name} must be ≥ 0, got: ${valueG}`
    );
  }
}