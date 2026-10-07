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

const sitemapSource = readFileSync(
  new URL('../pages/sitemap.xml.ts', import.meta.url),
  'utf8'
);

describe('Packmetry tools pages', () => {
  it('links the tools library from the shared footer', () => {
    expect(baseLayoutSource).toContain(
      'href="/tools/"'
    );

    expect(baseLayoutSource).toContain(
      'Tools'
    );
  });

  it('publishes a useful tools library with the DIM calculator', () => {
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

  it('keeps carrier-rate claims outside the tool page', () => {
    expect(dimCalculatorSource).toContain(
      'DIM weight is not a shipping quote.'
    );

    expect(dimCalculatorSource).toContain(
      'does not apply carrier billing'
    );
  });

  it('includes both tools routes in the sitemap', () => {
    expect(sitemapSource).toContain(
      "'/tools/'"
    );

    expect(sitemapSource).toContain(
      "'/tools/dimensional-weight-calculator/'"
    );
  });
});
