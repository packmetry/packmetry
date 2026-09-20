/**
 * Item domain model for Packmetry.
 *
 * @module domain/item
 */

import type { CanonicalDimensions } from '../units/types.js';
import { validateCanonicalDimensions } from '../units/dimensions.js';
import { ValidationError } from '../units/types.js';
import type { ItemConstraints, ItemConstraintsInput } from './constraints.js';
import { normalizeItemConstraints, validateItemConstraints } from './constraints.js';

/**
 * A canonical item to be packed.
 *
 * Items have dimensions in canonical millimeters, positive integer quantity,
 * optional weight in grams, and packing constraints.
 *
 * The caller must supply a non‑empty id; no IDs are auto‑generated.
 */
export interface Item {
  /** Required unique identifier (non‑empty string). */
  id: string;
  /** Optional descriptive name. */
  name?: string;
  /** Optional stock‑keeping unit/reference code. */
  sku?: string;
  /** Dimensions in canonical millimeters, preserving axis order. */
  dimensions: CanonicalDimensions;
  /** Positive integer quantity (≥ 1). */
  quantity: number;
  /**
   * Optional weight per unit in grams.
   *
   * When absent, weight is unknown; missing weight is never treated as zero.
   */
  unitWeightG?: number;
  /**
   * Item packing constraints.
   *
   * Affects rotation, fragile handling, padding, spacing, and stacking.
   * Always present with normalized defaults applied.
   */
  constraints: ItemConstraints;
}

/**
 * Options for creating an item.
 */
export interface CreateItemOptions {
  /** Required unique identifier (non‑empty string). */
  id: string;
  /** Optional descriptive name. */
  name?: string;
  /** Optional stock‑keeping unit/reference code. */
  sku?: string;
  /** Dimensions in canonical millimeters, preserving axis order. */
  dimensions: CanonicalDimensions;
  /** Positive integer quantity (≥ 1). */
  quantity: number;
  /**
   * Optional weight per unit in grams.
   *
   * When absent, weight is unknown; missing weight is never treated as zero.
   */
  unitWeightG?: number;
  /**
   * Optional item packing constraints.
   *
   * When absent or partially specified, defaults are applied.
   */
  constraints?: ItemConstraintsInput;
}

/**
 * Create a validated item.
 *
 * @param options - Item creation options
 * @returns A validated item
 * @throws {ValidationError} If any validation fails
 */
export function createItem(options: CreateItemOptions): Item {
  // Validate all fields except constraints (handled separately)
  validateItem(options);

  // Normalize constraints with defaults
  const constraints = normalizeItemConstraints(options.constraints);

  // Return immutable item (no mutation of input)
  return {
    id: options.id,
    name: options.name,
    sku: options.sku,
    dimensions: {
      length: options.dimensions.length,
      width: options.dimensions.width,
      height: options.dimensions.height,
    },
    quantity: options.quantity,
    unitWeightG: options.unitWeightG,
    constraints,
  };
}

/**
 * Validate an item or item creation options.
 *
 * @param item - The item or item options to validate
 * @throws {ValidationError} If any validation fails
 */
export function validateItem(item: CreateItemOptions | Item): void {
  // ID validation
  if (typeof item.id !== 'string' || item.id.trim().length === 0) {
    throw new ValidationError('Item id must be a non‑empty string');
  }

  // Quantity validation
  if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity)) {
    throw new ValidationError('Item quantity must be a finite number');
  }
  if (!Number.isInteger(item.quantity)) {
    throw new ValidationError('Item quantity must be an integer');
  }
  if (item.quantity < 1) {
    throw new ValidationError(`Item quantity must be ≥ 1, got: ${item.quantity}`);
  }

  // Dimensions validation using existing units API
  validateCanonicalDimensions(item.dimensions);

  // Weight validation (if present)
  if (item.unitWeightG !== undefined) {
    if (typeof item.unitWeightG !== 'number' || !Number.isFinite(item.unitWeightG)) {
      throw new ValidationError('Item unitWeightG must be a finite number when provided');
    }
    if (item.unitWeightG <= 0) {
      throw new ValidationError(`Item unitWeightG must be > 0 when provided, got: ${item.unitWeightG}`);
    }
  }

  // Constraints validation if present in CreateItemOptions
  if ('constraints' in item && item.constraints !== undefined) {
    // validateItemConstraints will throw if constraints are invalid
    // This handles the case where constraints is explicitly provided
    // It won't be called for normalized Item objects
    validateItemConstraints(item.constraints);
  }

  // Name and SKU are optional, no validation needed
}

/**
 * Calculate the unit volume of an item in cubic millimeters.
 *
 * @param item - The item
 * @returns Volume of one unit in mm³
 * @throws {ValidationError} If item dimensions are invalid
 */
export function itemUnitVolumeMm3(item: Item): number {
  validateCanonicalDimensions(item.dimensions);
  return item.dimensions.length * item.dimensions.width * item.dimensions.height;
}

/**
 * Calculate the total volume of all item units in cubic millimeters.
 *
 * @param item - The item
 * @returns Total volume of all units in mm³
 * @throws {ValidationError} If item dimensions are invalid or quantity invalid
 */
export function itemTotalVolumeMm3(item: Item): number {
  validateItem(item);
  return itemUnitVolumeMm3(item) * item.quantity;
}

/**
 * Calculate the total weight of all item units in grams.
 *
 * @param item - The item
 * @returns Total weight in grams, or undefined if unit weight is unknown
 * @throws {ValidationError} If item validation fails or unit weight is invalid when present
 */
export function itemTotalWeightG(item: Item): number | undefined {
  validateItem(item);

  if (item.unitWeightG === undefined) {
    return undefined;
  }

  // Unit weight already validated by validateItem
  return item.unitWeightG * item.quantity;
}