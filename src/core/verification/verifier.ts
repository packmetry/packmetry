import type {
  SolverCandidatePlan,
  SolverInput,
} from '../solver/contracts.js';
import type { VerificationReport } from './contracts.js';
import { collectReferenceAndQuantityIssues } from './references.js';
import { collectGeometryIssues } from './geometry.js';
import { collectLimitIssues } from './limits.js';

export function verifyCandidatePlan(
  input: SolverInput,
  candidate: SolverCandidatePlan
): VerificationReport {
  const issues = [
    ...collectReferenceAndQuantityIssues(input, candidate),
    ...collectGeometryIssues(input, candidate),
    ...collectLimitIssues(input, candidate),
  ];

  return {
    valid: issues.length === 0,
    issues,
  };
}