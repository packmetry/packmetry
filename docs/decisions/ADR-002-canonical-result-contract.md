# ADR-002: Canonical Result Contract

## Status
Accepted

## Context
The Packmetry canonical result model defined in master specification §38 references several supporting types that require precise definition to ensure consistent implementation. While §38 defines the top-level `PackingPlan` and `PackedCarton` structure, it does not detail the specific contracts for metrics, unplaced items, explanations, and solver metadata.

## Decision
We lock the following v1 contracts for the canonical result model:

### UnplacedReason
Enumeration of reasons why an item could not be placed:
- `no-fitting-carton`
- `inventory-exhausted`
- `weight-limit`
- `constraint-conflict`
- `solver-limit-reached`

### UnplacedItem
Represents an item instance that could not be placed:
- `itemId: string` – Identifier of the item type (matches catalog)
- `instanceIndex: integer >= 0` – Zero-based index distinguishing multiple instances of the same item
- `reason: UnplacedReason` – Specific reason why this instance was not placed

### CartonMetrics
Metrics for a single packed carton:
- `itemCount: integer >= 0` – Number of items placed in this carton
- `itemVolumeMm3: finite >= 0` – Total volume of placed items (mm³)
- `cartonVolumeMm3: finite >= 0` – Internal volume of the carton (mm³)
- `emptyVolumeMm3: finite >= 0` – Unused volume in carton (mm³)
- `utilization: finite 0..1` – Item volume ÷ carton volume (0 to 1 inclusive)
- `contentsWeightG?: finite >= 0` – Optional total weight of contents (grams)
- `grossWeightG?: finite >= 0` – Optional total weight including carton tare (grams)

### PlanMetrics
Metrics for the complete packing plan:
- `cartonCount: integer >= 0` – Total number of cartons in the plan
- `placedItemCount: integer >= 0` – Total items successfully placed
- `unplacedItemCount: integer >= 0` – Total items that could not be placed
- `itemVolumeMm3: finite >= 0` – Total volume of all placed items (mm³)
- `cartonVolumeMm3: finite >= 0` – Total volume of all cartons used (mm³)
- `emptyVolumeMm3: finite >= 0` – Total unused volume across all cartons (mm³)
- `utilization: finite 0..1` – Overall utilization (0 to 1 inclusive)
- `totalContentsWeightG?: finite >= 0` – Optional total weight of all placed items (grams)
- `totalGrossWeightG?: finite >= 0` – Optional total weight including all carton tares (grams)
- `totalCartonCost?: finite >= 0` – Optional total cost of cartons used

### ExplanationLevel
Severity level for explanations:
- `info` – Informational message about the result
- `warning` – Important condition that may affect the result

### Explanation
Human-readable explanation about the result:
- `code: non-empty string` – Machine-readable identifier
- `message: non-empty string` – Human-readable description
- `level: ExplanationLevel` – Severity of the explanation

### SolverMeta
Metadata about the solver that produced the result:
- `solverId: non-empty string` – Identifier of the solver algorithm
- `solverVersion?: non-empty string` – Optional version identifier
- `durationMs: finite >= 0` – Processing time in milliseconds
- `deterministic: boolean` – Whether results are reproducible with same inputs

## Implementation Note
The current Packmetry implementation uses `Carton` as the equivalent of master-spec `CartonDefinition`. No duplicate `CartonDefinition` type should be created.

## Rationale
1. **Consistency**: Ensures all solver adapters produce compatible result structures
2. **Verification**: Provides clear contracts for independent verification of solver results
3. **Visualization**: Enables Three.js and UI components to rely on stable interfaces
4. **Extensibility**: Optional fields allow gradual feature adoption without breaking changes
5. **Clarity**: Eliminates ambiguity in metric calculations and reason codes

## Consequences
### Positive
- Clear interface contracts for result consumption
- Consistent metrics calculation across solvers
- Support for weight-aware and cost-aware optimizations
- Human-readable explanations for users
- Solver metadata for debugging and comparison

### Negative
- Additional validation required for metric consistency
- Optional fields may lead to incomplete implementations
- Unit conversion responsibility at interface boundaries

## Authority Relationship
This ADR provides detailed type definitions for the structures named in master specification §38. It does not modify or contradict the authority of §38, which remains the highest source for the canonical result model structure.

## Validation / Revisit Trigger
This contract should be revisited if:
- New solver capabilities require additional metric fields
- Weight or cost optimizations become mandatory rather than optional
- Additional explanation levels are needed
- Performance requirements necessitate changes to metadata collection
- Measurement unit decisions change (see ADR-001)