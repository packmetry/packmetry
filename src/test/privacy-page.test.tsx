import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const privacyPageSource = readFileSync(
  new URL('../pages/privacy.astro', import.meta.url),
  'utf8'
);

const baseLayoutSource = readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
  'utf8'
);

const normalizedPrivacyPageSource =
  privacyPageSource.replace(/\s+/g, ' ');

describe('privacy page', () => {
  it('uses the shared Packmetry shell', () => {
    expect(privacyPageSource).toContain(
      "import BaseLayout from '../layouts/BaseLayout.astro';"
    );

    expect(privacyPageSource).toContain(
      "import '../styles/packmetry-workspace.css';"
    );

    expect(privacyPageSource).toContain(
      '<BaseLayout'
    );

    expect(privacyPageSource).toContain(
      '</BaseLayout>'
    );
  });

  it('describes the current browser-local storage model', () => {
    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'IndexedDB'
    );

    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'localStorage'
    );

    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'recent Personal items'
    );

    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'saved Business cartons'
    );
  });

  it('documents email contact without inventing other contact methods', () => {
    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'packmetry@gmail.com'
    );

    expect(privacyPageSource).not.toContain(
      'tel:'
    );

    expect(privacyPageSource).not.toContain(
      'Instagram'
    );

    expect(privacyPageSource).not.toContain(
      'LinkedIn'
    );
  });

  it('states the current analytics and advertising boundary', () => {
    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'does not include advertising trackers'
    );

    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'analytics trackers'
    );

    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'application-set advertising cookies'
    );
  });

  it('covers browser control and future product changes', () => {
    expect(
      normalizedPrivacyPageSource
    ).toContain(
      "browser's site"
    );

    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'accounts, cloud'
    );

    expect(
      normalizedPrivacyPageSource
    ).toContain(
      'integrations, APIs, analytics'
    );
  });

  it('exposes Privacy from the footer navigation', () => {
    expect(baseLayoutSource).toContain(
      'href="/privacy/"'
    );

    expect(baseLayoutSource).toContain(
      'Privacy'
    );
  });
});
