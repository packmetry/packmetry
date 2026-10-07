import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const astroConfigSource = readFileSync(
  new URL('../../astro.config.mjs', import.meta.url),
  'utf8'
);

const baseLayoutSource = readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
  'utf8'
);

const robotsSource = readFileSync(
  new URL('../pages/robots.txt.ts', import.meta.url),
  'utf8'
);

const sitemapSource = readFileSync(
  new URL('../pages/sitemap.xml.ts', import.meta.url),
  'utf8'
);

const normalizedBaseLayout =
  baseLayoutSource.replace(/\s+/g, ' ');

describe('technical SEO foundation', () => {
  it('defines the production Packmetry site URL', () => {
    expect(astroConfigSource).toContain(
      "site: 'https://packmetry.com'"
    );
  });

  it('publishes canonical URLs from the shared layout', () => {
    expect(normalizedBaseLayout).toContain(
      'rel="canonical"'
    );

    expect(normalizedBaseLayout).toContain(
      'Astro.site'
    );

    expect(normalizedBaseLayout).toContain(
      "'https://packmetry.com'"
    );
  });

  it('publishes indexable robots metadata', () => {
    expect(normalizedBaseLayout).toContain(
      'name="robots"'
    );

    expect(normalizedBaseLayout).toContain(
      'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    );
  });

  it('publishes Open Graph and Twitter metadata', () => {
    for (const value of [
      'property="og:site_name"',
      'property="og:type"',
      'property="og:title"',
      'property="og:description"',
      'property="og:url"',
      'name="twitter:card"',
      'name="twitter:title"',
      'name="twitter:description"',
    ]) {
      expect(normalizedBaseLayout).toContain(value);
    }
  });

  it('links the sitemap from the shared document head', () => {
    expect(normalizedBaseLayout).toContain(
      'rel="sitemap"'
    );

    expect(normalizedBaseLayout).toContain(
      'href="/sitemap.xml"'
    );
  });

  it('allows crawling and points robots.txt at the sitemap', () => {
    expect(robotsSource).toContain(
      "'User-agent: *'"
    );

    expect(robotsSource).toContain(
      "'Allow: /'"
    );

    expect(robotsSource).toContain(
      "new URL('/sitemap.xml', baseUrl)"
    );
  });

  it('includes every current public HTML route in the sitemap', () => {
    for (const route of [
      "'/'",
      "'/personal/'",
      "'/business/'",
      "'/tools/'",
      "'/tools/dimensional-weight-calculator/'",
      "'/methodology/'",
      "'/methodology/packing-algorithm/'",
      "'/guides/'",
      "'/guides/choosing-a-box/'",
      "'/guides/packing-with-existing-boxes/'",
      "'/guides/dimensional-weight/'",
      "'/contact/'",
      "'/privacy/'",
    ]) {
      expect(sitemapSource).toContain(route);
    }
  });

  it('does not invent sitemap last-modified dates', () => {
    expect(sitemapSource).not.toContain(
      '<lastmod>'
    );
  });
});