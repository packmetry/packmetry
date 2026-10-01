import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const businessPageSource = readFileSync(
  new URL('../pages/business.astro', import.meta.url),
  'utf8'
);

describe('business page', () => {
  it('uses the shared Packmetry base layout', () => {
    expect(businessPageSource).toContain(
      "import BaseLayout from '../layouts/BaseLayout.astro';"
    );

    expect(businessPageSource).toContain(
      '<BaseLayout>'
    );

    expect(businessPageSource).toContain(
      '</BaseLayout>'
    );
  });

  it('loads the dedicated BusinessWorkspace as a client island', () => {
    expect(businessPageSource).toContain(
      "import BusinessWorkspace from '../components/BusinessWorkspace';"
    );

    expect(businessPageSource).toContain(
      '<BusinessWorkspace client:load />'
    );
  });

  it('reuses the shared workspace stylesheet', () => {
    expect(businessPageSource).toContain(
      "import '../styles/packmetry-workspace.css';"
    );
  });

  it('does not render the Personal PackingWorkspace on the business route', () => {
    expect(businessPageSource).not.toContain(
      'PackingWorkspace'
    );
  });
});
