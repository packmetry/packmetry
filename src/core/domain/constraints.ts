/**
 * Item constraints domain model for Packmetry.
 *
 * @module domain/constraints
 */

import { ValidationError } from '../units/types.js';

/**
 * Rotation policy for an item.
 *
 * - 'any': No restrictions, item can be rotated freely in any axis
 * - 'upright': Item must remain upright (height axis aligned with carton height)
 * - 'vertical-axis-only': Item can rotate around vertical axis only (like a book)
 * - 'fixed': Item cannot be rotated at all, must maintain given orientation
 */
export type RotationPolicy = 'any' | 'upright' | 'vertical-axis-only' | 'fixed';

/**
 * Canonical item constraints.
 *
 * These constraints affect how an item can be packed.
 */
export interface ItemConstraints {
  /**
   * Rotation policy for the item.
   *
   * Default: 'any'
   */
  rotationPolicy: RotationPolicy;

  /**
   * Whether the item is fragile and requires special handling.
   *
   * Default: false
   */
  fragile: boolean;

  /**
   * Padding allowance in millimeters.
   *
   * Extra space that should be left around this item when packed.
   * Default: 0
   */
  paddingAllowanceMm: number;

  /**
   * Spacing allowance in millimeters.
   *
   * Minimum space that should be maintained between this item and other items.
   * Default: 0
   */
  spacingAllowanceMm: number;

  /**
   * Whether the item can be stacked upon by other items.
   *
   * Default: true
   */
  stackable: boolean;
}

/**
 * Default item constraints.
 */
export const DEFAULT_ITEM_CONSTRAINTS: ItemConstraints = {
  rotationPolicy: 'any',
  fragile: false,
  paddingAllowanceMm: 0,
  spacingAllowanceMm: 0,
  stackable: true,
};

/**
 * Input constraints that can be normalized.
 *
 * Allows partial constraints with some values omitted.
 */
export type ItemConstraintsInput = Partial<ItemConstraints>;

/**
 * Normalize item constraints, applying defaults where unspecified.
 *
 * @param input - Partial constraints input (optional)
 * @returns Normalized constraints with defaults applied
 * @throws {ValidationError} If any provided constraint value is invalid
 */
export function normalizeItemConstraints(
  input?: ItemConstraintsInput
): ItemConstraints {
  // If no input provided, return defaults
  if (!input) {
    return { ...DEFAULT_ITEM_CONSTRAINTS };
  }

  // Validate input constraints if any are provided
  validateItemConstraints(input);

  // Apply defaults where values are undefined
  return {
    rotationPolicy: input.rotationPolicy ?? DEFAULT_ITEM_CONSTRAINTS.rotationPolicy,
    fragile: input.fragile ?? DEFAULT_ITEM_CONSTRAINTS.fragile,
    paddingAllowanceMm: input.paddingAllowanceMm ?? DEFAULT_ITEM_CONSTRAINTS.paddingAllowanceMm,
    spacingAllowanceMm: input.spacingAllowanceMm ?? DEFAULT_ITEM_CONSTRAINTS.spacingAllowanceMm,
    stackable: input.stackable ?? DEFAULT_ITEM_CONSTRAINTS.stackable,
  };
}

/**
 * Validate item constraints.
 *
 * @param constraints - Constraints to validate
 * @throws {ValidationError} If any constraint is invalid
 */
export function validateItemConstraints(constraints: ItemConstraintsInput): void {
  // Rotation policy validation
  if (constraints.rotationPolicy !== undefined) {
    const validPolicies: RotationPolicy[] = ['any', 'upright', 'vertical-axis-only', 'fixed'];
    if (!validPolicies.includes(constraints.rotationPolicy)) {
      throw new ValidationError(
        `Invalid rotationPolicy: ${constraints.rotationPolicy}. Must be one of: ${validPolicies.join(', ')}`
      );
    }
  }

  // Fragile validation (must be boolean if provided)
  if (constraints.fragile !== undefined && typeof constraints.fragile !== 'boolean') {
    throw new ValidationError('fragile must be a boolean when provided');
  }

  // Stackable validation (must be boolean if provided)
  if (constraints.stackable !== undefined && typeof constraints.stackable !== 'boolean') {
    throw new ValidationError('stackable must be a boolean when provided');
  }

  // Padding allowance validation
  if (constraints.paddingAllowanceMm !== undefined) {
    if (typeof constraints.paddingAllowanceMm !== 'number' || !Number.isFinite(constraints.paddingAllowanceMm)) {
      throw new ValidationError('paddingAllowanceMm must be a finite number when provided');
    }
    if (constraints.paddingAllowanceMm < 0) {
      throw new ValidationError(`paddingAllowanceMm must be ≥ 0 when provided, got: ${constraints.paddingAllowanceMm}`);
    }
  }

  // Spacing allowance validation
  if (constraints.spacingAllowanceMm !== undefined) {
    if (typeof constraints.spacingAllowanceMm !== 'number' || !Number.isFinite(constraints.spacingAllowanceMm)) {
      throw new ValidationError('spacingAllowanceMm must be a finite number when provided');
    }
    if (constraints.spacingAllowanceMm < 0) {
      throw new ValidationError(`spacingAllowanceMm must be ≥ 0 when provided, got: ${constraints.spacingAllowanceMm}`);
    }
  }
}