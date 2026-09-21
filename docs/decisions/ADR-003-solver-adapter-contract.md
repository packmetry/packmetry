# ADR-003: Solver Adapter Contract

## Status
Accepted

## Context
The master specification requires interchangeable solver architecture and independent verification. The packing engine must be hidden behind an internal solver adapter so third-party solvers can be replaced later (authority §11/§27). Phase 2 prioritizes establishing the solver adapter boundary before trusting solver output.

The architecture requires clear TypeScript contracts for solver input, candidate output, and adapter interface that: preserve independence from UI/React/Three.js; use existing canonical domain models (Item, Carton, OptimizationObjective); separate candidate claims from verified canonical result; and enable worker-friendly async execution.

## Decision
We lock the following v1 contracts for the solver adapter subsystem:

### SolverInput
```typescript
interface SolverInput {
  items: Item[];
  cartons: Carton[];
  objective: OptimizationObjective;
}
```
- Items already contain normalized constraints (rotation policy, fragile handling, etc.)
- Cartons already contain availability/inventory/weight/cost metadata
- All dimensions and weights are in canonical millimeters and grams
- Adapter must not mutate caller-owned input arrays or objects

### SolverCandidateCarton
```typescript
interface SolverCandidateCarton {
  cartonId: string;
  placements: ItemPlacement[];
}
```
- Each entry equals one carton instance used by the candidate
- `cartonId` references one Carton from `SolverInput.cartons`
- Do not embed Carton; do not include metrics here
- Placements reference valid item IDs and instance indices

### SolverCandidatePlan
```typescript
interface SolverCandidatePlan {
  status: PlanStatus;
  cartons: SolverCandidateCarton[];
  unplacedItems: UnplacedItem[];
}
```
- `status` is the solver's candidate claim before independent verification
- Candidate output is NOT trusted canonical verified output
- Do not include PackingPlan metrics, explanations, or solverMeta here
- Must represent solver inability via status/unplacedItems, not by throwing

### SolverOutput
```typescript
interface SolverOutput {
  candidates: SolverCandidatePlan[];
  solverMeta: SolverMeta;
}
```
- Must contain at least one candidate
- `solverMeta` uses existing ADR-002 contract (solverId, version, durationMs, deterministic)
- Solver inability to fit items is represented by candidate status/unplacedItems

### SolverAdapter
```typescript
interface SolverAdapter {
  solve(input: SolverInput): Promise<SolverOutput>;
}
```
- Async Promise contract is mandatory for Web Worker compatibility
- API is data-only and worker-friendly
- No UI/React/Three.js/storage/backend types in v1
- No solver-specific configuration in v1
- No progress callback in v1
- No cancellation API or AbortSignal in v1
- No fallback/multi-solver orchestration in v1
- No Web Worker message protocol in this ADR
- No custom solver error type in v1
- Unexpected execution failures reject the Promise with Error
- Actual solver/library selection requires a separate future decision

## Alternatives considered
1. **Synchronous solve()**: Rejected because Web Worker parallelism is required for production-scale problems.
2. **Callback-based progress**: Rejected for v1 to keep initial contract minimal; can be added later.
3. **Embedded Carton in candidate**: Rejected to avoid data duplication and ensure consistency.
4. **Single candidate instead of array**: Rejected to support solver libraries that produce alternative solutions.
5. **Solver-specific error types**: Rejected in v1; generic Error suffices for unexpected failures.
6. **Cancellation via AbortSignal**: Deferred to future version when solver libraries support it.

## Consequences
### Positive
- Clear boundary for interchangeable solver implementations
- Async contract enables Web Worker isolation
- Candidate output clearly distinguished from verified result
- Reuses existing domain models without duplication
- Supports multiple candidate solutions

### Negative
- No cancellation support in v1
- No progress reporting in v1
- Simplified error handling may limit debugging

## Authority relationship
This ADR provides detailed type definitions for the solver adapter boundary named in master specification §27 and authority bootstrap §11/§27. It does not modify or contradict the authority requirement for interchangeable solver architecture and independent verification. These exact TypeScript shapes are an implementation architecture decision filling authority-defined gaps, not a modification of product requirements.

## Validation / revisit trigger
This contract should be revisited if:
- Web Worker message protocol requires additional metadata
- Solver cancellation becomes mandatory
- Weighted/multi-objective optimization requires extended input
- Batch solving requires streaming interface