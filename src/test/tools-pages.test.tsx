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

const sitemapSource = readFileSync(
  new URL('../pages/sitemap.xml.ts', import.meta.url),
  'utf8'
);

const normalizedBoxSizeCalculatorSource =
  boxSizeCalculatorSource.replace(/\s+/g, ' ');

describe('Packmetry tools pages', () => {
  it('links the tools library from the shared footer', () => {
    expect(baseLayoutSource).toContain(
      'href="/tools/"'
    );

    expect(baseLayoutSource).toContain(
      'Tools'
    );
  });

  it('publishes a useful tools library with both real calculators', () => {
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
      'thin keyword pages'
    );
  });

  it('publishes the dimensional-weight calculator as a real interactive tool', () => {
    expect(dimCalculatorSource).toContain(
      "import DimensionalWeightCalculator"
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
      "import BoxSizeCalculator"
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

  it('includes all current tools routes in the sitemap', () => {
    expect(sitemapSource).toContain(
      "'/tools/'"
    );

    expect(sitemapSource).toContain(
      "'/tools/dimensional-weight-calculator/'"
    );

    expect(sitemapSource).toContain(
      "'/tools/box-size-calculator/'"
    );
  });
});
