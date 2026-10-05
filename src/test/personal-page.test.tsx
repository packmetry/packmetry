import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const personalPageSource = readFileSync(
  new URL('../pages/personal.astro', import.meta.url),
  'utf8'
);

describe('personal page', () => {
  it('uses the shared Packmetry base layout', () => {
    expect(
      personalPageSource
    ).toContain(
      "import BaseLayout from '../layouts/BaseLayout.astro';"
    );

    expect(
      personalPageSource
    ).toContain(
      '<BaseLayout'
    );

    expect(
      personalPageSource
    ).toContain(
      '</BaseLayout>'
    );
  });

  it('loads the existing Personal PackingWorkspace as a client island', () => {
    expect(
      personalPageSource
    ).toContain(
      "import PackingWorkspace from '../components/PackingWorkspace';"
    );

    expect(
      personalPageSource
    ).toContain(
      '<PackingWorkspace client:load />'
    );
  });

  it('reuses the shared workspace stylesheet', () => {
    expect(
      personalPageSource
    ).toContain(
      "import '../styles/packmetry-workspace.css';"
    );
  });

  it('does not render BusinessWorkspace on the personal route', () => {
    expect(
      personalPageSource
    ).not.toContain(
      'BusinessWorkspace'
    );
  });
});