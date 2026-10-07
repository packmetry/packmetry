import type { APIRoute } from 'astro';

const INDEXABLE_ROUTES = [
  '/',
  '/personal/',
  '/business/',
  '/tools/',
  '/tools/dimensional-weight-calculator/',
  '/methodology/',
  '/methodology/packing-algorithm/',
  '/guides/',
  '/guides/choosing-a-box/',
  '/guides/packing-with-existing-boxes/',
  '/guides/dimensional-weight/',
  '/contact/',
  '/privacy/',
] as const;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = ({ site }) => {
  const baseUrl =
    site ?? new URL('https://packmetry.com');

  const urls = INDEXABLE_ROUTES.map(
    route => {
      const url =
        new URL(route, baseUrl).href;

      return [
        '  <url>',
        `    <loc>${escapeXml(url)}</loc>`,
        '  </url>',
      ].join('\n');
    }
  ).join('\n');

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
