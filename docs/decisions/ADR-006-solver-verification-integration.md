# ADR-006: Solver Verification Integration Contract

## Status
Accepted

## Context

ADR-003 defines the async `SolverAdapter` boundary and establishes that solver candidate output is not trusted canonical output.

ADR-004 defines `verifyCandidatePlan(...)` as the independent verification boundary and requires solver candidates to be checked independently before they can contribute to a canonical result.

ADR-005 defines the deterministic baseline solver, which now implements `SolverAdapter` and is exposed through the solver public API.

The project now needs a small orchestration path connecting:

normalized `SolverInput`
→ `SolverAdapter.solve(...)`
→ solver candidate output
→ independent `verifyCandidatePlan(...)`
→ candidate verification results

This integration must preserve solver interchangeability and independent verification without prematurely defining canonical `PackingPlan` construction, explanation generation, objective scoring, candidate ranking, or other behavior explicitly deferred by ADR-004.

## Decision

### Integration function

The v1 solver-verification integration API is:

```typescript
async function solveAndVerify(
  solver: SolverAdapter,
  input: SolverInput
): Promise<SolverVerificationResult>