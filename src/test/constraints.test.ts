import { describe, it, expect } from 'vitest';
import {
  normalizeItemConstraints,
  validateItemConstraints,
  DEFAULT_ITEM_CONSTRAINTS,
  type RotationPolicy,
  type ItemConstraintsInput,
} from '../core/domain/constraints.js';
import { ValidationError } from '../core/units/types.js';
import { createItem } from '../core/domain/item.js';

describe('Item constraints', () => {
  describe('normalizeItemConstraints', () => {
    it('returns default constraints when input is undefined', () => {
      const constraints = normalizeItemConstraints();
      expect(constraints).toEqual(DEFAULT_ITEM_CONSTRAINTS);
    });

    it('returns default constraints when input is empty object', () => {
      const constraints = normalizeItemConstraints({});
      expect(constraints).toEqual(DEFAULT_ITEM_CONSTRAINTS);
    });

    it('applies default values when some properties are undefined', () => {
      const constraints = normalizeItemConstraints({
        rotationPolicy: 'upright',
        fragile: true,
      });

      expect(constraints).toEqual({
        rotationPolicy: 'upright',
        fragile: true,
        paddingAllowanceMm: 0,
        spacingAllowanceMm: 0,
        stackable: true,
      });
    });

    it('preserves all custom values when all are provided', () => {
      const constraints = normalizeItemConstraints({
        rotationPolicy: 'vertical-axis-only',
        fragile: false,
        paddingAllowanceMm: 10,
        spacingAllowanceMm: 5,
        stackable: false,
      });

      expect(constraints).toEqual({
        rotationPolicy: 'vertical-axis-only',
        fragile: false,
        paddingAllowanceMm: 10,
        spacingAllowanceMm: 5,
        stackable: false,
      });
    });

    it('does not mutate input object', () => {
      const input: ItemConstraintsInput = { fragile: true };
      const originalInput = { ...input };

      normalizeItemConstraints(input);

      expect(input).toEqual(originalInput);
    });
  });

  describe('validateItemConstraints', () => {
    describe('rotationPolicy validation', () => {
      const validPolicies: RotationPolicy[] = ['any', 'upright', 'vertical-axis-only', 'fixed'];

      validPolicies.forEach(policy => {
        it(`accepts valid rotationPolicy: ${policy}`, () => {
          expect(() => validateItemConstraints({ rotationPolicy: policy })).not.toThrow();
        });
      });

      it('rejects invalid rotationPolicy', () => {
        expect(() => validateItemConstraints({ rotationPolicy: 'invalid' as any }))
          .toThrow(ValidationError);
      });
    });

    describe('fragile validation', () => {
      it('accepts true', () => {
        expect(() => validateItemConstraints({ fragile: true })).not.toThrow();
      });

      it('accepts false', () => {
        expect(() => validateItemConstraints({ fragile: false })).not.toThrow();
      });

      it('rejects non-boolean fragile', () => {
        expect(() => validateItemConstraints({ fragile: 'yes' as any }))
          .toThrow('fragile must be a boolean when provided');
      });
    });

    describe('stackable validation', () => {
      it('accepts true', () => {
        expect(() => validateItemConstraints({ stackable: true })).not.toThrow();
      });

      it('accepts false', () => {
        expect(() => validateItemConstraints({ stackable: false })).not.toThrow();
      });

      it('rejects non-boolean stackable', () => {
        expect(() => validateItemConstraints({ stackable: 'yes' as any }))
          .toThrow('stackable must be a boolean when provided');
      });
    });

    describe('paddingAllowanceMm validation', () => {
      it('accepts 0', () => {
        expect(() => validateItemConstraints({ paddingAllowanceMm: 0 })).not.toThrow();
      });

      it('accepts positive number', () => {
        expect(() => validateItemConstraints({ paddingAllowanceMm: 10 })).not.toThrow();
      });

      it('rejects negative number', () => {
        expect(() => validateItemConstraints({ paddingAllowanceMm: -5 }))
          .toThrow('paddingAllowanceMm must be ≥ 0 when provided');
      });

      it('rejects NaN', () => {
        expect(() => validateItemConstraints({ paddingAllowanceMm: NaN }))
          .toThrow('paddingAllowanceMm must be a finite number when provided');
      });

      it('rejects Infinity', () => {
        expect(() => validateItemConstraints({ paddingAllowanceMm: Infinity }))
          .toThrow('paddingAllowanceMm must be a finite number when provided');
      });

      it('rejects non-number', () => {
        expect(() => validateItemConstraints({ paddingAllowanceMm: '10' as any }))
          .toThrow('paddingAllowanceMm must be a finite number when provided');
      });
    });

    describe('spacingAllowanceMm validation', () => {
      it('accepts 0', () => {
        expect(() => validateItemConstraints({ spacingAllowanceMm: 0 })).not.toThrow();
      });

      it('accepts positive number', () => {
        expect(() => validateItemConstraints({ spacingAllowanceMm: 5 })).not.toThrow();
      });

      it('rejects negative number', () => {
        expect(() => validateItemConstraints({ spacingAllowanceMm: -2 }))
          .toThrow('spacingAllowanceMm must be ≥ 0 when provided');
      });

      it('rejects NaN', () => {
        expect(() => validateItemConstraints({ spacingAllowanceMm: NaN }))
          .toThrow('spacingAllowanceMm must be a finite number when provided');
      });

      it('rejects Infinity', () => {
        expect(() => validateItemConstraints({ spacingAllowanceMm: Infinity }))
          .toThrow('spacingAllowanceMm must be a finite number when provided');
      });

      it('rejects non-number', () => {
        expect(() => validateItemConstraints({ spacingAllowanceMm: '5' as any }))
          .toThrow('spacingAllowanceMm must be a finite number when provided');
      });
    });
  });

  describe('Item integration with constraints', () => {
    it('creates item with default constraints when none specified', () => {
      const item = createItem({
        id: 'item-1',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 1,
      });

      expect(item.constraints).toEqual(DEFAULT_ITEM_CONSTRAINTS);
    });

    it('creates item with partial constraints', () => {
      const item = createItem({
        id: 'item-2',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 1,
        constraints: {
          rotationPolicy: 'upright',
          fragile: true,
        },
      });

      expect(item.constraints).toEqual({
        rotationPolicy: 'upright',
        fragile: true,
        paddingAllowanceMm: 0,
        spacingAllowanceMm: 0,
        stackable: true,
      });
    });

    it('creates item with full custom constraints', () => {
      const item = createItem({
        id: 'item-3',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 1,
        constraints: {
          rotationPolicy: 'fixed',
          fragile: false,
          paddingAllowanceMm: 20,
          spacingAllowanceMm: 10,
          stackable: false,
        },
      });

      expect(item.constraints).toEqual({
        rotationPolicy: 'fixed',
        fragile: false,
        paddingAllowanceMm: 20,
        spacingAllowanceMm: 10,
        stackable: false,
      });
    });

    it('rejects item creation with invalid constraints', () => {
      expect(() =>
        createItem({
          id: 'item-4',
          dimensions: { length: 100, width: 50, height: 30 },
          quantity: 1,
          constraints: {
            rotationPolicy: 'invalid' as any,
          },
        })
      ).toThrow(ValidationError);
    });
  });
});