Packmetry
Packmetry is a browser-first packing and cartonization decision workbench.
Tell us what you are packing. We will figure out the boxes.
Project authority
Before changing product behavior, architecture, design direction, or implementation strategy, read:

## Current status — Phase 13 complete (2026-10-08)

Phase 13 — SEO Tools & Content Framework is complete as a **foundational implementation milestone**. The older Phase 12.5 status, validation baseline, and "next planned phase" statements elsewhere in this README are retained as historical snapshots, not the current project state.

### Public foundation

- Technical SEO: page-specific canonical URLs, crawlable `robots.txt`, XML sitemap, Open Graph and Twitter metadata.
- Structured data: homepage Organization/WebSite JSON-LD; Guide Article and breadcrumb JSON-LD. Publication/modified dates are not fabricated.
- Four interactive supporting tools: `/tools/dimensional-weight-calculator/`, `/tools/box-size-calculator/`, `/tools/box-utilization-calculator/`, and `/tools/how-many-items-fit/`.
- Guides: `/guides/` with three initial **starter** articles, not a claim of completed search-intent research for production guide expansion.
- Examples: `/examples/` and a worked mixed-item example rooted in the repository's benchmark corpus; benchmark expectations are distinguished from exhaustive optimality proof.
- Methodology: `/methodology/` and `/methodology/packing-algorithm/`, documenting candidate generation, independent verification, objective ranking, canonical results, utilization, DIM semantics, assumptions and limits.
- Personal and Business still share the verified packing engine. Supporting calculators do not claim globally optimal plans, and volume-only or uniform-grid estimates are not misrepresented as independently verified packing arrangements.

### Latest verified milestone checkpoint

- **18 public HTML pages** built successfully.
- Latest focused Slice 10 validation: **29 focused tests passed**, **typecheck 0 errors**, production build passed, diff check passed.
- Latest confirmed GitHub `main`: `6298689ad7d4f461bf41d557030c6be9ad6120f8` (Slice 10).
- The 29-test figure refers only to the latest focused validation, **not** the total repository test count; no Phase 13 full-suite rerun is claimed.

### Scope boundaries and next phase

This milestone covers the agreed SEO, supporting tools and useful content foundation. Additional researched production guide articles, standalone resources/about pages, extra calculators, and live indexing/performance evaluation may be addressed when there is a clear user or launch need. These are not automatically required just to populate a sitemap. The implemented SEO configuration is **not proof** of live deployment, search-engine indexing or rankings.

**Next: Phase 14 — CSV import/export**, with explicitly versioned/validated input shapes, safe parsing, row-level errors and unit normalization, while preserving the existing browser-first local-data and verified-planning boundaries.


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
Phase 12.5 complete: Product UI & Visual Integration Sprint implemented and validated.
Public product surfaces:
- Polished root homepage at /
- Personal packing workspace at /personal/
- Business packing workspace at /business/
- Guides library at /guides/
- Three starter guide articles:
  - /guides/choosing-a-box/
  - /guides/packing-with-existing-boxes/
  - /guides/dimensional-weight/
- Contact page at /contact/
- Privacy page at /privacy/
- Shared Packmetry header/footer shell
- Packmetry outline + solid carton brand mark and matching SVG favicon
- Responsive desktop/mobile presentation across public pages and workspaces
Personal experience:
- Multiple named items and quantities
- Optional item weight
- Item duplication/removal
- Metric / Imperial UI switching
- Persisted unit preference
- Need Boxes, Have Boxes, and Hybrid workflows
- Keep Upright / Allow Rotation controls
- Verified packing result
- Canonical 3D packing visualization
- Utilization / packed weight / empty space
- Why this plan? rationale
- Save / Share
- Recent Personal plans
- Recent Personal items
- Browser-first / account-free operation
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
- Canonical 3D packing visualization
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
Phase 12.5 capabilities:
- Homepage visual hierarchy and product positioning polished
- Interactive homepage packing-geometry presentation added without changing solver semantics
- Personal workspace/result layout polished
- Business workspace/result layout compacted and polished
- Responsive mobile layouts refined without disturbing desktop behavior
- Shared 3D packing visualization presentation polished
- Result spacing, hierarchy, badges, and explanation sections refined
- Shared Packmetry brand mark and favicon introduced
- Guides foundation added with reusable article layout
- Three starter guide articles published so the guide library is not empty
- Contact page added with email-only contact path
- Privacy page added describing the current browser-local product model and current tracking boundary
- Shared navigation/footer expanded to Guides, Contact, and Privacy where appropriate
- No solver/core rewrite and no unsupported metrics introduced
Guides content policy:
- The current three guide articles are starter/sample content.
- Future production guide articles should be published one at a time after current keyword/SERP research.
- Production articles should use strong search-intent matching, semantic keyword/entity coverage, content-gap analysis, internal linking, factual verification, and complete on-page SEO.
- Keyword stuffing and invented carrier rules are not acceptable.
Validation baseline:
- 75 test files passing
- 1118 tests passing
- typecheck: 0 errors, 0 warnings, 0 hints
- Production build passing
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
- GitHub Actions run #99: SUCCESS
- Latest validated main commit: 3f02576a7aef7910c72869766aac3153d78bea92
Intentional deferrals / later roadmap work:
- Unsupported fragile, padding, spacing, and stackability controls remain unexposed until solver/verifier semantics support them
- CSV import/export belongs to Phase 14
- Batch processing belongs to Phase 15
- Saved product catalog belongs to Phase 16
- Analytics and carton-portfolio rationalization belong to Phase 17
- Accounts/cloud belong to Phase 18
- Integrations/API belongs to Phase 19
- Live carrier billing/rates/shipping-price calculation remains outside the completed Phase 12 scope
No Phase 12.5 blockers remain.
Next planned product phase
Phase 13 — SEO foundation.
Phase 13 should build the technical SEO base for the polished public site and guide library without lowering content quality or turning the site into generic keyword-driven marketing.