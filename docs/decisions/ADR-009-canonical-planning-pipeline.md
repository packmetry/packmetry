ADR-009: Canonical Planning Pipeline

Status

Accepted

Context

ADR-003 defines the SolverAdapter boundary and requires solver implementations to return non-canonical SolverCandidatePlan values.

ADR-004 defines independent verification as the trust boundary for solver candidate output.

ADR-006 defines solveAndVerify(...) and preserves every solver candidate together with its VerificationReport and original SolverMeta.

ADR-007 defines constructPackingPlan(...) for converting exactly one already-selected independently valid candidate into one canonical PackingPlan.

ADR-008 defines deterministic objective-aware selection through selectVerifiedCandidate(...), including normal non-selection outcomes:

no-valid-candidate

objective-unsupported

insufficient-data

The repository therefore has all required individual stages for the canonical planning path, but callers currently have to compose those stages themselves.

That manual composition creates a risk that different callers will:

pick the first valid candidate instead of using objective-aware selection;

silently fall back when the selected objective cannot be evaluated;

discard verification diagnostics;

construct a canonical plan from the wrong candidate;

rerun the solver or verifier unnecessarily;

generate plan IDs inconsistently;

or bypass one of the architecture boundaries already defined by ADR-003 through ADR-008.

The project needs one small orchestration boundary that connects the existing stages without changing their individual authority.

This ADR defines that canonical planning pipeline only.

It does not change solver behavior, verification semantics, objective ranking, canonical metric formulas, plan-ID policy, explanation generation, alternative generation, UI presentation, persistence, export behavior, DIM-weight semantics, or owned-vs-buy carton modeling.

Decision

Pipeline position

The canonical planning pipeline is:

normalized SolverInput
→ SolverAdapter.solve(...)
→ independent verification
→ objective-aware candidate selection
→ canonical PackingPlan construction

The implementation reuses the existing public contracts rather than duplicating their logic.

Conceptual API

The v1 orchestration API is conceptually:

async function planPacking(
planId: string,
solver: SolverAdapter,
input: SolverInput
): Promise<CanonicalPlanningResult>

The caller supplies:

planId;

the SolverAdapter implementation;

the normalized SolverInput.

The pipeline must not create or normalize those values itself.

Result contract

The v1 result is a discriminated union conceptually equivalent to:

type SelectedCandidateSelection = Extract<
CandidateSelectionResult,
{ kind: 'selected' }

;

type UnselectedCandidateSelection = Exclude<
CandidateSelectionResult,
{ kind: 'selected' }

;

type CanonicalPlanningResult =
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

A successful pipeline therefore returns:

kind = 'planned'

together with:

the canonical PackingPlan;

the complete upstream SolverVerificationResult;

the exact successful CandidateSelectionResult.

A normal selection failure returns:

kind = 'not-planned'

together with:

the complete upstream SolverVerificationResult;

the exact non-selected CandidateSelectionResult.

The pipeline must not invent a second failure taxonomy that duplicates ADR-008.

Normal non-selection states

The following ADR-008 outcomes are normal non-exception pipeline results:

no-valid-candidate

objective-unsupported

insufficient-data

For each of these:

kind = 'not-planned'

No canonical PackingPlan is created.

The original verification result remains available to the caller.

No fallback objective is selected automatically.

No candidate is silently promoted.

No exception is thrown merely because selection did not produce a winner.

Successful execution order

planPacking(...) must execute the existing stages in this order:

Call solveAndVerify(solver, input).

Call selectVerifiedCandidate(
input,
verification.candidates
).

If selection.kind !== 'selected':
return a not-planned result.

Resolve the selected candidate from:
verification.candidates[
selection.selectedCandidateIndex
]

Call constructPackingPlan(
planId,
input,
selectedCandidate,
verification.solverMeta
).

Return the planned result containing:
plan;
verification;
selection.

No stage may be reordered.

Selection authority

The pipeline must not select candidates itself.

Candidate eligibility and ranking authority belong exclusively to ADR-008 selectVerifiedCandidate(...).

The pipeline must not:

use Array.find(...) to choose the first valid candidate;

prefer candidate index 0 without selection;

inspect solver candidate status as a ranking authority;

recalculate an independent objective comparator;

reorder the candidate array;

or replace the selected index returned by ADR-008.

The successful selected candidate is exactly:

verification.candidates[
selection.selectedCandidateIndex
]

The selectedCandidateIndex continues to refer to the original solver candidate array.

Verification authority

The pipeline must not duplicate or weaken independent verification.

It must use solveAndVerify(...) as the solver-to-verifier boundary.

The pipeline must not:

trust SolverCandidatePlan.status as independent validity;

call constructPackingPlan(...) on an unverified candidate;

repair verification failures;

discard invalid candidates from SolverVerificationResult;

or convert a failed VerificationReport into a successful candidate.

Invalid candidates remain observable through the returned verification result.

Canonical construction authority

The pipeline must not duplicate canonical PackingPlan construction.

Only ADR-007 constructPackingPlan(...) creates the canonical plan in this orchestration path.

The pipeline must not independently compute:

canonical status;

PackedCarton values;

CartonMetrics;

PlanMetrics;

weight totals;

cost totals;

utilization;

unplaced-item canonical copies;

or final PackingPlan validation.

Those semantics remain owned by ADR-007 and the canonical domain contracts.

Plan ID

PackingPlan.id remains caller-supplied.

planPacking(...) receives planId and passes it unchanged to constructPackingPlan(...).

The pipeline must not:

generate UUIDs;

generate random IDs;

use current time;

derive an ID from solver output;

or rewrite the supplied planId.

Persistent or globally unique plan-ID policy remains outside this ADR.

Solver metadata

SolverMeta returned by solveAndVerify(...) is passed unchanged to constructPackingPlan(...).

The pipeline must not modify:

solverId;

solverVersion;

durationMs;

deterministic.

The canonical PackingPlan constructor remains responsible for copying that metadata into the canonical result according to ADR-007.

Verification result retention

The successful planned result retains the complete SolverVerificationResult even after a canonical plan is constructed.

This is intentional.

The pipeline result therefore preserves:

every solver candidate;

every VerificationReport;

invalid candidate diagnostics;

original candidate order;

original SolverMeta.

The canonical PackingPlan remains the downstream product result.

The retained verification data is orchestration evidence and diagnostic context, not canonical plan state.

Selection result retention

The successful planned result retains the exact selected ranking information from ADR-008.

This includes:

selectedCandidateIndex;

rankedCandidateIndexes.

The pipeline does not write that ranking into PackingPlan.

PackingPlan remains governed by ADR-002 and ADR-007.

Future alternative-plan UI or explanation layers may use the retained selection result, but this ADR does not define how they present it.

Exactly-once orchestration behavior

For one invocation of planPacking(...):

the supplied solver is executed exactly once through solveAndVerify(...);

each returned candidate is independently verified exactly once through the existing ADR-006 path;

candidate selection is performed exactly once;

canonical construction is performed zero times for a not-planned result;

canonical construction is performed exactly once for a planned result.

The pipeline must not rerun a solver because:

no candidate is valid;

an objective is unsupported;

required cost data is missing;

required gross-weight data is missing;

or the selected candidate is not candidate index 0.

No retry or fallback behavior is introduced here.

Errors

Normal packing infeasibility is not an exception.

Normal verification failure is not an exception.

ADR-008 no-valid-candidate is not an exception.

ADR-008 objective-unsupported is not an exception.

ADR-008 insufficient-data is not an exception.

Unexpected errors from existing boundaries propagate.

Examples include:

SolverAdapter.solve(...) rejecting unexpectedly;

independent verification throwing for an exceptional invalid-input or programming condition allowed by ADR-004;

selection throwing because an independently valid candidate contains an impossible unresolved reference;

constructPackingPlan(...) throwing because a post-verification invariant is broken;

canonical PackingPlan validation failing because of an implementation/programming error.

No custom pipeline exception class is introduced in v1.

Unsupported objective behavior

If selectVerifiedCandidate(...) returns:

kind = 'objective-unsupported'

the pipeline returns:

kind = 'not-planned'

with the same selection result.

The pipeline must not silently replace the objective with:

balanced;

fewest-cartons;

least-wasted-volume;

solver order;

or any other supported objective.

The caller may explicitly request another objective in a later user action.

Insufficient-data behavior

If selectVerifiedCandidate(...) returns:

kind = 'insufficient-data'

the pipeline returns:

kind = 'not-planned'

with the same:

objective;

missingMetric.

The pipeline must not:

treat unknown carton cost as zero;

treat unknown gross weight as zero;

discard the candidate with missing data;

or silently use another objective.

A higher layer may ask the user to supply the missing data or choose another objective.

No-valid-candidate behavior

If selectVerifiedCandidate(...) returns:

kind = 'no-valid-candidate'

the pipeline returns:

kind = 'not-planned'.

The complete SolverVerificationResult is retained so verification issues remain inspectable.

The pipeline must not:

construct from an invalid candidate;

select the least-invalid candidate;

repair a candidate;

rerun the baseline solver;

or return an empty canonical plan merely to avoid failure.

Input and output ownership

The pipeline is non-mutating.

It must not mutate:

SolverInput;

input items;

input cartons;

input objective;

solver output candidates;

candidate carton arrays;

placements;

unplaced items;

VerificationReport values;

SolverMeta;

CandidateSelectionResult arrays.

The pipeline may retain references to the already-produced verification and selection result objects in its own result because it does not mutate them.

Canonical PackingPlan ownership remains governed by ADR-007.

Determinism

The pipeline introduces no new nondeterministic behavior.

For the same:

planId;

SolverInput;

deterministic SolverAdapter output;

verification behavior;

and selection behavior;

the orchestration result is deterministic.

The pipeline must not use:

randomness;

current time;

unordered iteration;

generated IDs;

or implicit candidate ordering outside the original solver order and ADR-008 ranking.

Current baseline solver behavior

The current BaselineSolver normally returns one candidate.

Therefore the immediate product-visible effect of adding this pipeline is not necessarily a different packing arrangement.

The architectural value is that all callers now use the same path that remains correct when future solvers return multiple meaningful candidates.

The baseline solver is not modified by this ADR.

Workspace migration

The current PackingWorkspace orchestration manually performs:

solveAndVerify(...);

find the first valid candidate;

constructPackingPlan(...).

After this pipeline is implemented and validated, PackingWorkspace should migrate to planPacking(...).

That migration must preserve current user-visible behavior for the current supported workspace objective.

The workspace must no longer manually choose the first valid candidate after migration.

This ADR defines the target orchestration contract but does not itself define UI wording for not-planned states.

Public API

The canonical planning pipeline should be exported through the solver public API after implementation is validated.

The public API should expose:

planPacking(...);

CanonicalPlanningResult;

and any supporting exported type aliases required by callers.

Existing exports from contracts, baseline, integration, and selection remain available.

No existing public export is removed by this ADR.

Scope boundary

This ADR does not define:

new solver algorithms;

generation of additional candidates;

alternative generation;

multi-solver orchestration;

solver fallback;

retry;

timeouts;

cancellation;

progress callbacks;

objective comparator changes;

custom weighted objectives;

DIM-weight formulas;

owned-vs-buy carton semantics;

carrier pricing;

shipping-rate lookup;

explanation generation;

persistent plan storage;

persistent plan IDs;

UI ranking presentation;

visualization behavior;

export formats.

Alternatives considered

Keep orchestration in each caller

Rejected because callers can bypass objective-aware selection or handle non-selection outcomes inconsistently.

Put selection inside solveAndVerify(...)

Rejected because ADR-006 deliberately preserves verification as a separate boundary and returns all candidate verification results without ranking them.

Put selection inside constructPackingPlan(...)

Rejected because ADR-007 intentionally constructs exactly one already-selected verified candidate and should remain independent of candidate ranking.

Return only PackingPlan and throw for every non-selection result

Rejected because unsupported objectives, insufficient optional data, and lack of a valid candidate are normal domain outcomes already modeled by ADR-008.

Silently use the first valid candidate

Rejected because it bypasses objective-aware ranking and becomes incorrect as soon as a solver returns multiple valid candidates.

Return only the selected candidate and discard verification results

Rejected because invalid candidate diagnostics and original solver evidence remain useful and are already deliberately preserved by ADR-006.

Generate plan IDs in the pipeline

Rejected because ADR-007 deliberately leaves plan-ID generation to callers or future persistence/workflow policy.

Automatically fall back to balanced

Rejected because ADR-008 explicitly forbids silent objective fallback.

Re-run the solver after selection failure

Rejected because missing comparison data or unsupported semantics are not solver execution failures.

Consequences

Positive

Creates one authoritative end-to-end core planning path.

Prevents callers from bypassing objective-aware candidate selection.

Preserves independent verification as the trust boundary.

Preserves all solver and verification diagnostics.

Keeps normal non-selection states explicit rather than exceptional.

Keeps objective fallback truthful and explicit.

Keeps canonical metric construction centralized in ADR-007.

Keeps the solver interchangeable.

Supports future multi-candidate solvers without changing caller orchestration.

Provides a clean migration target for PackingWorkspace and future API/export layers.

Introduces no new randomness or hidden ID generation.

Limitations

The pipeline does not make the baseline solver generate additional alternatives.

The current baseline solver normally produces one candidate.

Unsupported ADR-008 objectives remain unsupported.

Missing cost or gross-weight data can still produce a not-planned result for objectives that require those values.

The result retains verification data in addition to the canonical plan, which is intentional but larger than returning PackingPlan alone.

UI behavior for not-planned results remains a separate concern.

No persistence, retry, fallback, cancellation, or progress semantics are introduced.

Authority relationship

This ADR composes the existing authorities without replacing them:

ADR-003 owns the solver adapter contract.

ADR-004 owns independent verification semantics.

ADR-006 owns solver-to-verifier orchestration and candidate verification result preservation.

ADR-008 owns objective-aware candidate eligibility and ranking.

ADR-007 owns canonical PackingPlan construction.

ADR-002 owns the canonical result contracts.

The resulting architecture is:

normalized input
→ solver adapter
→ candidate output
→ independent verification
→ objective-aware selection
→ canonical PackingPlan construction
→ downstream summary / visualization / export

This ADR does not supersede ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, or ADR-008.

It defines only the orchestration contract that composes those already-accepted decisions.

Validation / revisit trigger

Revisit this ADR when:

multi-solver orchestration is introduced;

fallback or retry policy is introduced;

timeouts or cancellation are added;

progress reporting is added;

persistent plan-ID policy is introduced;

the pipeline needs to expose machine-readable explanation evidence;

alternative generation becomes a separate upstream stage;

selection begins returning richer ranking evidence;

a server/API boundary needs a serialized planning-result contract;

or product requirements require a different distinction between normal non-selection and exceptional failure.