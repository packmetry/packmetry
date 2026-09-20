/**
 * Canonical result model for Packmetry.
 *
 * @module domain/result
 */

import { ValidationError } from '../units/types.js';

/**
 * Plan status indicating feasibility outcome.
 *
 * - 'feasible': All items placed successfully
 * - 'partial': Some items placed, some not (inventory exhausted or otherwise)
 * - 'infeasible': No items could be placed (no boxes fit any item)
 * - 'limit_reached': Solver stopped before exploring full solution space
 */
export type PlanStatus =
  | 'feasible'
  | 'partial'
  | 'infeasible'
  | 'limit_reached';

/**
 * Canonical item placement coordinates and dimensions.
 *
 * Represents one placed instance of an item in a carton.
 * All dimensions are in canonical millimeters.
 */
export interface ItemPlacement {
  /** Non-empty identifier of the placed item. */
  itemId: string;

  /**
   * Instance index within the item's quantity.
   *
   * When an item has quantity > 1, each placed instance gets a unique index.
   * Zero‑based, non‑negative integer.
   */
  instanceIndex: number;

  /** X‑coordinate of the placement's minimum corner in millimeters. */
  x: number;

  /** Y‑coordinate of the placement's minimum corner in millimeters. */
  y: number;

  /** Z‑coordinate of the placement's minimum corner in millimeters. */
  z: number;

  /** Length of the placed instance in millimeters (along X‑axis). */
  length: number;

  /** Width of the placed instance in millimeters (along Y‑axis). */
  width: number;

  /** Height of the placed instance in millimeters (along Z‑axis). */
  height: number;

  /**
   * Rotation representation.
   *
   * The exact canonical rotation representation must be finalized
   * before solver adapter implementation.
   */
  rotation?: unknown;
}

/**
 * Validate an item placement.
 *
 * @param placement - The placement to validate
 * @throws {ValidationError} If placement is invalid
 */
export function validateItemPlacement(placement: ItemPlacement): void {
  if (!placement || typeof placement !== 'object') {
    throw new ValidationError('Item placement must be an object');
  }

  // itemId validation
  if (typeof placement.itemId !== 'string') {
    throw new ValidationError('Item placement itemId must be a string');
  }
  if (placement.itemId.trim().length === 0) {
    throw new ValidationError('Item placement itemId must be non-empty');
  }

  // instanceIndex validation
  if (typeof placement.instanceIndex !== 'number' || !Number.isFinite(placement.instanceIndex)) {
    throw new ValidationError('Item placement instanceIndex must be a finite number');
  }
  if (!Number.isInteger(placement.instanceIndex)) {
    throw new ValidationError('Item placement instanceIndex must be an integer');
  }
  if (placement.instanceIndex < 0) {
    throw new ValidationError(`Item placement instanceIndex must be ≥ 0, got: ${placement.instanceIndex}`);
  }

  // Coordinate validation (x, y, z)
  const coordinates = [
    { name: 'x', value: placement.x },
    { name: 'y', value: placement.y },
    { name: 'z', value: placement.z },
  ];

  for (const { name, value } of coordinates) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new ValidationError(`Item placement ${name} must be a finite number`);
    }
    if (value < 0) {
      throw new ValidationError(`Item placement ${name} must be ≥ 0, got: ${value}`);
    }
  }

  // Dimension validation (length, width, height)
  const dimensions = [
    { name: 'length', value: placement.length },
    { name: 'width', value: placement.width },
    { name: 'height', value: placement.height },
  ];

  for (const { name, value } of dimensions) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new ValidationError(`Item placement ${name} must be a finite number`);
    }
    if (value <= 0) {
      throw new ValidationError(`Item placement ${name} must be > 0, got: ${value}`);
    }
  }

  // No rotation validation needed as rotation is optional unknown
}

/**
 * Create a validated item placement.
 *
 * Returns a new object; does not mutate input.
 *
 * @param placement - The placement data
 * @returns A validated placement object
 * @throws {ValidationError} If placement is invalid
 */
export function createItemPlacement(placement: ItemPlacement): ItemPlacement {
  validateItemPlacement(placement);

  // Return a new object to avoid mutation of input
  return {
    itemId: placement.itemId,
    instanceIndex: placement.instanceIndex,
    x: placement.x,
    y: placement.y,
    z: placement.z,
    length: placement.length,
    width: placement.width,
    height: placement.height,
    rotation: placement.rotation,
  };
}

/**
 * Calculate the volume of an item placement in cubic millimeters.
 *
 * @param placement - The placement
 * @returns Volume in mm³
 * @throws {ValidationError} If placement is invalid
 */
export function placementVolumeMm3(placement: ItemPlacement): number {
  validateItemPlacement(placement);
  return placement.length * placement.width * placement.height;
}