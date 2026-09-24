import type { PackingPlan } from '../domain/packing-plan.js';
import { constructPackingPlan } from '../domain/plan-construction.js';
import type {
  SolverAdapter,
  SolverInput,
} from './contracts.js';
import {
  solveAndVerify,
  type SolverVerificationResult,
} from './integration.js';
import {
  selectVerifiedCandidate,
  type CandidateSelectionResult,
} from './selection.js';

export type SelectedCandidateSelection = Extract<
  CandidateSelectionResult,
  { kind: 'selected' }
>;

export type UnselectedCandidateSelection = Exclude<
  CandidateSelectionResult,
  { kind: 'selected' }
>;

export type CanonicalPlanningResult =
  | {
      kind: 'planned';
      plan: PackingPlan;
      verification: SolverVerificationResult;
      selection: SelectedCandidateSelection;
    }
  | {
      kind: 'not-planned';
      verification: SolverVerificationResult;
      selection: UnselectedCandidateSelection;
    };

export async function planPacking(
  planId: string,
  solver: SolverAdapter,
  input: SolverInput
): Promise<CanonicalPlanningResult> {
  const verification = await solveAndVerify(solver, input);

  const selection = selectVerifiedCandidate(
    input,
    verification.candidates
  );

  if (selection.kind !== 'selected') {
    return {
      kind: 'not-planned',
      verification,
      selection,
    };
  }

  const selectedCandidate =
    verification.candidates[selection.selectedCandidateIndex];

  if (!selectedCandidate) {
    throw new Error(
      `Selected candidate index is out of range: ${selection.selectedCandidateIndex}`
    );
  }

  const plan = constructPackingPlan(
    planId,
    input,
    selectedCandidate,
    verification.solverMeta
  );

  return {
    kind: 'planned',
    plan,
    verification,
    selection,
  };
}
