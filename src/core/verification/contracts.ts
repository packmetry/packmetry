/**
 * Independent verification contracts for Packmetry.
 *
 * @module verification/contracts
 */

/**
 * Issue codes for verification failures.
 */
export type VerificationIssueCode =
  | 'unknown-item'
  | 'unknown-carton'
  | 'invalid-instance'
  | 'boundary-violation'
  | 'overlap'
  | 'rotation-violation'
  | 'weight-limit'
  | 'quantity-mismatch'
  | 'unplaced-mismatch'
  | 'inventory-overuse';

/**
 * A single verification issue.
 */
export interface VerificationIssue {
  code: VerificationIssueCode;
  message: string;
  itemId?: string;
  instanceIndex?: number;
  cartonIndex?: number;
  cartonId?: string;
}

/**
 * Report from independent verification of a candidate plan.
 *
 * Invariant: `valid === (issues.length === 0)`
 */
export interface VerificationReport {
  valid: boolean;
  issues: VerificationIssue[];
}