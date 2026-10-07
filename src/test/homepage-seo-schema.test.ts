import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const baseLayoutSource = readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
  'utf8'
);

const indexSource = readFileSync(
  new URL('../pages/index.astro', import.meta.url),
  'utf8'
);

const personalSource = readFileSync(
  new URL('../pages/personal.astro', import.meta.url),
  'utf8'
);

const businessSource = readFileSync(
  new URL('../pages/business.astro', import.meta.url),
  'utf8'
);

const guidesSource = readFileSync(
  new URL('../pages/guides/index.astro', import.meta.url),
  'utf8'
);

const contactSource = readFileSync(
  new URL('../pages/contact.astro', import.meta.url),
  'utf8'
);

const privacySource = readFileSync(
  new URL('../pages/privacy.astro', import.meta.url),
  'utf8'
);

const guideLayoutSource = readFileSync(
  new URL('../layouts/GuideArticleLayout.astro', import.meta.url),
  'utf8'
);

const normalizedBaseLayout =
  baseLayoutSource.replace(/\s+/g, ' ');

const normalizedGuideLayout =
  guideLayoutSource.replace(/\s+/g, ' ');

describe('homepage organization and website SEO', () => {
  it('publishes Organization structured data for Packmetry', () => {
    for (const value of [
      "'@type': 'Organization'",
      "name: 'Packmetry'",
      "email: 'packmetry@gmail.com'",
      "'@id': `${siteUrl}#organization`",
    ]) {
      expect(normalizedBaseLayout).toContain(value);
    }
  });

  it('publishes WebSite structured data linked to the organization', () => {
    for (const value of [
      "'@type': 'WebSite'",
      "'@id': `${siteUrl}#website`",
      "publisher:",
      "'@id': `${siteUrl}#organization`",
      "inLanguage: 'en'",
    ]) {
      expect(normalizedBaseLayout).toContain(value);
    }
  });

  it('limits homepage organization and website JSON-LD to the homepage', () => {
    expect(normalizedBaseLayout).toContain(
      "const isHomePage = pathname === '/'"
    );

    expect(normalizedBaseLayout).toContain(
      'isHomePage &&'
    );

    expect(normalizedBaseLayout).toContain(
      'type="application/ld+json"'
    );

    expect(normalizedBaseLayout).toContain(
      'set:html={homeStructuredDataJson}'
    );
  });

  it('does not invent unsupported site-search or social profile data', () => {
    expect(baseLayoutSource).not.toContain(
      'SearchAction'
    );

    expect(baseLayoutSource).not.toContain(
      'sameAs'
    );

    expect(baseLayoutSource).not.toContain(
      'telephone'
    );
  });

  it('keeps distinct metadata for the main public page types', () => {
    const pages = [
      indexSource,
      personalSource,
      businessSource,
      guidesSource,
      contactSource,
      privacySource,
    ];

    const titles = pages.map(source => {
      const match = source.match(
        /title="([^"]+)"/
      );

      expect(match).not.toBeNull();
      return match?.[1];
    });

    const descriptions = pages.map(source => {
      const match = source.match(
        /description="([^"]+)"/
      );

      expect(match).not.toBeNull();
      return match?.[1];
    });

    expect(new Set(titles).size).toBe(
      pages.length
    );

    expect(new Set(descriptions).size).toBe(
      pages.length
    );
  });

  it('keeps guide-detail metadata page-specific through the shared layout', () => {
    expect(normalizedGuideLayout).toContain(
      'title={`${title} — Packmetry Guides`}'
    );

    expect(normalizedGuideLayout).toContain(
      'description={description}'
    );

    expect(normalizedGuideLayout).toContain(
      'ogType="article"'
    );
  });
});
