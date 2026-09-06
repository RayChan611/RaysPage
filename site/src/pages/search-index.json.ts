import {
  compareContentNewestFirst,
  formatContentDate,
  getPublishedEssays,
  getPublishedNotes,
} from '../lib/content';
import { photoCount, photoSeries } from '../data/photos';

export const prerender = true;

function plainText(value = '') {
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]+)\]\([^\n)]+\)/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+\.\s+)/gm, '')
    .replace(/(?:\*\*|__|~~|`)/g, '')
    .replace(/&(?:rarr|mdash|middot|nbsp);/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .replace(/\s*READ NOTES\s*$/i, '')
    .trim();
}

export async function GET() {
  const [essays, notes] = await Promise.all([
    getPublishedEssays(),
    getPublishedNotes(),
  ]);

  essays.sort(compareContentNewestFirst);
  notes.sort(compareContentNewestFirst);

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
      meta: `${photoCount} frames`,
      keywords: ['photography', 'photos', '摄影', '照片'],
      featured: true,
    },
  ];

  const photoItems = photoSeries.map((series) => ({
    type: 'photo',
    title: series.nav,
    description: series.description,
    href: `/photos.html#series-${series.id}`,
    meta: `${series.photos.length} photos`,
    keywords: ['photography', '摄影', series.name, series.nameEn],
    featured: false,
  }));

  const essayItems = essays.map((entry, index) => ({
    type: 'essay',
    title: entry.data.title,
    description: plainText(entry.data.excerpt),
    summary: plainText(entry.data.description),
    content: plainText(entry.body),
    href: `/essay-${entry.id}.html`,
    meta: formatContentDate(entry.data.date),
    keywords: entry.data.tags,
    featured: index < 3,
  }));

  const noteItems = notes.map((entry) => ({
    type: 'note',
    title: entry.data.book || entry.data.title,
    description: plainText(entry.data.excerpt),
    summary: plainText(entry.data.description),
    author: plainText(entry.data.author),
    content: plainText(entry.body),
    href: entry.data.hasDetail === false
      ? `/notes.html#note-${entry.id}`
      : `/note-${entry.id}.html`,
    meta: formatContentDate(entry.data.date),
    keywords: [...entry.data.tags, ...(entry.data.detailTags || []), entry.data.detailTitle || ''],
    featured: false,
  }));

  return new Response(JSON.stringify([...pages, ...photoItems, ...essayItems, ...noteItems]), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
