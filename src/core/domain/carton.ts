/**
 * Carton domain model for Packmetry.
 *
 * @module domain/carton
 */

import type { CanonicalDimensions } from '../units/types.js';
import { validateCanonicalDimensions } from '../units/dimensions.js';
import { ValidationError } from '../units/types.js';

/**
 * A canonical carton (box) that can hold items.
 *
 * Cartons have internal dimensions in canonical millimeters,
 * optional availability constraints, and optional business metadata.
 *
 * The caller must supply a non‑empty id; no IDs are auto‑generated.
 */
export interface Carton {
  /** Required unique identifier (non‑empty string). */
  id: string;
  /** Optional descriptive name. */
  name?: string;
  /** Internal dimensions in canonical millimeters, preserving axis order. */
  internalDimensions: CanonicalDimensions;
  /**
   * Optional quantity available.
   *
   * When absent, carton is unlimited; undefined ≠ 0.
   * Must be non‑negative integer if provided.
   */
  quantityAvailable?: number;
  /** Optional business carton code/reference. */
  cartonCode?: string;
  /**
   * Optional maximum gross weight in grams (box + contents).
   *
   * Must be positive finite when provided.
   */
  maxGrossWeightG?: number;
  /**
   * Optional empty box weight in grams.
   *
   * Must be positive finite when provided.
   */
  emptyBoxWeightG?: number;
  /**
   * Optional cost per box in unspecified currency units.
   *
   * Zero is valid (free box); must be non‑negative finite when provided.
   */
  costPerBox?: number;
  /**
   * Optional stock quantity (for business inventory tracking).
   *
   * Must be non‑negative integer when provided.
   */
  stockQuantity?: number;
  /** Optional supplier name. */
  supplier?: string;
  /**
   * Optional external dimensions in canonical millimeters.
   *
   * When absent, external dimensions equal internal dimensions.
   */
  externalDimensions?: CanonicalDimensions;
  /** Optional notes. */
  notes?: string;
}

/**
 * Options for creating a carton.
 */
export interface CreateCartonOptions {
  /** Required unique identifier (non‑empty string). */
  id: string;
  /** Optional descriptive name. */
  name?: string;
  /** Internal dimensions in canonical millimeters, preserving axis order. */
  internalDimensions: CanonicalDimensions;
  /**
   * Optional quantity available.
   *
   * When absent, carton is unlimited; undefined ≠ 0.
   * Must be non‑negative integer if provided.
   */
  quantityAvailable?: number;
  /** Optional business carton code/reference. */
  cartonCode?: string;
  /**
   * Optional maximum gross weight in grams (box + contents).
   *
   * Must be positive finite when provided.
   */
  maxGrossWeightG?: number;
  /**
   * Optional empty box weight in grams.
   *
   * Must be positive finite when provided.
   */
  emptyBoxWeightG?: number;
  /**
   * Optional cost per box in unspecified currency units.
   *
   * Zero is valid (free box); must be non‑negative finite when provided.
   */
  costPerBox?: number;
  /**
   * Optional stock quantity (for business inventory tracking).
   *
   * Must be non‑negative integer when provided.
   */
  stockQuantity?: number;
  /** Optional supplier name. */
  supplier?: string;
  /**
   * Optional external dimensions in canonical millimeters.
   *
   * When absent, external dimensions equal internal dimensions.
   */
  externalDimensions?: CanonicalDimensions;
  /** Optional notes. */
  notes?: string;
}
/**
 * Create a validated carton.
 *
 * @param options - Carton creation options
 * @returns A validated carton
 * @throws {ValidationError} If any validation fails
 */
export function createCarton(options: CreateCartonOptions): Carton {
  // Validate all fields
  validateCarton(options);

  // Return immutable carton (no mutation of input)
  const carton: Carton = {
    id: options.id,
    name: options.name,
    internalDimensions: {
      length: options.internalDimensions.length,
      width: options.internalDimensions.width,
      height: options.internalDimensions.height,
    },
    quantityAvailable: options.quantityAvailable,
    cartonCode: options.cartonCode,
    maxGrossWeightG: options.maxGrossWeightG,
    emptyBoxWeightG: options.emptyBoxWeightG,
    costPerBox: options.costPerBox,
    stockQuantity: options.stockQuantity,
    supplier: options.supplier,
    notes: options.notes,
  };

  // Clone external dimensions if provided
  if (options.externalDimensions) {
    carton.externalDimensions = {
      length: options.externalDimensions.length,
      width: options.externalDimensions.width,
      height: options.externalDimensions.height,
    };
  }

  return carton;
}

/**
 * Validate a carton or carton creation options.
 *
 * @param carton - The carton or carton options to validate
 * @throws {ValidationError} If any validation fails
 */
export function validateCarton(carton: CreateCartonOptions | Carton): void {
  // ID validation
  if (typeof carton.id !== 'string' || carton.id.trim().length === 0) {
    throw new ValidationError('Carton id must be a non‑empty string');
  }

  // Internal dimensions validation using existing units API
  validateCanonicalDimensions(carton.internalDimensions);

  // Quantity available validation (if present)
  if (carton.quantityAvailable !== undefined) {
    if (typeof carton.quantityAvailable !== 'number' || !Number.isFinite(carton.quantityAvailable)) {
      throw new ValidationError('Carton quantityAvailable must be a finite number when provided');
    }
    if (!Number.isInteger(carton.quantityAvailable)) {
      throw new ValidationError('Carton quantityAvailable must be an integer when provided');
    }
    if (carton.quantityAvailable < 0) {
      throw new ValidationError(`Carton quantityAvailable must be ≥ 0 when provided, got: ${carton.quantityAvailable}`);
    }
  }

  // Stock quantity validation (if present)
  if (carton.stockQuantity !== undefined) {
    if (typeof carton.stockQuantity !== 'number' || !Number.isFinite(carton.stockQuantity)) {
      throw new ValidationError('Carton stockQuantity must be a finite number when provided');
    }
    if (!Number.isInteger(carton.stockQuantity)) {
      throw new ValidationError('Carton stockQuantity must be an integer when provided');
    }
    if (carton.stockQuantity < 0) {
      throw new ValidationError(`Carton stockQuantity must be ≥ 0 when provided, got: ${carton.stockQuantity}`);
    }
  }

  // Max gross weight validation (if present)
  if (carton.maxGrossWeightG !== undefined) {
    if (typeof carton.maxGrossWeightG !== 'number' || !Number.isFinite(carton.maxGrossWeightG)) {
      throw new ValidationError('Carton maxGrossWeightG must be a finite number when provided');
    }
    if (carton.maxGrossWeightG <= 0) {
      throw new ValidationError(`Carton maxGrossWeightG must be > 0 when provided, got: ${carton.maxGrossWeightG}`);
    }
  }

  // Empty box weight validation (if present)
  if (carton.emptyBoxWeightG !== undefined) {
    if (typeof carton.emptyBoxWeightG !== 'number' || !Number.isFinite(carton.emptyBoxWeightG)) {
      throw new ValidationError('Carton emptyBoxWeightG must be a finite number when provided');
    }
    if (carton.emptyBoxWeightG <= 0) {
      throw new ValidationError(`Carton emptyBoxWeightG must be > 0 when provided, got: ${carton.emptyBoxWeightG}`);
    }
  }

  // Cost per box validation (if present)
  if (carton.costPerBox !== undefined) {
    if (typeof carton.costPerBox !== 'number' || !Number.isFinite(carton.costPerBox)) {
      throw new ValidationError('Carton costPerBox must be a finite number when provided');
    }
    if (carton.costPerBox < 0) {
      throw new ValidationError(`Carton costPerBox must be ≥ 0 when provided, got: ${carton.costPerBox}`);
    }
  }

  // External dimensions validation (if present)
  if (carton.externalDimensions) {
    validateCanonicalDimensions(carton.externalDimensions);
  }

  // Name, cartonCode, supplier, notes are optional, no validation needed
}

/**
 * Calculate the internal volume of a carton in cubic millimeters.
 *
 * @param carton - The carton
 * @returns Internal volume in mm³
 * @throws {ValidationError} If carton internal dimensions are invalid
 */
export function cartonInternalVolumeMm3(carton: Carton): number {
  validateCanonicalDimensions(carton.internalDimensions);
  return carton.internalDimensions.length * carton.internalDimensions.width * carton.internalDimensions.height;
}