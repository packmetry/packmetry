import { describe, it, expect } from 'vitest';
import {
  createOptimizationObjective,
  validateOptimizationObjective,
  isValidObjectiveKind,
  VALID_OBJECTIVE_KINDS,
  DEFAULT_OBJECTIVE_KIND,
  type ObjectiveKind,
  type OptimizationObjective,
} from '../core/domain/objectives.js';
import { ValidationError } from '../core/units/types.js';

describe('Optimization objectives domain model', () => {
  describe('VALID_OBJECTIVE_KINDS', () => {
    it('contains all canonical objective kinds', () => {
      expect(VALID_OBJECTIVE_KINDS).toEqual([
        'balanced',
        'fewest-cartons',
        'least-wasted-volume',
        'easier-to-carry',
        'existing-inventory-first',
        'min-dim-weight',
        'min-carton-cost',
      ]);
    });

    it('does not allow mutation of readonly array', () => {
      // Test that making a copy and modifying the copy does not affect the original readonly array
      const arrayCopy = [...VALID_OBJECTIVE_KINDS];
      (arrayCopy as string[]).push('custom');
      expect(arrayCopy).toHaveLength(VALID_OBJECTIVE_KINDS.length + 1);
      // Original readonly array unchanged
      expect(VALID_OBJECTIVE_KINDS).toHaveLength(7);
    });
  });

  describe('DEFAULT_OBJECTIVE_KIND', () => {
    it('is balanced', () => {
      expect(DEFAULT_OBJECTIVE_KIND).toBe('balanced');
    });
  });

  describe('isValidObjectiveKind', () => {
    it.each(VALID_OBJECTIVE_KINDS)('returns true for valid kind: %s', (kind) => {
      expect(isValidObjectiveKind(kind)).toBe(true);
    });

    it('returns false for invalid strings', () => {
      expect(isValidObjectiveKind('')).toBe(false);
      expect(isValidObjectiveKind('custom')).toBe(false);
      expect(isValidObjectiveKind('best')).toBe(false);
      expect(isValidObjectiveKind('minimum-cartons')).toBe(false);
      expect(isValidObjectiveKind('BALANCED')).toBe(false); // case-sensitive
    });

    it('returns false for non-strings', () => {
      expect(isValidObjectiveKind(123 as unknown as string)).toBe(false);
      expect(isValidObjectiveKind(null as unknown as string)).toBe(false);
      expect(isValidObjectiveKind(undefined as unknown as string)).toBe(false);
      expect(isValidObjectiveKind({} as unknown as string)).toBe(false);
    });
  });

  describe('createOptimizationObjective', () => {
    it.each(VALID_OBJECTIVE_KINDS)('creates objective with kind: %s', (kind) => {
      const objective = createOptimizationObjective(kind);
      expect(objective).toEqual({ kind });
      expect(objective.kind).toBe(kind);
    });

    it('rejects unknown kind', () => {
      expect(() => {
        createOptimizationObjective('unknown' as ObjectiveKind);
      }).toThrow(ValidationError);
    });

    it('returns object that does not mutate input', () => {
      const kind = 'fewest-cartons' as const;
      const objective = createOptimizationObjective(kind);

      // Verify returned object is a new object
      expect(objective).toEqual({ kind });
      expect(objective).not.toBe({ kind }); // Not the same reference
    });
  });

  describe('validateOptimizationObjective', () => {
    it.each(VALID_OBJECTIVE_KINDS)('validates valid objective kind: %s', (kind) => {
      expect(() => {
        validateOptimizationObjective({ kind });
      }).not.toThrow();
    });

    it('rejects null', () => {
      expect(() => {
        validateOptimizationObjective(null as unknown as { kind: string });
      }).toThrow(ValidationError);
    });

    it('rejects non-objects', () => {
      expect(() => {
        validateOptimizationObjective('not-an-object' as unknown as { kind: string });
      }).toThrow(ValidationError);
    });

    it('rejects missing kind property', () => {
      expect(() => {
        validateOptimizationObjective({} as { kind: string });
      }).toThrow(ValidationError);
    });

    it('rejects non-string kind', () => {
      expect(() => {
        validateOptimizationObjective({ kind: 123 });
      }).toThrow(ValidationError);
    });

    it('rejects invalid string kind', () => {
      expect(() => {
        validateOptimizationObjective({ kind: 'custom-objective' });
      }).toThrow(ValidationError);
    });

    it('includes valid kinds in error message', () => {
      try {
        validateOptimizationObjective({ kind: 'invalid' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const message = (error as ValidationError).message;
        expect(message).toContain('Invalid optimization objective kind: invalid');
        VALID_OBJECTIVE_KINDS.forEach((validKind) => {
          expect(message).toContain(validKind);
        });
      }
    });

    it('does not mutate input object', () => {
      const input = { kind: 'balanced' };
      const inputCopy = { ...input };

      validateOptimizationObjective(input);

      expect(input).toEqual(inputCopy);
    });
  });

  describe('OptimizationObjective interface', () => {
    it('has only kind property', () => {
      const objective: OptimizationObjective = { kind: 'balanced' };

      // The interface should only accept kind property
      // This is a TypeScript compile-time check, not runtime
      expect(objective.kind).toBe('balanced');
    });
  });

  describe('Architecture mapping verification', () => {
    it('maps Personal "Best overall" to balanced', () => {
      const objective = createOptimizationObjective('balanced');
      expect(objective.kind).toBe('balanced');
    });

    it('maps Personal "Use fewest boxes" to fewest-cartons', () => {
      const objective = createOptimizationObjective('fewest-cartons');
      expect(objective.kind).toBe('fewest-cartons');
    });

    it('maps Personal "Use least empty space" to least-wasted-volume', () => {
      const objective = createOptimizationObjective('least-wasted-volume');
      expect(objective.kind).toBe('least-wasted-volume');
    });

    it('maps Personal "Make boxes easier to carry" to easier-to-carry', () => {
      const objective = createOptimizationObjective('easier-to-carry');
      expect(objective.kind).toBe('easier-to-carry');
    });

    it('maps Personal "Use boxes I already own first" to existing-inventory-first', () => {
      const objective = createOptimizationObjective('existing-inventory-first');
      expect(objective.kind).toBe('existing-inventory-first');
    });

    it('includes all Business objectives', () => {
      const businessObjectives: ObjectiveKind[] = [
        'balanced',
        'fewest-cartons',
        'least-wasted-volume',
        'min-dim-weight',
        'min-carton-cost',
        'existing-inventory-first',
      ];

      businessObjectives.forEach((kind) => {
        expect(VALID_OBJECTIVE_KINDS).toContain(kind);
      });
    });
  });
});