import type { SolverMeta } from '../domain/plan-contracts.js';
import type { VerificationReport } from '../verification/contracts.js';
import { verifyCandidatePlan } from '../verification/verifier.js';
import type {
  SolverAdapter,
  SolverCandidatePlan,
  SolverInput,
} from './contracts.js';

export interface CandidateVerificationResult {
  candidate: SolverCandidatePlan;
  verification: VerificationReport;
}

export interface SolverVerificationResult {
  candidates: CandidateVerificationResult[];
  solverMeta: SolverMeta;
}

export async function solveAndVerify(
  solver: SolverAdapter,
  input: SolverInput
): Promise<SolverVerificationResult> {
  const output = await solver.solve(input);

  return {
    candidates: output.candidates.map(candidate => ({
      candidate,
      verification: verifyCandidatePlan(input, candidate),
    })),
    solverMeta: output.solverMeta,
  };
}