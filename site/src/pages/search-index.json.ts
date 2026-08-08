import {
  formatContentDate,
  getPublishedEssays,
  getPublishedNotes,
} from '../lib/content';

export const prerender = true;

function plainText(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:rarr|mdash|middot|nbsp);/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET() {
  const [essays, notes] = await Promise.all([
    getPublishedEssays(),
    getPublishedNotes(),
  ]);

  essays.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  notes.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const pages = [
    {
      type: 'page',
      title: 'Ray Chan',
      description: 'Ground-up rebuild · 产品、工程、交易与摄影。',
      href: '/index.html',
      meta: 'Home',
      keywords: ['home', 'about', 'contact', 'Ray Chan'],
      featured: true,
    },
    {
      type: 'page',
      title: 'Soul-Searching',
      description: 'Thoughts, notes, and scattered ideas.',
      href: '/essays.html',
      meta: `${essays.length} entries`,
      keywords: ['essays', 'writing', '思考', '文章'],
      featured: true,
    },
    {
      type: 'page',
      title: 'Reading Notes',
      description: 'Excerpts from books I have read.',
      href: '/notes.html',
      meta: `${notes.length} notes`,
      keywords: ['notes', 'books', '读书', '摘录'],
      featured: true,
    },
    {
      type: 'page',
      title: 'Photography',
      description: 'Moments captured in monochrome, grouped by series.',
      href: '/photos.html',
      meta: '39 frames',
      keywords: ['photography', 'photos', '摄影', '照片'],
      featured: true,
    },
  ];

  const photoSeries = [
    ['青岛 Qingdao', '海风、老街与日落。', '/photos.html#series-qingdao', '18 photos'],
    ['三亚 Sanya', '热带的海，南国的光。', '/photos.html#series-sanya', '7 photos'],
    ['F1 2025 上海', '引擎轰鸣，赛道与速度。', '/photos.html#series-f1-2025', '8 photos'],
    ['Moments', '散落的瞬间，赛道、雨后、花季与海。', '/photos.html#series-moments', '6 photos'],
  ].map(([title, description, href, meta]) => ({
    type: 'photo',
    title,
    description,
    href,
    meta,
    keywords: ['photography', '摄影', title],
    featured: false,
  }));

  const essayItems = essays.map((entry, index) => ({
    type: 'essay',
    title: entry.data.title,
    description: entry.data.excerpt,
    href: `/essay-${entry.id}.html`,
    meta: formatContentDate(entry.data.date),
    keywords: entry.data.tags,
    featured: index < 3,
  }));

  const noteItems = notes.map((entry) => ({
    type: 'note',
    title: entry.data.book || entry.data.title,
    description: plainText(entry.data.excerpt),
    href: entry.data.hasDetail === false
      ? `/notes.html#note-${entry.id}`
      : `/note-${entry.id}.html`,
    meta: formatContentDate(entry.data.date),
    keywords: entry.data.tags,
    featured: false,
  }));

  return new Response(JSON.stringify([...pages, ...photoSeries, ...essayItems, ...noteItems]), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
