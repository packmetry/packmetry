import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const contactPageSource = readFileSync(
  new URL('../pages/contact.astro', import.meta.url),
  'utf8'
);

const baseLayoutSource = readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
  'utf8'
);

describe('contact page', () => {
  it('uses the shared Packmetry shell', () => {
    expect(contactPageSource).toContain(
      "import BaseLayout from '../layouts/BaseLayout.astro';"
    );

    expect(contactPageSource).toContain(
      "import '../styles/packmetry-workspace.css';"
    );

    expect(contactPageSource).toContain(
      '<BaseLayout'
    );

    expect(contactPageSource).toContain(
      '</BaseLayout>'
    );
  });

  it('publishes the Packmetry contact email', () => {
    expect(contactPageSource).toContain(
      'packmetry@gmail.com'
    );

    expect(contactPageSource).toContain(
      'mailto:packmetry@gmail.com'
    );
  });

  it('keeps contact methods limited to email', () => {
    expect(contactPageSource).not.toContain(
      'tel:'
    );

    expect(contactPageSource).not.toContain(
      'Instagram'
    );

    expect(contactPageSource).not.toContain(
      'LinkedIn'
    );

    expect(contactPageSource).not.toContain(
      'Twitter'
    );

    expect(contactPageSource).not.toContain(
      'X.com'
    );
  });

  it('explains useful reasons to contact Packmetry', () => {
    expect(contactPageSource).toContain(
      'Product questions'
    );

    expect(contactPageSource).toContain(
      'Feedback &amp; bug reports'
    );

    expect(contactPageSource).toContain(
      'Business inquiries'
    );
  });

  it('exposes Contact from the footer navigation', () => {
    expect(baseLayoutSource).toContain(
      'href="/contact/"'
    );

    expect(baseLayoutSource).toContain(
      'Contact'
    );
  });
});
