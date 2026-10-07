import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const baseUrl =
    site ?? new URL('https://packmetry.com');

  const sitemapUrl =
    new URL('/sitemap.xml', baseUrl);

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl.href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
