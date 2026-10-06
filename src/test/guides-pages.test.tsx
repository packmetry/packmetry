import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const baseLayoutSource = readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
  'utf8'
);

const guidesPageSource = readFileSync(
  new URL('../pages/guides/index.astro', import.meta.url),
  'utf8'
);

const choosingBoxSource = readFileSync(
  new URL(
    '../pages/guides/choosing-a-box.astro',
    import.meta.url
  ),
  'utf8'
);

const existingBoxesSource = readFileSync(
  new URL(
    '../pages/guides/packing-with-existing-boxes.astro',
    import.meta.url
  ),
  'utf8'
);

const dimWeightSource = readFileSync(
  new URL(
    '../pages/guides/dimensional-weight.astro',
    import.meta.url
  ),
  'utf8'
);

const normalizedChoosingBoxSource =
  choosingBoxSource.replace(/\s+/g, ' ');

describe('guides pages', () => {
  it('exposes Guides from the shared site navigation', () => {
    expect(baseLayoutSource).toContain(
      'href="/guides/"'
    );

    expect(baseLayoutSource).toContain(
      "isCurrent('/guides/')"
    );
  });

  it('renders a dedicated guide library page', () => {
    expect(guidesPageSource).toContain(
      "import BaseLayout from '../../layouts/BaseLayout.astro';"
    );

    expect(guidesPageSource).toContain(
      'Packmetry Guides'
    );

    expect(guidesPageSource).toContain(
      'Packing decisions,'
    );

    expect(guidesPageSource).toContain(
      'Guide library'
    );
  });

  it('publishes three starter guide links', () => {
    expect(guidesPageSource).toContain(
      '/guides/choosing-a-box/'
    );

    expect(guidesPageSource).toContain(
      '/guides/packing-with-existing-boxes/'
    );

    expect(guidesPageSource).toContain(
      '/guides/dimensional-weight/'
    );
  });

  it('publishes a box-selection guide', () => {
    expect(choosingBoxSource).toContain(
      'Choosing a box without wasting space'
    );

    expect(
      normalizedChoosingBoxSource
    ).toContain(
      'internal carton dimensions'
    );

    expect(
      normalizedChoosingBoxSource
    ).toContain(
      'canonical verified placement plan'
    );
  });

  it('publishes an existing-inventory guide', () => {
    expect(existingBoxesSource).toContain(
      'Packing with boxes you already have'
    );

    expect(existingBoxesSource).toContain(
      'available quantity'
    );

    expect(existingBoxesSource).toContain(
      'Hybrid'
    );
  });

  it('publishes a DIM-weight guide without carrier presets', () => {
    expect(dimWeightSource).toContain(
      'DIM weight without the carrier guesswork'
    );

    expect(dimWeightSource).toContain(
      'external dimensions'
    );

    expect(dimWeightSource).toContain(
      'does not assume a universal DIM divisor'
    );

    expect(dimWeightSource).not.toContain(
      '139'
    );

    expect(dimWeightSource).not.toContain(
      '166'
    );

    expect(dimWeightSource).not.toContain(
      '5000'
    );
  });
});
