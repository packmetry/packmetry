import { describe, it, expect } from 'vitest';
import { validatePackedCarton, type PackedCarton } from '../core/domain/packed-carton.js';
import { ValidationError } from '../core/units/types.js';

describe('PackedCarton domain model', () => {
  const validCarton = {
    id: 'carton-123',
    internalDimensions: { length: 300, width: 200, height: 150 },
  };

  const validPlacement = {
    itemId: 'item-1',
    instanceIndex: 0,
    x: 0,
    y: 0,
    z: 0,
    length: 100,
    width: 50,
    height: 30,
    rotation: 'LWH' as const,
  };

  const validMetrics = {
    itemCount: 2,
    itemVolumeMm3: 10000,
    cartonVolumeMm3: 15000,
    emptyVolumeMm3: 5000,
    utilization: 0.6667,
  };

  const validPackedCarton: PackedCarton = {
    carton: validCarton,
    placements: [validPlacement],
    metrics: validMetrics,
  };

  describe('validatePackedCarton', () => {
    it('accepts a valid PackedCarton', () => {
      expect(() => validatePackedCarton(validPackedCarton)).not.toThrow();
    });

    it('accepts PackedCarton with empty placements array', () => {
      const packedCarton: PackedCarton = {
        carton: validCarton,
        placements: [],
        metrics: validMetrics,
      };
      expect(() => validatePackedCarton(packedCarton)).not.toThrow();
    });

    it('accepts PackedCarton with multiple placements', () => {
      const packedCarton: PackedCarton = {
        carton: validCarton,
        placements: [
          validPlacement,
          { ...validPlacement, instanceIndex: 1, x: 100 },
          { ...validPlacement, instanceIndex: 2, y: 50 },
        ],
        metrics: validMetrics,
      };
      expect(() => validatePackedCarton(packedCarton)).not.toThrow();
    });

    it('rejects null or non-object', () => {
      expect(() => validatePackedCarton(null)).toThrow(ValidationError);
      expect(() => validatePackedCarton(undefined)).toThrow(ValidationError);
      expect(() => validatePackedCarton('not-an-object')).toThrow(ValidationError);
      expect(() => validatePackedCarton(123)).toThrow(ValidationError);
    });

    describe('carton validation', () => {
      it('rejects missing carton', () => {
        const invalid = { ...validPackedCarton };
        delete (invalid as any).carton;
        expect(() => validatePackedCarton(invalid)).toThrow('PackedCarton.carton is required');
      });

      it('rejects invalid carton', () => {
        const invalid = {
          ...validPackedCarton,
          carton: { id: '', internalDimensions: { length: 300, width: 200, height: 150 } },
        };
        expect(() => validatePackedCarton(invalid)).toThrow(ValidationError);
        expect(() => validatePackedCarton(invalid)).toThrow('Carton id must be a non‑empty string');
      });

      it('rejects non-object carton', () => {
        const invalid = { ...validPackedCarton, carton: 'not-a-carton' };
        expect(() => validatePackedCarton(invalid)).toThrow(ValidationError);
      });
    });

    describe('placements validation', () => {
      it('rejects missing placements', () => {
        const invalid = { ...validPackedCarton };
        delete (invalid as any).placements;
        expect(() => validatePackedCarton(invalid)).toThrow('PackedCarton.placements is required');
      });

      it('rejects non-array placements', () => {
        const invalid = { ...validPackedCarton, placements: 'not-an-array' };
        expect(() => validatePackedCarton(invalid)).toThrow('PackedCarton.placements must be an array');
      });

      it('rejects invalid placement in array', () => {
        const invalid = {
          ...validPackedCarton,
          placements: [
            validPlacement,
            { ...validPlacement, itemId: '' }, // invalid: empty string
          ],
        };
        expect(() => validatePackedCarton(invalid)).toThrow(ValidationError);
        expect(() => validatePackedCarton(invalid)).toThrow('PackedCarton.placements[1] is invalid');
      });

      it('includes index in error message for invalid placement', () => {
        const invalid = {
          ...validPackedCarton,
          placements: [
            validPlacement,
            { ...validPlacement, instanceIndex: -1 }, // invalid: negative
          ],
        };
        expect(() => validatePackedCarton(invalid)).toThrow('PackedCarton.placements[1] is invalid');
        expect(() => validatePackedCarton(invalid)).toThrow('instanceIndex must be ≥ 0');
      });
    });

    describe('metrics validation', () => {
      it('rejects missing metrics', () => {
        const invalid = { ...validPackedCarton };
        delete (invalid as any).metrics;
        expect(() => validatePackedCarton(invalid)).toThrow('PackedCarton.metrics is required');
      });

      it('rejects invalid metrics', () => {
        const invalid = {
          ...validPackedCarton,
          metrics: { ...validMetrics, itemCount: -1 }, // invalid: negative
        };
        expect(() => validatePackedCarton(invalid)).toThrow(ValidationError);
        expect(() => validatePackedCarton(invalid)).toThrow('itemCount must be ≥ 0');
      });

      it('rejects non-object metrics', () => {
        const invalid = { ...validPackedCarton, metrics: 'not-metrics' };
        expect(() => validatePackedCarton(invalid)).toThrow(ValidationError);
      });
    });
  });
});