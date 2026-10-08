import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const baseLayoutSource = readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
  'utf8'
);

const toolsIndexSource = readFileSync(
  new URL('../pages/tools/index.astro', import.meta.url),
  'utf8'
);

const dimCalculatorSource = readFileSync(
  new URL(
    '../pages/tools/dimensional-weight-calculator.astro',
    import.meta.url
  ),
  'utf8'
);

const boxSizeCalculatorSource = readFileSync(
  new URL(
    '../pages/tools/box-size-calculator.astro',
    import.meta.url
  ),
  'utf8'
);

const utilizationCalculatorSource = readFileSync(
  new URL(
    '../pages/tools/box-utilization-calculator.astro',
    import.meta.url
  ),
  'utf8'
);

const sitemapSource = readFileSync(
  new URL('../pages/sitemap.xml.ts', import.meta.url),
  'utf8'
);

const normalizedBoxSizeCalculatorSource =
  boxSizeCalculatorSource.replace(/\s+/g, ' ');

const normalizedUtilizationCalculatorSource =
  utilizationCalculatorSource.replace(/\s+/g, ' ');

describe('Packmetry tools pages', () => {
  it('links the tools library from the shared footer', () => {
    expect(baseLayoutSource).toContain(
      'href="/tools/"'
    );

    expect(baseLayoutSource).toContain(
      'Tools'
    );
  });

  it('publishes a useful tools library with three real calculators', () => {
    expect(toolsIndexSource).toContain(
      'Packmetry Tools'
    );

    expect(toolsIndexSource).toContain(
      'Dimensional weight calculator'
    );

    expect(toolsIndexSource).toContain(
      '/tools/dimensional-weight-calculator/'
    );

    expect(toolsIndexSource).toContain(
      'Box size calculator'
    );

    expect(toolsIndexSource).toContain(
      '/tools/box-size-calculator/'
    );

    expect(toolsIndexSource).toContain(
      'Box utilization calculator'
    );

    expect(toolsIndexSource).toContain(
      '/tools/box-utilization-calculator/'
    );

    expect(toolsIndexSource).toContain(
      'thin keyword pages'
    );
  });

  it('publishes the dimensional-weight calculator as a real interactive tool', () => {
    expect(dimCalculatorSource).toContain(
      'import DimensionalWeightCalculator'
    );

    expect(dimCalculatorSource).toContain(
      '<DimensionalWeightCalculator client:load />'
    );

    expect(dimCalculatorSource).toContain(
      'Dimensional Weight Calculator — Packmetry'
    );

    expect(dimCalculatorSource).toContain(
      '/guides/dimensional-weight/'
    );

    expect(dimCalculatorSource).toContain(
      '/business/'
    );
  });

  it('keeps carrier-rate claims outside the DIM tool page', () => {
    expect(dimCalculatorSource).toContain(
      'DIM weight is not a shipping quote.'
    );

    expect(dimCalculatorSource).toContain(
      'does not apply carrier billing'
    );
  });

  it('publishes the box-size calculator as a real interactive tool', () => {
    expect(boxSizeCalculatorSource).toContain(
      'import BoxSizeCalculator'
    );

    expect(boxSizeCalculatorSource).toContain(
      '<BoxSizeCalculator client:load />'
    );

    expect(boxSizeCalculatorSource).toContain(
      'Box Size Calculator — Packmetry'
    );

    expect(boxSizeCalculatorSource).toContain(
      'A geometric minimum'
    );

    expect(boxSizeCalculatorSource).toContain(
      '/personal/'
    );

    expect(boxSizeCalculatorSource).toContain(
      '/business/'
    );
  });

  it('keeps single-item sizing boundaries explicit', () => {
    expect(normalizedBoxSizeCalculatorSource).toContain(
      'does not add a hidden padding'
    );

    expect(boxSizeCalculatorSource).toContain(
      'Multiple items need a packing plan.'
    );

    expect(boxSizeCalculatorSource).toContain(
      'internal box dimensions'
    );
  });

  it('publishes a real interactive box-utilization calculator', () => {
    expect(utilizationCalculatorSource).toContain(
      'import BoxUtilizationCalculator'
    );

    expect(utilizationCalculatorSource).toContain(
      '<BoxUtilizationCalculator client:load />'
    );

    expect(utilizationCalculatorSource).toContain(
      'Box Utilization Calculator — Packmetry'
    );

    expect(normalizedUtilizationCalculatorSource).toContain(
      '50% volume utilization'
    );
  });

  it('explains why volume calculations cannot certify packing fit', () => {
    expect(normalizedUtilizationCalculatorSource).toContain(
      'does not generate or verify a packing arrangement'
    );

    expect(normalizedUtilizationCalculatorSource).toContain(
      'Enough volume does not guarantee a fit.'
    );

    for (const path of [
      '/personal/',
      '/business/',
      '/methodology/packing-algorithm/',
      '/tools/box-size-calculator/',
    ]) {
      expect(utilizationCalculatorSource).toContain(path);
    }
  });

  it('includes all current tools routes in the sitemap', () => {
    for (const route of [
      "'/tools/'",
      "'/tools/dimensional-weight-calculator/'",
      "'/tools/box-size-calculator/'",
      "'/tools/box-utilization-calculator/'",
    ]) {
      expect(sitemapSource).toContain(route);
    }
  });
});
