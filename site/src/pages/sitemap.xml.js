import {
  getPublishedDetailedNotes,
  getPublishedEssays,
} from '../lib/content';

const SITE_URL = 'https://www.raychan.top';

const STATIC_ROUTES = [
  { path: '/', changefreq: 'monthly', priority: '1.0' },
  { path: '/essays.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/notes.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/photos.html', changefreq: 'monthly', priority: '0.8' },
];

function renderUrl({ path, changefreq, priority }) {
  return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const [essays, notes] = await Promise.all([
    getPublishedEssays(),
    getPublishedDetailedNotes(),
  ]);

  const contentRoutes = [
    ...notes
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((entry) => ({
        path: `/note-${entry.id}.html`,
        changefreq: 'monthly',
        priority: '0.6',
      })),
    ...essays
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((entry) => ({
        path: `/essay-${entry.id}.html`,
        changefreq: 'monthly',
        priority: '0.6',
      })),
  ];

  const body = [...STATIC_ROUTES, ...contentRoutes].map(renderUrl).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
