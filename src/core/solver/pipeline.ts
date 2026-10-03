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
      alternatives: PackingPlan[];
      verification: SolverVerificationResult;
      selection: SelectedCandidateSelection;
    }
  | {
      kind: 'not-planned';
      verification: SolverVerificationResult;
      selection: UnselectedCandidateSelection;
    };

function candidateAt(
  verification: SolverVerificationResult,
  candidateIndex: number,
  description: 'Selected' | 'Ranked'
) {
  const candidate =
    verification.candidates[
      candidateIndex
    ];

  if (!candidate) {
    throw new Error(
      `${description} candidate index is out of range: ${candidateIndex}`
    );
  }

  return candidate;
}

function materializeAlternativePlans(
  planId: string,
  input: SolverInput,
  verification: SolverVerificationResult,
  selection: SelectedCandidateSelection
): PackingPlan[] {
  return selection.rankedCandidateIndexes
    .slice(1)
    .map(
      (
        candidateIndex,
        alternativeIndex
      ) =>
        constructPackingPlan(
          `${planId}:alternative:${alternativeIndex + 1}`,
          input,
          candidateAt(
            verification,
            candidateIndex,
            'Ranked'
          ),
          verification.solverMeta
        )
    );
}

export async function planPacking(
  planId: string,
  solver: SolverAdapter,
  input: SolverInput
): Promise<CanonicalPlanningResult> {
  const verification =
    await solveAndVerify(
      solver,
      input
    );

  const selection =
    selectVerifiedCandidate(
      input,
      verification.candidates
    );

  if (
    selection.kind !==
    'selected'
  ) {
    return {
      kind: 'not-planned',
      verification,
      selection,
    };
  }

  const selectedCandidate =
    candidateAt(
      verification,
      selection.selectedCandidateIndex,
      'Selected'
    );

  const plan =
    constructPackingPlan(
      planId,
      input,
      selectedCandidate,
      verification.solverMeta
    );

  const alternatives =
    materializeAlternativePlans(
      planId,
      input,
      verification,
      selection
    );

  return {
    kind: 'planned',
    plan,
    alternatives,
    verification,
    selection,
  };
}
