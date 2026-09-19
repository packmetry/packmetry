# CartonLab — Ultimate Product, Design & Engineering Specification

**Document type:** Master project handoff / ultimate product specification  
**Purpose:** Give a new product, design, engineering, SEO, or AI-assisted coding team enough context to understand the complete long-term CartonLab vision before implementation begins.  
**Scope:** This document describes the **full mature website and product end-state**, not an MVP. Implementation can later be divided into technical proofs and phased releases, but those phases must remain consistent with this target architecture and experience.  
**Working name:** `CartonLab` is an internal project codename. Public brand/name must be validated separately before domain purchase or launch.  
**Companion visual:** `cartonlab_complete_website_flow.png`

---

## 1. Executive Summary

CartonLab is intended to become a **universal packing decision workbench** for both ordinary people and businesses.

The core promise is simple:

> **Tell us what you are packing. We will figure out the boxes.**

A user should be able to describe the items they need to pack and receive an efficient, practical packing plan whether:

1. they **do not own boxes yet** and want to know what carton size(s) to buy;
2. they **already have boxes** and want to know which existing boxes to use;
3. they **have some boxes** and want CartonLab to use those first and recommend only the additional boxes required.

The same underlying packing engine should serve two very different audiences without forcing either audience to learn the vocabulary of the other:

- **Home & Personal:** people moving, shipping gifts, packing belongings, storing items, sending marketplace purchases, or simply trying to work out what cartons to buy.
- **Business:** ecommerce merchants, small warehouses, fulfillment teams, manufacturers, and other operators who need repeatable cartonization decisions for mixed-SKU orders and real carton inventories.

The defining product principle is:

> **Simple enough for someone who has never heard the word SKU; powerful enough for a merchant to use every day.**

CartonLab must not become a collection of disconnected calculators. It should be a coherent product in which all tools, educational pages, saved data, analytics, and future capabilities connect back to one central job:

> **Determine the most practical and efficient way to package a set of physical items.**

---

## 2. Product Vision

### 2.1 Ultimate North Star

A person or business should be able to give CartonLab:

- the items they need to pack;
- optional available cartons/containers;
- optional physical and operational constraints;
- an optimization objective;

and CartonLab should determine:

- which carton or combination of cartons should be used;
- what carton size should be purchased if no suitable box is available;
- how the items should be arranged;
- whether all items fit;
- what alternative packing plans are viable;
- the space utilization and empty space;
- the actual weight and relevant dimensional-weight implications;
- the trade-offs between fewer cartons, less wasted space, lower cost, and easier handling;
- clear packing instructions for execution;
- and, for repeat business users, how to improve the box sizes they stock over time.

### 2.2 Mature Product Outcome

At maturity, a business should be able to upload or connect historical orders and ask questions such as:

- “Which of my stocked boxes should be used for today’s orders?”
- “Can I reduce the number of carton sizes I stock?”
- “Which six carton sizes cover 95% of my orders efficiently?”
- “How much empty space are we shipping?”
- “Which orders are suffering the largest dimensional-weight penalty?”
- “Would introducing a new carton size materially reduce waste or shipping cost?”

The consumer side should remain equally approachable:

- “I have these books, shoes, and kitchen items. What size box should I buy?”
- “Will everything fit in the boxes I already have?”
- “I have three cartons already. What else do I need?”
- “What is the easiest way to split these items across two boxes?”

### 2.3 What CartonLab Is Not

CartonLab should **not** drift into becoming:

- a full WMS/ERP;
- a shipping-label purchasing platform;
- a carrier-rate marketplace;
- a parcel tracking service;
- a freight forwarding portal;
- a structural packaging CAD system for die-lines and corrugated engineering;
- a generic logistics calculator farm;
- an AI chatbot whose primary output is text advice.

The product identity must remain **packing and cartonization intelligence**.

---

## 3. Product Positioning

### 3.1 Plain-Language Positioning

> **CartonLab helps people and businesses choose the right boxes and pack items efficiently.**

### 3.2 Consumer Positioning

> **Add the things you need to pack. CartonLab works out what box size you need, whether your existing boxes will work, and how to arrange the items.**

### 3.3 Business Positioning

> **A browser-based cartonization workbench for mixed-product orders and real carton inventories, with packing layouts, utilization, dimensional-weight visibility, alternatives, and operational instructions.**

### 3.4 Brand Promise

The user should feel:

- “I do not need to understand packing algorithms.”
- “I can see why the recommendation makes sense.”
- “The tool is helping me make a physical decision, not just giving me a formula.”
- “I can start simply and reveal more detail only when I need it.”

---

## 4. Core Product Principles

Every product and design decision should be tested against these principles.

### 4.1 Intention Before Features

The first question is not “Which calculator do you want?” It is:

> **What are you trying to pack?**

The homepage should identify user intent immediately, then move the user into the appropriate stream.

### 4.2 Progressive Disclosure

Do not show professional complexity to a casual user by default.

A normal user should see:

- item name;
- dimensions;
- quantity;
- optional weight;
- whether they already have boxes.

Advanced constraints should appear only when requested.

Business users may reveal:

- SKU/product identifiers;
- carton IDs;
- box stock quantity;
- cost per carton;
- max gross weight;
- rotation rules;
- upright-only handling;
- spacing/padding;
- DIM divisor/presets;
- optimization objectives;
- saved inventories and batch workflows.

### 4.3 Visual Proof, Not Black-Box Claims

The tool should not merely say “Use Box B.”

It should show:

- the arrangement;
- why the recommendation was selected;
- what alternatives exist;
- what trade-offs those alternatives create.

### 4.4 No False Mathematical Certainty

3D bin packing is computationally difficult. Public wording must not promise mathematically global optimality unless a particular scenario is provably solved optimally.

Preferred language:

- “Recommended packing plan”
- “Highly efficient arrangement”
- “Best plan found”
- “Most efficient option found under these settings”

Avoid unqualified claims such as:

- “Guaranteed optimal”
- “Perfect packing”
- “Always lowest cost”

### 4.5 Privacy by Architecture

Where possible, dimensions, box inventories, order details, and saved projects should remain in the user’s browser.

Client-side processing is preferred because it:

- reduces infrastructure cost;
- improves privacy;
- eliminates unnecessary account friction;
- lets the free product scale economically.

### 4.6 One Engine, Multiple Experiences

Home and business modes should use the same normalized packing engine and result model.

Do not create two unrelated applications.

### 4.7 Tools Must Form an Ecosystem

Supporting calculators and SEO pages must feed into the same core problem. Do not create pages merely because a keyword exists.

---

## 5. Primary Audience Architecture

## 5.1 Stream A — Home & Personal

Typical users:

- people moving home;
- people sending gifts;
- people shipping household items;
- marketplace sellers sending occasional parcels;
- students moving or storing belongings;
- people organizing storage bins;
- hobbyists or makers shipping finished work;
- anyone buying cartons before packing.

They should never be required to understand:

- SKU;
- cartonization;
- DIM divisor;
- WMS;
- case-pack terminology;
- logistics optimization jargon.

### Typical personal questions

- What box size should I buy?
- Will these things fit in this box?
- Can I use the boxes I already have?
- How many boxes will I need?
- How should I split these items across boxes?
- Which option wastes less space?
- Which option is easier to carry?

---

## 5.2 Stream B — Business

Typical users:

- small and medium ecommerce merchants;
- Shopify/WooCommerce stores;
- Amazon/Etsy/eBay sellers;
- small warehouses;
- fulfillment teams;
- small 3PLs;
- manufacturers shipping mixed orders;
- packaging/operations staff.

### Typical business questions

- Which stocked carton should this mixed-SKU order use?
- Should this order use one large box or two smaller boxes?
- Which choice produces the lowest DIM-weight penalty?
- Which carton gives the best utilization without exceeding weight limits?
- Which box sizes should we continue stocking?
- Which cartons are rarely useful?
- What packing instructions should the warehouse operator follow?
- What happens if we introduce/remove a carton size?

---

## 6. Homepage Experience

The homepage should be exceptionally simple.

### 6.1 Above-the-Fold Goal

The homepage’s first job is **classification by intention**, not education.

The user should understand the product in a few seconds.

### 6.2 Recommended Structure

**Header**

- Logo/wordmark
- Optional simple navigation: Tools, How It Works, Guides, About
- Units/language only if needed later
- No oversized navigation mega-menu at launch

**Hero**

Suggested direction:

> **Find the right way to pack it.**  
> Tell us what you are packing and we will help you choose the right boxes, use the ones you already have, and pack the space efficiently.

Supporting trust line:

> **Free · No signup required · Runs in your browser**

### 6.3 Two Primary Cards

#### Card 1 — Home & Personal

Label:

> **Home & Personal**

Subtitle:

> Moving, gifts, storage, household items and occasional shipping.

CTA:

> **Pack my items**

#### Card 2 — Business

Label:

> **Business**

Subtitle:

> Ecommerce orders, carton inventory, packaging efficiency and repeat workflows.

CTA:

> **Optimize my packing**

### 6.4 Below-the-Fold Homepage

After the two cards:

1. A small worked visual example.
2. “How it works” in three steps.
3. A short explanation of the three box-availability modes.
4. Core benefits.
5. Selected supporting tools.
6. Methodology/trust section.
7. FAQs.
8. Footer.

Do not create a long SEO essay before the user sees the product.

---

## 7. Universal Box-Availability Model

This is one of the most important product concepts.

Every packing workflow must support three states.

### 7.1 Mode 1 — I Need Boxes

The user has items but no cartons.

The system should derive practical recommended box dimensions and return:

- best practical carton size found;
- safer size with optional padding;
- alternative dimensions;
- whether one or multiple boxes are preferable;
- 3D layout;
- utilization;
- handling implications.

Example output:

> Recommended internal size: **60 × 40 × 35 cm**  
> Easier-to-source alternative: **60 × 40 × 40 cm**  
> All 9 items fit. Estimated space utilization: **83%**.

### 7.2 Mode 2 — I Already Have Boxes

The user defines available box sizes.

The engine chooses from those boxes and returns:

- recommended box or box combination;
- quantities used;
- unused boxes;
- items assigned per box;
- packing visualization;
- utilization and weight metrics;
- alternatives.

### 7.3 Mode 3 — Use What I Have, Then Tell Me What to Buy

The user provides some available boxes but inventory is insufficient or inefficient.

The engine should:

1. use existing stock where sensible;
2. identify items still unpacked;
3. recommend the additional carton size(s) required;
4. compare “use existing first” vs “buy a completely different box” if the latter is substantially better.

This hybrid mode is strategically important and should be treated as a first-class workflow, not an error state.

---

## 8. Item Data Model

Internally, all users create `Item` objects. The UI exposes only the fields relevant to the selected mode.

### 8.1 Core Fields

- `id`
- `name` — optional
- `length`
- `width`
- `height`
- `quantity`
- `weight` — optional
- `unitSystem`

### 8.2 Business/Advanced Fields

- `sku` — optional
- `rotationPolicy`
- `uprightOnly`
- `fragile`
- `spacingAllowance`
- `paddingAllowance`
- `stackable`
- `maxStackLoad` — future
- `groupId` / compatibility group — future
- `mustShipTogether` — future
- `mustShipSeparately` — future
- `priority` — future
- `value` — future, only if useful for handling logic

### 8.3 Rotation Policy

Potential values:

- any orientation;
- keep upright;
- rotate around vertical axis only;
- fixed orientation;
- user-defined allowed rotations.

The UI must explain rotation visually rather than with mathematical axis terminology where possible.

---

## 9. Box / Carton Data Model

### 9.1 Core Fields

- `id`
- `name` — optional for personal, recommended for business
- `internalLength`
- `internalWidth`
- `internalHeight`
- `quantityAvailable` — optional/unlimited if not specified

### 9.2 Business Fields

- `cartonCode`
- `maxGrossWeight`
- `emptyBoxWeight`
- `costPerBox`
- `stockQuantity`
- `supplier`
- `externalDimensions` — optional
- `materialType` — future
- `notes`

### 9.3 Box Presets

Public presets can exist for convenience, but should never become the only workflow.

Potential preset classes:

- common generic shipping sizes;
- user-created box library;
- region-specific common carton sizes;
- carrier packaging presets, only if data is verified and maintained.

Do not imply a carrier partnership.

---

## 10. Packing Constraints

Constraints should be optional and progressively disclosed.

### 10.1 Physical Constraints

- rotation restrictions;
- upright-only items;
- item-to-item spacing;
- padding allowance;
- carton wall allowance if relevant;
- weight limit;
- items that cannot be stacked;
- fragile zones / top-load restrictions in later versions;
- incompatibility groups in later versions.

### 10.2 Operational Constraints

- use only boxes in stock;
- prefer existing boxes before recommending new sizes;
- maximum number of cartons;
- maximum weight per carton;
- minimum utilization threshold;
- handling preference (fewer/heavier vs more/lighter boxes);

### 10.3 Shipping/Commercial Constraints

- dimensional-weight divisor/preset;
- carton cost;
- estimated shipping-cost proxy where sufficient data exists;
- carrier/service presets only when current and clearly versioned.

---

## 11. Optimization Objectives

Users should not be forced to understand optimization theory. Offer human goals.

### 11.1 Personal Goals

- **Best overall**
- **Use the fewest boxes**
- **Use the least empty space**
- **Make boxes easier to carry**
- **Use boxes I already own first**

### 11.2 Business Goals

- **Balanced recommendation**
- **Minimize number of cartons**
- **Minimize wasted volume**
- **Minimize DIM-weight exposure**
- **Minimize carton cost**
- **Use current carton inventory first**
- **Custom weighted objective** — advanced/future

### 11.3 Explainability

Every result should record why it won.

Example:

> **Why this plan?**  
> This option uses one carton, fits all items under the weight limit, and leaves 14% unused space. The next smaller carton cannot fit the longest item. Two smaller cartons reduce individual box weight but increase total carton volume by 19%.

---

## 12. Packing Engine

### 12.1 Technical Purpose

The packing engine should accept normalized items, containers, constraints, and objectives and return one or more deterministic candidate plans.

### 12.2 Engine Independence

The engine must be independent from:

- React UI;
- Three.js;
- storage implementation;
- analytics;
- backend services.

Recommended boundary:

```text
UI input
  -> normalized domain model
  -> packing engine
  -> normalized result model
  -> metrics / explainability / 3D renderer / export
```

### 12.3 Solver Strategy

The architecture should support interchangeable solvers/heuristics.

Do not tightly couple the product to one open-source package.

Possible components:

- heuristic 3D bin packing;
- candidate carton generation;
- multi-container selection;
- objective scoring;
- alternate-plan generation;
- constraint validation;
- post-solve verification.

### 12.4 Verification Layer

Every returned plan should be independently checked for:

- boundary violations;
- item overlap;
- forbidden rotations;
- weight-limit violations;
- quantity mismatch;
- unplaced items;
- carton inventory overuse.

A solution should not be displayed as successful until it passes verification.

### 12.5 Solver Status

The result model should expose a truthful status such as:

- feasible plan found;
- high-efficiency plan found;
- no valid arrangement found under current constraints;
- some items remain unpacked;
- calculation limit reached; try simplifying or allowing more time.

---

## 13. 3D Visualization — Required in the Ultimate Product

3D is not decoration. It is a trust and comprehension layer.

### 13.1 Core 3D View

Use a clear, lightweight rendering:

- transparent/wireframe carton;
- solid but restrained item colors;
- clean edges;
- no photorealistic cardboard texture by default;
- simple lighting;
- no unnecessary animation.

### 13.2 Required Interactions

- rotate/orbit;
- zoom;
- pan if useful;
- reset camera;
- fit view;
- toggle carton shell;
- identify items by hover/click;
- legend matching item names/types;
- switch between candidate boxes/plans;
- view one carton at a time when multiple cartons are used.

### 13.3 Layer View

Provide a `Layers` representation where appropriate:

- layer 1;
- layer 2;
- etc.

This is particularly useful for packing instructions and for users who find free-orbit 3D confusing.

### 13.4 3D Performance Rules

- lazy-load renderer only when needed;
- keep geometry simple;
- reuse geometry/materials where possible;
- use instancing for many identical items where useful;
- avoid expensive shadows/post-processing;
- render only visible plan(s);
- degrade gracefully on weak mobile devices.

### 13.5 Mobile 3D

Do not force a desktop split-screen onto mobile.

Suggested sequence:

```text
Inputs
-> Calculate
-> Recommendation summary
-> 3D viewer
-> Alternatives
-> Details
```

---

## 14. Personal Packing Experience — Detailed Flow

### Step 1 — Add Items

Default fields:

- Item name (optional)
- Length
- Width
- Height
- Quantity
- Weight (optional)

Actions:

- Add another item
- Duplicate item
- Remove item
- Change metric/imperial units

### Step 2 — Do You Already Have Boxes?

Three choices:

- **No — tell me what size to buy**
- **Yes — use my boxes**
- **Some — use what I have and tell me what else I need**

### Step 3 — Optional Packing Preferences

Collapsed by default:

- fragile;
- keep upright;
- allow rotation;
- extra padding;
- lighter boxes preferred;
- fewer boxes preferred.

### Step 4 — Calculate

Use a strong primary CTA:

> **Find my packing plan**

### Step 5 — Personal Results

The result hierarchy should be:

1. Can everything be packed?
2. What box(es) should I use or buy?
3. 3D visual proof.
4. How efficient is the plan?
5. What are the best alternatives?
6. Why was this option chosen?
7. Print/save/share.

Avoid overwhelming the personal user with business metrics.

---

## 15. Business Packing Experience — Detailed Flow

### Step 1 — Add Order / Products

Inputs:

- product name;
- SKU optional;
- dimensions;
- quantity;
- weight;
- handling constraints.

Input methods in mature product:

- manual entry;
- paste rows from spreadsheet;
- CSV import;
- saved product catalog;
- connected commerce source later.

### Step 2 — Add / Select Carton Inventory

Inputs:

- carton name/code;
- dimensions;
- quantity available;
- max weight;
- carton cost;
- box weight.

Mature methods:

- manually define boxes;
- saved box library;
- CSV import;
- business templates;
- integration/API.

### Step 3 — Set Objective & Constraints

Examples:

- balanced recommendation;
- fewest boxes;
- lowest waste;
- lowest DIM;
- use in-stock boxes only;
- prefer current stock;
- maximum gross weight;
- carton cost sensitivity.

### Step 4 — Optimize

CTA:

> **Optimize packing**

### Step 5 — Business Results

Summary:

- recommended carton combination;
- number of cartons;
- packed/unpacked items;
- actual weight;
- dimensional weight;
- chargeable-weight estimate if applicable;
- utilization;
- empty volume;
- carton cost;
- objective score;
- alternatives.

Operational output:

- packing instructions;
- per-carton item list;
- 3D/layer layout;
- printable report;
- CSV/JSON export;
- saved plan;
- shareable plan in later versions.

---

## 16. Results Experience

The result page/workspace should be one of the strongest parts of the product.

### 16.1 Result Summary Card

Example:

> **Recommended Plan**  
> Use **1 × Medium 60 × 40 × 35 cm carton**  
> All 8 items fit  
> **84% space utilized**

### 16.2 Primary Metrics

Personal:

- box size;
- boxes required;
- utilization;
- approximate packed weight;
- empty space.

Business adds:

- actual weight;
- DIM weight;
- chargeable weight estimate;
- carton cost;
- stock impact;
- objective-specific metric.

### 16.3 Alternatives

Do not show dozens of alternatives by default.

Display:

- recommended plan;
- 2–3 useful alternatives;
- “Show all alternatives” for users who want detail.

Alternative labels might be:

- **Smaller footprint**
- **Fewer cartons**
- **Less empty space**
- **Lower DIM weight**
- **Uses boxes you already have**
- **Easier to carry**

### 16.4 Failure Result

If a plan is impossible, the experience should remain useful.

Example:

> **These items do not fit in your available boxes.**  
> The television is too long for every carton you entered.  
> Minimum internal dimension needed: **at least 123 cm on one side**.  
> [Recommend an additional box] [Allow item rotation] [Edit items]

---

## 17. Carton Recommendation When No Boxes Exist

This mode must do more than divide total item volume by a cube.

The engine should consider:

- longest dimensions;
- actual spatial arrangement;
- allowed rotations;
- quantities;
- desired padding;
- weight distribution;
- single-box vs multi-box trade-offs;
- practical dimensional increments.

### 17.1 Practical Recommendation

Return both:

- **calculated minimum practical internal dimensions**;
- **easy-to-buy rounded alternative dimensions**.

Example:

> Calculated efficient fit: **57 × 38 × 34 cm**  
> Practical carton to look for: **60 × 40 × 35 cm**  
> With extra protective padding: **60 × 40 × 40 cm**

The system should clearly distinguish internal dimensions from external carton dimensions.

---

## 18. Saved Local Data

Even without accounts, the mature free experience should use browser storage.

### Personal

- recent items;
- recent plans;
- preferred units;
- optional saved boxes.

### Business

- saved carton library;
- saved product catalog;
- preferred constraints;
- default DIM settings;
- recent projects;
- custom box naming.

Use IndexedDB for structured local data and localStorage only for small preferences.

Provide an obvious:

> **Your data stays in this browser**

message where appropriate.

Allow export/import of project JSON so a user can back up local projects without a cloud account.

---

## 19. Cloud Accounts — Ultimate Optional Layer

Accounts should exist only when they create clear recurring value.

Potential account capabilities:

- sync saved cartons/products across devices;
- shared team libraries;
- saved batch jobs;
- project history;
- organization settings;
- integrations;
- API keys;
- audit history;
- premium reporting.

The free single-order calculator should remain usable without mandatory registration.

---

## 20. Batch Order Optimization

A mature business product should allow many orders to be processed at once.

### Inputs

- CSV upload;
- pasted order rows;
- ecommerce integration;
- API.

### Outputs

- recommended carton per order;
- cartons required by type;
- total carton consumption;
- expected utilization;
- DIM exposure;
- orders with no feasible box;
- packing plan per order;
- downloadable warehouse sheet.

### Batch Summary Example

> 312 orders analyzed  
> 294 packed using current carton library  
> 18 need a larger or alternative carton  
> Average utilization: 78%  
> Most-used carton: BX-M  
> Potential redundant carton types: BX-03, BX-07

---

## 21. Carton Inventory Rationalization

This is a major long-term differentiator.

The user should be able to upload historical order data plus current carton inventory and ask:

> **Which carton sizes should we stock?**

### Outputs

- current carton coverage;
- usage frequency by carton;
- average utilization per carton;
- carton types with overlapping utility;
- recommended core carton set;
- expected impact of removing a carton type;
- candidate new carton dimensions;
- projected packaging efficiency change.

### Example

> You currently stock **12 carton sizes**.  
> A core set of **6 sizes** can handle **94%** of historical orders within the selected utilization threshold.  
> Removing 4 low-value carton types increases average empty space by only 1.8%.

This analysis should never overstate savings. Show assumptions and sensitivity.

---

## 22. Carton Analytics

Business dashboard possibilities:

- orders analyzed;
- cartons per order;
- average utilization;
- average empty volume;
- DIM-weight penalty;
- carton cost per order;
- top carton types;
- underused carton types;
- un-packable orders;
- optimization opportunities;
- trend over time.

Analytics should only exist if the user supplies or stores sufficient data. Do not manufacture fake benchmark numbers.

---

## 23. Supporting Tool Ecosystem

Supporting tools are useful for SEO and user acquisition but must connect to the central product.

Potential tools:

### Packaging

- single-item box calculator;
- identical-items-in-box calculator;
- mixed-items fit checker;
- box volume calculator;
- void-space/utilization calculator;
- carton quantity calculator.

### Shipping

- dimensional-weight calculator;
- actual vs DIM comparison;
- unit conversion;
- weight conversion.

### Planning

- packaging cost comparison;
- carton library comparison;
- palletization later if strategically useful.

Every tool should offer a natural path into the core workbench.

Example:

> “Need to pack multiple different items? Open the full packing workbench.”

---

## 24. SEO / Content Architecture

The website should be a **product with an authority layer**, not a blog with a calculator attached.

### 24.1 Main Categories

Recommended long-term information architecture:

```text
/
/personal/
/business/
/tools/
/guides/
/examples/
/methodology/
/resources/
/about/
```

Potential important pages:

```text
/tools/dimensional-weight-calculator
/tools/box-size-calculator
/tools/box-utilization-calculator
/tools/how-many-items-fit
/guides/how-to-pack-multiple-items
/guides/how-to-choose-shipping-box-size
/guides/dimensional-weight-explained
/examples/mixed-item-packing-example
/methodology/packing-algorithm
```

### 24.2 Content Rules

Every page must do at least one of the following:

- provide a unique interactive tool;
- explain a parameter the actual product uses;
- provide a worked packing example;
- document the methodology;
- present original benchmark/research data;
- help a user make a real packaging decision.

Do not produce hundreds of templated near-duplicate pages.

### 24.3 Original Content Moat

Over time, CartonLab can publish:

- benchmark packing problems;
- solver comparisons;
- real before/after packaging examples;
- anonymized aggregate utilization studies where privacy allows;
- box-inventory optimization case studies;
- packaging efficiency reports.

---

## 25. Monetization — Ultimate Model

Monetization should be layered after genuine usefulness and traffic.

### 25.1 Advertising

Appropriate locations:

- guides;
- educational pages;
- below results;
- resource pages.

Avoid:

- ads inside critical inputs;
- ads that resemble calculator controls;
- excessive ads around the 3D canvas;
- intrusive interstitials.

### 25.2 Affiliate / Commerce

Potential categories:

- cartons and packing supplies;
- tape and void fill;
- scales and label printers;
- shipping software;
- ecommerce operations software.

Any affiliate relationship must be explicitly disclosed.

### 25.3 Lead Generation

Potentially strong:

- custom carton manufacturers;
- packaging suppliers;
- 3PLs;
- fulfillment providers;
- packaging consultants;
- warehouse software.

Lead generation should be contextual, not spammy.

### 25.4 Premium Product

Possible paid features:

- cloud sync;
- high-volume batch processing;
- team libraries;
- API access;
- integrations;
- advanced reporting;
- organization analytics;
- historical carton-inventory rationalization;
- custom export formats.

The free product should remain meaningfully useful.

---

## 26. Visual Design Direction

The visual identity must be **elegant, sober, practical, trustworthy, and non-gimmicky**.

The user has explicitly rejected the stereotypical “AI product” visual language.

### 26.1 Avoid

Do **not** use:

- purple-to-blue AI gradients;
- neon cyan/purple;
- glowing borders;
- glassmorphism as the main visual language;
- floating generative-AI blobs;
- excessive aurora backgrounds;
- animated gradient mesh backgrounds;
- cartoon robots;
- sparkles implying AI;
- oversized pill buttons everywhere;
- excessive cards within cards;
- dark cyberpunk UI as the default;
- overdesigned dashboards for simple tasks.

### 26.2 Desired Character

Think:

- premium industrial tool;
- modern editorial clarity;
- calm packaging studio;
- understated European/Japanese product design;
- quiet confidence;
- useful physical-world software.

The interface should feel more like a **precision tool** than an AI startup.

---

## 27. Recommended Color System

Use a restrained neutral base with one or two muted functional accents.

### 27.1 Core Palette

Suggested starting palette (can be tuned during brand work):

| Token | Suggested value | Use |
|---|---:|---|
| `--paper` | `#F7F4EE` | warm off-white page background |
| `--surface` | `#FFFEFB` | primary panels/cards |
| `--ink` | `#1D2428` | main text |
| `--ink-soft` | `#5E676A` | secondary text |
| `--line` | `#D9D5CC` | borders/dividers |
| `--stone` | `#EAE6DE` | secondary surfaces |
| `--navy` | `#18324A` | strong actions/business accent |
| `--forest` | `#2E5D50` | success/personal accent |
| `--sand` | `#B79A72` | subtle warm highlight |
| `--danger` | `#9D413B` | errors only |
| `--warning` | `#A56B24` | warnings only |

This is intentionally **not** a bright “AI palette.”

### 27.2 Usage Rules

- Warm neutral page background.
- White/cream surfaces.
- Dark charcoal/navy typography.
- Forest green only for success/recommendation or Personal accents.
- Deep navy for primary business actions and technical emphasis.
- Warm sand/taupe for secondary highlights.
- No gradient required for normal surfaces.
- If a gradient is ever used, it should be extremely subtle tonal shading, not a purple/blue marketing gradient.

### 27.3 Personal vs Business Differentiation

Do not create cartoonishly separate themes.

Suggested:

- Personal accent: muted forest/teal-green.
- Business accent: deep navy / warm bronze-taupe.

The shared shell and typography remain identical.

---

## 28. Typography

Use freely available, highly readable fonts.

Recommended approach:

### UI / Body

- **Inter** or **Source Sans 3**

### Optional Editorial Accent

If desired for selected large headings only:

- **Source Serif 4**

Do not combine many font families.

Typography should feel precise rather than playful.

### Scale Principles

- Strong, short H1.
- Comfortable body size (16–18 px desktop where appropriate).
- Dense data tables may use 14–15 px but maintain accessibility.
- Avoid overly tiny helper copy.
- Use tabular numerals for measurements/metrics where supported.

---

## 29. Layout & Spacing

### 29.1 General

- generous whitespace;
- maximum content width around 1180–1280 px for app/workbench;
- narrower width for editorial content;
- 8 px spacing grid;
- consistent radius, generally 10–14 px;
- subtle 1 px borders;
- very restrained shadows.

### 29.2 Desktop Workbench

Preferred pattern:

```text
-------------------------------------------------
 Inputs / controls       | Result / 3D workspace
 36–42%                  | 58–64%
-------------------------------------------------
```

The result pane should remain visible where practical while editing inputs.

### 29.3 Mobile

Single-column, task-first layout.

- inputs first;
- sticky or clear Calculate CTA;
- result summary;
- 3D viewer;
- alternatives;
- advanced details.

Do not reproduce a compressed desktop dashboard.

---

## 30. Component Design System

### Buttons

Primary:

- dark navy/charcoal fill;
- white text;
- medium radius;
- no neon glow.

Secondary:

- surface background;
- 1 px border;
- dark text.

Danger:

- muted red only where destructive action exists.

### Cards

- light surface;
- thin neutral border;
- soft shadow only where hierarchy needs it;
- no excessive floating glass cards.

### Inputs

- large enough for measurements;
- explicit units;
- keyboard-friendly;
- numeric step controls only where useful;
- visible validation;
- placeholders should not replace labels.

### Tables

- clean horizontal rules;
- sticky header for long tables;
- clear units;
- sort/filter only where useful;
- avoid dense spreadsheet mimicry for personal users.

### Badges

Use sparingly:

- Recommended
- Best fit
- Lowest waste
- Uses existing boxes
- Lower DIM

Do not badge every metric.

---

## 31. Icons & Illustration

Use simple line icons, preferably one consistent open-source library such as Lucide.

Icons may represent:

- home;
- business/store;
- boxes;
- item;
- dimensions;
- weight;
- rotate;
- fragile;
- upload;
- report;
- analytics.

Avoid decorative 3D cartoon illustrations as the main design system.

The actual packing visualization is the product’s visual hero.

---

## 32. Motion

Motion should communicate state, not decorate the site.

Appropriate:

- smooth result-pane update;
- subtle item highlight in 3D when selected;
- transitions between alternatives;
- small loading/progress indicator during optimization;
- layer transitions.

Avoid:

- looping hero animations;
- floating cards;
- animated gradients;
- bouncing CTAs;
- confetti for calculations.

Respect `prefers-reduced-motion`.

---

## 33. Accessibility

Target WCAG 2.2 AA principles.

Requirements:

- keyboard-operable forms;
- visible focus state;
- semantic labels;
- contrast-safe palette;
- 3D result must have text/table equivalent;
- color is never the only item identifier;
- errors connected to fields;
- unit selections accessible;
- touch targets sufficiently large;
- charts/metrics have text summaries.

The 3D visualization must enhance understanding, not become the only way to access the plan.

---

## 34. Internationalization & Units

The product should be architected for:

- metric;
- imperial;
- decimal precision rules;
- localized number formatting;
- future translation.

Internally, normalize dimensions and weight to canonical units to avoid conversion drift.

Do not assume one country’s common carton sizes are universal.

---

## 35. Dimensional Weight

DIM logic should be modular.

Support:

- user-entered divisor;
- verified presets where appropriate;
- actual weight vs DIM weight;
- clear formula explanation;
- last-verified date for carrier presets if carrier-specific.

CartonLab is not a live shipping-rate engine. Avoid pretending DIM weight alone predicts the final shipping bill.

---

## 36. Recommended Technology Stack

The project should remain cheap to operate until traffic validates it.

### Frontend / Site

- **Astro** — static/SEO pages and overall website shell
- **React** — interactive packing workbench components
- **TypeScript** — domain logic, engine interfaces, UI
- **Tailwind CSS** or well-structured CSS tokens — design system implementation

### Packing Computation

- TypeScript/JavaScript solver behind an internal adapter interface
- Web Workers for computational work
- optional WebAssembly only when benchmark evidence justifies it

### 3D

- **Three.js**
- renderer kept independent from solver

### Local Storage

- IndexedDB for projects/catalogs/cartons
- localStorage for small preferences

### Hosting / CDN

- **Cloudflare Pages** on free tier while validation is underway
- Cloudflare DNS/SSL/CDN

### Source Control

- GitHub

### Testing

- Vitest for unit/domain tests
- Playwright for end-to-end tests
- automated benchmark corpus for solver verification

### Analytics

- Google Search Console
- Cloudflare Web Analytics
- GA4 or another free event analytics layer if required for product funnels

### Backend

No mandatory backend for the core free experience.

Future backend only when required for:

- accounts;
- cross-device sync;
- shared projects;
- batch services beyond browser limits;
- integrations;
- API;
- billing.

Cloudflare Workers/D1 or another inexpensive serverless stack can be evaluated then.

---

## 37. Suggested Repository Architecture

```text
cartonlab/
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
│   ├── engine/
│   ├── benchmarks/
│   ├── fixtures/
│   ├── visual/
│   └── e2e/
├── docs/
│   ├── architecture/
│   ├── methodology/
│   └── decisions/
└── package.json
```

---

## 38. Canonical Result Model

All solvers should return a normalized structure conceptually similar to:

```ts
interface PackingPlan {
  id: string;
  status: 'feasible' | 'partial' | 'infeasible' | 'limit_reached';
  objective: OptimizationObjective;
  cartons: PackedCarton[];
  unplacedItems: UnplacedItem[];
  metrics: PlanMetrics;
  explanations: Explanation[];
  solverMeta: SolverMeta;
}

interface PackedCarton {
  carton: CartonDefinition;
  placements: ItemPlacement[];
  metrics: CartonMetrics;
}

interface ItemPlacement {
  itemId: string;
  instanceIndex: number;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  rotation: Rotation;
}
```

The 3D renderer, text summary, printable plan, exports, and metrics should consume this model rather than solver-specific output.

---

## 39. Solver Test Corpus

A serious packing product requires a permanent benchmark suite.

Include cases for:

- one item exactly fits;
- one item cannot fit;
- rotation required;
- rotation forbidden;
- several identical items;
- mixed items;
- multiple quantities;
- one carton vs two cartons;
- weight limit forces split;
- inventory quantity exhausted;
- upright-only item;
- spacing/padding;
- long thin item;
- flat items;
- highly different item sizes;
- many small items;
- empty input;
- invalid dimensions;
- units conversion;
- deterministic repeatability;
- known layouts from research/competitor examples where legally and practically appropriate.

Every production solver change should run against this corpus.

---

## 40. Performance Targets

These are design targets, not hard guarantees.

### Site

- static content loads quickly on mid-range mobile;
- minimal JS on editorial pages;
- workbench code split from homepage/content;
- 3D lazy-loaded where possible.

### Solver

Interactive small/medium jobs should feel immediate or near-immediate.

If a calculation takes longer:

- show meaningful progress/status;
- allow cancellation;
- do not freeze the UI thread;
- offer “fast” vs “deeper search” modes only if useful and understandable.

### 3D

Maintain smooth interaction on typical current desktop/mobile devices with simple geometry.

---

## 41. Analytics & Product Events

Track behavior without storing sensitive order content.

Suggested events:

```text
homepage_personal_selected
homepage_business_selected
item_added
carton_added
box_availability_mode_selected
advanced_constraints_opened
optimization_started
optimization_completed
optimization_failed
result_alternative_viewed
3d_view_opened
layers_view_opened
packing_plan_printed
project_exported
csv_import_started
csv_import_completed
saved_box_created
repeat_visit
```

Never send raw product names, SKUs, dimensions, or order details to analytics unless explicitly designed, justified, and disclosed.

---

## 42. Privacy & Security

### Default Principle

> **The browser should know more about the user’s order than CartonLab’s server does.**

Where feasible:

- compute locally;
- save locally;
- export locally;
- avoid PII collection.

### If Cloud Features Are Added

Require:

- clear consent;
- secure authentication;
- encryption in transit;
- access control;
- deletion/export mechanisms;
- documented retention;
- secure API design.

Do not claim “nothing leaves your browser” on pages where analytics or cloud functionality means that statement is not literally true. Be precise about what data stays local.

---

## 43. Trust & Methodology

Create a dedicated methodology area explaining:

- what 3D bin packing is;
- why different valid arrangements can exist;
- what the optimizer prioritizes;
- why results may not be mathematically globally optimal;
- what constraints are respected;
- how utilization is calculated;
- how dimensional weight is calculated;
- what assumptions are used;
- how result verification works.

This content builds trust and SEO value simultaneously.

---

## 44. Error Handling Philosophy

Errors should help the user recover.

Bad:

> “Calculation failed.”

Better:

> “No valid plan was found because the 72 cm lamp cannot fit inside any available carton. Add a carton with at least one internal side of 72 cm, allow rotation if appropriate, or pack that item separately.”

Common recoverable states:

- invalid dimensions;
- zero quantity;
- item larger than all cartons;
- carton exceeds weight;
- insufficient carton stock;
- contradictory constraints;
- too many items for current calculation limit;
- unsupported import row.

---

## 45. Export & Sharing

### Personal

- print packing plan;
- PDF summary;
- PNG/screenshot-friendly layout;
- project JSON export.

### Business

- printable packing instructions;
- CSV per-order result;
- JSON result;
- batch summary;
- PDF report;
- shareable project link after cloud accounts exist;
- API response in future.

Exports must include units and assumptions.

---

## 46. Search and Discoverability Inside the Product

As saved catalogs grow, support:

- search saved products;
- search carton library;
- recent items;
- favorites;
- tags/categories later.

Do not add heavyweight enterprise inventory UI until actual user demand justifies it.

---

## 47. Business Integrations — Ultimate Layer

Potential integrations after validation:

- Shopify;
- WooCommerce;
- CSV/Excel as universal baseline;
- WMS/ERP via API;
- marketplace exports where feasible.

Integration principle:

> CartonLab consumes the minimum information required to make the packaging decision and returns a packaging plan.

Do not turn integrations into an excuse to become a full order-management platform.

---

## 48. API — Ultimate Layer

A future deterministic API could be strategically valuable for businesses and AI agents.

Conceptual endpoint:

```text
POST /v1/pack
```

Input:

- items;
- available cartons;
- constraints;
- objective.

Output:

- recommended plan;
- alternatives;
- metrics;
- placements;
- explanation;
- solver metadata.

This should be designed only after the browser product proves demand.

---

## 49. AI Strategy

CartonLab should not depend on an LLM for the core packing answer.

The core answer should come from deterministic packing logic.

AI may later assist with:

- explaining results in plain language;
- mapping messy uploaded column names;
- suggesting missing measurement fields;
- converting natural-language constraints into structured settings;
- support/help search.

But the authoritative packing coordinates, feasibility checks, and metrics should remain deterministic and verifiable.

---

## 50. Design Reference Notes from Competitor Review

The team has reviewed examples including BoxVolume, BoxPack3D, CargoFormula, PackCalc, packaging calculators, moving calculators, supplier sites, and enterprise loading tools.

Use these references for lessons, not visual copying.

### Learn From BoxVolume

- very clear first choice;
- simple input forms;
- visible recommendation;
- 3D proof;
- progressive result detail.

### Learn From BoxPack3D

- products + target cartons in one workspace;
- rich packing metrics;
- clear 3D output;
- ability to identify items that do not fit.

### Learn From CargoFormula

- coherent tool ecosystem;
- strong information architecture;
- no-login browser utility;
- methodology and supporting content.

### Learn From PackCalc

- long-term packaging-tool expansion;
- professional depth;
- structured domain knowledge.

### Avoid

- old calculator portals with dozens of unrelated utilities;
- overwhelming users with every metric at once;
- enterprise forms on the consumer path;
- visual design that looks like a generic AI SaaS template.

---

## 51. Detailed Sitemap — Ultimate

```text
/
├── personal/
│   ├── pack/
│   ├── saved-boxes/
│   └── recent-plans/
├── business/
│   ├── optimize/
│   ├── products/
│   ├── cartons/
│   ├── batch/
│   ├── analytics/
│   └── carton-portfolio/
├── tools/
│   ├── dimensional-weight-calculator/
│   ├── box-size-calculator/
│   ├── items-in-box-calculator/
│   ├── box-utilization-calculator/
│   └── unit-converter/
├── guides/
├── examples/
├── methodology/
│   ├── how-packing-works/
│   ├── constraints/
│   ├── dimensional-weight/
│   └── solver-validation/
├── resources/
├── about/
├── contact/
└── legal/
    ├── privacy/
    ├── terms/
    └── data-policy/
```

This sitemap is an ultimate target. Do not build empty navigation destinations merely to match it.

---

## 52. Product State & URL Philosophy

Packing jobs should be representable as structured project state.

Possible states:

- local unsaved project;
- local saved project;
- exported project JSON;
- cloud project in mature version;
- shareable read-only result.

Do not encode sensitive business data directly into public query strings.

---

## 53. Content Voice

Tone:

- clear;
- calm;
- precise;
- practical;
- non-salesy;
- non-patronizing.

Prefer:

> “The 55 × 40 × 35 cm carton cannot fit the 61 cm item.”

Over:

> “Oops! Looks like your items are having a little packing adventure!”

Avoid AI-flavored marketing language such as:

- “revolutionary intelligence”;
- “AI-powered magic”;
- “unlock the future”;
- “supercharge everything.”

The product should earn trust through useful output.

---

## 54. Naming & Brand Status

`CartonLab` is a **working project name only**.

Prior research identified existing usage of “CartonLab/Cartonlab” in another cardboard/design context and the obvious `.com` domain may not be available.

Before public launch:

1. shortlist names;
2. check live web use;
3. check relevant trademark databases;
4. check domain availability;
5. check social/profile confusion only if relevant;
6. choose a name that can cover personal and business use, not only warehouses.

Do not let brand selection block technical development; use CartonLab internally until the public name is frozen.

---

## 55. Ultimate Quality Bar

The mature product should satisfy all of these statements.

### For a first-time household user

- I understand what the site does within seconds.
- I can enter items without knowing logistics terminology.
- I do not need an account.
- I can ask for a box size even if I do not own boxes yet.
- I can see the result in 3D.
- I understand the recommendation and alternatives.

### For a repeat merchant

- I can save my carton library.
- I can reuse products/SKUs.
- I can optimize mixed-product orders.
- I can use operational constraints.
- I can compare utilization/DIM/cost trade-offs.
- I can process many orders.
- I can print/export packing instructions.
- I can analyze whether my carton inventory itself is efficient.

### For the website owner

- core free computation can run cheaply in browser;
- static/SEO pages are fast;
- the product can scale without per-calculation API cost;
- analytics show real task completion;
- monetization can be layered without damaging the user experience;
- the site accumulates brand, content, backlinks, benchmarks, and product capability over time.

---

## 56. Engineering Build Sequence Toward the Ultimate Product

This section is **not an MVP definition**. It is the recommended dependency order so the team does not build the mature product in a technically dangerous sequence.

1. Freeze domain models and normalized result schema.
2. Build solver adapter + verification layer.
3. Build benchmark/test corpus.
4. Build simple manual input workspace.
5. Build result summary.
6. Build functional Three.js visualization.
7. Build three box-availability workflows.
8. Build Personal presentation layer.
9. Build Business presentation layer.
10. Build local saved cartons/projects.
11. Build alternatives/objective scoring.
12. Build DIM/weight modules.
13. Build supporting SEO tools/content framework.
14. Build CSV import/export.
15. Build batch processing.
16. Build saved product catalog.
17. Build analytics and carton-portfolio rationalization.
18. Add accounts/cloud only when needed.
19. Add integrations/API after validated business demand.

The product vision should remain stable even if implementation is staged.

---

## 57. Vibe-Coding / AI-Assisted Development Rules

A new AI coding chat should be instructed to treat this file as the product authority.

### Mandatory Rules

1. **Do not silently reduce or expand the ultimate product vision.**
2. **Do not invent requirements when this specification is ambiguous.** Ask or record an ADR (Architecture Decision Record).
3. Keep packing engine independent from UI and 3D renderer.
4. Write tests before trusting packing results.
5. Never call a heuristic result “guaranteed optimal” without proof.
6. Keep the default experience no-login and browser-first.
7. Preserve Personal vs Business progressive disclosure.
8. Do not introduce paid infrastructure without a validated reason.
9. Avoid unnecessary dependencies.
10. Verify open-source licenses before adoption.
11. Do not copy competitor UI or copyrighted content.
12. Follow the sober design system; no generic AI gradients/glow.
13. Keep dimensions/weights unit-safe and normalized internally.
14. Every result renderer must use the canonical verified result model.
15. Performance and accessibility are product requirements, not polish tasks.
16. Maintain a decision log for architecture changes.
17. Keep SEO pages useful independently; no thin programmatic pages.
18. Never send sensitive business/order inputs to analytics by default.

---

## 58. New Chat Bootstrap Prompt for the Team

The team can attach this specification and the flowchart image to a new coding chat and paste the following:

```text
You are the implementation lead for a new web product currently codenamed CartonLab.

Two files are attached:
1. CARTONLAB_ULTIMATE_PROJECT_SPECIFICATION.md
2. cartonlab_complete_website_flow.png

Treat the Markdown specification as the product authority and the image as a visual flow reference.

This is a long-term product build, not a request to improvise a generic calculator. First read and understand the entire specification. Do not start coding immediately.

Your first task is to:
- restate the product architecture in your own words;
- identify the main domain entities and boundaries;
- identify any contradictions or missing decisions;
- propose the repository/architecture plan consistent with the specification;
- propose the engineering dependency order;
- identify the first technical proof required for the packing engine and 3D result model;
- identify all external libraries you would consider and flag every license that must be verified;
- propose a testing/benchmark strategy;
- preserve the specified sober/non-AI visual direction.

Important constraints:
- core free product should be browser-first and capable of operating with near-zero infrastructure cost;
- Astro + React + TypeScript is the preferred website/workbench architecture;
- Three.js is expected for functional 3D visualization;
- packing logic must be independent of the UI and renderer;
- no backend/accounts are required merely because they are common in SaaS products;
- do not introduce paid services unless technically necessary and explicitly approved;
- do not promise mathematically optimal packing unless proven;
- Personal users must never need to know what an SKU is;
- Business users must be able to grow into advanced workflows without creating a separate product;
- visual design must be elegant, sober and practical: warm neutrals, charcoal/navy/forest accents, no purple-blue AI gradients, no neon glow, no generic AI aesthetic.

After presenting the architecture and open questions, wait for approval before creating implementation code.
```

---

## 59. Companion Flowchart

The companion image `cartonlab_complete_website_flow.png` summarizes the intended information flow:

- Homepage
- Home & Personal stream
- Business stream
- shared result engine
- supporting/SEO pages
- future expansion

The image is a conceptual reference, not a pixel-perfect final UI. The detailed requirements in this Markdown file take precedence if any text or detail in the image differs.

---

## 60. Final Product Definition

The final product can be summarized in one statement:

> **CartonLab is a universal browser-based packing decision workbench that helps anyone—from a household user to an ecommerce operation—determine the right carton or combination of cartons, visualize how items fit, compare practical alternatives, understand space/weight/cost trade-offs, and, for repeat businesses, continuously improve the carton inventory they stock and the efficiency of their packaging operation.**

The enduring product principle is:

> **Easy enough for someone who has never heard the word SKU. Powerful enough for a merchant to use every day.**

---

# Appendix A — Ultimate Feature Inventory

This inventory is intentionally comprehensive. It represents the long-term product map, not a requirement that all features ship together.

### Core packing

- multiple item types;
- quantities;
- weight;
- mixed-item packing;
- box recommendation without existing boxes;
- packing into user-provided boxes;
- partial inventory + additional box recommendation;
- multi-carton distribution;
- rotation;
- upright-only;
- padding/spacing;
- max carton weight;
- item compatibility constraints;
- unplaced-item explanation;
- alternatives;
- objective selection;
- verified output.

### Visualization

- interactive 3D;
- layer view;
- item highlighting;
- carton switching;
- legends;
- camera reset;
- hide carton shell;
- packing sequence later;
- printable layout.

### Metrics

- volume utilization;
- empty space;
- actual weight;
- DIM weight;
- chargeable-weight estimate where applicable;
- carton cost;
- number of cartons;
- stock consumption;
- objective score;
- comparison deltas.

### Personal

- no-box recommendation;
- existing-box fit;
- partial-box inventory;
- easy-to-buy rounded dimensions;
- handling preference;
- recent plans;
- simple print/export.

### Business

- SKU;
- saved products;
- saved carton library;
- stock quantities;
- box costs;
- CSV import;
- batch orders;
- packing instructions;
- analytics;
- carton rationalization;
- team/cloud later;
- integrations/API later.

### Content / SEO

- DIM calculator;
- box size calculator;
- utilization calculator;
- packing guides;
- worked examples;
- methodology;
- benchmark studies;
- case studies;
- original packaging-efficiency research.

### Platform

- metric/imperial;
- internationalization-ready;
- accessibility;
- privacy-first local processing;
- IndexedDB;
- import/export project file;
- optional cloud sync;
- analytics without raw order data;
- static-first hosting.

---

# Appendix B — Design Checklist

Before approving any major screen, ask:

- Is the primary task obvious?
- Is the page calmer than a typical SaaS dashboard?
- Did we accidentally use AI-startup visual clichés?
- Are advanced controls hidden until relevant?
- Are units explicit?
- Can a normal person understand the labels?
- Can a professional still access detailed information?
- Does 3D prove the result rather than merely decorate the page?
- Are alternatives explained rather than dumped into a giant table?
- Is the recommended plan visually dominant?
- Are warnings specific and actionable?
- Is the page usable by keyboard?
- Does the mobile layout preserve task order?
- Is the typography sober and readable?
- Are borders/shadows restrained?
- Are accent colors functional rather than decorative?

---

# Appendix C — Key Guardrails to Preserve

1. **Do not force users to provide available boxes.**
2. **Do not force users to provide SKUs.**
3. **Do not build Personal and Business as separate engines.**
4. **Do not make 3D optional in the ultimate vision; it is part of the trust layer.**
5. **Do not turn the site into a generic calculator directory.**
6. **Do not make login a prerequisite for the core calculator.**
7. **Do not make paid APIs a prerequisite for the free product.**
8. **Do not let live shipping-rate complexity consume the packing product.**
9. **Do not promise exact carrier charges from DIM alone.**
10. **Do not promise global mathematical optimality without proof.**
11. **Do not use an AI-generated-looking visual language.**
12. **Do not let SEO content become more important than the actual tool.**
13. **Do not hide solver limitations; explain them.**
14. **Do not publish unverified carrier presets as permanent truths.**
15. **Do not send customer order/SKU data to analytics by default.**

---

**End of master specification.**
