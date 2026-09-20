/**
 * Canonical units for Packmetry core.
 *
 * @module units/types
 */

/**
 * Supported length units for conversion.
 */
export type LengthUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft';

/**
 * Supported mass units for conversion.
 */
export type MassUnit = 'g' | 'kg' | 'oz' | 'lb';

/**
 * Canonical dimensions in millimeters.
 */
export interface CanonicalDimensions {
  /** Length in millimeters */
  length: number;
  /** Width in millimeters */
  width: number;
  /** Height in millimeters */
  height: number;
}

/**
 * Dimensions in any supported length unit.
 */
export interface Dimensions<T = number> {
  length: T;
  width: T;
  height: T;
}

/**
 * Validation error class for unit and dimension validation failures.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Type guard to check if a value is a valid length unit.
 */
export function isLengthUnit(unit: string): unit is LengthUnit {
  return ['mm', 'cm', 'm', 'in', 'ft'].includes(unit);
}

/**
 * Type guard to check if a value is a valid mass unit.
 */
export function isMassUnit(unit: string): unit is MassUnit {
  return ['g', 'kg', 'oz', 'lb'].includes(unit);
}