ADR-006: Solver Verification Integration Contract

Status

Accepted

Context

ADR-003 defines the async SolverAdapter boundary and establishes that solver candidate output is not trusted canonical output.

ADR-004 defines verifyCandidatePlan(...) as the independent verification boundary and requires solver candidates to be checked independently before they can contribute to a canonical result.

ADR-005 defines the deterministic baseline solver, which now implements SolverAdapter and is exposed through the solver public API.

The project now needs a small orchestration path connecting:

normalized SolverInput
→ SolverAdapter.solve(...)
→ solver candidate output
→ independent verifyCandidatePlan(...)
→ candidate verification results

This integration must preserve solver interchangeability and independent verification without prematurely defining canonical PackingPlan construction, explanation generation, objective scoring, candidate ranking, or other behavior explicitly deferred by ADR-004.

Decision

Integration function

The v1 solver-verification integration API is:

async function solveAndVerify(
  solver: SolverAdapter,
  input: SolverInput
): Promise<SolverVerificationResult>

The solver is injected through the existing SolverAdapter interface.

The integration layer must not depend specifically on BaselineSolver.

BaselineSolver is the current production solver, but future solver adapters must be usable through the same integration path without changing the contract.

CandidateVerificationResult

Each solver candidate is paired with its independent verification report:

interface CandidateVerificationResult {
  candidate: SolverCandidatePlan;
  verification: VerificationReport;
}

A CandidateVerificationResult may contain either:

a valid candidate with verification.valid === true; or

an invalid candidate with verification.valid === false.

Invalid candidates are retained for inspection.

They are not silently removed or converted into another result shape.

SolverVerificationResult

The integration result is:

interface SolverVerificationResult {
  candidates: CandidateVerificationResult[];
  solverMeta: SolverMeta;
}

solverMeta is carried through from the original SolverOutput unchanged.

The order of candidates must exactly match the order returned by the solver.

Required execution behavior

solveAndVerify(...) must:

call solver.solve(input) exactly once;

preserve the solver candidate array order;

independently call verifyCandidatePlan(input, candidate) exactly once for every returned candidate;

pair each candidate with its corresponding VerificationReport;

preserve the solver metadata unchanged;

return both valid and invalid candidate verification results;

avoid mutating the caller-owned SolverInput;

avoid mutating solver candidate output.

Verification authority

A solver candidate's own status or internal feasibility checks do not establish independent validity.

For this integration boundary:

candidate verification validity
=
VerificationReport.valid

The integration layer must not override, repair, reinterpret, or silently correct a candidate because verification found an issue.

Verification issues remain observable in the returned VerificationReport.

Candidate status

ADR-004 explicitly defers candidate-status consistency verification.

Therefore this integration layer does not attempt to prove that:

SolverCandidatePlan.status

is semantically consistent with placements or unplaced items beyond the checks already defined by ADR-004.

No new verification issue code is introduced by this ADR.

Multiple candidates

ADR-003 retains an array of candidates even though the current baseline solver returns exactly one.

The integration layer therefore verifies every candidate returned by a solver.

It must not:

select a preferred candidate;

rank candidates;

reorder candidates;

discard invalid candidates;

stop after the first valid candidate.

Candidate selection and ranking remain separate future responsibilities.

Errors

Normal packing infeasibility is represented through solver candidate status and unplaced items and must not be converted into an exception.

Normal verification failures are represented through VerificationReport.issues and must not be converted into an exception.

If SolverAdapter.solve(...) rejects because of an unexpected execution failure, solveAndVerify(...) also rejects.

If independent verification throws for an exceptional invalid-input/programming condition allowed by ADR-004, that error propagates.

No custom integration error type is introduced in v1.

No canonical PackingPlan construction

SolverVerificationResult is not a PackingPlan.

This ADR does not define:

canonical PackedCarton construction;

carton metrics calculation;

plan metrics calculation;

explanation generation;

candidate ranking;

objective scoring;

plan ID generation;

final candidate selection;

candidate-status consistency rules.

Those remain downstream work and require their own defined semantics before implementation.

The integration path ends after independent verification.

No solver fallback or retry

The v1 integration layer invokes only the supplied SolverAdapter.

It does not:

retry failed solver execution;

invoke fallback solvers;

compare multiple solver implementations;

impose time limits;

add cancellation;

add progress callbacks.

Those capabilities remain outside this ADR.

Input and output ownership

The integration layer is non-mutating.

It must not modify:

SolverInput;

items;

cartons;

objective;

solver candidate plans;

placements;

unplaced items;

solver metadata.

No IDs are generated or rewritten by this integration step.

Alternatives considered

Immediately convert valid candidates into PackingPlan
Rejected because ADR-004 explicitly defers canonical PackingPlan construction and related metric/explanation semantics.

Return only valid candidates
Rejected because verification failures must remain observable and must not be silently discarded.

Integrate directly with BaselineSolver
Rejected because ADR-003 requires interchangeable solver architecture.

Stop after the first valid candidate
Rejected because the solver contract supports multiple candidates and candidate selection/ranking semantics are not yet defined.

Throw when candidate verification fails
Rejected because ordinary verification failures are represented by VerificationReport, not exceptions.

Repair invalid solver candidates automatically
Rejected because independent verification must observe solver output rather than silently changing it.

Consequences

Positive

Establishes the first complete solver → verifier execution path.

Preserves independent verification as a separate authority.

Keeps the baseline solver replaceable.

Supports future multi-candidate solvers.

Keeps invalid solver output observable for debugging and testing.

Avoids prematurely inventing canonical result semantics.

Provides a stable boundary for later PackingPlan construction.

Limitations

Does not yet produce a canonical PackingPlan.

Does not rank or select candidates.

Does not verify candidate-status consistency.

Does not generate metrics or explanations.

Does not provide fallback, retry, cancellation, or progress handling.

Authority relationship

This ADR connects the existing contracts defined by ADR-003, ADR-004, and ADR-005.

It preserves the authority flow:

normalized input
→ solver adapter
→ candidate output
→ independent verification
→ canonical verified result later

It does not supersede ADR-003, ADR-004, or ADR-005.

It intentionally stops before behavior that ADR-004 explicitly deferred.

Validation / revisit trigger

Revisit this ADR when:

canonical PackingPlan construction is defined;

candidate selection or ranking is introduced;

objective scoring is implemented;

candidate-status consistency becomes independently verified;

fallback or multi-solver orchestration is introduced;

cancellation or progress reporting is added.