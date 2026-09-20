import { describe, it, expect } from 'vitest';
import {
  getRotatedDimensions,
  placementDimensionsMatchRotation,
  VALID_PLACEMENT_ROTATIONS,
  type ItemPlacement,
  type PlacementRotation,
} from '../core/domain/result.js';
import { ValidationError } from '../core/units/types.js';

describe('Rotation geometry functions', () => {
  describe('getRotatedDimensions', () => {
    const originalDimensions = { length: 100, width: 50, height: 30 };
    const originalVolume = 100 * 50 * 30; // 150000 mm³

    // Test all 6 rotations
    it.each([
      ['LWH', { length: 100, width: 50, height: 30 }],
      ['WLH', { length: 50, width: 100, height: 30 }],
      ['LHW', { length: 100, width: 30, height: 50 }],
      ['HLW', { length: 30, width: 100, height: 50 }],
      ['WHL', { length: 50, width: 30, height: 100 }],
      ['HWL', { length: 30, width: 50, height: 100 }],
    ])('correctly maps rotation %s', (rotation, expected) => {
      const result = getRotatedDimensions(originalDimensions, rotation as PlacementRotation);
      expect(result).toEqual(expected);
    });

    it('preserves volume for all rotations', () => {
      VALID_PLACEMENT_ROTATIONS.forEach((rotation) => {
        const rotated = getRotatedDimensions(originalDimensions, rotation);
        const volume = rotated.length * rotated.width * rotated.height;
        expect(volume).toBe(originalVolume);
      });
    });

    it('does not mutate input dimensions', () => {
      const originalCopy = { ...originalDimensions };
      const rotation: PlacementRotation = 'WLH';

      const result = getRotatedDimensions(originalCopy, rotation);

      // Original should be unchanged
      expect(originalCopy).toEqual(originalDimensions);
      // Result should be a new object
      expect(result).not.toBe(originalDimensions);
    });

    it('rejects invalid dimensions', () => {
      expect(() => getRotatedDimensions({ length: 0, width: 50, height: 30 }, 'LWH')).toThrow(ValidationError);
      expect(() => getRotatedDimensions({ length: -10, width: 50, height: 30 }, 'LWH')).toThrow(ValidationError);
      expect(() => getRotatedDimensions({ length: NaN, width: 50, height: 30 }, 'LWH')).toThrow(ValidationError);
      expect(() => getRotatedDimensions({ length: Infinity, width: 50, height: 30 }, 'LWH')).toThrow(ValidationError);
    });

    it('rejects invalid rotation', () => {
      expect(() => getRotatedDimensions(originalDimensions, 'INVALID' as any)).toThrow(ValidationError);
      expect(() => getRotatedDimensions(originalDimensions, '' as any)).toThrow(ValidationError);
      expect(() => getRotatedDimensions(originalDimensions, 123 as any)).toThrow(ValidationError);
    });
  });

  describe('placementDimensionsMatchRotation', () => {
    const originalDimensions = { length: 100, width: 50, height: 30 };

    it('returns true for matching dimensions and rotation', () => {
      const placement: ItemPlacement = {
        itemId: 'test',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 50,   // width becomes length in WLH rotation
        width: 100,   // length becomes width in WLH rotation
        height: 30,   // height stays same
        rotation: 'WLH',
      };

      expect(placementDimensionsMatchRotation(originalDimensions, placement)).toBe(true);
    });

    it('returns false for mismatched dimensions', () => {
      const placement: ItemPlacement = {
        itemId: 'test',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 50,   // correct for WLH
        width: 100,   // correct for WLH
        height: 40,   // WRONG - should be 30
        rotation: 'WLH',
      };

      expect(placementDimensionsMatchRotation(originalDimensions, placement)).toBe(false);
    });

    it('works with tolerance parameter', () => {
      const placement: ItemPlacement = {
        itemId: 'test',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 50.00000000005,   // Tiny difference (0.5e-10)
        width: 100.00000000005,   // Tiny difference (0.5e-10)
        height: 30.00000000005,   // Tiny difference (0.5e-10)
        rotation: 'WLH',
      };

      // Should pass with default tolerance (1e-10)
      expect(placementDimensionsMatchRotation(originalDimensions, placement)).toBe(true);

      // Should fail with stricter tolerance
      expect(placementDimensionsMatchRotation(originalDimensions, placement, 1e-12)).toBe(false);
    });

    it('handles all rotation types correctly', () => {
      VALID_PLACEMENT_ROTATIONS.forEach((rotation) => {
        const rotated = getRotatedDimensions(originalDimensions, rotation);

        const placement: ItemPlacement = {
          itemId: 'test',
          instanceIndex: 0,
          x: 0,
          y: 0,
          z: 0,
          length: rotated.length,
          width: rotated.width,
          height: rotated.height,
          rotation,
        };

        expect(placementDimensionsMatchRotation(originalDimensions, placement)).toBe(true);

        // Test with slightly wrong dimensions
        const wrongPlacement: ItemPlacement = {
          ...placement,
          length: placement.length + 1,
        };

        expect(placementDimensionsMatchRotation(originalDimensions, wrongPlacement)).toBe(false);
      });
    });

    it('does not mutate placement input', () => {
      const placement: ItemPlacement = {
        itemId: 'test',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 50,
        width: 100,
        height: 30,
        rotation: 'WLH',
      };

      const placementCopy = { ...placement };

      placementDimensionsMatchRotation(originalDimensions, placementCopy);

      // Placement should be unchanged
      expect(placementCopy).toEqual(placement);
    });

    it('rejects invalid canonical dimensions', () => {
      const placement: ItemPlacement = {
        itemId: 'test',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 50,
        width: 100,
        height: 30,
        rotation: 'WLH',
      };

      expect(() => placementDimensionsMatchRotation({ length: 0, width: 50, height: 30 }, placement)).toThrow(ValidationError);
    });

    it('rejects invalid placement', () => {
      const invalidPlacement = {
        itemId: '',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 50,
        width: 100,
        height: 30,
        rotation: 'WLH',
      } as ItemPlacement;

      expect(() => placementDimensionsMatchRotation(originalDimensions, invalidPlacement)).toThrow(ValidationError);
    });
  });
});