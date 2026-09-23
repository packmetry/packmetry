ADR-008: Objective Scoring and Candidate Selection

Status

Accepted

Context

ADR-003 defines solver output as one or more untrusted SolverCandidatePlan values.

ADR-004 requires independent verification before solver output can contribute to a canonical result.

ADR-006 preserves every solver candidate, pairs each candidate with an independent VerificationReport, and intentionally does not rank or select candidates.

ADR-007 constructs one canonical PackingPlan from one already-selected valid candidate and explicitly leaves candidate ranking and objective scoring as a separate responsibility.

Packmetry's product model already exposes these objective kinds:

balanced

fewest-cartons

least-wasted-volume

easier-to-carry

existing-inventory-first

min-dim-weight

min-carton-cost

The product requires deterministic candidate plans, explainable trade-offs, alternatives, and truthful wording such as “best plan found” rather than claims of guaranteed global optimality.

The project therefore needs a deterministic contract for comparing independently verified candidates without changing solver behavior, canonical-plan construction, or verification authority.

This ADR defines objective scoring and candidate selection only. It does not define candidate generation, alternative generation, DIM-weight formulas, owned-vs-purchasable carton modeling, explanation text, UI behavior, or a custom weighted objective.

Decision

Selection boundary

Candidate selection occurs after independent verification and before canonical PackingPlan construction:

normalized SolverInput
→ solver adapter
→ candidate output
→ independent verification
→ objective-aware candidate selection
→ canonical PackingPlan construction

The selector must never treat an unverified candidate as eligible.

Selection API

The v1 selection API is conceptually:

function selectVerifiedCandidate(
  input: SolverInput,
  candidates: readonly CandidateVerificationResult[]
): CandidateSelectionResult

The selected objective is always:

input.objective.kind

The selector must not accept a second objective that could disagree with SolverInput.objective.

Result contract

The selection result is a discriminated union conceptually equivalent to:

type CandidateSelectionResult =
  | {
      kind: 'selected';
      selectedCandidateIndex: number;
      rankedCandidateIndexes: number[];
    }
  | {
      kind: 'no-valid-candidate';
    }
  | {
      kind: 'objective-unsupported';
      objective: ObjectiveKind;
    }
  | {
      kind: 'insufficient-data';
      objective: ObjectiveKind;
      missingMetric: 'carton-cost' | 'gross-weight';
    };

selectedCandidateIndex and every entry in rankedCandidateIndexes refer to the original solver candidate array.

The selector does not clone, rewrite, repair, or replace solver candidates.

Verification eligibility

Only candidates satisfying:

candidate.verification.valid === true

are eligible for ranking.

Candidates with verification.valid === false remain observable in the upstream SolverVerificationResult, but they are excluded from candidate selection.

If no candidate is independently valid:

kind = 'no-valid-candidate'

Normal verification failure is not converted into an exception.

Common coverage gate

Before applying any optimization objective, valid candidates are compared by packing coverage.

For each valid candidate:

placedItemCount =
sum(candidate.cartons[].placements.length)

unplacedItemCount =
candidate.unplacedItems.length

Candidate selection first:

maximizes placedItemCount;

then minimizes unplacedItemCount.

Only candidates tied at the best coverage level proceed to objective-specific comparison.

This rule prevents an objective such as “fewest cartons” from selecting an empty or less-complete packing plan merely because it uses fewer cartons.

Objective optimization is therefore always subordinate to packing more of the requested item instances.

Candidate selection metrics

Selection metrics are transient comparison data.

They are not canonical PlanMetrics and are not written into solver candidate output.

Where a metric overlaps ADR-007 canonical metric semantics, the selector must use the same formula so ranking and later canonical construction cannot disagree.

For an eligible candidate:

cartonCount =
candidate.cartons.length

itemVolumeMm3 =
sum(
  placement.length
  * placement.width
  * placement.height
)

For every used carton instance, resolve its cartonId against SolverInput.cartons.

cartonVolumeMm3 =
sum(
  carton.internalDimensions.length
  * carton.internalDimensions.width
  * carton.internalDimensions.height
)

emptyVolumeMm3 =
cartonVolumeMm3 - itemVolumeMm3

utilization =
cartonVolumeMm3 === 0
  ? 0
  : itemVolumeMm3 / cartonVolumeMm3

An unresolved carton or item reference in an independently valid candidate is an invariant/programming failure and may throw Error.

Known carton cost

Candidate carton cost is known only when every used carton instance has a defined costPerBox.

Then:

totalCartonCost =
sum(costPerBox for every used carton instance)

For a candidate using zero cartons:

totalCartonCost = 0

If any used carton has unknown costPerBox, candidate carton cost is unknown.

Unknown cost must never be treated as zero.

Known gross carton weight

For each used carton instance, gross weight is known only when:

every placed item has a defined unitWeightG; and

the resolved carton has a defined emptyBoxWeightG.

Then:

contentsWeightG =
sum(unitWeightG for each placed item instance)

grossWeightG =
contentsWeightG + carton.emptyBoxWeightG

For an objective that requires gross weight, the candidate exposes:

maxGrossWeightG =
maximum grossWeightG across its used cartons

and:

totalGrossWeightG =
sum grossWeightG across its used cartons

For a candidate using zero cartons:

maxGrossWeightG = 0
totalGrossWeightG = 0

If any used carton gross weight is unknown, the candidate's gross-weight comparison data is unknown.

Unknown weight must never be treated as zero.

No arbitrary scalar score

V1 does not collapse different physical units into one weighted numeric score.

Candidate ranking uses deterministic lexicographic comparison.

This avoids inventing arbitrary conversion factors between:

carton count;

cubic millimetres;

currency;

grams;

utilization.

Custom weighted objectives remain future work.

Objective-specific ranking

All rules below apply only after the common coverage gate.

balanced

balanced uses only universally available count and geometry metrics.

Compare in this order:

fewer cartons;

lower empty volume;

higher utilization;

original solver candidate order.

This is a deterministic baseline definition of “balanced”, not a custom weighted optimization model.

It may be revisited when explicit user-adjustable weights are introduced.

fewest-cartons

Compare in this order:

fewer cartons;

lower empty volume;

higher utilization;

original solver candidate order.

The selector must not claim the result is a globally minimum-carton solution.

It is only the best verified candidate returned by the current solver set under this comparator.

least-wasted-volume

Compare in this order:

lower emptyVolumeMm3;

lower cartonVolumeMm3;

fewer cartons;

higher utilization;

original solver candidate order.

This objective compares absolute wasted volume first.

easier-to-carry

This objective requires known gross carton weights for every best-coverage candidate.

If any best-coverage candidate has unknown gross-weight comparison data:

kind = 'insufficient-data'
missingMetric = 'gross-weight'

No candidate is silently treated as lighter because its weight data is missing.

When all best-coverage candidates are comparable, compare in this order:

lower maxGrossWeightG;

lower totalGrossWeightG;

fewer cartons;

lower empty volume;

original solver candidate order.

The primary concern is therefore the heaviest individual carton rather than merely minimizing total packed weight.

min-carton-cost

This objective requires known carton cost for every best-coverage candidate.

If any best-coverage candidate has unknown carton cost:

kind = 'insufficient-data'
missingMetric = 'carton-cost'

No candidate with unknown cost is assumed to be free, cheap, or expensive.

When all best-coverage candidates are comparable, compare in this order:

lower totalCartonCost;

fewer cartons;

lower empty volume;

original solver candidate order.

existing-inventory-first

V1 candidate selection does not support this objective yet.

Current SolverInput contains available cartons and inventory bounds, but it does not distinguish:

cartons the user already owns/stocks; from

cartons proposed for purchase.

Without that distinction, an objective named existing-inventory-first cannot be scored truthfully.

Therefore:

kind = 'objective-unsupported'
objective = 'existing-inventory-first'

This objective becomes rankable only after the three box-availability workflows introduce an authoritative owned-vs-buy carton model.

min-dim-weight

V1 candidate selection does not support this objective yet.

The current core contracts do not contain authoritative:

dimensional-weight divisor/preset;

chargeable-weight policy;

per-carton DIM-weight metric.

Therefore:

kind = 'objective-unsupported'
objective = 'min-dim-weight'

This objective becomes rankable only after the DIM/weight module defines canonical semantics.

Deterministic tie-breaking

The final tie-break for every supported objective is the candidate's original index in the solver output array.

The selector must never use:

object identity;

random values;

current time;

hash-map iteration order;

generated IDs;

locale-dependent string ordering

as an implicit tie-break.

For identical inputs and identical candidate arrays, selection output must be identical.

Candidate order and alternatives

rankedCandidateIndexes contains only independently valid candidates that are comparable for the selected objective.

It is ordered best-first under this ADR.

The first entry is always equal to selectedCandidateIndex.

Invalid candidates are not inserted into this ranking.

This ranking does not generate new alternatives.

It only orders alternatives already returned by the solver.

Unsupported and insufficient-data behavior

objective-unsupported means the core model lacks semantics required to implement the requested objective truthfully.

insufficient-data means the objective semantics exist, but the current input/candidate set lacks required optional data.

Neither state may silently fall back to another objective.

In particular, the selector must not silently replace:

min-carton-cost with balanced;

easier-to-carry with fewest-cartons;

min-dim-weight with least-wasted-volume;

existing-inventory-first with solver order.

A caller may explicitly ask the user to change objective or supply missing information.

Candidate status

SolverCandidatePlan.status is not used as ranking authority.

Coverage is derived from placements and unplaced items after independent verification.

Canonical PackingPlan.status remains governed by ADR-007.

No solver mutation or rerun

Selection must not:

call a solver;

rerun a solver;

request fallback solvers;

mutate candidate order;

mutate placements;

mutate unplaced items;

change verification reports;

change solver metadata.

It operates only on already-produced verification results.

No global-optimality claim

A selected candidate means:

best comparable independently verified candidate returned by the current solver output under the selected objective and this deterministic ranking contract.

It does not mean:

mathematically global optimum;

best possible arrangement across all arrangements;

cheapest possible plan when unknown costs exist;

minimum DIM weight before DIM semantics exist.

User-facing wording must preserve the project's no-false-certainty rule.

Canonical construction handoff

After:

kind === 'selected'

the caller may pass:

candidates[selectedCandidateIndex]

to ADR-007 constructPackingPlan(...) together with the original SolverInput, caller-provided plan ID, and original solverMeta.

The selector does not construct canonical plans itself.

Input and output ownership

Candidate selection is non-mutating.

It must not modify:

SolverInput;

input items;

input cartons;

objective;

candidate plans;

candidate carton arrays;

placements;

unplaced items;

verification reports.

Returned ranking arrays must be newly owned by the selection result.

Scope boundary

This ADR does not define:

generation of multiple candidate plans;

changes to the baseline solver;

multi-solver orchestration;

fallback solvers;

custom weighted objectives;

DIM-weight calculations;

owned-vs-buy carton modeling;

explanation message generation;

UI ranking presentation;

persistent plan IDs;

shipping-price estimation;

carrier rates.

Alternatives considered

Use one normalized scalar score

Rejected for v1 because carton count, volume, weight, utilization, and currency have incompatible units and no authoritative weighting model exists.

Let the solver choose the winner

Rejected because solver interchangeability requires ranking semantics outside any one solver implementation.

Rank invalid candidates

Rejected because independent verification is the trust boundary.

Optimize objective before packing coverage

Rejected because it can prefer a cheaper, smaller, or zero-carton result that leaves more requested items unpacked.

Treat missing cost or weight as zero

Rejected because unknown data is not equivalent to zero.

Silently fall back when an objective is unsupported

Rejected because that would present a result as objective-aware when the requested objective was not actually evaluated.

Generate alternatives in the selector

Rejected because selection orders candidates; it does not invent solver output.

Consequences

Positive

Gives future multi-candidate solvers one deterministic comparison contract.

Preserves independent verification as the eligibility gate.

Prevents optimization goals from defeating packing completeness.

Avoids arbitrary cross-unit weighted scores.

Makes missing cost/weight data explicit.

Keeps unsupported objectives truthful rather than silently approximated.

Preserves solver interchangeability.

Provides deterministic alternative ordering.

Fits directly between ADR-006 verification and ADR-007 canonical construction.

Limitations

Current baseline solver returns exactly one candidate, so ranking has limited immediate effect.

existing-inventory-first remains unsupported until box-availability modeling exists.

min-dim-weight remains unsupported until DIM semantics exist.

easier-to-carry requires complete gross-weight data.

min-carton-cost requires complete carton-cost data.

balanced is a deterministic lexicographic baseline rather than a configurable weighted model.

This ADR does not cause the solver to generate stronger alternatives.

Authority relationship

This ADR fills the candidate-selection gap intentionally left by ADR-006 and ADR-007.

It preserves the architecture:

normalized input
→ solver adapter
→ candidate output
→ independent verification
→ objective-aware selection
→ canonical PackingPlan construction
→ downstream summary / visualization / export

It does not supersede ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, or ADR-007.

It also does not move alternative generation or DIM semantics earlier in the implementation sequence; it only fixes the comparison contract now so later implementation does not invent behavior.

Validation / revisit trigger

Revisit this ADR when:

the solver begins returning multiple meaningful alternatives;

the three box-availability workflows define owned-vs-buy carton semantics;

DIM-weight contracts are introduced;

custom weighted objectives are introduced;

explanation generation needs machine-readable ranking evidence;

a stronger solver produces metrics that require additional deterministic tie-breaks;

product evidence shows the v1 balanced comparator should change.