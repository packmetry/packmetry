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

  it('explains what 3D bin packing means in Packmetry', () => {
    for (const value of [
      'rectangular item instances inside rectangular cartons',
      'without crossing carton boundaries or overlapping one another',
      'Placements are axis-aligned',
      'rotation policy',
    ]) {
      expect(
        normalizedPackingAlgorithmSource
      ).toContain(value);
    }
  });

  it('explains why multiple valid arrangements can exist', () => {
    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'more than one valid arrangement'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'which carton type is opened first'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'does not attempt to enumerate every mathematically possible arrangement'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'Item order and rotation-order diversity are not currently explored'
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

  it('documents what the optimizer prioritizes', () => {
    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'Coverage comes before optimization.'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'first maximizes placed item instances and then minimizes unplaced item instances'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'deterministic lexicographic metrics'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'does not collapse different units'
    );
  });

  it('documents canonical utilization calculation', () => {
    for (const value of [
      'item volume = Σ(length × width × height)',
      'carton volume - item volume',
      'item volume / carton volume',
      'If a plan uses zero cartons, overall utilization is defined as zero',
      'Utilization is a metric derived after verified placement',
    ]) {
      expect(
        normalizedPackingAlgorithmSource
      ).toContain(value);
    }
  });

  it('documents canonical construction and truthful 3D presentation', () => {
    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'converted into one canonical plan'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      '3D view is a comprehension layer, not another packing engine'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'renders those coordinates'
    );
  });

  it('documents dimensional-weight calculation and carrier boundaries', () => {
    for (const value of [
      'external package dimensions rather than the internal packing cavity',
      'divided by the explicit divisor',
      'converted to canonical grams',
      'does not apply carrier-billing rounding',
      'greater of the two',
      'does not turn that DIM result into live carrier pricing',
    ]) {
      expect(
        normalizedPackingAlgorithmSource
      ).toContain(value);
    }
  });

  it('documents current assumptions and constraint boundaries', () => {
    for (const value of [
      'canonical packing dimensions are represented in millimetres',
      'canonical mass is represented in grams',
      'internal carton dimensions govern packing geometry and utilization',
      'external carton dimensions govern carton DIM calculations',
      'unknown item or carton tare weight is not silently treated as zero',
      'Fragile handling, padding, spacing and stackability remain outside',
    ]) {
      expect(
        normalizedPackingAlgorithmSource
      ).toContain(value);
    }
  });

  it('preserves the no-global-optimum boundary', () => {
    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'not a guaranteed global mathematical optimum'
    );

    expect(
      normalizedPackingAlgorithmSource
    ).toContain(
      'no claim of guaranteed global optimality'
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
