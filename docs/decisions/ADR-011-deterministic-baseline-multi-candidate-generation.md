ADR-011: Deterministic Baseline Multi-Candidate Generation
Status: Accepted
Date: 2026-10-03
Context
ADR-005 defines the deterministic baseline solver and intentionally locks its v1 behavior to exactly one SolverCandidatePlan.
ADR-008 already defines deterministic objective-aware ranking across multiple independently verified candidates.
ADR-009 composes solving, independent verification, candidate selection, and canonical plan construction.
Phase 11 now materializes non-selected ranked candidates as canonical alternative PackingPlan values, but the production BaselineSolver still returns only one candidate. The result is that the architecture can preserve alternatives, while production planning normally has no solver alternatives to preserve.
Phase 11 requires practical alternatives and explainable trade-offs without claiming global mathematical optimality.
This ADR revisits ADR-005 only where that ADR explicitly named multiple candidate generation as a revisit trigger.
Decision
Scope
The Packmetry baseline solver will remain one deterministic solver implementation.
It will now produce a small deterministic candidate set by running the existing ADR-005 first-fit placement heuristic against a bounded set of carton-order strategies.
This ADR does not introduce:
- a second packing engine;
- stochastic search;
- exhaustive search;
- objective scoring inside the solver;
- item reordering;
- new placement geometry;
- new constraint semantics;
- DIM-weight logic;
- UI alternative filtering.
ADR-008 remains the only authority for ranking verified candidates.
Solver identity
The solver identity remains:
- solverId: packmetry-baseline
- deterministic: true
Because the solver output contract changes from a single candidate to a bounded multi-candidate set:
- solverVersion: 2
Candidate strategies
For identical normalized SolverInput, the solver evaluates carton-order strategies in this exact order:
1. input order
   - SolverInput.cartons exactly as supplied.
2. smallest internal carton volume first
   - ascending:
     length * width * height
   - equal-volume carton types preserve their original SolverInput.cartons order.
3. largest internal carton volume first
   - descending:
     length * width * height
   - equal-volume carton types preserve their original SolverInput.cartons order.
No other strategies are part of this ADR.
Existing v1 candidate preservation
The first generated strategy is always the original input carton order.
Therefore the first candidate preserves the previous ADR-005 placement behavior for the same input.
The additional strategies only add deterministic alternatives after that original behavior.
Placement behavior inside each strategy
Every strategy uses the same placement algorithm already defined by ADR-005.
The following remain unchanged:
- item array order;
- ascending item instanceIndex;
- already-open-carton-first behavior;
- open carton creation order;
- rotation order;
- candidate-point generation;
- candidate-point ordering;
- overlap semantics;
- geometry tolerance;
- known-weight enforcement;
- inventory bounds;
- unplaced-reason classification;
- candidate status derivation.
Only the order in which carton types are considered when a new carton instance is required may differ between strategies.
Objective independence
Candidate generation does not branch on SolverInput.objective.kind.
The baseline solver generates the same candidate set for identical items and cartons regardless of which supported objective is later used to rank them.
This preserves separation of responsibilities:
candidate generation
→ independent verification
→ ADR-008 objective-aware selection
The solver does not decide which candidate is recommended.
Candidate deduplication
Different carton-order strategies can produce identical SolverCandidatePlan content.
The solver removes exact duplicate candidate content while preserving first occurrence order.
Consequences:
- the candidate set contains no exact duplicates;
- the original input-order candidate wins any duplicate;
- the result contains between 1 and 3 candidates;
- one-carton and otherwise order-insensitive inputs normally still return one candidate.
Deduplication does not merge or rewrite non-identical candidates.
Determinism
For identical normalized input, candidate content and candidate order must be identical across repeated runs.
Candidate generation must not depend on:
- randomness;
- current time;
- object identity;
- locale-sensitive ordering;
- hash-map iteration order;
- network state;
- browser layout state;
- React state.
durationMs remains runtime metadata and is excluded from candidate-content determinism.
Independent verification
Every returned candidate remains an untrusted solver claim.
Every candidate must pass the existing independent verification boundary before it may be ranked or materialized as a canonical plan.
Generating a candidate inside Packmetry does not make it trusted.
Alternative semantics
The additional candidates are search alternatives, not guaranteed distinct business outcomes.
ADR-008 determines which independently verified candidates are comparable and how they are ranked.
The canonical pipeline may materialize ranked non-selected candidates as alternatives.
The UI may later choose to display only 2–3 useful alternatives and provide “Show all alternatives”.
This solver layer does not perform that presentation filtering.
Truthful product wording
The baseline remains heuristic.
Even when multiple candidates are evaluated, Packmetry must use wording such as:
- “Best plan found”
- “Recommended packing plan”
- “Highest-scoring evaluated option”
It must not claim global mathematical optimality.
Alternatives considered
Keep BaselineSolver single-candidate
Rejected for Phase 11 because the production pipeline would continue to have no normal ranked alternatives to materialize.
Make candidate generation objective-specific
Rejected for this slice because candidate generation and objective ranking are already separate responsibilities. ADR-008 should remain authoritative for choosing among verified candidates.
Reorder items as well as cartons
Deferred. Item ordering materially changes the ADR-005 search policy and expands the search surface. Carton-order diversity is a smaller first production step.
Add random or shuffled carton orders
Rejected because deterministic candidate generation is a project requirement.
Generate every carton permutation
Rejected because factorial growth is unnecessary for a browser-first deterministic baseline.
Generate exactly three candidates even when duplicates occur
Rejected because duplicate alternatives add no product value and would create misleading repeated plans.
Consequences
Positive
- Production planning can now produce real alternative candidates.
- The original ADR-005 input-order behavior remains candidate 0.
- Candidate generation stays deterministic and bounded.
- ADR-008 can expose real objective trade-offs such as fewer cartons versus less wasted volume.
- Independent verification remains authoritative.
- Existing single-carton inputs remain effectively backward compatible.
- Browser cost is bounded to at most three baseline heuristic runs per solve.
Limitations
- The search remains heuristic and non-exhaustive.
- Alternatives come only from carton-type ordering diversity.
- Some inputs still produce one candidate after deduplication.
- Item-order diversity is not explored.
- Rotation-order diversity is not explored.
- The solver does not guarantee that 2–3 useful alternatives always exist.
- The solver does not generate explanation text.
- The solver does not decide which alternatives the UI should display.
Authority relationship
This ADR supersedes only these ADR-005 v1 statements:
- “Returns exactly one SolverCandidatePlan in v1.”
- solverVersion: 1
- “It returns one candidate only” as a current limitation.
All other ADR-005 placement, constraint, verification, and determinism rules remain authoritative unless explicitly changed above.
ADR-008 remains authoritative for candidate selection and ranking.
ADR-009 remains authoritative for canonical planning orchestration, as extended by the validated Phase 11 ranked-alternative materialization slice.
ADR-010 remains authoritative for box-availability workflow orchestration.
Validation / revisit trigger
Revisit this ADR when:
- item-order candidate strategies are introduced;
- rotation-order candidate strategies are introduced;
- a stronger 3D heuristic replaces or supplements the baseline;
- a candidate-diversity policy beyond exact deduplication is required;
- solver limits, cancellation, or Web Worker execution require explicit search-budget semantics;
- benchmark evidence shows carton-order diversity is insufficient for required Phase 11 alternatives.