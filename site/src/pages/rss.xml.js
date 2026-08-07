import rss from '@astrojs/rss';
import {
  getPublishedDetailedNotes,
  getPublishedEssays,
} from '../lib/content';

export async function GET(context) {
  const [essayEntries, noteEntries] = await Promise.all([
    getPublishedEssays(),
    getPublishedDetailedNotes(),
  ]);

  const items = [
    ...essayEntries.map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.description || e.data.excerpt || '',
      link: `/essay-${e.id}.html`,
    })),
    ...noteEntries.map((n) => ({
      title: n.data.title,
      pubDate: n.data.date,
      description: n.data.description || n.data.excerpt || '',
      link: `/note-${n.id}.html`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Ray Chan',
    description: 'Soul-Searching & Notes — Ray Chan 的个人思考与读书笔记',
    site: context.site,
    items,
  });
}
