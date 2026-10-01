# Packmetry

Packmetry is a browser-first packing and cartonization decision workbench.

> Tell us what you are packing. We will figure out the boxes.

## Project authority

Before changing product behavior, architecture, design direction, or implementation strategy, read:

1. `docs/authority/PACKMETRY_NEW_PROJECT_CHAT_BOOTSTRAP.md` — highest repository project authority after an explicit current user instruction.
2. `docs/authority/CARTONLAB_ULTIMATE_PROJECT_SPECIFICATION.md` — detailed legacy product specification; interpret `CartonLab` as `Packmetry` unless the bootstrap explicitly says otherwise.
3. Accepted ADRs in `docs/decisions/`.
4. The current approved task packet.

The Packmetry bootstrap controls naming, workflow, design status, repository policy, and any override of the older CartonLab document.

## Important boundaries

- Final public brand: **Packmetry**
- Domain: **Packmetry.com**
- Repository: **packmetry**
- Personal and Business are two experiences on one shared engine.
- The three box-availability workflows are first-class product requirements.
- The packing engine must remain independent from React/UI and Three.js.
- Solver output must be independently verified before being presented as a successful packing result.
- Three.js visualizes the canonical verified result; it does not invent placements.
- Core free use remains browser-first with no mandatory backend or account.
- Do not claim globally optimal packing unless it is actually proven for the exact case.

## AI implementation workflow

Cline is the implementation agent, not the product owner.

For every meaningful task:

1. ChatGPT issues one narrow task packet.
2. Cline reads only the relevant repository context.
3. Cline implements and validates the approved scope.
4. Cline inspects its diff and returns `READY_FOR_REVIEW`.
5. Cline does **not** commit or push.
6. ChatGPT reviews the receipt/diff.
7. Only after approval does the user commit and push.

See `docs/process/AI_IMPLEMENTATION_WORKFLOW.md`.

## Current state

Phase 9 complete: Business UX implemented and validated.

**Personal and Business entry experience**:
- Root homepage classifies visitors by intention
- Home & Personal entry at `/personal/`
- Business entry at `/business/`
- Personal and Business continue to use one shared packing engine

**Business UX core capabilities**:
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
- Balanced objective
- Fewest boxes objective
- Least empty space objective
- Optimize packing CTA
- Shared verified `planHaveBoxes` planning workflow
- Canonical packing result
- Carton count and packed/unpacked items
- Utilization and empty space
- Content weight and gross packed weight when known
- Carton cost when known
- Carton stock impact
- Per-carton result detail
- 3D packing visualization

**Validation baseline**:
- 102 files typechecked with 0 errors, 0 warnings, 0 hints
- 56 test files passing
- 789 tests passing
- Production build passing
- `/`, `/personal/`, and `/business/` generated successfully
- GitHub Actions run #53: SUCCESS

**Intentional deferrals / later roadmap work**:
- Unsupported fragile, padding, spacing, and stackability controls remain unexposed until solver/verifier semantics support them
- Saved Business projects, cartons, and preferences belong to Phase 10
- Alternatives and broader objective-scoring UX belong to Phase 11
- DIM weight and chargeable-weight modules belong to Phase 12
- CSV import/export belongs to Phase 14
- Batch processing belongs to Phase 15
- Saved product catalog belongs to Phase 16
- Analytics, cloud accounts, integrations, and API remain later roadmap work

No Phase 9 blockers remain.

## Next planned product phase

Phase 10 — Local Persistence