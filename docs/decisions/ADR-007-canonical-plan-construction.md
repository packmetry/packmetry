ADR-007: Canonical PackingPlan Construction

Status

Accepted

Context

ADR-002 defines the canonical PackingPlan, PackedCarton, CartonMetrics, PlanMetrics, Explanation, and SolverMeta result contracts.

ADR-003 defines solver candidate output as non-canonical solver claims.

ADR-004 defines independent candidate verification.

ADR-006 connects solver execution to independent verification and intentionally stops before canonical PackingPlan construction.

The project now needs a deterministic, non-mutating conversion from one independently verified solver candidate into one canonical PackingPlan.

This ADR defines only canonical plan construction. It does not define candidate ranking, objective scoring, UI behavior, persistence, exports, or alternative-plan selection.

Decision

Construction API

The v1 canonical construction API is:

function constructPackingPlan(
  planId: string,
  input: SolverInput,
  verifiedCandidate: CandidateVerificationResult,
  solverMeta: SolverMeta
): PackingPlan

The function constructs exactly one canonical PackingPlan from exactly one independently verified candidate.

Candidate selection happens before this function and remains a separate responsibility.

Verification precondition

Canonical construction is permitted only when:

verifiedCandidate.verification.valid === true

If verification is invalid, construction must throw Error.

The constructor must not:

repair the candidate;

discard verification issues;

convert an invalid candidate into a canonical plan;

rerun the solver.

The constructor does not replace independent verification.

Plan ID

PackingPlan.id is supplied by the caller as planId.

The constructor must not:

generate random IDs;

generate UUIDs;

derive an ID from solver output;

use time as an ID source.

This ADR does not strengthen the existing PackingPlan.id validation contract beyond string.

ID-generation policy belongs to the caller or a later persistence/workflow layer.

Canonical status

Canonical PackingPlan.status is derived from verified item accounting rather than blindly trusting SolverCandidatePlan.status.

Let:

requestedItemCount = sum(input.items[].quantity)
placedItemCount = total placements across candidate cartons

Status is derived in this order:

If requestedItemCount === 0, status is feasible.

If placedItemCount === requestedItemCount, status is feasible.

If any unplaced item has reason solver-limit-reached, status is limit_reached.

If placedItemCount > 0, status is partial.

Otherwise status is infeasible.

The candidate's own status is not copied into the canonical plan.

Objective

PackingPlan.objective is copied from SolverInput.objective.

Objective scoring and candidate ranking remain separate future work.

Packed cartons

Each SolverCandidateCarton becomes one PackedCarton.

For each candidate carton:

Resolve cartonId against SolverInput.cartons.

Use that carton definition in the canonical result.

Copy placements in their existing order.

Compute canonical carton metrics.

Because independent verification already guarantees referenced carton IDs exist for a valid candidate, an unresolved carton ID during construction is treated as an exceptional programming/invariant failure and throws Error.

The constructor must create its own result objects and arrays and must not mutate or reuse mutable candidate arrays as canonical storage.

Carton metrics

For each packed carton:

itemCount = placements.length

itemVolumeMm3 =
sum(placement.length * placement.width * placement.height)

cartonVolumeMm3 =
carton.internalDimensions.length
* carton.internalDimensions.width
* carton.internalDimensions.height

emptyVolumeMm3 =
cartonVolumeMm3 - itemVolumeMm3

utilization =
itemVolumeMm3 / cartonVolumeMm3

Canonical carton dimensions are positive, so carton volume is non-zero.

Independent geometry verification is relied upon to ensure valid placements and non-overlap before these metrics are constructed.

Carton weight metrics

contentsWeightG is included only when the weight of every placed item instance is known.

For each placement, resolve its item by itemId and use that item's unitWeightG.

If any placed item's unitWeightG is unknown:

omit contentsWeightG;

omit grossWeightG;

do not assume zero.

For a carton with zero placements:

contentsWeightG = 0

grossWeightG is included only when:

contentsWeightG is known; and

carton.emptyBoxWeightG is known.

Then:

grossWeightG =
contentsWeightG + carton.emptyBoxWeightG

If carton tare weight is unknown, omit grossWeightG.

Plan metrics

Canonical plan metrics are derived from constructed packed cartons and canonical unplaced items.

cartonCount = cartons.length

placedItemCount =
sum(carton.metrics.itemCount)

unplacedItemCount =
unplacedItems.length

itemVolumeMm3 =
sum(carton.metrics.itemVolumeMm3)

cartonVolumeMm3 =
sum(carton.metrics.cartonVolumeMm3)

emptyVolumeMm3 =
sum(carton.metrics.emptyVolumeMm3)

Overall utilization is:

itemVolumeMm3 / cartonVolumeMm3

When cartonVolumeMm3 === 0, utilization is 0.

Plan weight metrics

totalContentsWeightG is included only when every packed carton has known contentsWeightG.

If any used carton's contents weight is unknown, omit totalContentsWeightG.

For a plan with zero cartons:

totalContentsWeightG = 0

totalGrossWeightG is included only when every packed carton has known grossWeightG.

If any used carton's gross weight is unknown, omit totalGrossWeightG.

For a plan with zero cartons:

totalGrossWeightG = 0

Unknown weight is never treated as zero for a carton containing items.

Carton cost metric

totalCartonCost is included only when every used carton has a defined costPerBox.

Then:

totalCartonCost =
sum(carton.costPerBox for each packed carton instance)

If any used carton has unknown costPerBox, omit totalCartonCost.

For a plan with zero cartons:

totalCartonCost = 0

A defined carton cost of 0 is valid and remains part of the known total.

Unplaced items

Canonical PackingPlan.unplacedItems are copied from the verified candidate in their existing order.

No unplaced reason is rewritten during canonical construction.

Solver metadata

PackingPlan.solverMeta is copied from the solverMeta supplied to construction.

The constructor does not rewrite duration, solver identity, version, or determinism metadata.

Explanations

The v1 constructor returns:

explanations: []

Human-readable explanation generation remains a separate future responsibility.

The canonical result contract permits an empty explanations array.

No explanation text or explanation code is invented by this ADR.

Ownership and mutation

Construction is non-mutating.

The constructor must not mutate:

SolverInput;

input items;

input cartons;

the verified candidate;

candidate placements;

candidate unplaced items;

verification reports;

solver metadata.

The canonical result must own new arrays and result objects.

Nested mutable domain/result objects copied into the canonical plan must be copied sufficiently so later mutation of the constructed plan does not mutate solver candidate placement arrays or the caller-owned input carton/objective structures.

Final validation

After construction, the completed object must satisfy the existing canonical validators, including validatePackingPlan(...).

A constructor implementation may call validatePackingPlan(...) before returning.

Validation failure after a verified candidate indicates an implementation or contract invariant problem and is allowed to throw.

Scope boundary

This ADR does not define:

selection of one candidate from multiple valid candidates;

candidate ranking;

objective scoring;

alternative plan generation;

UI explanation generation;

persistence or saved-plan IDs;

exports;

DIM-weight calculations;

padding/spacing/fragile/stackable semantics that remain deferred elsewhere.

Alternatives considered

Copy the solver candidate status directly
Rejected because canonical output should not blindly trust a solver claim when status can be derived from verified item accounting.

Generate plan IDs inside the constructor
Rejected because no authoritative ID-generation policy exists and random/time-based behavior would make construction less deterministic.

Treat unknown weights or costs as zero
Rejected because Packmetry already distinguishes unknown values from zero.

Construct canonical plans from invalid candidates
Rejected because independent verification is a required trust boundary.

Generate human explanations during construction
Rejected because explanation semantics and wording are a separate product concern.

Rank or select candidates during construction
Rejected because candidate ranking and objective scoring are separate responsibilities.

Consequences

Positive

Produces a stable canonical PackingPlan from independently verified solver output.

Prevents invalid solver candidates from becoming canonical results.

Makes utilization, volume, weight, and cost metric semantics explicit.

Preserves unknown-value semantics.

Avoids hidden/random plan ID behavior.

Keeps candidate ranking and explanation generation decoupled.

Gives downstream 3D/UI/export layers a solver-independent canonical model.

Limitations

Caller must provide the plan ID.

Only one already-selected verified candidate is constructed at a time.

Explanations remain empty in v1.

No objective scoring or alternative-plan ranking is performed.

DIM-weight and deferred physical-constraint semantics remain future work.

Authority relationship

This ADR fills the construction gap between ADR-006 verified candidates and the canonical result model defined by ADR-002 and master specification §38.

The resulting architecture is:

normalized input
→ solver adapter
→ candidate output
→ independent verification
→ selected valid candidate
→ canonical PackingPlan construction
→ downstream renderer/UI/export

It does not supersede ADR-002, ADR-003, ADR-004, ADR-005, or ADR-006.

Validation / revisit trigger

Revisit this ADR when:

candidate ranking/objective scoring is implemented;

explanation generation is defined;

persistent plan-ID policy is introduced;

DIM-weight metrics are added;

deferred physical constraints receive canonical semantics;

canonical status semantics need additional states or solver-limit behavior changes.