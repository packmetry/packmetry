import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PackingWorkspace from '../components/PackingWorkspace.js';

describe('PackingWorkspace personal calculate CTA', () => {
  it('renders the personal primary CTA copy', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace />
    );

    expect(html).toContain(
      'Find my packing plan'
    );
  });

  it('does not render the legacy Calculate packing CTA', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace />
    );

    expect(html).not.toContain(
      'Calculate packing'
    );
  });

  it('uses the same primary CTA in Have Boxes mode', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace
        initialMode="have-boxes"
      />
    );

    expect(html).toContain(
      'Find my packing plan'
    );
  });

  it('uses the same primary CTA in hybrid mode', () => {
    const html = renderToStaticMarkup(
      <PackingWorkspace
        initialMode="hybrid-boxes"
      />
    );

    expect(html).toContain(
      'Find my packing plan'
    );
  });
});