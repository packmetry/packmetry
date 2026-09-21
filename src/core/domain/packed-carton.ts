/**
 * PackedCarton domain model for Packmetry.
 *
 * Represents a single carton that has been packed with items.
 *
 * @module domain/packed-carton
 */

import type { Carton } from './carton.js';
import type { ItemPlacement } from './result.js';
import type { CartonMetrics } from './plan-contracts.js';
import { validateCarton } from './carton.js';
import { validateItemPlacement } from './result.js';
import { validateCartonMetrics } from './plan-contracts.js';
import { ValidationError } from '../units/types.js';

/**
 * A single carton that has been packed with items.
 *
 * Contains the carton definition, the placements of items within it,
 * and the metrics calculated for this packed carton.
 */
export interface PackedCarton {
  /** The carton definition. */
  carton: Carton;
  /** Placements of items within this carton. */
  placements: ItemPlacement[];
  /** Metrics calculated for this packed carton. */
  metrics: CartonMetrics;
}

/**
 * Validates a PackedCarton object.
 *
 * @param value - The value to validate
 * @throws {ValidationError} If any validation fails
 */
export function validatePackedCarton(value: unknown): asserts value is PackedCarton {
  if (value === null || typeof value !== 'object') {
    throw new ValidationError('PackedCarton must be an object');
  }

  const packedCarton = value as Record<string, unknown>;

  // Validate carton
  if (!packedCarton.carton) {
    throw new ValidationError('PackedCarton.carton is required');
  }
  validateCarton(packedCarton.carton as Carton);

  // Validate placements
  if (!packedCarton.placements) {
    throw new ValidationError('PackedCarton.placements is required');
  }
  if (!Array.isArray(packedCarton.placements)) {
    throw new ValidationError('PackedCarton.placements must be an array');
  }

  // Validate each placement
  for (let i = 0; i < packedCarton.placements.length; i++) {
    try {
      validateItemPlacement(packedCarton.placements[i] as ItemPlacement);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`PackedCarton.placements[${i}] is invalid: ${error.message}`);
      }
      throw error;
    }
  }

  // Validate metrics
  if (!packedCarton.metrics) {
    throw new ValidationError('PackedCarton.metrics is required');
  }
  validateCartonMetrics(packedCarton.metrics);
}