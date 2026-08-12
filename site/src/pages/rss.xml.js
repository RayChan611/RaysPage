import rss from '@astrojs/rss';
import {
  compareContentNewestFirst,
  getPublishedDetailedNotes,
  getPublishedEssays,
} from '../lib/content';

export async function GET(context) {
  const [essayEntries, noteEntries] = await Promise.all([
    getPublishedEssays(),
    getPublishedDetailedNotes(),
  ]);

  const entries = [
    ...essayEntries.map((entry) => ({ kind: 'essay', entry })),
    ...noteEntries.map((entry) => ({ kind: 'note', entry })),
  ].sort((a, b) => compareContentNewestFirst(a.entry, b.entry));

  const items = entries.map(({ kind, entry }) => ({
    title: entry.data.title,
    pubDate: entry.data.date,
    description: entry.data.description || entry.data.excerpt || '',
    link: `/${kind}-${entry.id}.html`,
  }));

  return rss({
    title: 'Ray Chan',
    description: 'Soul-Searching & Notes — Ray Chan 的个人思考与读书笔记',
    site: context.site,
    items,
  });
}
