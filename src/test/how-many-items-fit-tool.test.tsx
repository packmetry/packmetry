import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HowManyItemsFitCalculator, {
  calculateHowManyItemsFitTool,
} from '../components/HowManyItemsFitCalculator.js';

const base = {
  cartonLength: 20,
  cartonWidth: 20,
  cartonHeight: 20,
  itemLength: 5,
  itemWidth: 5,
  itemHeight: 5,
  unit: 'cm' as const,
  rotationPolicy: 'any' as const,
};

describe('HowManyItemsFitCalculator', () => {
  it('renders a real identical-item uniform-grid calculator', () => {
    const html = renderToStaticMarkup(<HowManyItemsFitCalculator />);
    expect(html).toContain('Estimate identical-item grid capacity');
    expect(html).toContain('Carton internal dimensions');
    expect(html).toContain('Rotation policy');
    expect(html).toContain('Calculate grid fit');
    expect(html).toContain('not a proof of');
  });

  it('counts a feasible 4 by 4 by 4 uniform grid', () => {
    const result = calculateHowManyItemsFitTool(base);
    expect(result.gridCapacity).toBe(64);
    expect(result.countAlongLength).toBe(4);
    expect(result.countAlongWidth).toBe(4);
    expect(result.countAlongHeight).toBe(4);
    expect(result.gridUtilizationPercent).toBeCloseTo(100);
    expect(result.rotation).toBe('LWH');
  });

  it('finds a rotation that a fixed orientation does not permit', () => {
    const input = {
      ...base,
      cartonLength: 20,
      cartonWidth: 10,
      cartonHeight: 10,
      itemLength: 5,
      itemWidth: 10,
      itemHeight: 20,
    };

    expect(calculateHowManyItemsFitTool({
      ...input,
      rotationPolicy: 'fixed',
    }).gridCapacity).toBe(0);

    const rotated = calculateHowManyItemsFitTool(input);
    expect(rotated.gridCapacity).toBe(2);
    expect(rotated.rotation).toBe('HLW');
  });

  it('honors upright restrictions', () => {
    const input = {
      ...base,
      cartonLength: 20,
      cartonWidth: 10,
      cartonHeight: 10,
      itemLength: 5,
      itemWidth: 10,
      itemHeight: 20,
    };
    expect(calculateHowManyItemsFitTool({
      ...input,
      rotationPolicy: 'upright',
    }).gridCapacity).toBe(0);
    expect(calculateHowManyItemsFitTool({
      ...input,
      rotationPolicy: 'vertical-axis-only',
    }).gridCapacity).toBe(0);
  });

  it('compares optional requested quantity to grid capacity', () => {
    expect(calculateHowManyItemsFitTool({
      ...base,
      requestedQuantity: 64,
    }).requestedQuantityFitsGrid).toBe(true);
    expect(calculateHowManyItemsFitTool({
      ...base,
      requestedQuantity: 65,
    }).requestedQuantityFitsGrid).toBe(false);
    expect(calculateHowManyItemsFitTool(base))
      .not.toHaveProperty('requestedQuantityFitsGrid');
  });

  it('uses Packmetry canonical unit conversion', () => {
    const result = calculateHowManyItemsFitTool({
      ...base,
      cartonLength: 200,
      cartonWidth: 200,
      cartonHeight: 200,
      itemLength: 50,
      itemWidth: 50,
      itemHeight: 50,
      unit: 'mm',
    });
    expect(result.gridCapacity).toBe(64);
  });

  it('returns zero when no allowed orientation fits', () => {
    const result = calculateHowManyItemsFitTool({
      ...base,
      itemLength: 21,
      itemWidth: 21,
      itemHeight: 21,
    });
    expect(result.gridCapacity).toBe(0);
    expect(result.gridUtilizationPercent).toBe(0);
  });

  it('rejects nonpositive and nonfinite dimensions', () => {
    expect(() => calculateHowManyItemsFitTool({
      ...base,
      cartonLength: 0,
    })).toThrow('Length must be greater than zero');
    expect(() => calculateHowManyItemsFitTool({
      ...base,
      itemWidth: Number.NaN,
    })).toThrow('Width must be a finite number');
  });

  it('rejects invalid optional quantities', () => {
    expect(() => calculateHowManyItemsFitTool({
      ...base,
      requestedQuantity: 1.5,
    })).toThrow('positive whole number');
    expect(() => calculateHowManyItemsFitTool({
      ...base,
      requestedQuantity: 0,
    })).toThrow('positive whole number');
  });

  it('rejects quantities outside safe integer range', () => {
    expect(() => calculateHowManyItemsFitTool({
      ...base,
      cartonLength: 10 ** 8,
      cartonWidth: 10 ** 8,
      cartonHeight: 10 ** 8,
      itemLength: 1,
      itemWidth: 1,
      itemHeight: 1,
    })).toThrow('Grid quantity is outside the supported numeric range.');
  });
});
