Packmetry
Packmetry is a browser-first packing and cartonization decision workbench.
Tell us what you are packing. We will figure out the boxes.

Project authority
Before changing product behavior, architecture, design direction, or implementation strategy, read:
1. docs/authority/PACKMETRY_NEW_PROJECT_CHAT_BOOTSTRAP.md — highest repository project authority after an explicit current user instruction.
2. docs/authority/CARTONLAB_ULTIMATE_PROJECT_SPECIFICATION.md — detailed legacy product specification; interpret CartonLab as Packmetry unless the bootstrap explicitly says otherwise.
3. Accepted ADRs in docs/decisions/.
4. The current approved task packet.
The Packmetry bootstrap controls naming, workflow, design status, repository policy, and any override of the older CartonLab document.
Important boundaries
- Final public brand: Packmetry
- Domain: Packmetry.com
- Repository: packmetry
- Personal and Business are two experiences on one shared engine.
- The three box-availability workflows are first-class product requirements.
- The packing engine must remain independent from React/UI and Three.js.
- Solver output must be independently verified before being presented as a successful packing result.
- Three.js visualizes the canonical verified result; it does not invent placements.
- Core free use remains browser-first with no mandatory backend or account.
- Do not claim globally optimal packing unless it is actually proven for the exact case.
AI implementation workflow
Cline is the implementation agent, not the product owner.
For every meaningful task:
1. ChatGPT issues one narrow task packet.
2. Cline reads only the relevant repository context.
3. Cline implements and validates the approved scope.
4. Cline inspects its diff and returns READY_FOR_REVIEW.
5. Cline does not commit or push.
6. ChatGPT reviews the receipt/diff.
7. Only after approval does the user commit and push.
See docs/process/AI_IMPLEMENTATION_WORKFLOW.md.
Current state
Phase 12 complete: DIM / Weight Modules implemented and validated.
Personal and Business entry experience:
- Root homepage classifies visitors by intention
- Home & Personal entry at /personal/
- Business entry at /business/
- Personal and Business continue to use one shared packing engine
Business UX core capabilities:
- Multiple products
- Product name and optional SKU
- Product dimensions and quantity
- Optional product weight
- Supported handling controls: Any rotation, Keep upright, Fixed orientation
- Multiple carton inventory types
- Carton name and code
- Carton dimensions and available quantity
- Optional maximum gross weight
- Optional carton tare weight
- Optional carton cost
- Optional carton external dimensions
- Explicit dimensional-weight divisor and divisor units
- Balanced objective
- Fewest boxes objective
- Least empty space objective
- Lowest DIM weight objective
- Optimize packing CTA
- Shared verified planHaveBoxes planning workflow
- Canonical packing result
- Carton count and packed/unpacked items
- Utilization and empty space
- Content weight and gross packed weight when known
- Actual gross weight when product weight and carton tare weight are known
- Canonical DIM weight when settings and external dimensions are available
- Canonical estimated chargeable weight when actual gross and DIM weight are both known
- Carton cost when known
- Carton stock impact
- Per-carton result detail
- 3D packing visualization
Local persistence capabilities:
- Personal Metric / Imperial unit preference stored locally
- Personal recent items stored in IndexedDB
- Personal recent packing plans stored in IndexedDB
- Business saved carton library stored in IndexedDB
- Business objective preference stored locally
- Business handling preference stored locally
- Business recent projects stored in IndexedDB
- Business recent-project history is bounded and ordered deterministically
- Business project JSON export/import for local backup without an account
- Business recent projects include DIM settings
- Business project JSON round-trips DIM settings
- Versioned Business project JSON validation with safe rejection of malformed or unsupported data
- Browser download/read mechanics kept separate from JSON validation and persistence
- Imported projects restore workspace state including DIM settings without automatic persistence
- Project identity allocation is guarded until recent-project history initialization completes
- Browser-local messaging makes local-only storage behavior explicit
Phase 12 capabilities:
- ADR-012 dimensional and chargeable weight semantics
- Explicit dimensional-weight divisor with length and mass units
- No assumed carrier divisor or numeric carrier preset
- Carton DIM calculations use external dimensions only
- No internal-dimension fallback for carton DIM calculations
- Actual gross weight = contents + carton tare when both known
- DIM weight remains distinct from physical mass
- Estimated chargeable weight = greater of actual gross and DIM weight only when both are known
- Plan-level DIM/chargeable totals remain unknown unless all used cartons provide required data
- SolverInput accepts dimensional-weight planning context
- min-dim-weight ranking uses canonical DIM data and deterministic tie-breaking
- Business UI exposes Lowest DIM weight only when required divisor and external dimensions are available
- Business result surface shows Actual gross weight, DIM weight, and Estimated chargeable weight
- Business persistence and JSON round-trip DIM settings and min-dim objective
- Carrier billing rounding, service rules, rates, and shipping prices are NOT implemented
Validation baseline:
- 72 test files passing
- 1098 tests passing
- typecheck: 0 errors, 0 warnings, 0 hints
- Production build passing
- /, /personal/, and /business/ generated successfully
- GitHub Actions run #88: SUCCESS
- Latest validated main commit: cf7fd442277a3ef5801cd054548ef0478cfb6ac8
Intentional deferrals / later roadmap work:
- Unsupported fragile, padding, spacing, and stackability controls remain unexposed until solver/verifier semantics support them
- CSV import/export belongs to Phase 14
- Batch processing belongs to Phase 15
- Saved product catalog belongs to Phase 16
- Analytics and carton-portfolio rationalization belong to Phase 17
- Accounts/cloud belong to Phase 18
- Integrations/API belong to Phase 19
- Live carrier billing/rates/shipping-price calculation remains outside the completed Phase 12 scope
No Phase 12 blockers remain.
Next planned product phase
Phase 12.5 — Product UI & Visual Integration Sprint
This focused sprint covers homepage, Personal, Business, result surfaces, 3D presentation, responsive/accessibility polish, and design consistency without rewriting the solver/core or inventing unsupported metrics.