ADR-012: Dimensional and Chargeable Weight Semantics
Status: Accepted
Date: 2026-10-03

Context

Phase 12 introduces modular dimensional-weight and weight-analysis semantics.

The Packmetry authority requires DIM logic to support:
- user-entered divisors;
- verified presets where appropriate;
- actual weight versus dimensional weight;
- clear formula explanation;
- chargeable-weight estimates where applicable;
- carrier-specific preset provenance and a last-verified date;
- browser-first calculation without becoming a live shipping-rate engine.

The existing Packmetry domain already provides:
- canonical dimensions in millimeters;
- item unitWeightG;
- carton emptyBoxWeightG;
- carton maxGrossWeightG;
- optional carton externalDimensions;
- per-carton contentsWeightG and grossWeightG;
- plan-level totalContentsWeightG and totalGrossWeightG;
- the min-dim-weight optimization objective identifier.

ADR-008 intentionally leaves min-dim-weight unsupported until authoritative DIM semantics exist.

Current physical carton-weight enforcement is based on actual known mass:
contents weight + carton tare weight.

DIM weight is a shipping/rating metric.
It is not physical mass and must not alter geometry or physical gross-weight verification.

This ADR defines canonical DIM and chargeable-weight semantics only.

Decision

Scope

Phase 12 will add one modular DIM-weight calculation contract shared by:
- canonical plan metrics;
- candidate selection;
- result presentation;
- future standalone DIM tools;
- future saved DIM settings.

This ADR does not introduce:
- live carrier rates;
- shipping-label purchasing;
- shipping-price prediction;
- carrier API calls;
- zone calculations;
- service-level pricing;
- fuel surcharges;
- residential surcharges;
- minimum billing rules;
- carrier rounding rules;
- automatic carrier selection;
- physical placement changes;
- new packing geometry.

Canonical DIM divisor meaning

A dimensional-weight divisor is not a unitless number.

A divisor must include:
- a positive finite numeric value;
- the length unit used by the three package dimensions;
- the mass unit produced by the formula.

Conceptually:

DimensionalWeightDivisor {
  value: number;
  lengthUnit: LengthUnit;
  massUnit: MassUnit;
}

The divisor value means:

cubic length units per one mass unit.

Examples of the shape of a divisor are:

value + inches + pounds

or:

value + centimeters + kilograms

No specific numeric divisor is made authoritative by this ADR.

A bare number such as:

139
166
5000

is insufficient by itself because its unit semantics are ambiguous.

User-entered divisors

Packmetry must support a user-entered divisor.

A user-entered divisor must always carry its explicit:
- numeric value;
- length unit;
- mass unit.

The numeric value must be:
- finite;
- greater than zero.

Unknown, missing, invalid, zero, negative, NaN, or infinite divisors must not be silently replaced by a default.

No global Packmetry divisor exists.

DIM calculation

For supplied package dimensions and an authoritative divisor:

1. convert length, width, and height into the divisor's length unit;
2. calculate package volume in that cubic length unit;
3. divide that volume by the divisor value;
4. interpret the result in the divisor's mass unit;
5. convert the result to canonical grams.

Conceptually:

volume =
length
* width
* height

dimensionalWeight =
volume / divisor

dimWeightG =
convert resulting mass to grams

The canonical DIM result is therefore expressed in grams.

The core DIM calculation must not round the result for presentation or carrier billing.

UI formatting may round displayed values.

Any future carrier-specific billing rounding remains outside this base calculation unless separately defined by an accepted decision.

Carton dimension source

Shipping DIM weight represents the outer package size.

Therefore, when DIM weight is calculated for a canonical Carton:

carton.externalDimensions

is the authoritative dimension source.

If externalDimensions are absent:

DIM weight for that carton is unknown.

Packmetry must not silently substitute:

carton.internalDimensions

for externalDimensions.

Internal dimensions remain authoritative for packing geometry and utilization.

External dimensions remain authoritative for carton DIM calculations.

This distinction prevents the packing cavity from being misrepresented as the shipping package size.

Standalone DIM calculations

A standalone DIM calculator may calculate directly from dimensions explicitly entered by the user.

Those dimensions do not need to originate from a Carton.

The caller is responsible for identifying them truthfully as the package dimensions used in the calculation.

Physical actual weight

For a packed carton:

contentsWeightG =
sum of known unitWeightG values
for every placed item instance

When contents weight and carton tare are both known:

grossWeightG =
contentsWeightG
+ carton.emptyBoxWeightG

grossWeightG represents actual physical packed-carton mass.

Unknown item weight or unknown carton tare must remain unknown.

Unknown weight must never be treated as zero.

Dimensional weight

For a used carton with:
- known external dimensions; and
- valid DIM settings;

dimWeightG is calculated from the carton external dimensions and configured divisor.

dimWeightG is not physical mass.

It must not:
- modify placement geometry;
- affect overlap verification;
- consume physical carton capacity;
- replace grossWeightG;
- trigger maxGrossWeightG by itself.

Chargeable-weight estimate

When both values are known:

chargeableWeightG =
max(
  grossWeightG,
  dimWeightG
)

This value is a Packmetry estimate of the greater of actual packed mass and dimensional mass under the selected DIM divisor.

If either:
- grossWeightG; or
- dimWeightG

is unknown:

chargeableWeightG is unknown.

Packmetry must not substitute:
- contentsWeightG for unknown grossWeightG;
- zero for unknown DIM weight;
- zero for unknown actual weight.

Chargeable weight does not represent an exact shipping bill.

Canonical carton metrics

CartonMetrics may add:

dimWeightG?: number

chargeableWeightG?: number

Existing fields remain unchanged:

contentsWeightG?: number

grossWeightG?: number

Unknown optional DIM or chargeable values remain absent.

All known DIM and chargeable values must be finite and non-negative.

Canonical plan metrics

PlanMetrics may add:

totalDimWeightG?: number

totalChargeableWeightG?: number

When DIM weight is known for every used carton:

totalDimWeightG =
sum of dimWeightG
for all used carton instances

When chargeable weight is known for every used carton:

totalChargeableWeightG =
sum of chargeableWeightG
for all used carton instances

If any used carton lacks the required data:

the corresponding plan-level total is unknown.

For a plan using zero cartons:

totalDimWeightG = 0

totalChargeableWeightG = 0

when DIM settings are otherwise valid for the calculation context.

Planning input

DIM settings are optional planning context.

The canonical solver/planning input may be extended conceptually with:

dimensionalWeight?: DimensionalWeightSettings

Existing workflows that do not supply DIM settings remain valid.

The deterministic baseline solver must not change placement behavior based on DIM settings.

The baseline solver remains responsible for candidate generation only.

DIM settings may be consumed later by:
- candidate selection;
- canonical plan construction;
- result metrics.

This preserves the existing responsibility chain:

candidate generation
→ independent verification
→ objective-aware selection
→ canonical plan construction
→ result presentation

Independent verification boundary

DIM calculations do not change the independent geometric verification boundary.

Verification continues to validate:
- carton references;
- item references;
- placement geometry;
- overlap;
- containment;
- rotation constraints;
- inventory bounds;
- actual physical max-gross-weight rules.

DIM weight and chargeable weight are derived planning/result metrics.

They are not physical packing constraints unless a future accepted decision explicitly introduces a separate shipping/rating constraint.

Physical max gross weight

Carton.maxGrossWeightG continues to mean:

maximum actual gross physical mass of the packed carton.

Its enforcement remains based on:

contentsWeightG
+ emptyBoxWeightG

DIM weight must not be compared against maxGrossWeightG.

Chargeable weight must not be compared against maxGrossWeightG.

The existing weight-limit unplaced reason remains a physical-weight result.

min-dim-weight objective

ADR-008 currently marks min-dim-weight as unsupported because canonical DIM semantics did not exist.

After the Phase 12 DIM module and planning-input integration are implemented, min-dim-weight becomes a supported candidate-selection objective.

The common ADR-008 coverage gate remains authoritative.

Only independently valid candidates tied at the best coverage level may be compared.

For min-dim-weight, every comparable candidate must have known total dimensional weight.

If the DIM divisor/settings are absent:

selection must return insufficient-data rather than silently using another objective.

If any used carton required for comparison lacks external dimensions:

selection must return insufficient-data rather than substituting internal dimensions.

The selection contract may extend its missingMetric discriminator with specific DIM causes such as:
- dim-divisor;
- external-dimensions.

When all comparable candidates have known DIM weight, compare in this order:

1. lower totalDimWeightG;
2. fewer cartons;
3. lower emptyVolumeMm3;
4. original solver candidate order.

The selected result means:

the lowest-DIM-weight comparable verified candidate produced by the current solver candidate set under this comparator.

It does not mean:
- globally minimum DIM weight;
- lowest possible carrier bill;
- cheapest shipping service.

Candidate generation remains objective-independent

The deterministic BaselineSolver must not generate different candidate sets merely because:

objective.kind === 'min-dim-weight'

Candidate generation remains governed by ADR-011.

The same candidate set is generated for identical normalized packing inputs.

ADR-008 selection remains responsible for ranking those independently verified candidates.

Carrier presets

Carrier-specific DIM divisors may be added only when Packmetry has an authoritative source for that preset.

A carrier-specific preset must include sufficient provenance to avoid presenting an undocumented constant as permanent truth.

At minimum, a carrier-specific preset must identify:
- a stable preset identifier;
- human-readable label;
- divisor value;
- divisor length unit;
- divisor mass unit;
- source/provenance;
- last-verified date.

Where the rule depends on:
- service type;
- package type;
- destination;
- origin;
- account terms;
- date;
- carrier policy;

that limitation must be represented or disclosed.

This ADR does not approve any numeric carrier preset.

No divisor such as 139, 166, 5000, or any other value may be shipped as an authoritative carrier preset solely because it is commonly cited.

Verified presets are a later Phase 12 slice after source review.

Preset and user-entered settings

A verified preset and a user-entered divisor ultimately normalize into the same calculation semantics.

The DIM calculation module must not contain separate mathematical formulas for different carriers.

Carrier presets supply configuration.

They do not create separate DIM engines.

Formula explainability

When DIM weight is presented to a user, Packmetry must make the calculation understandable.

The UI should be able to state:
- package dimensions used;
- divisor value;
- divisor units;
- resulting DIM weight;
- actual gross weight when known;
- chargeable-weight estimate when known.

If external dimensions are missing, the UI should explain that DIM weight cannot yet be calculated rather than fabricating a result from internal dimensions.

Result truthfulness

Preferred wording includes:
- “Dimensional weight”
- “Actual packed weight”
- “Estimated chargeable weight”
- “Using your selected DIM divisor”

Avoid wording such as:
- “Exact shipping weight”
- “Exact carrier charge”
- “Guaranteed billable weight”
- “Guaranteed shipping price”

unless a future live carrier integration actually establishes those facts.

No live shipping-rate engine

Packmetry Phase 12 remains a packing and cartonization analysis feature.

DIM and chargeable-weight metrics must not expand the product into:
- real-time shipping rates;
- shipping-label checkout;
- carrier-account pricing;
- rate shopping;
- tax/duty calculation;
- delivery-time prediction.

Consequences

Positive

- DIM mathematics becomes explicit and unit-safe.
- A divisor cannot be interpreted without its units.
- Canonical outputs remain in grams.
- Internal packing dimensions and external shipping dimensions remain distinct.
- Missing external dimensions remain truthfully unknown.
- Actual physical weight remains separate from DIM weight.
- Chargeable-weight estimates have one deterministic base definition.
- min-dim-weight can become a truthful ADR-008 objective.
- Carrier presets can be added later without embedding undocumented constants in core logic.
- The solver remains independent from shipping/rating semantics.
- Existing workflows remain backward compatible when no DIM settings are supplied.

Limitations

- Many existing cartons currently lack externalDimensions, so DIM metrics will remain unavailable for those cartons until external dimensions are supplied.
- This ADR does not define carrier billing rounding.
- This ADR does not define service-specific exceptions.
- This ADR does not define a default divisor.
- This ADR does not ship carrier presets.
- This ADR does not estimate shipping price.
- This ADR does not make min-dim-weight globally optimal.
- The current solver candidate set remains bounded by ADR-011.

Alternatives considered

Use internal dimensions when external dimensions are missing

Rejected because internal dimensions describe usable packing space, not the physical shipping package.

Treat the divisor as a unitless number

Rejected because common DIM divisors depend on a specific cubic-length and mass-unit convention.

Hardcode commonly cited carrier divisors

Rejected because carrier rules may vary and the product authority requires verified presets and provenance.

Use DIM weight for carton max-weight verification

Rejected because DIM weight is not physical mass.

Calculate chargeable weight from contents weight when tare is unknown

Rejected because contents-only mass is not the actual packed carton gross mass.

Treat missing DIM information as zero

Rejected because unknown DIM weight is not zero DIM weight.

Silently fall back from min-dim-weight to another objective

Rejected because ADR-008 requires requested objectives to be evaluated truthfully.

Put DIM ranking inside the solver

Rejected because ADR-008 owns candidate ranking and ADR-011 keeps candidate generation objective-independent.

Authority relationship

This ADR defines the DIM semantics intentionally deferred by ADR-008.

Once the corresponding implementation is complete, it supersedes ADR-008 only where ADR-008 states that:

min-dim-weight

is unsupported because DIM semantics do not yet exist.

ADR-008 remains authoritative for:
- independent-verification eligibility;
- common coverage gating;
- deterministic ranking;
- no silent fallback;
- no global-optimality claim.

ADR-011 remains authoritative for deterministic candidate generation.

Existing carton physical max-gross-weight semantics remain unchanged.

Existing geometry and verification ADRs remain unchanged.

Validation / revisit trigger

Revisit this ADR when:
- verified carrier presets are introduced;
- carrier-specific rounding semantics are required;
- external-dimension estimation is proposed;
- package-type-specific DIM rules are introduced;
- service-level DIM policies are introduced;
- chargeable-weight logic needs carrier-specific exceptions;
- live shipping-rate integration is proposed;
- a future objective minimizes estimated shipping cost rather than DIM weight;
- product evidence requires a different deterministic min-dim-weight tie-break order.