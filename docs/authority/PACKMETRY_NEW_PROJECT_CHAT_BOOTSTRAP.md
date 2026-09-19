# Packmetry — New Project Chat Bootstrap, Authority & AI Execution Protocol

**Status:** AUTHORITATIVE PROJECT-START HANDOFF  
**Project:** Packmetry  
**Public domain:** `Packmetry.com`  
**Repository name:** `packmetry`  
**Purpose:** Start a fresh ChatGPT project chat with enough product, design, engineering, Git/GitHub, and AI-in-VS-Code context to build Packmetry in a controlled, reviewable way.  
**Important:** This document is a project-start authority and override layer. It does **not** discard the detailed legacy product and workflow documents supplied with it; it resolves their outdated `CartonLab` naming and establishes the current build process.

---

# 1. Files to Attach to the New Chat

Attach these files together when starting the new ChatGPT project chat:

1. **`PACKMETRY_NEW_PROJECT_CHAT_BOOTSTRAP.md`** — this file; highest authority for current brand, start procedure, design status, and workflow overrides.
2. **`CARTONLAB_ULTIMATE_PROJECT_SPECIFICATION(2).md`** — detailed long-term product/design/engineering specification created before the final brand was selected.
3. **`CARTONLAB_AI_EXECUTION_WORKFLOW(1).md`** — detailed AI-assisted development and review protocol created before the final brand was selected.
4. **`packmetry_updated_design(1).html`** — current visual/homepage design reference using the final Packmetry brand.
5. **`cartonlab_complete_website_flow(1).png`** — conceptual website/product-flow diagram; title contains the old codename but the underlying flow remains relevant.

## Legacy-name rule

Any reference to **CartonLab** in the older Markdown or flowchart must be interpreted as **Packmetry** unless a historical distinction is explicitly being discussed.

The public brand is now:

> **Packmetry**

The chosen domain is:

> **Packmetry.com**

Do not reopen brand naming unless the user explicitly asks.

Formal trademark/legal clearance may still be performed before public commercial launch, but it is **not a blocker for local engineering work**.

---

# 2. Authority Hierarchy

When files or instructions appear to conflict, use this order:

```text
1. Explicit current user instruction in the active chat
2. PACKMETRY_NEW_PROJECT_CHAT_BOOTSTRAP.md
3. Accepted ADRs / architecture decisions in the repository
4. Current approved ChatGPT implementation task packet
5. CARTONLAB_ULTIMATE_PROJECT_SPECIFICATION(2).md
6. CARTONLAB_AI_EXECUTION_WORKFLOW(1).md
7. packmetry_updated_design(1).html for current visual direction
8. cartonlab_complete_website_flow(1).png for conceptual flow
9. Existing accepted tests/contracts
10. Current implementation
11. AI assumptions
```

Important interpretation rules:

- The legacy **ultimate product specification** remains the detailed product authority wherever this bootstrap does not override it.
- The legacy **AI execution workflow** remains the detailed process authority wherever this bootstrap does not override it.
- The **Packmetry HTML design** is the strongest current visual reference, but it is **not production architecture** and should not simply be copied into the final app as one monolithic HTML file.
- The **flowchart image is conceptual**, not pixel-perfect UI authority.
- If a material ambiguity remains, **STOP and ask** rather than inventing a product rule.

---

# 3. Final Product Identity

Packmetry is intended to become a **universal browser-based packing decision workbench**.

The enduring product promise is:

> **Tell us what you are packing. We will figure out the boxes.**

The product must work for both:

- ordinary household/personal users who do not know logistics terminology; and
- merchants/business users who need repeatable cartonization, packing efficiency, and inventory decisions.

The enduring design/product principle is:

> **Easy enough for someone who has never heard the word SKU. Powerful enough for a merchant to use every day.**

Packmetry is not merely a box-volume calculator and must not become a generic calculator farm.

The central job is:

> **Determine the most practical and efficient way to package a set of physical items.**

---

# 4. Core User Architecture

Packmetry has two primary user experiences that share one engine.

## A. Home & Personal

Examples:

- moving house;
- packing books, clothes, kitchen items, electronics, gifts, or belongings;
- marketplace sellers shipping occasional items;
- people buying cartons before they pack;
- people checking whether existing boxes are enough;
- storage-bin planning.

Personal users should not be required to understand:

- SKU;
- cartonization;
- WMS;
- DIM divisor terminology;
- packing algorithms;
- logistics jargon.

## B. Business

Examples:

- ecommerce merchants;
- Shopify/WooCommerce sellers;
- Amazon/Etsy/eBay sellers;
- small warehouses;
- fulfillment teams;
- 3PLs;
- manufacturers;
- operations/packaging teams.

Business users may progressively access:

- SKU/product identifiers;
- saved product catalog;
- carton inventory;
- stock quantities;
- max weight;
- carton cost;
- CSV/batch workflows;
- objective selection;
- DIM-weight analysis;
- packing instructions;
- analytics;
- carton portfolio rationalization;
- integrations/API later.

## One engine, two experiences

Do **not** build separate personal and business packing engines.

Both experiences must converge to the same normalized domain model, solver boundary, verification layer, result model, and 3D renderer.

---

# 5. The Three Box-Availability Modes

These are first-class workflows and must survive the entire architecture.

## Mode 1 — I Need Boxes

The user has items but no cartons.

Packmetry should determine practical carton size(s) to buy and show the packing arrangement.

## Mode 2 — I Already Have Boxes

The user provides available cartons.

Packmetry chooses the best available carton or carton combination and shows how to pack it.

## Mode 3 — Use What I Have, Then Tell Me What to Buy

The user has some boxes, but not necessarily enough or not necessarily the ideal sizes.

Packmetry should use existing boxes where sensible, then recommend only the additional box sizes required, while comparing against a better complete replacement plan when relevant.

This hybrid flow is a strategic product differentiator and must not be treated as an edge-case error.

---

# 6. Ultimate Capabilities to Preserve in the Architecture

The project will be implemented in phases, but the architecture must leave room for the mature end-state.

Long-term capabilities include:

- mixed item types and quantities;
- item dimensions and optional weight;
- item rotation restrictions;
- upright-only items;
- fragile/padding/spacing constraints;
- multiple available carton types;
- carton stock quantities;
- carton weight limits;
- carton cost;
- single-carton and multi-carton plans;
- no-box recommendation;
- existing-box optimization;
- hybrid existing + buy-more workflow;
- utilization and empty-space metrics;
- actual weight and DIM-weight visibility;
- multiple optimization objectives;
- practical alternative plans;
- explainability / “why this plan?”;
- interactive 3D packing visualization;
- layer view / packing instruction view;
- printable/exportable plans;
- local saved box library;
- local saved product catalog;
- CSV import/export;
- batch order processing;
- carton analytics;
- carton inventory rationalization;
- optional accounts/cloud sync later;
- integrations/API later;
- useful SEO/supporting tool ecosystem.

Later features are **not permission to prematurely build everything**. They define architectural direction and future compatibility.

---

# 7. What Packmetry Must NOT Become

Do not drift into:

- a full WMS/ERP;
- a shipping-label purchasing platform;
- a parcel-tracking product;
- a freight marketplace;
- a carrier-rate engine;
- structural packaging CAD/dieline software;
- a generic logistics calculator directory;
- an AI chatbot whose primary value is text advice;
- a SaaS dashboard that requires accounts before basic use.

The identity remains:

> **Packing and cartonization intelligence.**

---

# 8. Current Visual Design Authority

The current design reference is:

> `packmetry_updated_design(1).html`

Treat it as the strongest current visual direction.

## Design character

Packmetry must feel:

- elegant;
- sober;
- minimal;
- premium;
- calm;
- trustworthy;
- modern/futuristic without looking like an AI startup;
- like a precision physical-world tool.

## Explicitly avoid

Do not use:

- purple/blue “AI” gradients;
- neon cyan or purple;
- glowing borders;
- glassmorphism as the main language;
- aurora/mesh AI backgrounds;
- animated floating blobs;
- sparkles/robot motifs;
- cyberpunk styling;
- excessive pills;
- excessive cards-within-cards;
- decorative 3D illustrations that compete with the actual packing visualization.

## Current design tokens

Use the current Packmetry HTML as the baseline token system:

```text
Primary navy:        #18324A
Secondary forest:    #2E5D50
Main ink:            #17212B
Muted ink:           #5E676A
Surface:             #FFFFFF
Subtle surface:      #F7F9FA
Neutral surface:     #F3F6F8
Subtle border:       #E2E8F0
Darker border:       #CBD5E1
```

Typography direction:

```text
Headings / UI emphasis: Inter
Body: Source Sans 3
```

Future refinement is allowed through an approved design task/ADR, but the character above must remain intact.

## Current homepage information architecture

The current design direction uses:

1. restrained header/navigation;
2. simple hero;
3. two large intention cards:
   - Home & Personal
   - Business
4. compact “How it works” strip;
5. result/packing-plan preview;
6. the three box-availability modes;
7. trust/value section;
8. FAQ;
9. final CTA;
10. footer.

This structure is a starting authority for the public homepage.

## Important production rule

The attached HTML is a **design prototype/reference**, not the production codebase.

Do not simply place the entire file into production and continue modifying it indefinitely.

Production should implement:

- reusable Astro layouts;
- reusable React components where interactivity is needed;
- explicit design tokens;
- maintainable Tailwind/structured CSS;
- semantic accessibility;
- reusable content/components.

Do not depend on Tailwind CDN in production.

---

# 9. 3D Visualization Is a Core Product Requirement

3D is not decorative polish. It is a **trust and comprehension layer**.

Plan for it from the start.

However, implementation order remains disciplined:

```text
Canonical domain model
→ solver boundary
→ verification
→ canonical verified result
→ 3D renderer
```

The renderer must **never invent placement truth**.

It only visualizes the canonical verified packing result.

Ultimate 3D requirements include:

- clear carton shell/wireframe;
- restrained solid item colors;
- rotate/orbit;
- zoom;
- fit/reset view;
- optional pan;
- item selection/hover;
- matching legend;
- hide/show carton shell;
- switch between cartons/plans;
- layer representation where useful;
- mobile-safe rendering;
- text/table equivalent for accessibility.

Use **Three.js** unless an approved architecture decision changes this.

---

# 10. Final Technical Direction

The project is intentionally browser-first and near-zero-cost during validation.

## Preferred stack

```text
Astro
  static/SEO site shell

React
  interactive packing workbench

TypeScript
  domain models
  solver interfaces
  verification
  UI logic

Tailwind CSS or structured CSS tokens
  production design system

Three.js
  3D visualization only

Web Workers
  expensive packing computation when needed

IndexedDB
  saved cartons/projects/products

localStorage
  small preferences

Vitest
  domain/engine/unit tests

Playwright
  end-to-end workflows

Git + GitHub
  source control and durable reviewed history

Cloudflare Pages
  eventual free/low-cost deployment during validation
```

## Backend policy

No mandatory backend for the core free experience.

Do not add accounts, database infrastructure, server-side compute, paid APIs, or recurring paid services merely because they are conventional.

Future backend/cloud capabilities require validated need and explicit approval.

## Version policy

Do not hard-code dependency versions in this bootstrap.

At setup time, verify **current stable/LTS versions from official documentation** before initializing the project.

Major dependencies and licenses must be verified before adoption.

---

# 11. Architectural Boundaries That Must Never Be Broken Casually

## Packing engine independence

The packing engine must not depend on:

- React;
- page components;
- Three.js;
- marketing content;
- analytics;
- storage implementation.

## 3D renderer independence

The renderer consumes the canonical verified result model.

It must not perform an alternative hidden packing calculation.

## Verification layer

No solver output should be shown as valid merely because the same solver says it is valid.

Returned plans should be independently checked for, at minimum:

- carton-boundary violations;
- item overlap;
- quantity mismatch;
- invalid rotations;
- weight-limit violations where relevant;
- missing/unplaced items;
- carton inventory overuse;
- internally inconsistent metrics.

## Units

Internally normalize dimensions and weight to canonical units.

Metric/imperial UI choices must not create conversion drift.

## Mathematical language

Do not claim global mathematical optimality unless it is proven for the exact problem.

Prefer:

- Recommended plan
- Best candidate found
- Highly efficient arrangement
- Verified feasible arrangement
- Highest-scoring evaluated option

---

# 12. Suggested Production Repository Structure

Use `packmetry/` as the repository root.

```text
packmetry/
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── personal/
│   │   ├── business/
│   │   ├── tools/
│   │   ├── guides/
│   │   ├── examples/
│   │   ├── methodology/
│   │   └── legal/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── packing/
│   │   ├── results/
│   │   ├── visualization/
│   │   └── analytics/
│   ├── domain/
│   │   ├── item.ts
│   │   ├── carton.ts
│   │   ├── constraints.ts
│   │   ├── objectives.ts
│   │   └── result.ts
│   ├── engine/
│   │   ├── adapters/
│   │   ├── solvers/
│   │   ├── scoring/
│   │   ├── verification/
│   │   ├── candidate-generation/
│   │   └── workers/
│   ├── visualization/
│   │   ├── three/
│   │   ├── layers/
│   │   └── colors/
│   ├── storage/
│   │   ├── indexeddb/
│   │   ├── migrations/
│   │   └── export-import/
│   ├── analytics/
│   ├── content/
│   └── styles/
├── public/
├── tests/
│   ├── domain/
│   ├── engine/
│   ├── benchmarks/
│   ├── fixtures/
│   ├── visual/
│   └── e2e/
├── docs/
│   ├── authority/
│   ├── architecture/
│   ├── decisions/
│   ├── methodology/
│   ├── design/
│   └── reference/
├── .github/
│   └── workflows/
└── package.json
```

This is a target structure, not permission to create every empty directory immediately.

Create directories only when justified by the current phase.

---

# 13. AI-Assisted Operating Model

The project uses a controlled separation of responsibilities.

## ChatGPT — architect, planner, reviewer, gatekeeper

ChatGPT owns:

- product interpretation;
- architecture;
- decomposition;
- task scope;
- acceptance criteria;
- validation requirements;
- review;
- correction tasks;
- commit authorization;
- next-task selection.

## AI in VS Code — implementation agent

AI in VS Code:

- reads only the relevant repository context;
- edits files;
- runs allowed commands;
- writes/updates tests;
- runs validation;
- fixes in-scope failures;
- inspects its diff;
- returns a structured receipt;
- **stops before commit/push**.

AI in VS Code is not the product owner.

## User — human control layer

The user controls:

- whether a task is executed;
- local terminal/tool approvals;
- external accounts;
- credentials;
- GitHub repository creation/settings;
- commit/push timing;
- material business/product decisions.

## GitHub — durable reviewed source of truth

The permanent project is the reviewed repository state, not an AI conversation.

---

# 14. Normal Engineering Loop

```text
Master authority + accepted GitHub state
        ↓
ChatGPT defines ONE narrow task
        ↓
User gives task to AI in VS Code
        ↓
Agent reads only relevant files
        ↓
Agent implements
        ↓
Agent runs required validation
        ↓
Agent inspects diff
        ↓
Agent returns READY_FOR_REVIEW
NO COMMIT / NO PUSH
        ↓
User sends receipt/diff to ChatGPT
        ↓
ChatGPT review
   ┌───────────────┐
   │ corrections?  │
   └──────┬────────┘
          │ yes → narrow correction task → repeat
          │ no
          ↓
APPROVED_FOR_COMMIT
        ↓
User stages reviewed files deliberately
        ↓
commit + push
        ↓
ChatGPT verifies pushed GitHub state
        ↓
Task becomes ACCEPTED
        ↓
Next narrow task
```

Do not collapse this loop merely because implementation is being performed by AI.

---

# 15. Git and Branch Policy

Stable branch:

```text
main
```

Use small feature branches where appropriate, for example:

```text
chore/repo-foundation
feat/domain-item-model
feat/carton-model
feat/result-contract
feat/solver-adapter
feat/result-verification
feat/three-renderer
feat/personal-workspace
feat/business-workspace
fix/result-verification
```

## Commit rule

AI in VS Code does not autonomously commit/push unless the user explicitly changes this policy in the future.

After ChatGPT approval:

```powershell
git status
git diff --check
git diff --cached
```

Then deliberately stage reviewed files and commit.

Prefer precise staging over blind `git add .` when practical.

For meaningful feature work, prefer a GitHub pull request so the pushed diff and review history are explicit.

Never merge a branch until the applicable tests/typecheck/lint/build/review gates pass.

---

# 16. Security and Secret Rules

Never commit:

- API keys;
- model credentials;
- tokens;
- passwords;
- private keys;
- cloud secrets;
- service credentials;
- temporary copied secrets;
- `.env` secrets.

Use environment variables or ignored local files if a future service genuinely needs credentials.

Before pushing configuration-related work, inspect staged diffs for accidental secrets.

The AI backend used inside VS Code is intentionally **provider-agnostic**. Provider credentials must never become project source code.

---

# 17. Standard ChatGPT Task Packet

Every implementation task should be narrow and use this format:

```text
TASK ID:
<stable task identifier>

OBJECTIVE:
<exactly what must exist when complete>

AUTHORITY:
<relevant spec / ADR / accepted contract>

READ FIRST:
<minimum files the agent should inspect>

IN SCOPE:
<allowed files/modules/behaviors>

OUT OF SCOPE:
<explicitly prohibited adjacent work>

REQUIREMENTS:
<exact functional and technical requirements>

ARCHITECTURAL CONSTRAINTS:
<boundaries that must remain intact>

DEPENDENCIES:
<whether package changes are allowed>

TESTS TO ADD OR UPDATE:
<required automated coverage>

VALIDATION COMMANDS:
<exact commands>

ACCEPTANCE CRITERIA:
<observable pass conditions>

STOP CONDITIONS:
<conditions that require returning instead of guessing>

GIT RULE:
No commit. No push. Stop for review.

REQUIRED RECEIPT:
READY_FOR_REVIEW structured report.
```

Normal task size should be roughly one reviewable unit:

- one contract;
- one small module;
- one component;
- one bug;
- one validation layer;
- one narrow refactor;
- one connected small set of files.

Avoid tasks such as:

- “Build the whole packing engine”;
- “Build the website”;
- “Fix all tests”;
- “Improve everything.”

---

# 18. Standard Header for AI in VS Code

Each implementation prompt should begin with a control block similar to:

```text
You are the implementation agent for a narrowly scoped Packmetry task.

The supplied task packet is authoritative for this execution.

Rules:
- Work only inside the opened Packmetry repository.
- Read only the context needed for this task.
- Do not silently change architecture or requirements.
- Do not add dependencies unless explicitly authorized.
- Do not modify unrelated files.
- Do not weaken/delete tests merely to pass validation.
- Run the specified validation commands.
- Fix failures caused by your changes when they remain in scope.
- If requirements are materially ambiguous, STOP and report the ambiguity.
- Do not commit.
- Do not push.
- Inspect the final diff.
- Return the required READY_FOR_REVIEW receipt.
```

---

# 19. Required AI-in-VS-Code Completion Receipt

```text
STATUS: READY_FOR_REVIEW

TASK:
<task id/name>

FILES_CHANGED:
- ...

IMPLEMENTED:
- ...

TESTS_ADDED_OR_UPDATED:
- ...

COMMANDS_RUN:
- ...

VALIDATION:
- typecheck: PASS / FAIL / NOT RUN
- unit tests: PASS / FAIL / NOT RUN
- lint: PASS / FAIL / NOT RUN
- build: PASS / FAIL / NOT RUN
- targeted validation: PASS / FAIL / NOT RUN

KNOWN_LIMITATIONS:
- NONE
or
- ...

DEPENDENCIES_CHANGED:
- NONE
or
- package + reason + license note

OUT_OF_SCOPE_CHANGES:
- NONE
or
- ...

GIT_STATUS:
- uncommitted changes present
- NO COMMIT
- NO PUSH

READY_FOR_REVIEW:
YES
```

If blocked, use:

```text
STATUS: BLOCKED

BLOCKER:
...

EVIDENCE:
...

DECISION_NEEDED:
...

NO COMMIT
NO PUSH
```

---

# 20. ChatGPT Review Gate

ChatGPT reviews, where applicable:

- scope compliance;
- architecture;
- correctness;
- tests;
- types;
- units/conversions;
- solver/verification integrity;
- error handling;
- privacy/security;
- dependency changes/licenses;
- performance;
- accessibility;
- responsive behavior;
- design consistency;
- Personal vs Business progressive disclosure;
- accidental unrelated changes.

Possible verdicts:

```text
APPROVED_FOR_COMMIT
```

or

```text
CORRECTIONS_REQUIRED
```

A correction should be a **delta task**, not a full reimplementation prompt.

---

# 21. Definition of Done

An individual task is done only when:

```text
implementation complete
AND required validation passes
AND agent returns READY_FOR_REVIEW
AND ChatGPT approves
AND reviewed files are committed
AND commit/branch is pushed
AND pushed GitHub state is verified
AND no required correction remains
```

“AI says done” is never sufficient.

---

# 22. Testing and Quality Strategy

Packmetry is a geometry/optimization product. Correctness must be executable, not assumed.

Use, where applicable:

- TypeScript strict typing;
- domain invariant tests;
- solver adapter tests;
- independent verification tests;
- deterministic regression fixtures;
- benchmark corpus;
- unit conversion tests;
- serialization tests;
- UI component tests where valuable;
- Playwright end-to-end tests;
- accessibility checks;
- build/typecheck/lint gates;
- performance checks around solver and 3D renderer.

## Solver benchmark corpus must eventually include

- single-item exact fit;
- impossible fit;
- rotation-sensitive cases;
- repeated identical items;
- mixed heterogeneous items;
- multiple cartons;
- weight-limit cases;
- boundary-touching placements;
- near-degenerate dimensions;
- deterministic regression cases;
- known feasible layouts;
- known impossible combinations.

Do not optimize solver performance before correctness and verification are observable.

---

# 23. Dependency Policy

Before adding a package, ask:

```text
Is it necessary?
Can the platform/framework already do this?
Is it actively maintained?
What is the license?
Is commercial use allowed?
What bundle/runtime cost does it add?
Does it introduce backend/server requirements?
Can the requirement be implemented more simply?
```

Major dependency adoption requires explicit approval and should be recorded in an ADR.

The packing engine must be hidden behind an internal solver adapter so a third-party solver can be replaced later.

---

# 24. Architecture Decision Records

Material decisions belong under:

```text
docs/decisions/
```

Suggested format:

```markdown
# ADR-00X: Decision title

Status:
Date:

Context:
...

Decision:
...

Alternatives considered:
...

Consequences:
...

Validation / revisit trigger:
...
```

Likely ADR topics include:

- canonical unit policy;
- solver/library selection;
- result schema;
- independent verification architecture;
- Web Worker boundary;
- 3D renderer boundary;
- persistence strategy;
- scoring/objectives;
- major dependency adoption.

---

# 25. Dependency-Aware Build Sequence

This is the implementation dependency order, **not an MVP reduction of the ultimate product vision**.

## Phase 0 — Repository & Governance Foundation

- local project folder;
- Git repository;
- GitHub repository;
- README;
- authoritative docs imported;
- `docs/decisions/`;
- contributor/agent instructions;
- Astro/React/TypeScript/tooling baseline;
- validation commands;
- CI baseline when appropriate.

Exit condition:

> A clean clone can install dependencies and run baseline validation successfully.

## Phase 1 — Domain Model & Canonical Result Contract

- units;
- dimensions;
- item model;
- carton model;
- constraints;
- objective model;
- placements;
- result schema;
- serialization safety;
- invariants/tests.

## Phase 2 — Solver Adapter & Independent Verification

```text
normalized input
→ solver adapter
→ candidate output
→ independent verification
→ canonical verified result
```

## Phase 3 — Benchmark/Test Corpus

Create stable known cases before trusting solver evolution.

## Phase 4 — Minimal Functional Packing Workspace

Manual entry and verified result without premature polish.

## Phase 5 — Result Summary

Make answers understandable without relying on 3D.

## Phase 6 — Functional Three.js Visualization

3D is required and should be planned from day one, but it consumes canonical verified output rather than preceding the engine contract.

## Phase 7 — Three Box-Availability Workflows

- need boxes;
- have boxes;
- hybrid existing + buy remainder.

## Phase 8 — Personal UX

Plain language, progressive disclosure, no SKU jargon.

## Phase 9 — Business UX

Advanced inputs/workflows using the same engine.

## Phase 10 — Local Persistence

IndexedDB projects/cartons/preferences.

## Phase 11 — Alternatives & Objective Scoring

Explainable trade-offs.

## Phase 12 — DIM / Weight Modules

Modular and tested; not a live shipping-price engine.

## Phase 13 — SEO Tools & Content Framework

Only after the core product is genuinely useful.

## Phase 14 — CSV Import / Export

Validated schemas and unit normalization.

## Phase 15 — Batch Processing

Web Workers, progress/cancellation, browser limits.

## Phase 16 — Saved Product Catalog

Local/browser-first initially.

## Phase 17 — Analytics & Carton Portfolio Intelligence

Waste/utilization/carton coverage/rationalization.

## Phase 18 — Accounts / Cloud Features

Only after validated need.

## Phase 19 — Integrations / API

Only after validated business demand.

Later phases may be deferred or modified by real product evidence, but the mature product vision remains the strategic target.

---

# 26. Cost and Infrastructure Rule

During product validation, the intended recurring infrastructure cost is approximately **zero aside from the domain** wherever practical.

Prefer:

- static/browser-first architecture;
- Cloudflare Pages free tier;
- client-side solver;
- client-side 3D;
- IndexedDB/localStorage;
- no account requirement;
- no paid API per calculation.

Do not introduce recurring paid infrastructure without evidence and explicit user approval.

The public domain is:

> **Packmetry.com**

Deployment/domain wiring should happen only when the local project reaches the appropriate milestone; local engineering should not be blocked on production DNS.

---

# 27. SEO and Content Rule

SEO is important, but the product comes first.

Supporting content should connect to actual packing decisions, such as:

- box size calculator;
- DIM calculator;
- utilization tools;
- packing guides;
- worked examples;
- methodology;
- benchmark/case-study content;
- packaging efficiency research.

Do not create thin programmatic pages simply because keywords exist.

The free interactive product must deserve traffic independently of SEO.

---

# 28. Analytics and Privacy Rule

Prefer privacy by architecture.

Do not send raw:

- order contents;
- SKU names;
- item names;
- customer data;
- saved carton/product catalogs;
- sensitive business details

to analytics by default.

Track aggregate product events where useful, such as:

```text
personal_mode_selected
business_mode_selected
items_added
box_mode_selected
calculation_started
calculation_completed
verified_plan_found
alternative_viewed
three_d_opened
project_exported
```

Search Console / Cloudflare analytics / optional GA4 can be added when relevant, with deliberate privacy review.

---

# 29. New AI Session Policy

Start a fresh AI-in-VS-Code session when:

- a new implementation ticket begins;
- the subsystem changes materially;
- previous context is noisy;
- provider/model backend changes;
- repeated corrections obscure the original task.

Do not use one giant AI conversation as permanent project memory.

Permanent knowledge belongs in:

- Git;
- docs;
- ADRs;
- tests;
- benchmarks;
- specifications.

---

# 30. FIRST SESSION — Required Behavior for the New ChatGPT Chat

When this file and companion files are attached to a new ChatGPT chat, the assistant must **not start coding immediately**.

It should first perform the following sequence.

## Step 1 — Read all attached authorities

Read:

- this bootstrap;
- legacy ultimate product specification;
- legacy AI execution workflow;
- current Packmetry HTML design reference;
- flowchart image.

Do not rely on snippets only when full file context matters.

## Step 2 — Resolve naming

State explicitly:

```text
Project codename/history: CartonLab
Final public brand: Packmetry
Domain: Packmetry.com
Repository: packmetry
```

From this point forward, use **Packmetry** in new source code, documentation, branches, task IDs, and UI unless preserving a legacy filename for archival/reference reasons.

## Step 3 — Restate architecture briefly

Confirm understanding of:

- Personal + Business streams;
- three box-availability modes;
- one shared engine;
- independent solver adapter;
- independent verification;
- canonical result model;
- Three.js as visualization of verified output;
- browser-first/no mandatory backend;
- local-first persistence;
- sober Packmetry design.

Do not rewrite the entire master specification back to the user.

## Step 4 — Identify true blockers only

Before project initialization, the new chat should ask only for information that is actually required.

At minimum, if not already provided:

1. **Local parent folder/path** where the `packmetry` repository should live.
2. **GitHub repository visibility:** private or public.
3. If needed, whether the repo should live under the user's personal GitHub account or an organization.

Do not ask unnecessary product questions that are already answered by the attached authorities.

## Step 5 — Environment preflight

Give the user a short **manual PowerShell preflight** to run before repository creation.

The preflight should check, at minimum:

```powershell
git --version
node --version
npm --version
code --version
gh --version
```

`gh` may be absent; that is not a blocker because the GitHub web UI can be used.

Do not assume a particular Node/Astro version. Verify current official stable/LTS guidance at execution time if setup requires it.

Ask the user to paste the preflight result.

## Step 6 — Create the local folder and Git repository

After the user provides the desired parent path, issue **exact PowerShell commands** using that path.

Conceptually:

```powershell
$ProjectRoot = "<USER_CHOSEN_PARENT>\packmetry"
New-Item -ItemType Directory -Path $ProjectRoot -Force
Set-Location $ProjectRoot
git init -b main
git status
```

Do not invent the user's local path.

## Step 7 — Create the GitHub repository

Repository name:

```text
packmetry
```

If GitHub CLI is installed/authenticated, the new chat may offer an exact command.

If not, guide the user through GitHub web creation.

Do **not** assume public/private; use the user's choice.

Do not initialize the remote with conflicting README/gitignore/license if the local repository is already being initialized unless the workflow deliberately accounts for it.

## Step 8 — Connect local and remote

After the repo exists, guide the user to set `origin` and verify it.

Do not push implementation code before the repository/governance foundation is reviewed.

## Step 9 — Start Phase 0 using AI in VS Code

The first AI-in-VS-Code ticket must be **repository/governance foundation only**.

It should not build the full UI or solver.

Likely Phase 0 subtasks should be issued one at a time, for example:

```text
PKM-BOOT-001  Repository documentation + authority layout
PKM-BOOT-002  Astro/React/TypeScript baseline scaffold
PKM-BOOT-003  Quality scripts: typecheck/lint/test/build
PKM-BOOT-004  Basic CI validation
PKM-BOOT-005  Initial design tokens / shell architecture
```

Do not issue all as one giant task.

## Step 10 — Review each subtask before commit/push

Follow the review gate defined in this document.

---

# 31. Recommended Initial Repository Documentation Layout

During Phase 0, aim toward:

```text
docs/
├── authority/
│   ├── PACKMETRY_NEW_PROJECT_CHAT_BOOTSTRAP.md
│   └── PACKMETRY_ULTIMATE_PRODUCT_SPECIFICATION.md
├── process/
│   └── PACKMETRY_AI_EXECUTION_WORKFLOW.md
├── design/
│   ├── packmetry_updated_design.html
│   └── packmetry_flow_reference.png
├── decisions/
└── reference/
    └── legacy/
```

The project may preserve the original legacy CartonLab files in `docs/reference/legacy/` if useful for audit/history.

However, active project docs should use the final **Packmetry** name.

Any mechanical rename/update of the detailed legacy docs should preserve semantics and be reviewed; do not silently rewrite product rules while renaming.

---

# 32. Initial Design Implementation Rule

When the project eventually implements the public homepage:

- use the attached `packmetry_updated_design(1).html` as the design reference;
- implement it with reusable components;
- preserve its calm white/gray/navy/forest palette;
- preserve its Personal/Business split;
- preserve its compact information hierarchy;
- preserve the restrained typography/spacing;
- update prototype-only or illustrative claims so production copy matches real implemented behavior;
- do not keep fake metrics or fake “actual solver output” once the real engine exists;
- do not add sign-in/account UI before account functionality is deliberately added;
- do not use decorative AI visual motifs.

The production site should feel **more refined than the prototype**, not more visually noisy.

---

# 33. Initial Engineering Priority After Phase 0

Do not make the marketing homepage the first hard engineering problem.

After repository foundation, prioritize the correctness core:

```text
1. canonical units and dimensions
2. Item model
3. Carton model
4. Constraints and objectives
5. Canonical result/placement model
6. Solver adapter boundary
7. Independent verification
8. Benchmark corpus
9. Functional manual workspace
10. Result summary
11. Functional Three.js rendering
```

The final design should inform component architecture, but **geometry correctness and result truth come before visual polish**.

---

# 34. First Technical Proof Required

Before Packmetry is trusted as a packing product, prove that the architecture can support:

- normalized items;
- normalized cartons;
- valid item placement coordinates;
- deterministic result serialization;
- independent overlap/boundary verification;
- accurate utilization metrics;
- a renderer that can consume the same verified placements;
- known feasible and impossible benchmark cases.

The first solver/library choice should remain replaceable behind an adapter.

Do not let one third-party package define the product architecture.

---

# 35. Stop Conditions for the New Chat

The new ChatGPT project chat or AI in VS Code must stop and ask for a decision when:

- a product requirement is materially ambiguous;
- architecture would need to violate the authority hierarchy;
- a new major dependency is required but not approved;
- a license is unclear;
- an external paid service is proposed;
- a destructive migration/data operation is needed;
- credentials are required;
- existing repo state differs materially from assumptions;
- validation cannot run;
- fixing a problem requires a large out-of-scope refactor;
- a task would require silently weakening tests or verification.

Do not fabricate completion.

---

# 36. What the New Chat Must Not Do

The new chat must **not**:

- restart broad idea validation;
- revisit the Packmetry name unless asked;
- replace the product with a simpler generic calculator;
- treat the legacy `CartonLab` brand as current;
- build everything in one prompt;
- allow AI in VS Code to self-approve and push its own work;
- start from the prototype HTML as a monolithic production file;
- couple solver logic to React/Three.js;
- add a backend/accounts without validated need;
- require users to provide SKUs;
- require users to already own boxes;
- remove the hybrid box mode;
- treat 3D as mere decoration;
- claim perfect/global-optimal packing without proof;
- introduce generic AI colors/effects;
- send raw business/order data to analytics by default;
- build thin SEO pages before a useful product exists.

---

# 37. Expected First Response From the New Chat

The ideal first response after reading all files should be concise but decisive.

It should contain:

1. confirmation that **Packmetry** is the final brand and `Packmetry.com` is the domain;
2. a short architecture restatement;
3. a note that legacy CartonLab naming is superseded;
4. confirmation that the current HTML is visual reference, not production architecture;
5. confirmation that the controlled ChatGPT → AI in VS Code → review → GitHub workflow will be followed;
6. only the essential startup questions (local parent folder/path, GitHub visibility, account/org if needed);
7. then, once answered, the exact environment preflight and repo-creation sequence.

It should **not** start writing application code in its first response.

---

# 38. Ready-to-Paste New Chat Instruction

If desired, paste the following beneath the attached files in the new chat:

```text
PACKMETRY PROJECT START

Read every attached project file before acting.

The final product brand is Packmetry and the chosen public domain is Packmetry.com. Any CartonLab naming in older files is legacy naming only and must be interpreted as Packmetry unless explicitly historical.

Authority order begins with PACKMETRY_NEW_PROJECT_CHAT_BOOTSTRAP.md, then the detailed legacy ultimate product specification and AI execution workflow, then the Packmetry HTML design reference and conceptual flowchart as described in the bootstrap.

You are the project's architect, planner, reviewer, and gatekeeper. AI in VS Code is the implementation agent. GitHub is the durable reviewed source of truth. The implementation agent must stop before commit/push and return READY_FOR_REVIEW. You review each task before I commit and push it.

Do not start coding immediately.

First:
1. read and understand all attachments;
2. confirm the final Packmetry product architecture and the authority hierarchy;
3. identify only material contradictions or blockers;
4. ask me only for the startup information you truly need, especially my local parent folder/path and GitHub repo visibility;
5. give me a short PowerShell environment preflight;
6. once I return the result, guide me through creating the local packmetry folder and Git repository, then the GitHub repo and remote;
7. begin Phase 0 as a series of narrow AI-in-VS-Code task packets;
8. review every implementation receipt/diff before authorizing commit/push.

Important project constraints:
- final brand: Packmetry
- domain: Packmetry.com
- repo: packmetry
- browser-first and near-zero recurring infrastructure cost during validation
- Astro + React + TypeScript preferred
- Three.js is a core visualization layer
- solver must remain independent from UI and renderer
- every displayed successful packing result must pass independent verification
- Personal and Business share the same engine
- three box modes are mandatory architectural workflows
- no mandatory backend/accounts for the core free experience
- design must remain elegant, sober, minimal, premium, and non-AI-looking
- use the attached Packmetry HTML as the current design reference, not as monolithic production code
- do not claim guaranteed optimal packing without proof
- preserve privacy-first local computation and local persistence
- no paid service/dependency/infrastructure change without explicit approval

Begin by confirming you have understood the project, then ask only the minimum startup questions. Do not generate application code yet.
```

---

# 39. Final Operating Principle

> **ChatGPT decides what should be built, issues narrow tasks, and independently reviews the result. AI in VS Code implements only the approved task and validates it. The user controls external actions and commits. GitHub stores only reviewed work.**

And the product principle remains:

> **Simple enough for someone who has never heard the word SKU. Powerful enough for a merchant to use every day.**

---

**End of Packmetry project-start authority.**
