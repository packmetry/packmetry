import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const baseLayoutSource = readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
  'utf8'
);

const methodologyIndexSource = readFileSync(
  new URL('../pages/methodology/index.astro', import.meta.url),
  'utf8'
);

const packingAlgorithmSource = readFileSync(
  new URL(
    '../pages/methodology/packing-algorithm.astro',
    import.meta.url
  ),
  'utf8'
);

const sitemapSource = readFileSync(
  new URL('../pages/sitemap.xml.ts', import.meta.url),
  'utf8'
);

const normalizedPackingAlgorithmSource =
  packingAlgorithmSource.replace(/\s+/g, ' ');

describe('Packmetry methodology pages', () => {
  it('links Methodology from the shared footer', () => {
    expect(baseLayoutSource).toContain(
      'href="/methodology/"'
    );

    expect(baseLayoutSource).toContain(
      'Methodology'
    );
  });

  it('publishes a methodology library with the packing algorithm page', () => {
    expect(methodologyIndexSource).toContain(
      'Packmetry Methodology'
    );

    expect(methodologyIndexSource).toContain(
      'Packing algorithm and verification'
    );

    expect(methodologyIndexSource).toContain(
      '/methodology/packing-algorithm/'
    );

    expect(methodologyIndexSource).toContain(
      'thin search-traffic pages'
    );
  });

  it('documents the deterministic bounded baseline candidate strategies', () => {
    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'smallest internal carton volume first'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'largest internal carton volume first'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'between one and three candidates'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'not exhaustive 3D bin-packing enumeration'
    );
  });

  it('documents independent verification as the trust boundary', () => {
    for (const value of [
      'untrusted claim',
      'placements stay inside carton internal boundaries',
      'placements do not overlap',
      'known gross-weight limits',
      'carton inventory limits',
    ]) {
      expect(
        normalizedPackingAlgorithmSource
      ).toContain(value);
    }
  });

  it('documents coverage-first objective ranking and canonical construction', () => {
    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'Coverage comes before optimization.'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'greatest number of requested item instances'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'converted into one canonical plan'
    );
  });

  it('documents truthful 3D, DIM and optimality boundaries', () => {
    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      '3D view is a comprehension layer, not another packing engine'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'DIM calculations use external package dimensions'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'no claim of guaranteed global optimality'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'does not turn that DIM result into live carrier pricing'
    );
  });

  it('links methodology to real Packmetry product and support surfaces', () => {
    for (const href of [
      '/personal/',
      '/business/',
      '/tools/dimensional-weight-calculator/',
      '/guides/dimensional-weight/',
    ]) {
      expect(
        packingAlgorithmSource
      ).toContain(href);
    }
  });

  it('includes both methodology routes in the sitemap', () => {
    expect(sitemapSource).toContain(
      "'/methodology/'"
    );

    expect(sitemapSource).toContain(
      "'/methodology/packing-algorithm/'"
    );
  });
});
