import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const baseLayoutSource = readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
  'utf8'
);

const examplesIndexSource = readFileSync(
  new URL('../pages/examples/index.astro', import.meta.url),
  'utf8'
);

const mixedExampleSource = readFileSync(
  new URL(
    '../pages/examples/mixed-item-packing-example.astro',
    import.meta.url
  ),
  'utf8'
);

const benchmarkSource = readFileSync(
  new URL('./benchmarks/cases.ts', import.meta.url),
  'utf8'
);

const sitemapSource = readFileSync(
  new URL('../pages/sitemap.xml.ts', import.meta.url),
  'utf8'
);

const normalizedMixedExampleSource =
  mixedExampleSource.replace(/\s+/g, ' ');

describe('Packmetry examples pages', () => {
  it('links Examples from the shared footer', () => {
    expect(baseLayoutSource).toContain(
      'href="/examples/"'
    );

    expect(baseLayoutSource).toContain(
      'Examples'
    );
  });

  it('publishes an examples library with the mixed-item case', () => {
    expect(examplesIndexSource).toContain(
      'Packmetry Examples'
    );

    expect(examplesIndexSource).toContain(
      'One large item, five small items'
    );

    expect(examplesIndexSource).toContain(
      '/examples/mixed-item-packing-example/'
    );

    expect(examplesIndexSource).toContain(
      'not manufacture examples'
    );
  });

  it('bases the worked example on the locked repository benchmark', () => {
    expect(benchmarkSource).toContain(
      "id: 'highly-different-item-sizes'"
    );

    expect(benchmarkSource).toContain(
      "item('large', { length: 80, width: 80, height: 80 }, 1)"
    );

    expect(benchmarkSource).toContain(
      "item('small', { length: 20, width: 20, height: 20 }, 5)"
    );

    expect(benchmarkSource).toContain(
      "carton('box', { length: 100, width: 100, height: 100 })"
    );

    expect(benchmarkSource).toContain(
      "status: 'feasible'"
    );
  });

  it('publishes the locked expected outcome and canonical utilization math', () => {
    for (const value of [
      'highly-different-item-sizes',
      'Cartons used',
      'Items placed',
      'Items unplaced',
      '552,000 mm³',
      '448,000 mm³',
      '55.2%',
    ]) {
      expect(
        normalizedMixedExampleSource
      ).toContain(value);
    }
  });

  it('keeps geometry, weight, DIM and optimality boundaries truthful', () => {
    for (const value of [
      'Volume is useful, but geometry still decides whether the plan is valid.',
      'cannot prove that a collection of three-dimensional items can be placed',
      'does not supply item weights',
      'does not turn the baseline heuristic into an exhaustive proof of mathematical optimality',
    ]) {
      expect(
        normalizedMixedExampleSource
      ).toContain(value);
    }
  });

  it('links the worked example to methodology and both workspaces', () => {
    for (const href of [
      '/methodology/packing-algorithm/',
      '/personal/',
      '/business/',
    ]) {
      expect(
        mixedExampleSource
      ).toContain(href);
    }
  });

  it('includes both examples routes in the sitemap', () => {
    expect(sitemapSource).toContain(
      "'/examples/'"
    );

    expect(sitemapSource).toContain(
      "'/examples/mixed-item-packing-example/'"
    );
  });
});
