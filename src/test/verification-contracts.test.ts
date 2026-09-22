import { describe, it, expect } from 'vitest';

import type {
  VerificationIssueCode,
  VerificationIssue,
  VerificationReport,
} from '../core/verification/contracts.js';

describe('verification contracts', () => {
  describe('VerificationIssueCode', () => {
    it('contains all 10 required issue codes', () => {
      const allCodes: VerificationIssueCode[] = [
        'unknown-item',
        'unknown-carton',
        'invalid-instance',
        'boundary-violation',
        'overlap',
        'rotation-violation',
        'weight-limit',
        'quantity-mismatch',
        'unplaced-mismatch',
        'inventory-overuse',
      ];

      expect(allCodes).toHaveLength(10);

      // Verify type compatibility
      const code: VerificationIssueCode = 'overlap';
      expect(code).toBe('overlap');
    });
  });

  describe('VerificationIssue', () => {
    it('can be constructed with only required fields', () => {
      const issue: VerificationIssue = {
        code: 'boundary-violation',
        message: 'Item exceeds carton boundaries',
      };

      expect(issue).toBeDefined();
      expect(issue.code).toBe('boundary-violation');
      expect(issue.message).toBe('Item exceeds carton boundaries');
      expect(issue.itemId).toBeUndefined();
      expect(issue.instanceIndex).toBeUndefined();
      expect(issue.cartonIndex).toBeUndefined();
      expect(issue.cartonId).toBeUndefined();
    });

    it('can be constructed with all optional fields', () => {
      const issue: VerificationIssue = {
        code: 'overlap',
        message: 'Items overlap in carton',
        itemId: 'item-1',
        instanceIndex: 2,
        cartonIndex: 0,
        cartonId: 'carton-1',
      };

      expect(issue.code).toBe('overlap');
      expect(issue.message).toBe('Items overlap in carton');
      expect(issue.itemId).toBe('item-1');
      expect(issue.instanceIndex).toBe(2);
      expect(issue.cartonIndex).toBe(0);
      expect(issue.cartonId).toBe('carton-1');
    });

    it('accepts each issue code type', () => {
      const issue1: VerificationIssue = {
        code: 'unknown-item',
        message: 'Unknown item ID',
      };
      expect(issue1.code).toBe('unknown-item');

      const issue2: VerificationIssue = {
        code: 'weight-limit',
        message: 'Weight limit exceeded',
      };
      expect(issue2.code).toBe('weight-limit');

      const issue3: VerificationIssue = {
        code: 'quantity-mismatch',
        message: 'Quantity mismatch',
      };
      expect(issue3.code).toBe('quantity-mismatch');
    });
  });

  describe('VerificationReport', () => {
    it('can be constructed as valid empty report', () => {
      const report: VerificationReport = {
        valid: true,
        issues: [],
      };

      expect(report).toBeDefined();
      expect(report.valid).toBe(true);
      expect(report.issues).toHaveLength(0);
    });

    it('can be constructed as invalid report with issues', () => {
      const issue: VerificationIssue = {
        code: 'boundary-violation',
        message: 'Boundary violation detected',
        itemId: 'item-1',
        cartonId: 'carton-1',
      };

      const report: VerificationReport = {
        valid: false,
        issues: [issue],
      };

      expect(report.valid).toBe(false);
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0]?.code).toBe('boundary-violation');
      expect(report.issues[0]?.message).toBe('Boundary violation detected');
      expect(report.issues[0]?.itemId).toBe('item-1');
      expect(report.issues[0]?.cartonId).toBe('carton-1');
    });

    it('typed assignments preserve exact field structure', () => {
      // Type-only test to ensure structure is correct
      const report: VerificationReport = {
        valid: false,
        issues: [
          {
            code: 'rotation-violation',
            message: 'Rotation policy violation',
            instanceIndex: 1,
          },
        ],
      };

      // Access fields to verify structure
      expect(report.valid).toBe(false);
      expect(report.issues[0]?.code).toBe('rotation-violation');
      expect(report.issues[0]?.instanceIndex).toBe(1);
    });
  });
});