import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const essayEntries = await getCollection('essays', ({ data }) => !data.draft);
  const noteEntries = await getCollection(
    'notes',
    ({ data }) => !data.draft && data.hasDetail !== false
  );

  const items = [
    ...essayEntries.map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.description || e.data.excerpt || '',
      link: `/essay-${e.slug}.html`,
    })),
    ...noteEntries.map((n) => ({
      title: n.data.title,
      pubDate: n.data.date,
      description: n.data.description || n.data.excerpt || '',
      link: `/note-${n.slug}.html`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Ray Chan',
    description: 'Essays & Notes — Ray Chan 的个人随笔与读书笔记',
    site: context.site,
    items,
  });
}
