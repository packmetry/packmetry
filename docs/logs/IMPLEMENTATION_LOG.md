# Packmetry Implementation Log

Keep this short and factual. This is a continuation aid, not product authority.

## 2026-09-19 — Clean Packmetry repository foundation prepared

### Completed
- Created clean Packmetry authority structure.
- Preserved the Packmetry bootstrap as highest project authority.
- Preserved the detailed CartonLab specification only as subordinate legacy product detail.
- Excluded obsolete CartonLab Cline bootstrap/rules/log/ADR files from active authority to prevent instruction mixing.
- Added Packmetry-specific Cline rules, security rules, review workflow, `.gitignore`, and `.clineignore`.
- Preserved the supplied old CartonLab HTML only as a legacy visual artifact, not active design authority.

### Current stage
Phase 0 — repository and governance foundation.

### Next step
Review this foundation locally, then create/connect the empty GitHub `packmetry` repository. Do not begin application implementation until the foundation is accepted.

## 2026-09-19 — PKM-BOOT-002: Production codebase skeleton established

### Completed
- Initialized Astro project in existing repository (not nested)
- Configured: Astro 7.3.3 + React integration + TypeScript strict mode + Vitest
- Established maintainable source structure:
  ```
  src/
  ├── components/
  ├── layouts/
  ├── pages/
  ├── core/
  │   ├── domain/
  │   ├── units/
  │   ├── solver/
  │   └── verification/
  └── test/
  ```
- Created minimal placeholder index page proving Astro runs (only simple Packmetry identification text)
- Created package scripts: dev, build, test, typecheck (astro check)
- Updated .gitignore for Vitest cache (.vitest/)
- Preserved all governance/docs files and browser-first architecture

### Corrections Applied
- Changed `typecheck` script from `tsc --noEmit` to Astro-aware `astro check`
- Added `@astrojs/check` dependency
- Removed unused foundation dependencies: @vitest/ui, @vitest/coverage-v8, @testing-library/react, @testing-library/jest-dom, jsdom, jest-environment-jsdom
- Removed `.env.example` (no required configuration)

### Validation Results
- ✅ npm install: Success (with 1 deprecated dependency warning)
- ✅ npm run typecheck: Success (astro check passes)
- ✅ npm test: Success (2 example tests pass)
- ✅ npm run build: Success (1 page built successfully)

### Files Created
- `package.json` with configured dependencies
- `astro.config.mjs` with React integration
- `tsconfig.json` with strict mode and path aliases
- `vitest.config.ts` with test configuration
- `src/layouts/BaseLayout.astro`
- `src/pages/index.astro` (placeholder page)
- `src/test/setup.ts`
- `src/test/example.test.ts`

### Files Modified
- `.gitignore` (added .vitest/)
- `package.json` (updated scripts and dependencies)
- `docs/logs/IMPLEMENTATION_LOG.md` (this entry)

### Dependencies Added
- Production: astro, @astrojs/react, react, react-dom
- Development: typescript, vitest, @astrojs/check, @types/react, @types/react-dom, @types/node

### Known Issues
- 1 deprecated dependency warning (glob@10.5.0)
- 2 moderate severity vulnerabilities reported by npm audit (reduced from 4)
- No actual packing functionality implemented yet (as per scope)

### Next Recommended Task
PKM-CORE-001: Implement canonical units and dimensions system (first dependency-correct module)


## 2026-09-19 — PKM-CORE-001: Canonical units and dimensions implemented

### Completed
- Created canonical units module in `src/core/units/`:
  - `types.ts`: Type definitions and validation utilities
  - `length.ts`: Millimeter-centric length conversions
  - `mass.ts`: Gram-centric mass conversions
  - `dimensions.ts`: Dimension normalization, conversion, and validation
  - `index.ts`: Module exports
- Implemented exact conversion factors per specification:
  - 1 in = 25.4 mm
  - 1 ft = 304.8 mm
  - 1 lb = 453.59237 g
  - 1 oz = 28.349523125 g
- Added comprehensive validation:
  - Rejects NaN/Infinity values
  - Rejects zero/negative dimensions
  - Validates finite numbers only
- Preserves axis order (length/width/height) without auto-sorting
- Created comprehensive unit tests covering:
  - Exact metric conversions
  - Exact imperial conversions
  - Metric↔imperial round trips
  - Invalid input rejection
  - Dimension validation
  - Volume calculation (600×400×350 mm = 84,000,000 mm³)
- Created ADR-001 documenting the canonical units decision
- No external dependencies added

### Files Created
- `src/core/units/types.ts`
- `src/core/units/length.ts`
- `src/core/units/mass.ts`
- `src/core/units/dimensions.ts`
- `src/core/units/index.ts`
- `src/test/units.test.ts`
- `docs/decisions/ADR-001-canonical-measurement-units.md`

### Files Modified
- `docs/logs/IMPLEMENTATION_LOG.md` (this entry)

### Validation Results
- ✅ npm run typecheck: Success (2 hints, no errors)
- ✅ npm test: Success (52 tests passed)
- ✅ npm run build: Success
- ✅ git diff --check: Clean

### Next Recommended Task
PKM-CORE-002: Implement Item model with dimensions, weight, and constraints

## 2026-09-20 — PKM-CORE-002: Canonical Item model implemented

### Completed
- Created canonical Item domain model in `src/core/domain/`:
  - `item.ts`: Item interface, creation, validation, volume, and weight calculations
  - `index.ts`: Domain module exports
- Implemented per specification:
  - `id`: required non‑empty string (no auto‑generated IDs)
  - `name?`: optional string
  - `sku?`: optional string
  - `dimensions`: CanonicalDimensions (mm), using existing units validation
  - `quantity`: positive integer ≥ 1
  - `unitWeightG?`: optional positive finite number; missing means unknown ≠ 0
- Created functions:
  - `createItem()`: validates input and returns immutable item
  - `validateItem()`: validates Item properties
  - `itemUnitVolumeMm3()`: calculates unit volume in mm³
  - `itemTotalVolumeMm3()`: calculates total volume (unit × quantity)
  - `itemTotalWeightG()`: returns total weight or undefined if unknown
- Preserved axis order without auto‑sorting
- No external dependencies added
- No Carton model or UI components
- Created comprehensive unit tests covering:
  - Valid minimal item
  - Valid business item with name/SKU/weight
  - Invalid blank ID
  - Invalid quantity: 0, negative, fractional, NaN, Infinity
  - Invalid dimensions
  - Invalid supplied weight: ≤ 0, NaN, Infinity
  - Missing weight returns undefined
  - Volume × quantity correctness
  - Weight × quantity correctness
  - Axis order preservation
  - Input object immutability

### Files Created
- `src/core/domain/item.ts`
- `src/core/domain/index.ts`
- `src/test/item.test.ts`

### Files Modified
- `docs/logs/IMPLEMENTATION_LOG.md` (this entry)

### Validation Results
- ✅ npm run typecheck: Success (0 errors, 0 warnings, 0 hints)
- ✅ npm test: Success (76 tests passed including 24 new item tests)
- ✅ npm run build: Success (1 page built in 2.14s)
- ✅ git diff --check: Clean (no whitespace errors)

## 2026-09-20 — PKM-CORE-003: Canonical Carton model implemented

### Completed
- Created canonical Carton domain model in `src/core/domain/`:
  - `carton.ts`: Carton interface, creation, validation, and volume calculations
  - `index.ts`: Updated domain module exports
- Implemented per specification:
  - `id`: required non‑empty string (no auto‑generated IDs)
  - `name?`: optional string
  - `internalDimensions`: CanonicalDimensions (mm), using existing units validation
  - `quantityAvailable?`: non‑negative integer; undefined = unlimited ≠ 0
  - `cartonCode?`: optional string
  - `maxGrossWeightG?`: optional positive finite number (grams)
  - `emptyBoxWeightG?`: optional positive finite number (grams)
  - `costPerBox?`: optional non‑negative finite number (0 valid)
  - `stockQuantity?`: optional non‑negative integer
  - `supplier?`: optional string
  - `externalDimensions?`: optional CanonicalDimensions
  - `notes?`: optional string
- Created functions:
  - `createCarton()`: validates input and returns immutable carton
  - `validateCarton()`: validates Carton properties
  - `cartonInternalVolumeMm3()`: calculates internal volume in mm³
- Preserved axis order without auto‑sorting
- Cloned dimension objects to prevent input mutation
- No external dependencies added
- No solver, constraints, objectives, or UI components
- Created comprehensive unit tests covering:
  - Valid minimal carton
  - Valid business carton with all optional fields
  - Blank id rejection
  - Invalid internal dimensions
  - quantityAvailable: allow 0; reject negative/fractional/NaN/Infinity
  - stockQuantity: allow 0; reject negative/fractional/NaN/Infinity
  - Invalid maxGrossWeightG
  - Invalid emptyBoxWeightG
  - costPerBox allows 0; rejects negative/NaN/Infinity
  - Invalid external dimensions
  - Internal volume correct (600×400×350 mm = 84,000,000 mm³)
  - Axis order preserved
  - Input not mutated

### Files Created
- `src/core/domain/carton.ts`
- `src/test/carton.test.ts`

### Files Modified
- `src/core/domain/index.ts` (added carton export)
- `docs/logs/IMPLEMENTATION_LOG.md` (this entry)

### Validation Results
- ✅ npm run typecheck: PASSED (0 errors)
- ✅ npm test: PASSED (114 tests, 4 test files)
- ✅ npm run build: PASSED (builds successfully)
- ✅ git diff --check: PASSED (no whitespace errors)

### Next Recommended Task
PKM-CORE-004: Item handling constraints

## 2026-09-20 — PKM-CORE-004: Item handling constraints implemented

### Completed
- Created canonical constraints module in `src/core/domain/`:
  - `constraints.ts`: RotationPolicy type, ItemConstraints interface, normalization, and validation
- Implemented per specification:
  - `rotationPolicy`: 'any' | 'upright' | 'vertical-axis-only' | 'fixed'
  - `fragile`: boolean (default false)
  - `paddingAllowanceMm`: number ≥ 0 (default 0)
  - `spacingAllowanceMm`: number ≥ 0 (default 0)
  - `stackable`: boolean (default true)
- Created functions:
  - `normalizeItemConstraints()`: applies defaults, normalizes input
  - `validateItemConstraints()`: validates constraint values
  - `DEFAULT_ITEM_CONSTRAINTS`: default values object
- Updated Item domain model:
  - Added normalized `constraints` field to Item interface
  - Extended `CreateItemOptions` with optional `constraints?` input
  - Updated `createItem()` to normalize constraints with defaults
  - Updated `validateItem()` to validate provided constraints
- No redundant uprightOnly boolean stored
- Input objects not mutated
- No solver, carton constraints, objectives, or UI components
- Repaired corrupted test file syntax (previous task corruption)
- Created comprehensive unit tests covering:
  - Default constraints
  - Every rotation policy
  - Invalid policy rejection
  - fragile true/false
  - stackable true/false
  - padding/spacing valid (incl. 0)
  - negative/NaN/Infinity rejection
  - Item receives normalized defaults
  - Custom Item constraints preserved
  - Input objects not mutated

### Validation Results
- ✅ npm run typecheck: PASSED (0 errors)
- ✅ npm test: PASSED (146 total tests, 32 constraint tests)
- ✅ npm run build: PASSED (builds successfully)
- ✅ git diff --check: PASSED (no whitespace errors)

### Files Created
- `src/core/domain/constraints.ts`
- `src/test/constraints.test.ts`

### Files Modified
- `src/core/domain/item.ts` (added constraints)
- `src/core/domain/index.ts` (export constraints)
- `docs/logs/IMPLEMENTATION_LOG.md` (this entry)

### Next Recommended Task
PKM-CORE-006: Canonical Rotation Contract

## 2026-09-20 — PKM-CORE-005: Optimization Objectives model implemented

### Completed
- Created canonical objectives model in `src/core/domain/`:
  - `objectives.ts`: ObjectiveKind type, OptimizationObjective interface, validation, and creation functions
- Implemented per specification:
  - Canonical `ObjectiveKind` with all listed kinds:
    - `'balanced'` (default)
    - `'fewest-cartons'`
    - `'least-wasted-volume'`
    - `'easier-to-carry'`
    - `'existing-inventory-first'`
    - `'min-dim-weight'`
    - `'min-carton-cost'`
  - `OptimizationObjective` interface with single `kind` property
  - Functions:
    - `createOptimizationObjective(kind)`: validates and returns objective
    - `validateOptimizationObjective(objective)`: validates objective kind
    - `isValidObjectiveKind(candidate)`: type guard for ObjectiveKind
  - Constants:
    - `VALID_OBJECTIVE_KINDS`: readonly array of all valid kinds
    - `DEFAULT_OBJECTIVE_KIND = 'balanced'`
- Updated domain module exports
- Housekeeping:
  - Updated misleading "immutable" comments in `item.ts` and `carton.ts` to clarify returned object clones caller-owned nested data
  - Corrected next task in CORE-003 log entry from PKM-CORE-005 to PKM-CORE-004
- Architecture mapping preserved:
  - Personal "Best overall" → `balanced`
  - Personal "Use fewest boxes" → `fewest-cartons`
  - Personal "Use least empty space" → `least-wasted-volume`
  - Personal "Make boxes easier to carry" → `easier-to-carry`
  - Personal "Use boxes I already own first" → `existing-inventory-first`
  - Business uses: all except `easier-to-carry`
- No custom weighted objectives implemented (future)
- No numerical scoring
- No solver integration
- No DIM calculation
- No shipping-cost calculation
- No UI components
- No external dependencies added
- Input objects not mutated
- Created comprehensive unit tests covering:
  - All valid objective kinds
  - Invalid kind rejection with descriptive error message
  - Default objective validation (`balanced`)
  - Architecture mapping verification
  - Input/output immutability verification
  - Type guard functionality

### Files Created
- `src/core/domain/objectives.ts`
- `src/test/objectives.test.ts`

### Files Modified
- `src/core/domain/index.ts` (added objectives export)
- `src/core/domain/item.ts` (updated misleading comment)
- `src/core/domain/carton.ts` (updated misleading comment)
- `docs/logs/IMPLEMENTATION_LOG.md` (this entry and CORE-003 correction)

## 2026-09-20 — PKM-CORE-006: Canonical Rotation Contract implemented

### Completed
- Created canonical axis-aligned rotation representation in `src/core/domain/result.ts`:
  - `PlacementRotation` type with 6 values: 'LWH', 'WLH', 'LHW', 'HLW', 'WHL', 'HWL'
  - `VALID_PLACEMENT_ROTATIONS` constant array
  - `validatePlacementRotation` function with descriptive error messages
- Updated `ItemPlacement` interface:
  - Rotation is now required (not optional)
  - Type changed from `rotation?: unknown` to `rotation: PlacementRotation`
  - No `unknown` technical debt remains
- Updated `validateItemPlacement` to validate rotation property
- Updated `createItemPlacement` to preserve rotation through cloning
- Updated all test placements in `src/test/result-placement.test.ts` to include valid rotations
- Added comprehensive rotation validation tests:
  - All 6 rotations accepted
  - Invalid rotation strings rejected
  - Non-string rotations rejected
  - Missing rotation property rejected
  - Each rotation literal preserved by `createItemPlacement`
- Maintained immutability guarantee: input objects not mutated
- No rotation-policy compatibility logic implemented (as per scope)
- No solver, verifier, or 3D transforms implemented (as per scope)

### Validation Results
- ✅ npm run typecheck: Passed (0 errors)
- ✅ npm test: Passed (255 tests)
- ✅ npm run build: Passed
- ✅ git diff --check: Clean (no whitespace errors)

### Files Modified
- `src/core/domain/result.ts`
- `src/test/result-placement.test.ts`
- `docs/logs/IMPLEMENTATION_LOG.md` (this entry and next task update)

## 2026-09-20 — PKM-CORE-006A.2 RECOVERY V2: Rotation Geometry Test File Created

### Completed
- Created new test file `src/test/rotation-geometry.test.ts` containing all rotation geometry tests
- Tests include:
  - Exact mapping for all 6 rotations (LWH, WLH, LHW, HLW, WHL, HWL)
  - Volume preservation verification for all rotations
  - Matching placement returns true tests
  - Mismatched placement returns false tests
  - Invalid canonical dimensions rejection tests
  - Original dimensions not mutated tests
  - Placement input not mutated tests
  - Tolerance parameter tests
- Preserved existing `src/test/result-placement.test.ts` unchanged (as required)
- Used existing functions `getRotatedDimensions` and `placementDimensionsMatchRotation` from `src/core/domain/result.ts`
- All tests validate proper rotation mapping and geometry correctness

### Validation Results
- ✅ npm run typecheck: Passed (0 errors, 0 warnings, 0 hints)
- ✅ npm test -- rotation-geometry.test.ts: 17 tests passed
- ✅ npm run build: Success (1 page built successfully)
- ✅ git diff --check: No whitespace errors
- ✅ git status --short: Shows new rotation-geometry.test.ts file created

### Files Modified/Created
- `src/test/rotation-geometry.test.ts` (created new test file)
- `docs/logs/IMPLEMENTATION_LOG.md` (this entry)

### Next Recommended Task
PKM-CORE-007: PackingPlan model

## 2026-09-21 — ADR-003 / solver adapter contract implemented

### Completed
- Solver adapter contract defined in `src/core/solver/contracts.ts`:
  - `SolverInput` interface for normalized packing problem
  - `SolverCandidatePlan` interface representing untrusted solver claims
  - `SolverAdapter` interface with async Promise contract for Web Worker compatibility
- All contracts use existing canonical domain models (Item, Carton, OptimizationObjective)
- Preserves independence from UI/React/Three.js
- Separates candidate claims from verified canonical result

## 2026-09-22 — ADR-004 / independent verification implemented

### Completed
- Independent verification contract defined in `src/core/verification/contracts.ts`:
  - `VerificationReport` interface with validity flag and issue descriptions
  - `verifyCandidatePlan` function signature for verifying solver candidates
- Verification implementation modules:
  - `geometry.ts`: Collision and boundary checking
  - `limits.ts`: Weight, quantity, and inventory limit validation
  - `references.ts`: Item/carton reference and ID validation
  - `verifier.ts`: Main orchestration combining all checks
- Candidate output remains untrusted until independent verification passes
- Verification does not construct canonical PackingPlan results (deferred per ADR-004)

## 2026-09-22 — ADR-005 / deterministic baseline solver implemented

### Completed
- Deterministic baseline solver implemented in `src/core/solver/baseline.ts`:
  - `solverId: 'packmetry-baseline'`
  - Implements `SolverAdapter` interface
  - First-fit decreasing with deterministic carton selection
  - Axis-aligned rotations only (no complex rotation policies)
  - Volume-first item ordering
  - Deterministic tie-breaking for reproducible results
- Returns exactly one candidate plan (per v1 design)
- Does not claim mathematical optimality
- Baseline serves as production-ready interchangeable solver
- Exposed through solver public API

## 2026-09-23 — Baseline solver public export

### Current test baseline
529 tests passing.


## 2026-09-24 — GitHub CI workflow established

### Completed
- GitHub Actions CI workflow created at `.github/workflows/ci.yml`
- Runs on push to main and pull requests
- Executes: npm ci, npm run typecheck, npm test
- Provides automated validation for all repository changes
- Ensures deterministic test execution in CI environment

## 2026-09-24 — Benchmark corpus expanded

### Completed
- Benchmark corpus expanded to 16 locked test cases
- Cases cover: exact fit, impossible fit, rotation required, multiple cartons, weight limits, inventory constraints
- Includes deterministic repeatability benchmark
- Provides stable regression foundation for solver verification
- All benchmark cases validated for structural correctness

## 2026-09-24 — Minimal functional PackingWorkspace implemented

### Completed
- `PackingWorkspace` React component implemented in `src/components/PackingWorkspace.tsx`
- Provides manual input UI for single item packing problem
- Supports: item dimensions, quantity, rotation policy, carton dimensions
- Executes complete packing pipeline on form submission
- Displays packing results via `ResultSummary` and `PackingVisualization`
- Validates user input through canonical domain validation
- Handles loading and error states appropriately

## 2026-09-24 — ResultSummary implemented

### Completed
- `ResultSummary` React component implemented in `src/components/ResultSummary.tsx`
- Displays canonical packing plan results in readable format
- Shows: plan status, carton count, placed/unplaced item counts
- Provides clear user-facing explanations for unplaced items
- Formats metrics (volume efficiency, weight efficiency)
- Presents solver metadata when available
- Supports all plan statuses (feasible, partial, infeasible, limit_reached)

## 2026-09-24 — Three.js PackingVisualization implemented and integrated

### Completed
- `PackingVisualization` React component implemented in `src/components/PackingVisualization.tsx`
- Uses Three.js to render 3D visualization of packed cartons and items
- Maps canonical dimensions to Three.js coordinate system
- Supports: multiple carton visualization, carton selection, item color coding
- Implements camera controls: drag/orbit, zoom in/out, reset view
- Handles empty states and loading appropriately
- Integrated into PackingWorkspace result display

## 2026-09-24 — Manual browser smoke test confirmed

### Completed
- Manual browser smoke test performed with `npm run dev`
- Confirmed: 3D carton renders correctly with proper dimensions
- Confirmed: packed items render correctly within carton boundaries
- Confirmed: different box sizes render correctly proportionally
- Confirmed: drag/orbit camera controls work smoothly
- Confirmed: zoom in/out controls work as expected
- Confirmed: visual feedback matches canonical packing result

## 2026-09-24 — ADR-008 objective-aware verified candidate selection implemented

### Completed
- Objective-aware candidate selection implemented in `src/core/solver/selection.ts`
- `selectVerifiedCandidate` function scores and ranks verified candidates by objective
- Supports: fewest-cartons, balanced, min-carton-cost, easier-to-carry
- Rejects unsupported objectives (e.g., min-dim-weight) with clear error
- Computes objective-specific metrics for ranking
- Maintains immutability guarantees
- Preserves verification-first architecture

## 2026-09-24 — ADR-009 canonical planning pipeline implemented

### Completed
- Canonical planning pipeline implemented in `src/core/solver/pipeline.ts`
- `planPacking` function provides unified orchestration API
- Orchestrates: solver execution → independent verification → candidate selection → canonical construction
- Preserves exactly-once execution guarantees
- Maintains immutability throughout pipeline
- Returns `CanonicalPlanningResult` with complete audit trail
- Provides clean migration target for workspace and API layers

## 2026-09-24 — PackingWorkspace migration to canonical planning pipeline

### Completed
- PackingWorkspace migrated from manual orchestration to `planPacking(...)`
- Replaces manual `solveAndVerify` → `createPackingPlanFromVerifiedCandidate` chain
- Preserves identical user-visible behavior
- Gains automatic candidate selection and objective support
- Reduces workspace orchestration complexity
- Aligns with canonical planning pipeline architecture

## 2026-09-24 — Phase 6 completion

### Completed
- Full canonical planning pipeline implemented and validated
- Workspace UI components implemented and integrated
- Three.js visualization operational and validated
- GitHub CI workflow operational
- Benchmark corpus solidified
- All architectural layers connected end-to-end

### Current test baseline
574 tests passing.

### Current dependency-aware stage
Phase 6 complete.

### Next planned product phase
Phase 7 — Three Box-Availability Workflows:
1. I Need Boxes
2. I Already Have Boxes
3. Use What I Have, Then Tell Me What to Buy
### Completed
- Solver subsystem exported through `src/core/solver/index.ts`:
  - Exports all solver contracts (`SolverInput`, `SolverCandidatePlan`, `SolverAdapter`)
  - Exports `BaselineSolver` class
  - Exports solver integration utilities
- All adapters accessible via standard import path
- Maintains Web Worker compatibility through Promise interface
- Interchangeable architecture preserved

## 2026-09-23 — ADR-006 / solver-verification integration implemented

### Completed
- Solver-verification integration implemented in `src/core/solver/integration.ts`:
  - `solveAndVerify` function orchestrates solver → verification pipeline
  - Accepts any `SolverAdapter` implementation (not just BaselineSolver)
  - Verifies every candidate returned by solver (1+)
  - Returns `SolverVerificationResult` with validity status and reports
  - Preserves independent verification as separate authority
- No canonical PackingPlan construction (deferred)
- No solver ranking, scoring, or fallback logic (deferred)
- Integration ends after independent verification

## 2026-09-23 — Solver-verification implementation validated

### Completed
- Integration tests created in `src/test/solver-verification-integration.test.ts`:
  - Validates pipeline from solver input through verification
  - Tests valid and invalid candidate scenarios
  - Verifies independent verification authority maintained
  - Confirms multiple-candidate handling
- All solver-verification integration tests pass
- Pipeline handles solver errors gracefully
- No mutation of solver or verification inputs

## 2026-09-23 — ADR-007 / canonical plan construction implemented

### Completed
- Canonical PackingPlan construction defined in `src/core/domain/plan-construction.ts`:
  - `createPackingPlanFromVerifiedCandidate` function constructs canonical result
  - Transforms verified candidate to canonical PackingPlan with required fields:
    - ID generation with deterministic prefix
    - Status mapping from candidate status
    - Carton array conversion with metrics computation
    - Unplaced items preservation
    - Plan metrics calculation (carton count, volume efficiency, weight efficiency)
    - Explanations placeholder array
    - Solver metadata propagation
- Preserves immutability guarantee
- Requires independent verification to have passed
- Does not replace independent verification
- Throws on programming/invariant failures (undefined carton references)

## 2026-09-23 — Canonical PackingPlan construction implementation validated

### Completed
- Plan construction tests created in `src/test/plan-construction.test.ts`:
  - Valid construction from verified candidate
  - Required field validations
  - Carton metrics correctness verification
  - Plan metrics calculation validation
  - Immutability preservation tests
  - Error handling for invalid inputs
- All canonical construction tests pass
- Construction does not mutate candidate arrays
- Maintains deterministic plan ID generation

### Current test baseline
529 tests passing.

## 2026-09-28 — Phase 7: Box-Availability Workflows, Workspace Redesign & Multi-Item Support Complete

### Completed
- ADR-010 accepted and implemented
- Purchase-carton candidate generator implemented
- I Need Boxes workflow + workspace integration
- I Already Have Boxes workflow + inventory-aware workspace integration
- Hybrid workflow + workspace integration
- Packmetry workspace visual redesign
- Result presentation compacted / nested result scrolling removed
- Multiple different item types supported across all three workflows

### Validation Results
- Latest accepted test baseline: 637 tests passing

### Current dependency-aware stage
Phase 7 complete

### Next planned phase
Phase 8 — Personal UX

## 2026-09-29 — Phase 8 Personal UX progress (current)

### Completed
- Personal item names added to PackingWorkspace
- Personal item names in PackingVisualization legend
- Personal item names in ResultSummary
- Optional personal item weight using canonical unitWeightG
- Duplicate item action with unique stable internal IDs
- Metric/imperial UI unit switching while preserving canonical mm/g
- Keep Upright preference using canonical rotationPolicy: 'upright'
- Allow Rotation preference using canonical rotation behavior
- Personal primary CTA: Find my packing plan
- Personal result selection rationale: Why this plan?
- Personal result Save plan action
- Personal result Share plan action
- Personal result Packed weight metric
- Personal result Empty space metric
- Persisted Metric / Imperial unit preference using browser localStorage
- Recent Personal packing plans using IndexedDB
- Recent Personal items using IndexedDB

### Intentional deferrals / limitations
- Fragile UI deferred: canonical `fragile` field exists but current solver/verifier do not enforce fragile behavior
- Extra Padding UI deferred: canonical `paddingAllowanceMm` exists but current solver/verifier do not enforce padding geometry
- Lighter boxes preference deferred: easier-to-carry objective requires complete weight data that current personal workflow does not guarantee
- Fewer boxes preference not exposed as separate toggle: current personal planning already uses fewest-cartons
- General 2–3 "best alternatives" UI deferred: BaselineSolver returns only one solver candidate
- Print intentionally NOT part of Personal Results: current product decision is Save + Share only

### Current CI validation
- Latest main commit: 82130a9
- GitHub Actions CI run #44: SUCCESS
- 92 files checked
- 0 errors
- 0 warnings
- 0 hints
- 49 test files passed
- 738 tests passed
- Production build passed

### Current stage
Phase 8 — Personal UX in progress

## 2026-09-30 — Phase 8 Personal UX complete

### Completed

Summarize the final Phase 8 capabilities:
- plain-language personal workspace
- multiple named items and quantities
- optional item weight
- item duplication/removal
- Metric / Imperial UI switching
- persisted unit preference
- three box-availability workflows
- Keep Upright / Allow Rotation
- Find my packing plan CTA
- understandable verified results
- 3D visualization
- utilization / packed weight / empty space
- Why this plan? rationale
- Save / Share
- Recent Personal plans
- Recent Personal items
- browser-first / account-free Personal experience

### Validated deferrals

Record the six existing intentional deferrals without changing their meaning:
- Fragile UI deferred because solver/verifier do not enforce fragile behavior
- Extra Padding deferred because padding geometry is not currently enforced
- Lighter boxes preference deferred because complete weight data is not guaranteed
- Fewer boxes preference not separately exposed because current personal planning already prioritizes fewest cartons
- General 2–3 best alternatives deferred because BaselineSolver returns one candidate
- Print intentionally excluded from Personal Results; Save + Share remain the product decision

### Final validation

Record:
- latest accepted implementation baseline: 738 tests passing
- 49 test files passing
- GitHub Actions run #45: SUCCESS
- production build passed
- no Phase 8 blockers remain

### Current dependency-aware stage

Phase 8 complete.

### Next planned phase

Phase 9 — Business UX

## 2026-10-01 — Phase 9 Business UX complete

### Completed
- Dedicated Business workspace implemented using the existing shared packing engine
- Multiple Business products supported with:
  - product name
  - optional SKU
  - dimensions
  - quantity
  - optional unit weight
  - supported rotation/handling policy
- Business carton inventory supported with:
  - carton name
  - carton code
  - internal dimensions
  - quantity available
  - optional maximum gross weight
  - optional empty carton weight
  - optional carton cost
- Business objective selection implemented for:
  - Balanced
  - Fewest boxes
  - Least empty space
- Business planning continues to use the existing verified `planHaveBoxes` workflow and canonical PackingPlan
- Business-specific result metrics added:
  - gross packed weight from canonical plan metrics
  - carton cost from canonical plan metrics
  - stock impact from existing inventory usage
- Existing shared ResultSummary and PackingVisualization remain reused
- Dedicated `/business/` route implemented
- Dedicated `/personal/` route implemented without duplicating the Personal workspace
- Root `/` converted to Personal-vs-Business intention classification
- Homepage provides direct entry to both `/personal/` and `/business/`
- No separate Business solver or packing engine introduced

### Constraint truthfulness
- Business UI exposes only handling semantics currently enforced by the solver:
  - Any rotation
  - Keep upright
  - Fixed orientation
- Fragile, padding, spacing, and stackability controls remain unexposed because their full solver/verifier semantics are not currently enforced

### Validated later-phase deferrals
- Local Business persistence belongs to Phase 10
- Alternatives and broader objective-scoring UX belong to Phase 11
- DIM weight and chargeable-weight modules belong to Phase 12
- CSV import/export belongs to Phase 14
- Batch workflows belong to Phase 15
- Saved product catalog belongs to Phase 16
- Analytics, accounts/cloud, and integrations/API remain later roadmap work

### Final validation
- 102 files checked
- 0 errors
- 0 warnings
- 0 hints
- 56 test files passing
- 789 tests passing
- Production build passed
- Generated routes:
  - `/`
  - `/personal/`
  - `/business/`
- GitHub Actions run #53: SUCCESS
- No Phase 9 blockers remain

### Current dependency-aware stage

Phase 9 complete.

### Next planned phase

Phase 10 — Local Persistence

2026-10-03 — Phase 10 Local Persistence complete
Completed
- Personal browser-local persistence retained and validated:
  - Metric / Imperial unit preference
  - Recent Personal items
  - Recent Personal packing plans
- Business saved carton library implemented with IndexedDB:
  - saved carton identity
  - carton name and code
  - dimensions
  - quantity available
  - optional maximum gross weight
  - optional empty carton weight
  - optional carton cost
- Business objective preference implemented using browser-local preference storage
- Business handling preference implemented using browser-local preference storage
- Business recent-project persistence implemented with a dedicated IndexedDB database:
  - project identity and name
  - complete product snapshot
  - complete carton snapshot
  - objective
  - per-product handling selections
  - saved timestamp
  - newest-first ordering
  - duplicate-ID replacement semantics
  - bounded 10-project history
- Business recent-project workspace integration implemented:
  - explicit Save project action
  - explicit Open project action
  - no automatic save during optimization
  - project restore clears stale result state
  - project restore does not rewrite global objective or handling preferences
- Versioned Business project JSON backup implemented:
  - format packmetry.business.project
  - version 1
  - complete project snapshot serialization
  - safe malformed/unrelated/unsupported JSON rejection
  - strict objective and handling subsets
  - no numeric-string coercion
  - duplicate product/carton identity rejection
  - optional values remain optional without fake defaults
- Business project JSON browser actions implemented:
  - deterministic safe filename generation
  - application/json downloads
  - Blob/object-URL/temporary-anchor download boundary
  - selected-file text reading
  - safe browser/read failure results
  - cleanup of temporary browser resources
- Business project JSON workspace integration implemented:
  - explicit Export project JSON action
  - explicit Import project JSON file input
  - imported project restores id, name, products, cartons, objective, and handling selections
  - imported project clears stale result state
  - imported project is not automatically persisted
  - user must explicitly Save project to retain imported data in recent-project history
  - import/export reuse dedicated JSON and browser-action modules
- Business project identity initialization race fixed:
  - recent-project history readiness tracked separately from an empty history
  - new unsaved project Save/Export cannot allocate an identity until recent history has loaded
  - existing/opened/imported project identities remain usable
  - deterministic business-project-N identity policy remains unchanged
- No IndexedDB schema migration was required
- Core solver, verifier, workflows, canonical PackingPlan, Three.js result visualization, and routes remain unchanged
Persistence architecture
- IndexedDB remains the structured local-data store for projects/cartons/recent records
- localStorage-style preference modules remain limited to small preferences
- JSON validation/serialization is isolated from browser file mechanics
- Browser file mechanics are isolated from React workspace state
- BusinessWorkspace reuses persistence and JSON modules instead of duplicating storage or parsing logic
- Local persistence remains browser-first and account-free
Validated deferrals
- Alternatives and broader objective-scoring UX belong to Phase 11
- DIM weight, chargeable-weight modules, and broader DIM settings belong to Phase 12
- CSV import/export belongs to Phase 14
- Batch processing belongs to Phase 15
- Saved product catalog belongs to Phase 16
- Analytics and carton-portfolio rationalization belong to Phase 17
- Accounts/cloud belong to Phase 18
- Integrations/API belong to Phase 19
- Unsupported fragile, padding, spacing, and stackability UI remains deferred until solver/verifier semantics fully support those constraints
Final validation
- 120 files checked
- 0 errors
- 0 warnings
- 0 hints
- 68 test files passing
- 952 tests passing
- Production build passed
- Generated routes:
  - /
  - /personal/
  - /business/
- Latest validated main commit: 4abc20d87a87d1a6cfe20757860568c172554306
- GitHub Actions run #66: SUCCESS
- No Phase 10 blockers remain
Current dependency-aware stage
Phase 10 complete.
Next planned phase
Phase 11 — Alternatives & Objective Scoring


## 2026-10-03 — Phase 11 Alternatives & Objective Scoring complete

### Completed
- ADR-011 deterministic multi-candidate generation implemented
- Three deterministic candidate-generation strategies:
  - input-order candidate generation
  - smallest-volume-first candidate generation
  - largest-volume-first candidate generation
- Exact candidate deduplication prevents duplicate canonical packing results
- solverVersion 2 includes bounded candidate set generation
- Canonical pipeline: solver → independent verification → ADR-008 ranking → canonical plan
- Ranked alternative materialization for non-selected plans
- Canonical pipeline and have-boxes integration validation
- Shared PlanAlternatives component for unified alternatives UI
- Personal have-boxes alternatives integration
- Business alternatives integration throughout result display
- Objective-ranking explanation UX with truthful heuristic wording
- Current bounded candidate set ensures UI has at most two non-selected alternatives

### Design Boundaries Preserved
- No DIM/weight semantics added (deferred to Phase 12)
- No new solver engine added (stayed within BaselineSolver capabilities)
- No global-optimality claim introduced
- Inventory usage remains tied to the recommended canonical plan
- Three.js visualization continues to show canonical verified result, not separate calculations

### Final validation
- typecheck: 0 errors, 0 warnings, 0 hints
- 991 tests passing across 69 test files
- production build passed
- routes /, /personal/, /business/ generated successfully
- latest validated main commit: 1cfc34f
- GitHub Actions run #75: SUCCESS
- No Phase 11 blockers remain

### Current dependency-aware stage
Phase 11 complete.

### Next planned phase
Phase 12 — DIM / Weight Modules


## 2026-10-04 — Phase 12 DIM / Weight Modules complete

### Completed
- ADR-012 dimensional and chargeable weight semantics accepted and implemented
- Canonical dimensional-weight divisor/settings module implemented
- SolverInput accepts optional dimensional-weight planning context
- Canonical carton metrics support DIM weight and estimated chargeable weight
- Canonical plan metrics support total DIM weight and total estimated chargeable weight
- Carton DIM calculations use external dimensions only; no internal-dimension fallback
- Actual gross weight remains physical contents plus carton tare when both are known
- DIM weight remains distinct from physical mass
- Estimated chargeable weight is available only when both actual gross and DIM weight are known
- min-dim-weight verified candidate ranking implemented with deterministic tie-breaking
- Have-boxes workflow propagates dimensional-weight settings
- Business carton model/UI supports optional external dimensions
- Business workspace supports explicit DIM divisor value plus length/mass units
- No numeric carrier divisor default or carrier preset is assumed
- Business recent projects persist DIM settings
- Business project JSON version 1 round-trips DIM settings while remaining backward compatible with older v1 snapshots that omit them
- Business result presentation exposes Actual gross weight, DIM weight, and Estimated chargeable weight from canonical metrics
- Business Lowest DIM weight objective exposed with prerequisite gating
- min-dim-weight preference/project/JSON persistence implemented
- zero-availability cartons do not block min-DIM objective readiness
- carrier billing rounding, service rules, rates, and shipping prices remain outside Phase 12

### Architecture boundaries preserved
- DIM settings are ranking/metric context and do not change packing geometry
- independent verification remains authoritative before candidate ranking
- physical max-gross-weight semantics remain separate from DIM/chargeable weight
- no carrier-specific numeric preset was introduced
- no shipping-rate engine was introduced
- solver/core architecture remains shared between Personal and Business

### Final validation
- typecheck: 0 errors, 0 warnings, 0 hints
- 72 test files passing
- 1098 tests passing
- production build passed
- routes /, /personal/, /business/ generated successfully
- latest validated main commit: cf7fd442277a3ef5801cd054548ef0478cfb6ac8
- GitHub Actions run #88: SUCCESS
- No Phase 12 blockers remain

### Current dependency-aware stage
Phase 12 complete.

### Next planned phase
Phase 12.5 — Product UI & Visual Integration Sprint

This focused sprint covers homepage, Personal, Business, result surfaces, 3D presentation, responsive/accessibility polish, and design consistency without rewriting the solver/core or inventing unsupported metrics.

2026-10-06 — Phase 12.5 Product UI & Visual Integration Sprint complete
Completed
- Polished the Packmetry homepage while preserving the browser-first product position
- Added a clearer Personal-vs-Business entry hierarchy
- Added an interactive homepage packing-geometry presentation without changing solver output or canonical placement semantics
- Polished Personal workspace and result presentation
- Polished Business workspace and result presentation
- Compacted Business form density while preserving existing functionality
- Improved result hierarchy, spacing, badges, rationale presentation, and 3D result framing
- Added shared responsive/mobile refinements for Personal and Business without disturbing the accepted desktop layouts
- Added dedicated PackingVisualization styling while preserving canonical verified placement rendering
- Introduced the accepted Packmetry outline + solid carton brand mark
- Added matching SVG favicon
- Added shared Guides navigation and reusable GuideArticleLayout
- Added /guides/ library page
- Added three starter/sample guide articles:
  - Choosing a box without wasting space
  - Packing with boxes you already have
  - DIM weight without the carrier guesswork
- Added /contact/ with packmetry@gmail.com as the current direct contact path
- Added /privacy/ describing the current browser-local data model, email contact boundary, hosting-data boundary, current analytics/advertising-tracker boundary, user controls, and future-policy update requirement
- Added Contact and Privacy to footer navigation
- Preserved the shared solver/core architecture and did not invent unsupported metrics or carrier behavior
Guides content boundary
- The three current guide articles are starter/sample content so the Guides surface is not empty
- Future production guide articles should be researched and published one at a time
- Production guide work should include current keyword/SERP research, search-intent analysis, semantic keyword/entity clustering, content-gap analysis, internal linking, factual verification, and complete on-page SEO
- Keyword stuffing, thin content, and invented carrier-specific assumptions remain unacceptable
Final validation
- 75 test files passing
- 1118 tests passing
- typecheck: 0 errors, 0 warnings, 0 hints
- production build passed
- 9 generated pages:
  - /
  - /personal/
  - /business/
  - /guides/
  - /guides/choosing-a-box/
  - /guides/packing-with-existing-boxes/
  - /guides/dimensional-weight/
  - /contact/
  - /privacy/
- latest validated main commit: 3f02576a7aef7910c72869766aac3153d78bea92
- GitHub Actions run #99: SUCCESS
- no Phase 12.5 blockers remain
Current dependency-aware stage
Phase 12.5 complete.
Next planned phase
Phase 13 — SEO foundation.


## 2026-10-08 — Phase 13 SEO Tools & Content Framework — milestone closeout

### Implemented

- Technical SEO foundation: canonical URLs, robots.txt, sitemap.xml, Open Graph and Twitter metadata.
- Homepage Organization/WebSite JSON-LD and guide Article/BreadcrumbList JSON-LD without invented publishing dates.
- Tools library with four browser-based calculators: DIM weight, single-item box size, box volume utilization, and identical-items uniform-grid capacity (`/tools/how-many-items-fit/`).
- All supporting calculators reuse Packmetry's unit semantics, distinguish internal carton dimensions from external shipping dimensions, and explicitly state calculation boundaries. Volume-only and grid estimates do not claim verified 3D packing or global maximum capacity.
- Methodology index and expanded packing-algorithm page covering heuristic candidates, independent verification, coverage-first ranking, canonical plans, utilization, DIM, assumptions and constraints.
- Worked examples library and benchmark-backed mixed-item case; no invented supplier data, carrier prices or mathematical optimality claims.
- Expanded shared footer links and public route sitemap as real destinations were added.

### Validation and repository checkpoint

- Final focused Slice 10 test run: 29 passing tests, typecheck 0 errors, build 18 pages, diff check passed.
- Latest confirmed pushed and clean main commit before documentation closeout: `6298689ad7d4f461bf41d557030c6be9ad6120f8`.
- These are the latest focused validation results; **no fresh Phase 13 full-suite pass or live search indexing verification is claimed**.
- Earlier README and log Phase 12.5 state/test counts were historical and are superseded by this Phase 13 milestone record.

### Preserved guardrails

- Shared Personal/Business verified packing engine unchanged by SEO-tool additions.
- No fake search performance, solver speed, guaranteed optimum, carrier rate or unsupported constraint claims.
- No accounts, required backend, paid services or unrelated calculators introduced.
- Additional content pages are to be driven by genuine usefulness and research, not by filling empty route categories.

### Current stage and next work

Phase 13 implementation foundation complete; proceed to **Phase 14 — CSV import/export** with validated file schemas, safe row-level error reporting and explicit dimension/weight unit normalization. Phase 15 batch processing remains a separate later phase.

## 2026-10-09 — Phase 14 CSV Import/Export — milestone closeout

### Completed

- Slice 1: Validated Business products CSV import.
- Slice 2: Business products CSV export with import-compatible schema.
- Slice 3: Business workspace product CSV import/export controls.
- Slice 4: Validated Business carton inventory CSV import.
- Slice 5: Business carton CSV export with import-compatible schema.
- Slice 6: Business workspace carton CSV import/export controls.
- Slice 7: Spreadsheet-formula identifier safety validation and regression tests.

### Data and safety boundaries

- Product and carton CSV schemas are separate and require explicit units.
- Internal dimensions normalize to millimeters and weights to grams.
- Optional unknown measurements are not replaced with invented defaults.
- Invalid rows reject the entire CSV import; partial imports are not applied.
- Successful imports replace the relevant current workspace rows and invalidate previous packing results.
- Saved projects and the saved carton library are not automatically modified by CSV import.
- Existing Business project JSON backup remains separate from CSV interchange.
- No solver, verifier, or canonical packing-plan behavior was rewritten.
- CSV processing remains browser-local with bounded input file size.
- Batch order execution and background processing remain Phase 15 responsibilities.

### Validation and repository checkpoint

- Seven focused slices completed with successful targeted validation.
- Latest Phase 14 implementation validation: focused tests passed, typecheck 0 errors, production build 18 pages, diff check passed.
- Latest pushed implementation commit: `d054cbc18e95052da4b5aecc59c5b187a3a323e3`.
- The reported results are focused validation checkpoints, not a fresh full test-suite run.
- Fourteen unrelated temporary files were safely moved outside the repository, leaving a clean Git working tree.

### Current dependency-aware stage

Phase 14 implementation complete. Phase 14 documentation closeout is the remaining administrative checkpoint.

### Next planned phase

Phase 15 — Batch Processing: multiple orders, Web Workers, progress and cancellation controls, browser resource limits, and verified per-order packing results.