import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DimensionalWeightCalculator, {
  calculateDimensionalWeightTool,
} from '../components/DimensionalWeightCalculator.js';

describe('DimensionalWeightCalculator', () => {
  it('renders an explicit-divisor DIM calculator', () => {
    const html =
      renderToStaticMarkup(
        <DimensionalWeightCalculator />
      );

    expect(html).toContain(
      'Calculate dimensional weight'
    );

    expect(html).toContain(
      'External package dimensions'
    );

    expect(html).toContain(
      'Divisor value'
    );

    expect(html).toContain(
      'Packmetry does not assume a universal carrier divisor'
    );

    expect(html).toContain(
      'Actual gross weight'
    );
  });

  it('calculates DIM weight through the canonical unit-safe module', () => {
    const result =
      calculateDimensionalWeightTool({
        length: 10,
        width: 10,
        height: 10,
        dimensionUnit: 'cm',
        divisorValue: 1000,
        divisorLengthUnit: 'cm',
        divisorMassUnit: 'kg',
      });

    expect(
      result.dimensionalWeight
    ).toBe(1);

    expect(
      result.dimensionalWeightG
    ).toBe(1000);

    expect(
      result.outputMassUnit
    ).toBe('kg');
  });

  it('calculates the base chargeable-weight comparison when actual gross weight is supplied', () => {
    const result =
      calculateDimensionalWeightTool({
        length: 10,
        width: 10,
        height: 10,
        dimensionUnit: 'cm',
        divisorValue: 1000,
        divisorLengthUnit: 'cm',
        divisorMassUnit: 'kg',
        grossWeight: 2,
        grossWeightUnit: 'kg',
      });

    expect(
      result.chargeableWeight
    ).toBe(2);

    expect(
      result.chargeableWeightG
    ).toBe(2000);
  });

  it('rejects invalid dimensions and divisor values', () => {
    expect(() =>
      calculateDimensionalWeightTool({
        length: 0,
        width: 10,
        height: 10,
        dimensionUnit: 'cm',
        divisorValue: 1000,
        divisorLengthUnit: 'cm',
        divisorMassUnit: 'kg',
      })
    ).toThrow(
      'External length must be greater than 0.'
    );

    expect(() =>
      calculateDimensionalWeightTool({
        length: 10,
        width: 10,
        height: 10,
        dimensionUnit: 'cm',
        divisorValue: 0,
        divisorLengthUnit: 'cm',
        divisorMassUnit: 'kg',
      })
    ).toThrow(
      'DIM divisor must be greater than 0.'
    );
  });

  it('does not embed carrier divisor presets', () => {
    const source =
      renderToStaticMarkup(
        <DimensionalWeightCalculator />
      );

    expect(source).not.toContain(
      'value="139"'
    );

    expect(source).not.toContain(
      'value="166"'
    );

    expect(source).not.toContain(
      'value="5000"'
    );
  });
});
