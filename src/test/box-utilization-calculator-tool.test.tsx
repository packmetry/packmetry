import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BoxUtilizationCalculator, {
  calculateBoxUtilizationTool,
  type BoxUtilizationToolInput,
} from '../components/BoxUtilizationCalculator.js';

const basicInput: BoxUtilizationToolInput = {
  cartonLength: 30,
  cartonWidth: 20,
  cartonHeight: 10,
  itemLength: 10,
  itemWidth: 10,
  itemHeight: 5,
  quantity: 6,
  unit: 'cm',
};

describe('BoxUtilizationCalculator', () => {
  it('renders a volume-only calculator and its verification boundary', () => {
    const html = renderToStaticMarkup(
      <BoxUtilizationCalculator />
    );

    expect(html).toContain('Calculate carton volume utilization');
    expect(html).toContain('Carton internal dimensions');
    expect(html).toContain('Identical items');
    expect(html).toContain('Quantity');
    expect(html).toContain('No geometric fit has been verified.');
  });

  it('calculates utilization and remaining volume from canonical dimensions', () => {
    const result = calculateBoxUtilizationTool(basicInput);

    expect(result.cartonVolumeMm3).toBe(6_000_000);
    expect(result.requestedItemVolumeMm3).toBe(3_000_000);
    expect(result.cartonVolume).toBe(6000);
    expect(result.requestedItemVolume).toBe(3000);
    expect(result.remainingVolume).toBe(3000);
    expect(result.excessVolume).toBe(0);
    expect(result.utilizationPercent).toBe(50);
    expect(result.volumeExceedsCapacity).toBe(false);
    expect(result.unit).toBe('cm');
  });

  it('reports exact volume equality without inventing empty volume', () => {
    const result = calculateBoxUtilizationTool({
      cartonLength: 10,
      cartonWidth: 10,
      cartonHeight: 10,
      itemLength: 5,
      itemWidth: 10,
      itemHeight: 10,
      quantity: 2,
      unit: 'cm',
    });

    expect(result.utilizationPercent).toBe(100);
    expect(result.remainingVolume).toBe(0);
    expect(result.excessVolume).toBe(0);
    expect(result.volumeExceedsCapacity).toBe(false);
  });

  it('reports volume overcapacity rather than negative remaining volume', () => {
    const result = calculateBoxUtilizationTool({
      cartonLength: 10,
      cartonWidth: 10,
      cartonHeight: 10,
      itemLength: 10,
      itemWidth: 10,
      itemHeight: 10,
      quantity: 2,
      unit: 'cm',
    });

    expect(result.utilizationPercent).toBe(200);
    expect(result.remainingVolume).toBe(0);
    expect(result.excessVolume).toBe(1000);
    expect(result.volumeExceedsCapacity).toBe(true);
  });

  it('preserves unit conversion for inches as well as millimetres', () => {
    const result = calculateBoxUtilizationTool({
      cartonLength: 10,
      cartonWidth: 10,
      cartonHeight: 10,
      itemLength: 5,
      itemWidth: 5,
      itemHeight: 5,
      quantity: 1,
      unit: 'in',
    });

    expect(result.cartonVolume).toBeCloseTo(1000);
    expect(result.requestedItemVolume).toBeCloseTo(125);
    expect(result.remainingVolume).toBeCloseTo(875);
    expect(result.utilizationPercent).toBeCloseTo(12.5);
  });

  it('rejects zero, fractional and unsafe item quantities', () => {
    for (const quantity of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() =>
        calculateBoxUtilizationTool({
          ...basicInput,
          quantity,
        })
      ).toThrow('Quantity must be a positive whole number.');
    }
  });

  it('rejects invalid item and carton dimensions', () => {
    expect(() =>
      calculateBoxUtilizationTool({
        ...basicInput,
        itemLength: 0,
      })
    ).toThrow('Length must be greater than zero');

    expect(() =>
      calculateBoxUtilizationTool({
        ...basicInput,
        cartonHeight: -2,
      })
    ).toThrow('Height must be greater than zero');

    expect(() =>
      calculateBoxUtilizationTool({
        ...basicInput,
        cartonLength: Number.POSITIVE_INFINITY,
      })
    ).toThrow('Length must be a finite number');
  });

  it('rejects quantities that overflow the supported numeric volume range', () => {
    expect(() =>
      calculateBoxUtilizationTool({
        ...basicInput,
        itemLength: 1e200,
        itemWidth: 1e200,
        itemHeight: 1e200,
      })
    ).toThrow();
  });
});
