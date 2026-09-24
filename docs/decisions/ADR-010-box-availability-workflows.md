ADR-010: Box-Availability Workflows

Status

Accepted

Context

Packmetry's authoritative product requirements define three box-availability workflows as first-class product behavior:

Mode 1 — I Need Boxes

The user has items but no cartons.

Packmetry should determine practical carton size(s) to buy and show how the items fit.

Mode 2 — I Already Have Boxes

The user supplies the cartons available to them.

Packmetry should choose the best available carton or carton combination under the current solver/objective capabilities and show how to pack the items.

Mode 3 — Use What I Have, Then Tell Me What to Buy

The user supplies some cartons, but that inventory may be insufficient or inefficient.

Packmetry should use existing cartons where sensible, determine what remains unpacked, recommend only the additional carton size(s) required, and make a complete replacement plan available for comparison when useful.

These modes are not three separate products.

The authoritative architecture requires Personal and Business experiences to share one normalized domain model, solver boundary, independent verification layer, canonical result model, and Three.js renderer.

The repository currently has:

canonical Item and Carton domain models;

inventory-relevant Carton fields including quantityAvailable and stockQuantity;

a replaceable SolverAdapter boundary;

a deterministic BaselineSolver;

independent solver-output verification;

objective-aware verified candidate selection;

canonical PackingPlan construction;

the canonical planPacking(...) pipeline;

ResultSummary;

PackingVisualization;

and a minimal PackingWorkspace.

The current canonical planning pipeline requires a concrete SolverInput containing:

items;

cartons;

objective.

That input shape is correct for planning once a concrete carton set exists.

It is not sufficient by itself to represent the user-level distinction between:

having no boxes;

having only existing boxes;

and combining existing boxes with newly recommended boxes.

The product therefore needs a workflow layer above the canonical planning pipeline.

That layer must prepare the correct carton set or sequence of planning jobs without weakening the existing solver, verification, selection, construction, or rendering boundaries.

This ADR defines that workflow architecture.

It does not define supplier integration, market availability, carrier packaging, live carton pricing, global mathematical optimality, persistence, account behavior, or final Personal/Business presentation.

Decision

Workflow position

Box-availability workflows sit above the canonical planning pipeline.

The architecture is:

user intent
→ normalized items
→ box-availability workflow
→ concrete carton preparation
→ planPacking(...)
→ canonical verified PackingPlan result(s)
→ workflow-level recommendation
→ ResultSummary / PackingVisualization / later export

The workflow layer may prepare one or more canonical planning jobs.

It must not replace the canonical planning pipeline.

Every successful sub-plan shown to the user must still be produced by planPacking(...).

The workflow layer must not:

invent item placements;

trust solver output directly;

skip independent verification;

reimplement candidate selection;

reimplement canonical plan construction;

or allow Three.js to perform hidden packing logic.

One engine, three workflows

The three product modes share the same:

Item model;

Carton model;

SolverAdapter;

verification implementation;

selection implementation;

planPacking(...) pipeline;

PackingPlan contract;

result summary;

visualization.

Mode differences belong to workflow orchestration and carton preparation only.

Do not fork the packing engine into:

personal solver;

business solver;

need-boxes solver;

have-boxes solver;

or hybrid solver.

Workflow mode contract

The workflow mode is a discriminated value conceptually equivalent to:

need-boxes

have-boxes

hybrid

The exact public TypeScript names may be introduced by implementation, but these three semantic states are fixed by this ADR.

Mode selection must be explicit.

The system must not infer a different workflow merely because a particular solve is infeasible.

For example:

have-boxes does not silently become hybrid;

hybrid does not silently become need-boxes;

need-boxes does not pretend that generated cartons are user-owned inventory.

Carton provenance

Workflow orchestration must preserve whether a carton came from:

existing user-provided inventory;

or a Packmetry-generated purchase recommendation.

This provenance is workflow metadata.

It is not currently added as a new required field to the canonical Carton domain object.

Reason:

Carton represents physical carton properties.

Existing-versus-recommended is contextual to a particular workflow.

The same carton definition could be existing inventory in one project and a purchase recommendation in another.

Therefore the workflow layer tracks provenance separately, keyed by the carton IDs it supplies to planning.

No hidden mutation of Carton objects is required.

Mode 1 — I Need Boxes

Meaning

The user supplies items and an optimization objective but does not need to supply cartons.

The workflow prepares deterministic candidate carton definitions before calling planPacking(...).

The resulting carton dimensions are recommendations, not claims that a particular commercial product is available.

Mode 1 must not require:

a supplier;

a saved carton library;

a carrier packaging catalog;

an account;

a backend;

or a paid external API.

Candidate carton generation

Mode 1 introduces a dedicated core responsibility:

purchase-carton candidate generation.

This responsibility is separate from:

the solver;

verification;

candidate selection;

canonical plan construction;

and the UI.

Conceptually:

normalized items
→ deterministic purchase-carton candidate generation
→ generated Carton values
→ SolverInput
→ planPacking(...)

Candidate generation may produce one or more validated Carton definitions.

The generator must be deterministic for identical normalized input and policy.

The generator must not use:

randomness;

current time;

network responses;

browser layout state;

React state;

or Three.js geometry.

The generated candidates must use canonical internal dimensions.

Generated carton IDs must be deterministic within one workflow run.

They do not need to be globally persistent identifiers.

Generated cartons must pass the existing Carton validation contract.

Purchase recommendation truthfulness

A generated carton recommendation means:

these internal dimensions are a carton size Packmetry found useful for the packing calculation.

It does not mean:

a retailer definitely stocks this exact size;

a supplier has inventory;

the listed dimensions are external dimensions;

the carton has a known price;

the carton has a known tare weight;

or a carrier accepts it.

Unless those values are supplied by a future verified catalog, generated cartons must leave unknown commercial metadata unknown.

Do not invent:

costPerBox;

emptyBoxWeightG;

supplier;

externalDimensions;

stockQuantity;

or quantityAvailable.

An undefined purchase quantity limit means the planning calculation is not constrained by the user's existing stock.

Recommendation count is instead derived from how many carton instances the canonical plan actually uses.

Practical-size language

The product specification ultimately calls for:

a best practical size;

a safer size with optional padding;

alternative dimensions;

and easier-to-source rounded dimensions.

This ADR does not invent an arbitrary market rounding rule.

Until a separate approved policy defines sourcing/rounding semantics:

generated internal dimensions may be exact deterministic recommendations;

the UI must not claim that an exact generated size is commonly stocked;

no hidden safety margin may be added;

no hidden padding may be added beyond already-normalized item constraints.

A future approved candidate-generation policy may add:

rounded dimensions;

common-size presets;

region-aware presets;

supplier catalogs;

or explicit safety margins.

Those additions must remain upstream of planPacking(...) and must be independently testable.

Mode 1 result

A successful Mode 1 workflow returns:

the canonical planning result;

the generated carton provenance;

and purchase recommendation information derivable from the verified canonical plan.

At minimum, purchase recommendation information must be able to answer:

which generated carton size(s) were used;

how many instances of each were used;

which canonical plan they belong to.

The workflow result must preserve the canonical plan rather than translating it into a second competing placement model.

If planPacking(...) returns a normal not-planned result, Mode 1 preserves that result truthfully.

The workflow must not fabricate a recommendation merely to avoid a not-planned outcome.

Mode 1 objectives

Mode 1 passes the caller's objective through to canonical planning.

It must not silently replace an unsupported objective.

If a chosen objective requires data that generated cartons do not know, such as carton cost or gross weight, the existing ADR-008 / ADR-009 insufficient-data behavior remains authoritative.

Mode 1 must not treat unknown cost or weight as zero.

Mode 2 — I Already Have Boxes

Meaning

The user supplies one or more Carton definitions representing boxes available for use.

Mode 2 plans only against those cartons.

It must not generate purchase cartons.

It must not silently recommend additional boxes.

This is intentionally different from hybrid mode.

Existing inventory limits

The current Carton model already supports:

quantityAvailable;

stockQuantity.

For current solver behavior, when both are defined for one carton type, the effective opening limit is the stricter value.

When neither is defined, that carton type is unbounded for the planning calculation.

Mode 2 preserves those semantics.

The workflow layer must not clone an inventory-limited carton into an unlimited carton.

It must not increase stock to make a plan feasible.

It must not silently ignore zero availability.

Inventory usage

Mode 2 should derive workflow-level inventory usage from the verified canonical plan.

At minimum it must be possible to determine:

carton types used;

number of instances used per carton ID;

provided carton types not used.

The canonical PackingPlan remains the authority for which carton instances were actually used.

The workflow layer may summarize those instances but must not alter them.

Mode 2 infeasibility

If the available cartons cannot pack all requested items, that is a normal result.

Mode 2 must not automatically transition to Mode 3.

A partial or infeasible verified canonical plan may be returned according to existing canonical status semantics.

The UI may later offer the user an explicit action to switch to hybrid mode.

That action is a new workflow request, not a hidden retry.

Mode 3 — Use What I Have, Then Tell Me What to Buy

Meaning

Mode 3 is an explicit existing-first workflow.

The user supplies existing cartons.

Packmetry first evaluates what can be packed with those existing cartons.

If items remain unpacked, Packmetry prepares purchase-carton candidates for the remainder and plans those remaining items.

Mode 3 is not an error-recovery branch of Mode 2.

It is a first-class user-selected workflow.

Mode 3 orchestration stages

The hybrid workflow is conceptually:

original normalized items
→ existing-carton planning
→ canonical verified existing plan
→ determine verified remainder
→ purchase-carton candidate generation for remainder
→ supplemental canonical planning
→ optional complete replacement comparison
→ hybrid workflow result

Each planning stage uses planPacking(...).

The workflow must not combine unverified solver candidates across stages.

Existing stage

The first stage uses only the user-provided existing cartons.

It must respect their current inventory limits.

The existing stage does not add generated cartons.

If the canonical existing plan packs all requested items:

the hybrid workflow is complete;

no purchase plan is required;

the purchase recommendation list is empty.

Remainder authority

The remainder is determined only from a canonical verified existing plan.

The workflow must use canonical unplaced-item information from the accepted plan.

It must not use:

raw solver status;

unverified candidate placements;

a guessed volume deficit;

or the original solver's private intermediate state.

If the existing stage itself has no canonical planned result because selection or verification cannot produce one, the hybrid workflow must preserve that failure instead of pretending the existing packing stage succeeded.

Remainder item reconstruction

Supplemental planning requires a normalized Item list describing only the unplaced instances.

For an original item with quantity N, the canonical existing plan can identify unplaced original instance indexes.

The supplemental workflow may construct a derived Item value with:

the same physical item properties;

a quantity equal to the number of remaining instances.

Because SolverInput item quantities use local instance indexes starting at zero, the workflow must preserve an explicit deterministic mapping from supplemental local instance indexes back to the original instance indexes.

Conceptually, for each item ID:

supplemental instance 0
→ original unplaced instance index A

supplemental instance 1
→ original unplaced instance index B

and so on in ascending original-instance order.

This mapping is workflow evidence.

It prevents the supplemental result from losing original item-instance identity.

The workflow must not silently claim that local supplemental instance indexes are the original indexes.

Supplemental purchase stage

Purchase-carton candidate generation runs only for the remaining item instances.

The supplemental stage then calls planPacking(...) with:

the reconstructed remainder items;

the generated purchase cartons;

the chosen objective.

A successful supplemental plan therefore describes only the remaining items.

It does not duplicate items already assigned to existing cartons.

Complete replacement comparison

The product requirement says hybrid mode should compare existing-first against a better complete replacement plan when relevant.

The workflow architecture therefore permits a separate replacement planning branch:

all original items
→ generated purchase cartons
→ planPacking(...)

The replacement branch must remain separate from the existing-first plus supplemental branch.

The workflow must not merge their carton instances.

The workflow must not automatically declare the replacement plan better merely because one metric is lower.

No numeric threshold for "substantially better" is defined by current product authority.

Therefore v1 may return both verified alternatives and their canonical metrics without inventing an automatic superiority threshold.

A later approved comparison/scoring policy may decide when the UI should label the replacement alternative materially better.

Hybrid composite result

A hybrid result is a workflow-level composite.

It may contain:

the canonical existing-inventory plan;

the canonical supplemental purchase plan when required;

the remainder instance mapping;

the purchase carton provenance;

the optional canonical complete replacement plan.

The hybrid wrapper is not itself a replacement for PackingPlan.

Do not fabricate one merged PackingPlan by concatenating independently constructed plans unless a future ADR defines:

cross-plan item-instance identity;

combined metrics;

combined status;

combined explanations;

combined solver metadata;

and validation semantics.

Until then, each sub-plan remains individually canonical and verified.

Workflow result architecture

The workflow layer should expose a discriminated result that preserves the selected mode.

Conceptually, callers must be able to distinguish:

need-boxes result;

have-boxes result;

hybrid result.

Each result must preserve its underlying CanonicalPlanningResult values.

The workflow should expose derived recommendation summaries only when those summaries can be computed from verified canonical data.

The workflow layer must not create a parallel placement schema.

Planning IDs

Box workflows may invoke planPacking(...) more than once.

The caller supplies one workflow-level ID.

Sub-plan IDs may be derived deterministically from that workflow ID with stable purpose suffixes.

Conceptually:

<workflow-id>

<workflow-id>

<workflow-id>

<workflow-id>

<workflow-id>

These are orchestration-local deterministic IDs.

They are not a new persistent/global ID policy.

The workflow must not use:

random UUID generation;

current timestamps;

or process-global counters.

Each derived ID is passed explicitly to planPacking(...), preserving ADR-009's requirement that planPacking itself does not generate IDs.

Objectives

The workflow layer does not define a second objective-scoring system.

Each planning stage passes an OptimizationObjective into planPacking(...).

ADR-008 remains authoritative for candidate selection.

Workflow ordering and optimization objective are different concepts.

For example:

hybrid is existing-first because the workflow explicitly runs an existing-inventory stage before generating supplemental purchase cartons.

That does not require the workflow to fake support for the currently unsupported existing-inventory-first ADR-008 objective.

If the caller explicitly chooses an objective that ADR-008 reports as unsupported, the normal not-planned result is preserved.

The workflow must not silently translate it to balanced or fewest-cartons.

Inventory semantics

Existing inventory and generated purchase recommendations have intentionally different availability semantics.

Existing cartons:

may have quantityAvailable;

may have stockQuantity;

are constrained by supplied availability.

Generated purchase cartons:

represent sizes to acquire;

are not existing stock;

normally leave quantityAvailable and stockQuantity undefined;

derive the required purchase count from verified plan usage.

The workflow must never report a generated purchase carton as an unused user-owned carton.

Metrics

All placement, utilization, volume, weight, carton-cost, and canonical status metrics remain owned by PackingPlan construction.

Workflow-level metrics may aggregate or compare already-canonical values.

They must not recompute geometry independently.

For a hybrid result, combined existing-plus-supplemental summary values may eventually be useful.

Any combined metric must have explicit semantics before being introduced.

Until then, keep canonical metrics attached to their individual sub-plans.

Verification

Every plan displayed as successful in every mode must remain independently verified through the existing pipeline.

Mode 1 generated cartons are not exempt.

Mode 2 user-supplied cartons are not exempt.

Mode 3 existing, supplemental, and replacement branches are not exempt.

The workflow layer must never interpret "generated by Packmetry" as a reason to trust a placement without verification.

Three.js

PackingVisualization continues to consume canonical PackingPlan values.

The workflow layer does not give Three.js raw generated candidates or unverified solver placements.

Mode 1:

visualize the canonical recommended purchase plan.

Mode 2:

visualize the canonical existing-box plan.

Mode 3:

the UI may visualize existing and supplemental canonical plans separately and may later provide workflow navigation between them.

A future composite visualization must not invent merged coordinates.

Non-mutation

Box workflow orchestration is non-mutating.

It must not mutate:

caller-owned Item values;

caller-owned Carton values;

their nested dimensions;

caller-owned objective values;

canonical planning results;

canonical PackingPlan values;

verification reports;

selection results.

Derived remainder Item values and generated Carton values are new workflow-owned values.

Determinism

For the same:

workflow ID;

normalized item input;

existing cartons;

objective;

candidate-generation policy;

solver behavior;

verification behavior;

and selection behavior;

workflow output must be deterministic.

The workflow layer introduces no:

randomness;

time-based ordering;

network-dependent ordering;

or hidden market lookup.

Errors and normal outcomes

Normal packing outcomes remain non-exceptional.

Examples:

items do not fit existing cartons;

existing inventory is exhausted;

some items remain unpacked;

a generated recommendation still cannot produce a full plan;

an objective is unsupported;

required objective data is missing.

These conditions should remain represented by canonical planning and workflow result states.

Unexpected programming or invariant failures may propagate as exceptions.

The workflow layer must not catch an invariant error and convert it into a fake successful recommendation.

Mode 1 initial implementation boundary

The first Phase 7 implementation target is Mode 1.

Its initial technical proof must demonstrate:

a user can supply items without supplying cartons;

a deterministic core candidate generator produces validated carton definitions;

those cartons feed the existing planPacking(...) pipeline;

the resulting successful recommendation is independently verified;

purchase carton count is derived from the canonical plan;

the existing ResultSummary and PackingVisualization can consume the same canonical plan without modification to placement truth.

The first implementation does not need:

supplier lookup;

market catalog integration;

rounded "common size" claims;

multiple polished alternative cards;

live prices;

saved box libraries;

or backend services.

Mode 2 implementation boundary

After Mode 1 is stable, Mode 2 should expose existing inventory explicitly as a workflow rather than relying on the old workspace's implicit single-box behavior.

Its technical proof must demonstrate:

multiple user-provided carton types can be supplied;

availability limits are respected;

no generated purchase cartons appear;

used and unused carton summaries are derived from the canonical result;

partial/infeasible results do not silently switch modes.

Mode 3 implementation boundary

After Modes 1 and 2 are stable, hybrid mode should compose them.

Its technical proof must demonstrate:

existing cartons are planned first;

verified unplaced instances define the remainder;

supplemental generated cartons plan only the remainder;

original instance identity can be recovered through the remainder mapping;

purchase recommendations describe only supplemental needs;

a complete replacement plan can be retained separately for comparison;

all displayed sub-plans remain independently verified.

No external services

All three initial workflows remain browser-first.

Do not add:

supplier APIs;

shopping APIs;

shipping APIs;

accounts;

server databases;

server-side optimization;

or paid infrastructure

merely to implement Phase 7.

Future catalogs may be local or externally sourced after separate approval.

Accessibility and UI separation

This ADR defines core workflow semantics, not final presentation.

The workflow layer must be usable without 3D.

A text/result summary must remain sufficient to understand:

which boxes are recommended;

which existing boxes are used;

which additional boxes are needed;

which items remain unpacked.

Final Personal and Business presentation remains Phase 8 and Phase 9 work.

The initial Phase 7 UI may be functional and explicit rather than polished.

Alternatives considered

Put all three modes inside BaselineSolver

Rejected.

The solver should solve concrete normalized packing inputs, not own user-intent workflow policy.

Create three independent solvers

Rejected.

This violates the one-engine architecture and duplicates verification and result semantics.

Make cartons optional in SolverInput

Rejected for now.

The canonical planner should continue receiving a concrete planning problem.

Need-box generation is an upstream responsibility.

Silently generate boxes when existing inventory fails

Rejected.

That would collapse Mode 2 into Mode 3 and violate explicit user intent.

Treat hybrid as one solver call containing existing and generated cartons

Rejected for v1.

Without explicit provenance preference, the solver could choose generated cartons before existing inventory, and current objective semantics do not encode the workflow's existing-first requirement.

A staged hybrid workflow makes the product rule explicit and preserves truthful provenance.

Add an isExisting field to Carton

Rejected for now.

Existing-versus-recommended is workflow context, not necessarily an intrinsic physical carton property.

Store provenance in workflow metadata instead.

Merge hybrid sub-plans into one PackingPlan immediately

Rejected.

Independent sub-plans have different item-instance scopes, solver metadata, and potentially different candidate sets.

A merged canonical contract needs explicit semantics and independent validation before adoption.

Use volume arithmetic instead of the solver for Mode 1

Rejected.

Volume alone does not establish 3D geometric feasibility.

Generated carton candidates must still pass through the normal solver and independent verification path.

Claim generated dimensions are commonly available sizes

Rejected without a verified sourcing policy or catalog.

Automatically round dimensions

Rejected until the rounding increment, region, units, safety behavior, and sourcing claim are explicitly defined.

Automatically choose the hybrid replacement plan when one metric improves

Rejected.

The product requirement says compare when relevant, but no current authority defines a "substantially better" threshold or a multi-metric superiority rule.

Return only a human-readable recommendation

Rejected.

The canonical verified plan must remain available as the source of truth for metrics, summary, visualization, and future export.

Consequences

Positive

Preserves all three required box-availability modes as first-class architecture.

Keeps one packing engine for Personal and Business.

Keeps planPacking(...) as the trusted canonical planning boundary.

Allows users to begin without owning cartons.

Makes existing inventory behavior explicit and testable.

Makes hybrid existing-first behavior explicit rather than accidental.

Preserves carton provenance without polluting the physical Carton model.

Allows Mode 1 to remain browser-first and offline-capable.

Avoids false supplier or market-availability claims.

Keeps Three.js dependent only on canonical verified plans.

Provides a safe path toward future common-size catalogs and supplier integrations.

Supports existing inventory limits already present in the Carton model.

Allows hybrid replacement comparison without inventing an unsupported automatic winner rule.

Limitations

Initial Mode 1 recommendations are internal-dimension recommendations, not guaranteed purchasable SKUs.

The exact purchase-carton candidate-generation heuristic still needs implementation and benchmark coverage.

The current BaselineSolver may under-explore generated carton alternatives because it normally returns one solver candidate.

No market-specific rounding policy is defined yet.

No supplier availability is known.

No live carton cost is known unless future catalog data supplies it.

Objectives requiring unknown generated-carton cost or gross weight can legitimately return insufficient-data.

Hybrid output is a workflow composite rather than one merged PackingPlan.

No automatic "substantially better" replacement threshold is defined.

No final Personal/Business Phase 8/9 UX is defined here.

Authority relationship

The authoritative product specification owns the existence and meaning of the three box-availability modes.

ADR-001 owns canonical units.

ADR-002 owns canonical result contracts.

ADR-003 owns the solver adapter boundary.

ADR-004 owns independent verification.

ADR-005 owns current deterministic baseline solver behavior.

ADR-006 owns solver-to-verifier integration.

ADR-007 owns canonical PackingPlan construction.

ADR-008 owns objective-aware verified candidate selection.

ADR-009 owns the canonical planPacking(...) orchestration path.

ADR-010 owns box-availability workflow orchestration and carton provenance above that pipeline.

The architecture becomes:

user workflow intent
→ normalized items
→ box-availability orchestration
→ existing and/or generated cartons
→ canonical planning pipeline
→ independently verified canonical plan(s)
→ workflow recommendation
→ summary / 3D / later export

This ADR does not supersede ADR-001 through ADR-009.

It composes them for Phase 7.

Validation / revisit trigger

Revisit this ADR when:

a common-size carton rounding policy is defined;

a verified carton catalog is introduced;

supplier availability is introduced;

purchase cost data becomes authoritative;

a persistent saved carton library changes inventory semantics;

the existing-inventory-first objective becomes fully implemented at candidate-selection level;

hybrid plans need one merged canonical result contract;

a formal threshold for "substantially better replacement plan" is defined;

combined hybrid metrics are introduced;

carton provenance becomes a persistent domain property rather than workflow context;

candidate generation moves into a replaceable strategy interface;

multiple solver runs are parallelized;

or external sourcing/shopping integration is approved.