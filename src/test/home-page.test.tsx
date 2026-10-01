import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const homePageSource = readFileSync(
  new URL('../pages/index.astro', import.meta.url),
  'utf8'
);

describe('home page', () => {
  it('uses the shared Packmetry shell and stylesheet', () => {
    expect(homePageSource).toContain(
      "import BaseLayout from '../layouts/BaseLayout.astro';"
    );

    expect(homePageSource).toContain(
      "import '../styles/packmetry-workspace.css';"
    );

    expect(homePageSource).toContain(
      '<BaseLayout>'
    );

    expect(homePageSource).toContain(
      '</BaseLayout>'
    );
  });

  it('classifies visitors between Personal and Business experiences', () => {
    expect(homePageSource).toContain(
      'Home &amp; Personal'
    );

    expect(homePageSource).toContain(
      'Business'
    );

    expect(homePageSource).toContain(
      'Choose your packing experience'
    );
  });

  it('links the Personal card to the dedicated personal route', () => {
    expect(homePageSource).toContain(
      'href="/personal/"'
    );

    expect(homePageSource).toContain(
      'Pack my items'
    );
  });

  it('links the Business card to the dedicated business route', () => {
    expect(homePageSource).toContain(
      'href="/business/"'
    );

    expect(homePageSource).toContain(
      'Optimize my packing'
    );
  });

  it('shows the browser-first trust line', () => {
    expect(homePageSource).toContain(
      'Free · No signup required · Runs in your browser'
    );
  });

  it('does not mount either packing workspace on the homepage', () => {
    expect(homePageSource).not.toContain(
      'PackingWorkspace'
    );

    expect(homePageSource).not.toContain(
      'BusinessWorkspace'
    );

    expect(homePageSource).not.toContain(
      'client:load'
    );
  });
});
