import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const baseLayoutSource = readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
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

describe('guide structured data', () => {
  it('allows pages to publish an article Open Graph type', () => {
    expect(normalizedBaseLayout).toContain(
      "ogType?: 'website' | 'article'"
    );

    expect(normalizedBaseLayout).toContain(
      "ogType = 'website'"
    );

    expect(normalizedBaseLayout).toContain(
      'property="og:type" content={ogType}'
    );
  });

  it('marks guide pages as Open Graph articles', () => {
    expect(normalizedGuideLayout).toContain(
      'ogType="article"'
    );
  });

  it('publishes Article JSON-LD for guide pages', () => {
    for (const value of [
      "'@type': 'Article'",
      "headline: title",
      "description",
      "articleSection: category",
      "inLanguage: 'en'",
      "isAccessibleForFree: true",
      "name: 'Packmetry'",
    ]) {
      expect(normalizedGuideLayout).toContain(value);
    }
  });

  it('publishes canonical article identity in structured data', () => {
    expect(normalizedGuideLayout).toContain(
      "'@id': `${articleUrl}#article`"
    );

    expect(normalizedGuideLayout).toContain(
      "'@type': 'WebPage'"
    );

    expect(normalizedGuideLayout).toContain(
      "'@id': articleUrl"
    );
  });

  it('publishes a Home to Guides breadcrumb trail', () => {
    expect(normalizedGuideLayout).toContain(
      "'@type': 'BreadcrumbList'"
    );

    expect(normalizedGuideLayout).toContain(
      "name: 'Home'"
    );

    expect(normalizedGuideLayout).toContain(
      "name: 'Guides'"
    );

    expect(normalizedGuideLayout).toContain(
      "position: 3"
    );

    expect(normalizedGuideLayout).toContain(
      "name: title"
    );
  });

  it('supports real publication dates without inventing defaults', () => {
    expect(normalizedGuideLayout).toContain(
      'publishedDate?: string'
    );

    expect(normalizedGuideLayout).toContain(
      'modifiedDate?: string'
    );

    expect(normalizedGuideLayout).toContain(
      'datePublished: publishedDate'
    );

    expect(normalizedGuideLayout).toContain(
      'dateModified: modifiedDate'
    );

    expect(normalizedGuideLayout).not.toContain(
      "publishedDate = '"
    );

    expect(normalizedGuideLayout).not.toContain(
      "modifiedDate = '"
    );
  });

  it('renders JSON-LD without exposing raw less-than characters', () => {
    expect(normalizedGuideLayout).toContain(
      'JSON.stringify(structuredData).replace'
    );

    expect(normalizedGuideLayout).toContain(
      "'\\\\u003c'"
    );

    expect(normalizedGuideLayout).toContain(
      'type="application/ld+json"'
    );

    expect(normalizedGuideLayout).toContain(
      'set:html={structuredDataJson}'
    );
  });
});
