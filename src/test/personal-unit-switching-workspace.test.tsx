import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace, {
  workspaceLengthToCanonical,
  workspaceLengthToDisplay,
  workspaceWeightToCanonical,
  workspaceWeightToDisplay,
} from '../components/PackingWorkspace.js';

describe('PackingWorkspace personal unit switching', () => {
  it('renders metric and imperial unit choices', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace />
    );

    expect(html).toContain(
      'aria-label="Unit system"'
    );

    expect(html).toContain('Metric');
    expect(html).toContain('Imperial');
  });

  it('keeps the current metric workspace compatible with millimeters and grams', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace />
    );

    expect(html).toContain(
      'Length (mm)'
    );

    expect(html).toContain(
      'Weight per item (g) (optional)'
    );

    expect(html).toContain(
      'placeholder="e.g. 500"'
    );
  });

  it('renders imperial input labels when imperial is selected initially', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace
        initialUnitSystem="imperial"
      />
    );

    expect(html).toContain(
      'Length (in)'
    );

    expect(html).toContain(
      'Width (in)'
    );

    expect(html).toContain(
      'Height (in)'
    );

    expect(html).toContain(
      'Weight per item (oz) (optional)'
    );

    expect(html).toContain(
      'placeholder="e.g. 16"'
    );
  });

  it('converts canonical millimeters to inches and back', () => {
    expect(
      workspaceLengthToDisplay(
        25.4,
        'imperial'
      )
    ).toBeCloseTo(1);

    expect(
      workspaceLengthToCanonical(
        1,
        'imperial'
      )
    ).toBeCloseTo(25.4);
  });

  it('converts canonical grams to ounces and back', () => {
    expect(
      workspaceWeightToDisplay(
        28.349523125,
        'imperial'
      )
    ).toBeCloseTo(1);

    expect(
      workspaceWeightToCanonical(
        1,
        'imperial'
      )
    ).toBeCloseTo(
      28.349523125
    );
  });

  it('leaves canonical values unchanged in metric mode', () => {
    expect(
      workspaceLengthToDisplay(
        80,
        'metric'
      )
    ).toBe(80);

    expect(
      workspaceLengthToCanonical(
        80,
        'metric'
      )
    ).toBe(80);

    expect(
      workspaceWeightToDisplay(
        500,
        'metric'
      )
    ).toBe(500);

    expect(
      workspaceWeightToCanonical(
        500,
        'metric'
      )
    ).toBe(500);
  });
});