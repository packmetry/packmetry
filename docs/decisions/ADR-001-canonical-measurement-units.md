# ADR-001: Canonical Measurement Units

## Status
Accepted

## Context
Packmetry needs consistent internal representation of physical measurements for reliable packing calculations. Users may input dimensions and weights in various units (metric and imperial), but the packing engine requires normalized values to avoid conversion drift and ensure accuracy.

## Decision
We adopt the following canonical units:
- **Length**: Millimeters (mm)
- **Mass**: Grams (g)

All internal calculations use these canonical units exclusively. User interface layers handle conversion to/from display units.

## Rationale
1. **Precision**: Millimeters provide sufficient granularity for carton dimensions while avoiding floating-point precision issues common with smaller units.
2. **Industry alignment**: Millimeters are standard in packaging, shipping, and manufacturing specifications.
3. **Conversion simplicity**: Millimeters have simple conversion factors with centimeters (10×) and meters (1000×).
4. **Imperial compatibility**: Inches convert cleanly to millimeters (1 in = 25.4 mm exactly per international standard).
5. **Mass consistency**: Grams provide precise weight representation compatible with both metric and imperial systems.
6. **Avoidance of drift**: Storing canonical values prevents cumulative rounding errors from repeated conversions.

## Conversion Factors
### Length (to millimeters)
- 1 mm = 1 mm
- 1 cm = 10 mm
- 1 m = 1000 mm
- 1 in = 25.4 mm (exact)
- 1 ft = 304.8 mm (exact: 12 × 25.4)

### Mass (to grams)
- 1 g = 1 g
- 1 kg = 1000 g
- 1 oz = 28.349523125 g (exact)
- 1 lb = 453.59237 g (exact)

## Consequences
### Positive
- Elimination of conversion drift in calculations
- Consistent internal representation
- Simplified validation and comparison logic
- Clear separation between display formatting and computation
- Deterministic test results

### Negative
- Additional conversion layer required between UI and core engine
- Display values must be derived from canonical values (not recalculated)
- Initial development overhead for unit handling infrastructure

## Implementation Notes
1. All dimension inputs must be normalized to millimeters before use in calculations.
2. All weight inputs must be normalized to grams before use in calculations.
3. Display formatting must derive from canonical values, not recalculate conversions independently.
4. Validation must reject non-finite values (NaN, Infinity) and zero/negative dimensions.
5. Dimension axis order (length × width × height) must be preserved; no automatic sorting.
6. The canonical units module must have no external dependencies.

## Testing Requirements
1. Exact conversion factor verification
2. Metric↔imperial round-trip conversions with appropriate tolerance
3. Rejection of invalid inputs (NaN, Infinity, zero, negative)
4. Volume calculation verification (600×400×350 mm = 84,000,000 mm³)
5. Axis order preservation

## References
- PKM-CORE-001 implementation task
- Legacy product specification section 34
- Packmetry bootstrap sections 33-35