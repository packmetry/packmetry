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
