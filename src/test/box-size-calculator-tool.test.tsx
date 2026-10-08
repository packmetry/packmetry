import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BoxSizeCalculator, {
  calculateBoxSizeTool,
} from '../components/BoxSizeCalculator.js';

describe('BoxSizeCalculator', () => {
  it('renders a single-item geometry calculator with truthful boundaries', () => {
    const html =
      renderToStaticMarkup(
        <BoxSizeCalculator />
      );

    expect(html).toContain(
      'Size a box for one rectangular item'
    );

    expect(html).toContain(
      'Rotation policy'
    );

    expect(html).toContain(
      'Optional box check'
    );

    expect(html).toContain(
      'No padding, void fill or manufacturing tolerance is added automatically.'
    );
  });

  it('returns one minimum profile for fixed orientation', () => {
    const result =
      calculateBoxSizeTool({
        length: 120,
        width: 80,
        height: 40,
        unit: 'mm',
        rotationPolicy: 'fixed',
      });

    expect(
      result.orientations
    ).toHaveLength(1);

    expect(
      result.orientations[0]
        ?.rotation
    ).toBe('LWH');

    expect(
      result.orientations[0]
        ?.dimensions
    ).toEqual({
      length: 120,
      width: 80,
      height: 40,
    });
  });

  it('returns all distinct axis-aligned profiles when unrestricted rotation is allowed', () => {
    const result =
      calculateBoxSizeTool({
        length: 120,
        width: 80,
        height: 40,
        unit: 'mm',
        rotationPolicy: 'any',
      });

    expect(
      result.orientations
    ).toHaveLength(6);

    expect(
      result.orientations.map(
        orientation =>
          orientation.rotation
      )
    ).toEqual([
      'LWH',
      'WLH',
      'LHW',
      'HLW',
      'WHL',
      'HWL',
    ]);
  });

  it('keeps original height vertical for upright sizing', () => {
    const result =
      calculateBoxSizeTool({
        length: 120,
        width: 80,
        height: 40,
        unit: 'mm',
        rotationPolicy: 'upright',
      });

    expect(
      result.orientations
    ).toHaveLength(2);

    for (
      const orientation of
        result.orientations
    ) {
      expect(
        orientation.dimensions.height
      ).toBe(40);
    }
  });

  it('deduplicates equivalent profiles for equal item axes', () => {
    const result =
      calculateBoxSizeTool({
        length: 100,
        width: 100,
        height: 50,
        unit: 'mm',
        rotationPolicy: 'any',
      });

    expect(
      result.orientations
    ).toHaveLength(3);
  });

  it('checks an available internal box against allowed rotations', () => {
    const fixed =
      calculateBoxSizeTool({
        length: 120,
        width: 80,
        height: 40,
        unit: 'mm',
        rotationPolicy: 'fixed',
        availableBox: {
          length: 80,
          width: 120,
          height: 40,
        },
      });

    expect(
      fixed.availableBoxCheck
        ?.fits
    ).toBe(false);

    const rotatable =
      calculateBoxSizeTool({
        length: 120,
        width: 80,
        height: 40,
        unit: 'mm',
        rotationPolicy: 'any',
        availableBox: {
          length: 80,
          width: 120,
          height: 40,
        },
      });

    expect(
      rotatable.availableBoxCheck
        ?.fits
    ).toBe(true);

    expect(
      rotatable.availableBoxCheck
        ?.matchingRotation
    ).toBe('WLH');
  });

  it('uses canonical unit conversion for item and box dimensions', () => {
    const result =
      calculateBoxSizeTool({
        length: 12,
        width: 8,
        height: 4,
        unit: 'cm',
        rotationPolicy: 'fixed',
        availableBox: {
          length: 12,
          width: 8,
          height: 4,
        },
      });

    expect(
      result.orientations[0]
        ?.dimensionsMm
    ).toEqual({
      length: 120,
      width: 80,
      height: 40,
    });

    expect(
      result.availableBoxCheck
        ?.fits
    ).toBe(true);
  });

  it('rejects non-positive item dimensions through canonical validation', () => {
    expect(() =>
      calculateBoxSizeTool({
        length: 0,
        width: 80,
        height: 40,
        unit: 'mm',
        rotationPolicy: 'any',
      })
    ).toThrow(
      'Length must be greater than zero'
    );
  });
});
