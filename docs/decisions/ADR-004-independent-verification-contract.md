# ADR-004: Independent Verification Contract

**Status:** Accepted
**Context:** Master spec §12.4 requires independent verification. Authority §27 forbids trusting solver output without verification.

**Decision:** Lock v1 verification contracts:

**VerificationIssueCode:**
`type VerificationIssueCode = 'unknown-item' | 'unknown-carton' | 'invalid-instance' | 'boundary-violation' | 'overlap' | 'rotation-violation' | 'weight-limit' | 'quantity-mismatch' | 'unplaced-mismatch' | 'inventory-overuse';`

**VerificationIssue:**
`interface VerificationIssue { code: VerificationIssueCode; message: string; itemId?: string; instanceIndex?: number; cartonIndex?: number; cartonId?: string; }`

**VerificationReport:**
`interface VerificationReport { valid: boolean; issues: VerificationIssue[]; }`
Invariant: `valid === (issues.length === 0)`

**Verification API:**
`verifyCandidatePlan(input: SolverInput, candidate: SolverCandidatePlan): VerificationReport`
Function: non-mutating; fails via report; throws only for invalid input.

**V1 Checks:** Referenced IDs exist; instanceIndex valid; instances counted once; placement matches rotation; rotation obeys policy; inside boundaries; no overlaps; weight ≤ maxGrossWeightG (when all known); usage ≤ inventory.

**Rotation Mapping:** 'any': LWH,WLH,LHW,HLW,WHL,HWL; 'upright': LWH,WLH; 'vertical-axis-only': LWH,WLH; 'fixed': LWH.

**Geometry:** Tolerance `1e-10` mm. Boundary: min ≥ -tolerance, max ≤ dimension+tolerance. Overlap: >tolerance on all 3 axes. Touching ≠ overlap.

**Weight:** Gross = known items weight + emptyBoxWeightG. If any item weight unknown → no violation claim, no zero assumption. No issue code for unknown weight.

**Inventory:** quantityAvailable/stockQuantity are upper bounds; if both defined, satisfy both; undefined = no bound.

**Deferred:** paddingAllowanceMm, spacingAllowanceMm, fragile, stackable, metric consistency, candidate status, PackingPlan construction, explanation, objective scoring. Reason: insufficiently defined; require later ADR.

**Note:** VerificationReport ≠ PackingPlan. Canonical result constructed downstream after verification succeeds.

**Authority:** Aligns with master spec §12.4 and authority §27/§465.

**Revisit if:** Deferred constraints need verification; severity system needed; weight handling refinement; tolerance changes; performance optimization.