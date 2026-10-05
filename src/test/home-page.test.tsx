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
      '<BaseLayout'
    );

    expect(homePageSource).toContain(
      '</BaseLayout>'
    );
  });

  it('presents Packmetry as a browser-first packing workbench', () => {
    expect(homePageSource).toContain(
      'Browser-first packing workbench'
    );

    expect(homePageSource).toContain(
      'Find the right way'
    );

    expect(homePageSource).toContain(
      'to pack it.'
    );
  });

  it('classifies visitors between Personal and Business experiences', () => {
    expect(homePageSource).toContain(
      'Choose your packing experience'
    );

    expect(homePageSource).toContain(
      'Home &amp; Personal'
    );

    expect(homePageSource).toContain(
      'Business'
    );

    expect(homePageSource).toContain(
      'One packing engine.'
    );

    expect(homePageSource).toContain(
      'Two ways to work.'
    );
  });

  it('links the Personal experience to the dedicated personal route', () => {
    expect(homePageSource).toContain(
      'href="/personal/"'
    );

    expect(homePageSource).toContain(
      'Pack my items'
    );
  });

  it('links the Business experience to the dedicated business route', () => {
    expect(homePageSource).toContain(
      'href="/business/"'
    );

    expect(homePageSource).toContain(
      'Business workspace'
    );

    expect(homePageSource).toContain(
      'Optimize my packing'
    );
  });

  it('shows the browser-first trust message without relying on one source-line string', () => {
    expect(homePageSource).toContain(
      'Free'
    );

    expect(homePageSource).toContain(
      'No signup required'
    );

    expect(homePageSource).toContain(
      'Runs in your browser'
    );
  });

  it('describes the three real box-availability situations without a numbered process section', () => {
    expect(homePageSource).toContain(
      'find boxes to buy'
    );

    expect(homePageSource).toContain(
      'pack into existing boxes'
    );

    expect(homePageSource).toContain(
      'use existing stock and cover the remainder'
    );

    expect(homePageSource).not.toContain(
      'How It Works'
    );

    expect(homePageSource).not.toContain(
      'Step 1'
    );

    expect(homePageSource).not.toContain(
      'Step 2'
    );

    expect(homePageSource).not.toContain(
      'Step 3'
    );
  });

  it('keeps homepage claims aligned with implemented Packmetry capabilities', () => {
    expect(homePageSource).toContain(
      'Carton inventory'
    );

    expect(homePageSource).toContain(
      'Objective ranking'
    );

    expect(homePageSource).toContain(
      'DIM analysis'
    );

    expect(homePageSource).toContain(
      'independently'
    );

    expect(homePageSource).toContain(
      'verified'
    );

    expect(homePageSource).not.toContain(
      'FedEx'
    );

    expect(homePageSource).not.toContain(
      'UPS'
    );

    expect(homePageSource).not.toContain(
      'DHL'
    );

    expect(homePageSource).not.toContain(
      '139'
    );

    expect(homePageSource).not.toContain(
      '166'
    );

    expect(homePageSource).not.toContain(
      '5000'
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