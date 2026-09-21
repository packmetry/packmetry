import { describe, it, expect } from 'vitest';
import {
  type UnplacedItem,
  type CartonMetrics,
  type PlanMetrics,
  type Explanation,
  type SolverMeta,
  validateUnplacedReason,
  validateUnplacedItem,
  validateCartonMetrics,
  validatePlanMetrics,
  validateExplanationLevel,
  validateExplanation,
  validateSolverMeta,
} from '../core/domain/plan-contracts.js';
import { ValidationError } from '../core/units/types.js';

describe('plan-contracts module', () => {
  describe('UnplacedReason', () => {
    it.each([
      'no-fitting-carton',
      'inventory-exhausted',
      'weight-limit',
      'constraint-conflict',
      'solver-limit-reached',
    ])('accepts valid reason: %s', (reason) => {
      expect(() => validateUnplacedReason(reason)).not.toThrow();
    });

    it.each([
      'invalid-reason',
      'unknown',
      '',
      null,
      undefined,
      123,
      {},
    ])('rejects invalid reason: %s', (reason) => {
      expect(() => validateUnplacedReason(reason)).toThrow(ValidationError);
    });
  });

  describe('UnplacedItem', () => {
    const validUnplacedItem: UnplacedItem = {
      itemId: 'item-123',
      instanceIndex: 0,
      reason: 'no-fitting-carton',
    };

    it('accepts a valid UnplacedItem', () => {
      expect(() => validateUnplacedItem(validUnplacedItem)).not.toThrow();
    });

    it('accepts empty string for itemId (per ADR)', () => {
      const item = { ...validUnplacedItem, itemId: '' };
      expect(() => validateUnplacedItem(item)).not.toThrow();
    });

    it.each([
      [{ ...validUnplacedItem, itemId: 123 as never }, 'itemId must be a string'],
      [{ ...validUnplacedItem, instanceIndex: -1 }, 'instanceIndex must be ≥ 0'],
      [{ ...validUnplacedItem, instanceIndex: 0.5 }, 'instanceIndex must be an integer'],
      [{ ...validUnplacedItem, instanceIndex: NaN }, 'instanceIndex must be a finite number'],
      [{ ...validUnplacedItem, instanceIndex: Infinity }, 'instanceIndex must be a finite number'],
      [{ ...validUnplacedItem, reason: 'invalid' }, 'Invalid UnplacedReason'],
      [null, 'must be an object'],
      [{}, 'itemId must be a string'],
    ])('rejects invalid UnplacedItem %j', (item, expectedError) => {
      expect(() => validateUnplacedItem(item)).toThrow(ValidationError);
      expect(() => validateUnplacedItem(item)).toThrow(expectedError);
    });
  });

  describe('CartonMetrics', () => {
    const validCartonMetrics: CartonMetrics = {
      itemCount: 5,
      itemVolumeMm3: 10000,
      cartonVolumeMm3: 15000,
      emptyVolumeMm3: 5000,
      utilization: 0.6667,
    };

    it('accepts a valid CartonMetrics', () => {
      expect(() => validateCartonMetrics(validCartonMetrics)).not.toThrow();
    });

    it('accepts CartonMetrics with all optional fields', () => {
      const metrics: CartonMetrics = {
        ...validCartonMetrics,
        contentsWeightG: 2500,
        grossWeightG: 3000,
      };
      expect(() => validateCartonMetrics(metrics)).not.toThrow();
    });

    it.each([
      // invalid itemCount
      [{ ...validCartonMetrics, itemCount: -1 }, 'itemCount must be ≥ 0'],
      [{ ...validCartonMetrics, itemCount: 0.5 }, 'itemCount must be an integer'],
      [{ ...validCartonMetrics, itemCount: NaN }, 'itemCount must be a finite number'],
      [{ ...validCartonMetrics, itemCount: Infinity }, 'itemCount must be a finite number'],

      // invalid itemVolumeMm3
      [{ ...validCartonMetrics, itemVolumeMm3: -1 }, 'itemVolumeMm3 must be ≥ 0'],
      [{ ...validCartonMetrics, itemVolumeMm3: NaN }, 'itemVolumeMm3 must be a finite number'],
      [{ ...validCartonMetrics, itemVolumeMm3: Infinity }, 'itemVolumeMm3 must be a finite number'],

      // invalid cartonVolumeMm3
      [{ ...validCartonMetrics, cartonVolumeMm3: -1 }, 'cartonVolumeMm3 must be ≥ 0'],
      [{ ...validCartonMetrics, cartonVolumeMm3: NaN }, 'cartonVolumeMm3 must be a finite number'],
      [{ ...validCartonMetrics, cartonVolumeMm3: Infinity }, 'cartonVolumeMm3 must be a finite number'],

      // invalid emptyVolumeMm3
      [{ ...validCartonMetrics, emptyVolumeMm3: -1 }, 'emptyVolumeMm3 must be ≥ 0'],
      [{ ...validCartonMetrics, emptyVolumeMm3: NaN }, 'emptyVolumeMm3 must be a finite number'],
      [{ ...validCartonMetrics, emptyVolumeMm3: Infinity }, 'emptyVolumeMm3 must be a finite number'],

      // invalid utilization
      [{ ...validCartonMetrics, utilization: -0.1 }, 'utilization must be between 0 and 1'],
      [{ ...validCartonMetrics, utilization: 1.1 }, 'utilization must be between 0 and 1'],
      [{ ...validCartonMetrics, utilization: NaN }, 'utilization must be a finite number'],
      [{ ...validCartonMetrics, utilization: Infinity }, 'utilization must be a finite number'],

      // invalid optional contentsWeightG
      [{ ...validCartonMetrics, contentsWeightG: -1 }, 'contentsWeightG must be ≥ 0 when provided'],
      [{ ...validCartonMetrics, contentsWeightG: NaN }, 'contentsWeightG must be a finite number when provided'],
      [{ ...validCartonMetrics, contentsWeightG: Infinity }, 'contentsWeightG must be a finite number when provided'],

      // invalid optional grossWeightG
      [{ ...validCartonMetrics, grossWeightG: -1 }, 'grossWeightG must be ≥ 0 when provided'],
      [{ ...validCartonMetrics, grossWeightG: NaN }, 'grossWeightG must be a finite number when provided'],
      [{ ...validCartonMetrics, grossWeightG: Infinity }, 'grossWeightG must be a finite number when provided'],

      // general invalid
      [null, 'must be an object'],
      [{}, 'itemCount must be a finite number'],
    ])('rejects invalid CartonMetrics %j', (metrics, expectedError) => {
      expect(() => validateCartonMetrics(metrics)).toThrow(ValidationError);
      expect(() => validateCartonMetrics(metrics)).toThrow(expectedError);
    });
  });

  describe('PlanMetrics', () => {
    const validPlanMetrics: PlanMetrics = {
      cartonCount: 3,
      placedItemCount: 15,
      unplacedItemCount: 2,
      itemVolumeMm3: 30000,
      cartonVolumeMm3: 45000,
      emptyVolumeMm3: 15000,
      utilization: 0.6667,
    };

    it('accepts a valid PlanMetrics', () => {
      expect(() => validatePlanMetrics(validPlanMetrics)).not.toThrow();
    });

    it('accepts PlanMetrics with all optional fields', () => {
      const metrics: PlanMetrics = {
        ...validPlanMetrics,
        totalContentsWeightG: 7500,
        totalGrossWeightG: 9000,
        totalCartonCost: 7.5,
      };
      expect(() => validatePlanMetrics(metrics)).not.toThrow();
    });

    it.each([
      // invalid cartonCount
      [{ ...validPlanMetrics, cartonCount: -1 }, 'cartonCount must be ≥ 0'],
      [{ ...validPlanMetrics, cartonCount: 0.5 }, 'cartonCount must be an integer'],
      [{ ...validPlanMetrics, cartonCount: NaN }, 'cartonCount must be a finite number'],
      [{ ...validPlanMetrics, cartonCount: Infinity }, 'cartonCount must be a finite number'],

      // invalid placedItemCount
      [{ ...validPlanMetrics, placedItemCount: -1 }, 'placedItemCount must be ≥ 0'],
      [{ ...validPlanMetrics, placedItemCount: 0.5 }, 'placedItemCount must be an integer'],
      [{ ...validPlanMetrics, placedItemCount: NaN }, 'placedItemCount must be a finite number'],
      [{ ...validPlanMetrics, placedItemCount: Infinity }, 'placedItemCount must be a finite number'],

      // invalid unplacedItemCount
      [{ ...validPlanMetrics, unplacedItemCount: -1 }, 'unplacedItemCount must be ≥ 0'],
      [{ ...validPlanMetrics, unplacedItemCount: 0.5 }, 'unplacedItemCount must be an integer'],
      [{ ...validPlanMetrics, unplacedItemCount: NaN }, 'unplacedItemCount must be a finite number'],
      [{ ...validPlanMetrics, unplacedItemCount: Infinity }, 'unplacedItemCount must be a finite number'],

      // invalid itemVolumeMm3
      [{ ...validPlanMetrics, itemVolumeMm3: -1 }, 'itemVolumeMm3 must be ≥ 0'],
      [{ ...validPlanMetrics, itemVolumeMm3: NaN }, 'itemVolumeMm3 must be a finite number'],
      [{ ...validPlanMetrics, itemVolumeMm3: Infinity }, 'itemVolumeMm3 must be a finite number'],

      // invalid cartonVolumeMm3
      [{ ...validPlanMetrics, cartonVolumeMm3: -1 }, 'cartonVolumeMm3 must be ≥ 0'],
      [{ ...validPlanMetrics, cartonVolumeMm3: NaN }, 'cartonVolumeMm3 must be a finite number'],
      [{ ...validPlanMetrics, cartonVolumeMm3: Infinity }, 'cartonVolumeMm3 must be a finite number'],

      // invalid emptyVolumeMm3
      [{ ...validPlanMetrics, emptyVolumeMm3: -1 }, 'emptyVolumeMm3 must be ≥ 0'],
      [{ ...validPlanMetrics, emptyVolumeMm3: NaN }, 'emptyVolumeMm3 must be a finite number'],
      [{ ...validPlanMetrics, emptyVolumeMm3: Infinity }, 'emptyVolumeMm3 must be a finite number'],

      // invalid utilization
      [{ ...validPlanMetrics, utilization: -0.1 }, 'utilization must be between 0 and 1'],
      [{ ...validPlanMetrics, utilization: 1.1 }, 'utilization must be between 0 and 1'],
      [{ ...validPlanMetrics, utilization: NaN }, 'utilization must be a finite number'],
      [{ ...validPlanMetrics, utilization: Infinity }, 'utilization must be a finite number'],

      // invalid optional totalContentsWeightG
      [{ ...validPlanMetrics, totalContentsWeightG: -1 }, 'totalContentsWeightG must be ≥ 0 when provided'],
      [{ ...validPlanMetrics, totalContentsWeightG: NaN }, 'totalContentsWeightG must be a finite number when provided'],
      [{ ...validPlanMetrics, totalContentsWeightG: Infinity }, 'totalContentsWeightG must be a finite number when provided'],

      // invalid optional totalGrossWeightG
      [{ ...validPlanMetrics, totalGrossWeightG: -1 }, 'totalGrossWeightG must be ≥ 0 when provided'],
      [{ ...validPlanMetrics, totalGrossWeightG: NaN }, 'totalGrossWeightG must be a finite number when provided'],
      [{ ...validPlanMetrics, totalGrossWeightG: Infinity }, 'totalGrossWeightG must be a finite number when provided'],

      // invalid optional totalCartonCost
      [{ ...validPlanMetrics, totalCartonCost: -1 }, 'totalCartonCost must be ≥ 0 when provided'],
      [{ ...validPlanMetrics, totalCartonCost: NaN }, 'totalCartonCost must be a finite number when provided'],
      [{ ...validPlanMetrics, totalCartonCost: Infinity }, 'totalCartonCost must be a finite number when provided'],

      // general invalid
      [null, 'must be an object'],
      [{}, 'cartonCount must be a finite number'],
    ])('rejects invalid PlanMetrics %j', (metrics, expectedError) => {
      expect(() => validatePlanMetrics(metrics)).toThrow(ValidationError);
      expect(() => validatePlanMetrics(metrics)).toThrow(expectedError);
    });
  });

  describe('ExplanationLevel', () => {
    it.each(['info', 'warning'])('accepts valid level: %s', (level) => {
      expect(() => validateExplanationLevel(level)).not.toThrow();
    });

    it.each([
      'error',
      'critical',
      '',
      null,
      undefined,
      123,
      {},
    ])('rejects invalid level: %s', (level) => {
      expect(() => validateExplanationLevel(level)).toThrow(ValidationError);
    });
  });

  describe('Explanation', () => {
    const validExplanation: Explanation = {
      code: 'SOLVER_COMPLETED',
      message: 'Packing completed successfully',
      level: 'info',
    };

    it('accepts a valid Explanation', () => {
      expect(() => validateExplanation(validExplanation)).not.toThrow();
    });

    it.each([
      [{ ...validExplanation, code: '' }, 'code must be a non-empty string'],
      [{ ...validExplanation, code: 123 as never }, 'code must be a string'],
      [{ ...validExplanation, message: '' }, 'message must be a non-empty string'],
      [{ ...validExplanation, message: 456 as never }, 'message must be a string'],
      [{ ...validExplanation, level: 'invalid' }, 'Invalid ExplanationLevel'],
      [null, 'must be an object'],
      [{}, 'code must be a string'],
    ])('rejects invalid Explanation %j', (explanation, expectedError) => {
      expect(() => validateExplanation(explanation)).toThrow(ValidationError);
      expect(() => validateExplanation(explanation)).toThrow(expectedError);
    });
  });

  describe('SolverMeta', () => {
    const validSolverMeta: SolverMeta = {
      solverId: 'bin-packer-v1',
      durationMs: 150.5,
      deterministic: true,
    };

    it('accepts a valid SolverMeta', () => {
      expect(() => validateSolverMeta(validSolverMeta)).not.toThrow();
    });

    it('accepts fractional durationMs (1.5)', () => {
      const meta = { ...validSolverMeta, durationMs: 1.5 };
      expect(() => validateSolverMeta(meta)).not.toThrow();
    });

    it('accepts SolverMeta with solverVersion', () => {
      const meta: SolverMeta = {
        ...validSolverMeta,
        solverVersion: '1.2.3',
      };
      expect(() => validateSolverMeta(meta)).not.toThrow();
    });

    it.each([
      // invalid solverId
      [{ ...validSolverMeta, solverId: '' }, 'solverId must be a non-empty string'],
      [{ ...validSolverMeta, solverId: 123 as never }, 'solverId must be a string'],

      // invalid solverVersion
      [{ ...validSolverMeta, solverVersion: '' }, 'solverVersion must be a non-empty string when provided'],
      [{ ...validSolverMeta, solverVersion: 456 as never }, 'solverVersion must be a string when provided'],

      // invalid durationMs
      [{ ...validSolverMeta, durationMs: -1 }, 'durationMs must be ≥ 0'],
      [{ ...validSolverMeta, durationMs: NaN }, 'durationMs must be a finite number'],
      [{ ...validSolverMeta, durationMs: Infinity }, 'durationMs must be a finite number'],

      // invalid deterministic
      [{ ...validSolverMeta, deterministic: 'true' as never }, 'deterministic must be a boolean'],
      [{ ...validSolverMeta, deterministic: null }, 'deterministic must be a boolean'],

      // general invalid
      [null, 'must be an object'],
      [{}, 'solverId must be a string'],
    ])('rejects invalid SolverMeta %j', (meta, expectedError) => {
      expect(() => validateSolverMeta(meta)).toThrow(ValidationError);
      expect(() => validateSolverMeta(meta)).toThrow(expectedError);
    });
  });
});