# ADR-005: Deterministic Baseline Solver

## Status
Accepted

## Context
The master specification requires deterministic candidate packing plans, interchangeable solver/heuristic implementations, independent post-solve verification, and a permanent solver benchmark corpus.

ADR-003 defines the async SolverAdapter boundary and candidate result contracts.
ADR-004 defines independent verification and forbids treating solver claims as verified canonical results.

The v1 benchmark corpus now locks baseline feasibility cases before production solver implementation. A deterministic baseline heuristic is required so implementation behavior, ordering, rotations, carton usage, and tie-breaks are not invented during coding.

This ADR defines that baseline heuristic only. It does not claim mathematical optimality.

## Decision

### Solver identity
The first production solver is the Packmetry deterministic baseline solver.

- `solverId`: `packmetry-baseline`
- `solverVersion`: `1`
- `deterministic`: `true`
- Returns exactly one `SolverCandidatePlan` in v1.
- `durationMs` is runtime metadata and is not part of candidate determinism.

### Input ownership
The solver consumes existing `SolverInput`.

It must not mutate:
- items
- cartons
- objective
- nested dimensions
- constraints

No input IDs are generated or rewritten.

### Item expansion and order
Each Item is expanded into instances:

`instanceIndex = 0 .. quantity - 1`

Processing order is exactly:
1. `SolverInput.items` array order
2. ascending `instanceIndex`

The baseline solver does not reorder items by volume, weight, ID, or objective.

### Existing-carton-first rule
For each item instance:

1. Try already-open candidate carton instances first.
2. Candidate carton instances are tried in their array creation order.
3. Only if no existing carton accepts the item may a new carton instance be opened.

This deterministic first-fit rule reduces unnecessary new cartons without claiming global minimum-carton optimality.

### New carton type order
When a new carton is required:

- Try `SolverInput.cartons` in input array order.
- Do not sort by volume, cost, dimensions, ID, or inventory.
- A carton type whose inventory bound is exhausted cannot be opened.

A `SolverCandidateCarton` array entry represents one physical carton instance.

### Inventory bound
For each carton type:

- `quantityAvailable` is an upper bound when defined.
- `stockQuantity` is an upper bound when defined.
- If both exist, both must be satisfied.
- Effective usable count is therefore the smaller defined bound.
- If neither exists, availability is unbounded.

Zero means no new instance of that carton may be opened.

### Rotation order
Allowed rotation order is exactly the ADR-004 policy mapping:

- `any`: `LWH`, `WLH`, `LHW`, `HLW`, `WHL`, `HWL`
- `upright`: `LWH`, `WLH`
- `vertical-axis-only`: `LWH`, `WLH`
- `fixed`: `LWH`

No other rotation order or implicit rotation is allowed.

### Placement search
Each open carton uses deterministic axis-aligned candidate points.

The initial candidate point is:

`(0, 0, 0)`

After placements exist, candidate points are:

- the origin
- `(x + length, y, z)` for each placement
- `(x, y + width, z)` for each placement
- `(x, y, z + height)` for each placement

Duplicate coordinate triples are removed.

Candidate points are tried in ascending order of:

1. `z`
2. `y`
3. `x`

At each candidate point, allowed rotations are tried in the policy order above.

The first valid placement wins.

### Placement validity
A placement is acceptable only when:

- rotated dimensions match the selected rotation;
- the placement stays within carton internal dimensions;
- it does not overlap an existing placement;
- the rotation obeys the item's rotation policy;
- known weight constraints permit the placement.

Geometry uses the same `1e-10 mm` tolerance convention defined by ADR-004.

Touching faces or edges are allowed and are not overlap.

### Weight rule
When `maxGrossWeightG` is absent, weight does not block placement.

When `maxGrossWeightG` is defined, the solver enforces it only when gross weight is knowable.

Gross weight is:

`emptyBoxWeightG + sum(placed item unitWeightG)`

If `emptyBoxWeightG` is unknown, or any involved item weight is unknown:

- do not assume zero;
- do not reject the placement on weight grounds.

When all required weights are known:

`grossWeightG <= maxGrossWeightG`

must hold.

### Unplaced reason classification
When an instance cannot be placed, choose exactly one reason.

Classification order is:

1. `weight-limit`
   - At least one carton can geometrically fit the item using an allowed rotation,
   - but every otherwise usable option is blocked by a known weight limit.

2. `inventory-exhausted`
   - At least one allowed-rotation and weight-feasible carton type could accept the item when empty,
   - but all such carton inventory is exhausted.

3. `constraint-conflict`
   - No allowed rotation fits,
   - but the item would geometrically fit an available carton using a rotation forbidden by its rotation policy.

4. `no-fitting-carton`
   - No carton can geometrically contain the item in any canonical rotation.

`solver-limit-reached` is not emitted by the baseline v1 solver because v1 has no search/time limit contract.

### Candidate status
Candidate status is derived only from placement outcome:

- zero requested items -> `feasible`
- all requested instances placed -> `feasible`
- some placed and some unplaced -> `partial`
- requested items exist and none are placed -> `infeasible`

Baseline v1 does not emit `limit_reached`.

### Objective behavior
The baseline is a deterministic feasibility heuristic, not the final objective-scoring system.

`SolverInput.objective` remains part of the contract, but v1 baseline placement order is not changed by objective kind.

Objective scoring, alternative-plan ranking, and objective-specific solver strategies remain later work.

The baseline must never claim that its candidate is globally optimal.

### Deferred item constraints
The following remain deferred exactly as in ADR-004:

- `paddingAllowanceMm`
- `spacingAllowanceMm`
- `fragile`
- `stackable`

The baseline solver must not invent semantics for these fields before a later decision defines them.

### Verification boundary
Baseline output is always an untrusted `SolverCandidatePlan`.

A candidate must still pass independent `verifyCandidatePlan(...)` verification before it can become or contribute to a canonical successful PackingPlan.

Internal solver feasibility checks do not replace independent verification.

### Determinism
For identical normalized SolverInput, candidate content must be identical across repeated runs.

Deterministic candidate content includes:

- status
- carton array order
- placement array order
- coordinates
- rotations
- unplaced item order
- unplaced reasons

Runtime duration metadata is excluded from this equality requirement.

## Consequences

### Positive
- Reproducible baseline behavior
- No hidden tie-break decisions
- Simple browser-friendly implementation
- Benchmark failures expose solver regressions
- Solver can later be replaced behind ADR-003 adapter
- Independent verification remains authoritative

### Limitations
- First-fit extreme-point search is heuristic, not exhaustive
- It may miss valid arrangements that a stronger solver can find
- It does not optimize all objective kinds
- It returns one candidate only
- Deferred physical constraints are not yet interpreted

These limitations must not be described to users as guaranteed optimal packing.

## Authority relationship
This ADR fills implementation details intentionally left open by the master specification.

It preserves:
- deterministic candidate plans;
- interchangeable solver architecture;
- normalized solver contracts;
- independent verification;
- browser-first execution;
- permanent benchmark testing;
- truthful non-optimality language.

It does not modify ADR-003, ADR-004, or the canonical result contracts.

## Revisit triggers
Revisit this ADR when:

- objective scoring is implemented;
- multiple candidate generation is added;
- a stronger 3D heuristic replaces the baseline;
- deferred constraints receive defined semantics;
- solver limits/cancellation are introduced;
- benchmark cases demonstrate a required arrangement the baseline search cannot represent.