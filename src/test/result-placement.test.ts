import { describe, it, expect } from 'vitest';
import {
  validateItemPlacement,
  createItemPlacement,
  placementVolumeMm3,
  type ItemPlacement,
  type PlanStatus,
} from '../core/domain/result.js';
import { ValidationError } from '../core/units/types.js';

describe('Canonical result placement primitives', () => {
  describe('PlanStatus type', () => {
    it.each(['feasible', 'partial', 'infeasible', 'limit_reached'] satisfies PlanStatus[])(
      'represents every literal: %s',
      (status) => {
        // Type guard ensures all literals are represented
        expect(status).toBeDefined();
        expect(typeof status).toBe('string');
      }
    );
  });

  describe('validateItemPlacement', () => {
    const validPlacement: ItemPlacement = {
      itemId: 'item-1',
      instanceIndex: 0,
      x: 0,
      y: 0,
      z: 0,
      length: 100,
      width: 50,
      height: 30,
    };

    it('accepts a valid placement', () => {
      expect(() => validateItemPlacement(validPlacement)).not.toThrow();
    });

    it('rejects null placement', () => {
      expect(() => validateItemPlacement(null as unknown as ItemPlacement)).toThrow(ValidationError);
    });

    it('rejects non-object', () => {
      expect(() => validateItemPlacement('not-an-object' as unknown as ItemPlacement)).toThrow(ValidationError);
    });

    describe('itemId validation', () => {
      it('rejects missing itemId', () => {
        const invalid = { ...validPlacement };
        delete (invalid as any).itemId;
        expect(() => validateItemPlacement(invalid)).toThrow(ValidationError);
      });

      it('rejects non-string itemId', () => {
        expect(() => validateItemPlacement({ ...validPlacement, itemId: 123 as unknown as string })).toThrow(
          ValidationError
        );
      });

      it('rejects empty string itemId', () => {
        expect(() => validateItemPlacement({ ...validPlacement, itemId: '' })).toThrow(ValidationError);
      });

      it('rejects whitespace-only itemId', () => {
        expect(() => validateItemPlacement({ ...validPlacement, itemId: '   ' })).toThrow(ValidationError);
      });
    });

    describe('instanceIndex validation', () => {
      it('accepts instanceIndex 0', () => {
        expect(() => validateItemPlacement({ ...validPlacement, instanceIndex: 0 })).not.toThrow();
      });

      it('accepts positive integer instanceIndex', () => {
        expect(() => validateItemPlacement({ ...validPlacement, instanceIndex: 5 })).not.toThrow();
      });

      it('rejects negative instanceIndex', () => {
        expect(() => validateItemPlacement({ ...validPlacement, instanceIndex: -1 })).toThrow(ValidationError);
      });

      it('rejects fractional instanceIndex', () => {
        expect(() => validateItemPlacement({ ...validPlacement, instanceIndex: 2.5 })).toThrow(ValidationError);
      });

      it('rejects NaN instanceIndex', () => {
        expect(() => validateItemPlacement({ ...validPlacement, instanceIndex: NaN })).toThrow(ValidationError);
      });

      it('rejects Infinity instanceIndex', () => {
        expect(() => validateItemPlacement({ ...validPlacement, instanceIndex: Infinity })).toThrow(ValidationError);
      });

      it('rejects non-number instanceIndex', () => {
        expect(() => validateItemPlacement({ ...validPlacement, instanceIndex: '0' as unknown as number })).toThrow(
          ValidationError
        );
      });
    });

    describe('coordinate validation (x, y, z)', () => {
      it('accepts zero coordinates', () => {
        const zeroCoords = { ...validPlacement, x: 0, y: 0, z: 0 };
        expect(() => validateItemPlacement(zeroCoords)).not.toThrow();
      });

      it('accepts positive coordinates', () => {
        const positiveCoords = { ...validPlacement, x: 10.5, y: 20.3, z: 30.7 };
        expect(() => validateItemPlacement(positiveCoords)).not.toThrow();
      });

      it.each(['x', 'y', 'z'] as const)('rejects negative %s coordinate', (coord) => {
        const placement = { ...validPlacement };
        placement[coord] = -1;
        expect(() => validateItemPlacement(placement)).toThrow(ValidationError);
      });

      it.each(['x', 'y', 'z'] as const)('rejects NaN %s coordinate', (coord) => {
        const placement = { ...validPlacement };
        placement[coord] = NaN;
        expect(() => validateItemPlacement(placement)).toThrow(ValidationError);
      });

      it.each(['x', 'y', 'z'] as const)('rejects Infinity %s coordinate', (coord) => {
        const placement = { ...validPlacement };
        placement[coord] = Infinity;
        expect(() => validateItemPlacement(placement)).toThrow(ValidationError);
      });

      it.each(['x', 'y', 'z'] as const)('rejects non-number %s coordinate', (coord) => {
        const placement = { ...validPlacement };
        (placement as any)[coord] = '10';
        expect(() => validateItemPlacement(placement)).toThrow(ValidationError);
      });
    });

    describe('dimension validation (length, width, height)', () => {
      it('rejects zero length', () => {
        expect(() => validateItemPlacement({ ...validPlacement, length: 0 })).toThrow(ValidationError);
      });

      it('rejects negative length', () => {
        expect(() => validateItemPlacement({ ...validPlacement, length: -1 })).toThrow(ValidationError);
      });

      it('rejects negative width', () => {
        expect(() => validateItemPlacement({ ...validPlacement, width: -1 })).toThrow(ValidationError);
      });

      it('rejects negative height', () => {
        expect(() => validateItemPlacement({ ...validPlacement, height: -1 })).toThrow(ValidationError);
      });

      it.each(['length', 'width', 'height'] as const)('rejects NaN %s', (dim) => {
        const placement = { ...validPlacement };
        placement[dim] = NaN;
        expect(() => validateItemPlacement(placement)).toThrow(ValidationError);
      });

      it.each(['length', 'width', 'height'] as const)('rejects Infinity %s', (dim) => {
        const placement = { ...validPlacement };
        placement[dim] = Infinity;
        expect(() => validateItemPlacement(placement)).toThrow(ValidationError);
      });

      it.each(['length', 'width', 'height'] as const)('rejects non-number %s', (dim) => {
        const placement = { ...validPlacement };
        (placement as any)[dim] = '100';
        expect(() => validateItemPlacement(placement)).toThrow(ValidationError);
      });

      it('accepts positive fractional dimensions', () => {
        const fractionalDims = { ...validPlacement, length: 100.5, width: 50.3, height: 30.7 };
        expect(() => validateItemPlacement(fractionalDims)).not.toThrow();
      });
    });

    it('does not validate rotation property (optional unknown)', () => {
      const placementWithRotation = { ...validPlacement, rotation: { axis: 'x', degrees: 90 } };
      expect(() => validateItemPlacement(placementWithRotation)).not.toThrow();
    });
  });

  describe('createItemPlacement', () => {
    const basePlacement: ItemPlacement = {
      itemId: 'item-a',
      instanceIndex: 2,
      x: 10,
      y: 20,
      z: 30,
      length: 100,
      width: 50,
      height: 25,
    };

    it('creates a validated placement', () => {
      const result = createItemPlacement(basePlacement);
      expect(result).toEqual(basePlacement);
      expect(result).not.toBe(basePlacement); // Should be a new object
    });

    it('rejects invalid placement', () => {
      expect(() => createItemPlacement({ ...basePlacement, length: -1 })).toThrow(ValidationError);
    });

    it('returns object that does not mutate input', () => {
      const input = { ...basePlacement };
      const result = createItemPlacement(input);

      // Modify result
      (result as any).itemId = 'modified';

      // Input should not be affected
      expect(input.itemId).toBe('item-a');
    });

    it('clones rotation property when present', () => {
      const placementWithRotation = { ...basePlacement, rotation: { axis: 'y', angle: 90 } };
      const result = createItemPlacement(placementWithRotation);

      expect(result.rotation).toEqual({ axis: 'y', angle: 90 });
      expect(result.rotation).toBe(placementWithRotation.rotation); // Same reference, rotation is unknown
    });
  });

  describe('placementVolumeMm3', () => {
    it('calculates correct volume for integer dimensions', () => {
      const placement: ItemPlacement = {
        itemId: 'test',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 10,
        width: 20,
        height: 30,
      };

      expect(placementVolumeMm3(placement)).toBe(10 * 20 * 30); // 6000
    });

    it('calculates correct volume for fractional dimensions', () => {
      const placement: ItemPlacement = {
        itemId: 'test',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 10.5,
        width: 20.25,
        height: 30.75,
      };

      expect(placementVolumeMm3(placement)).toBeCloseTo(10.5 * 20.25 * 30.75);
    });

    it('rejects invalid placement', () => {
      const invalidPlacement = {
        itemId: 'test',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: -10, // Invalid
        width: 20,
        height: 30,
      };

      expect(() => placementVolumeMm3(invalidPlacement as ItemPlacement)).toThrow(ValidationError);
    });

    it('uses placement validation internally', () => {
      const placement: ItemPlacement = {
        itemId: 'test',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 100,
        width: 50,
        height: 25,
      };

      const volume = placementVolumeMm3(placement);
      expect(volume).toBe(100 * 50 * 25); // 125000
    });
  });

  describe('ItemPlacement interface validation', () => {
    it('requires all mandatory properties', () => {
      // TypeScript compile-time check
      const placement: ItemPlacement = {
        itemId: 'valid',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 1,
        width: 1,
        height: 1,
      };

      expect(placement).toBeDefined();
    });

    it('allows optional rotation property', () => {
      const placementWithRotation: ItemPlacement = {
        itemId: 'valid',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 1,
        width: 1,
        height: 1,
        rotation: undefined,
      };

      expect(placementWithRotation.rotation).toBeUndefined();

      const placementWithRotationValue: ItemPlacement = {
        itemId: 'valid',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 1,
        width: 1,
        height: 1,
        rotation: { axis: 'z', angle: 45 },
      };

      expect((placementWithRotationValue.rotation as any)?.axis).toBe('z');
    });
  });
});