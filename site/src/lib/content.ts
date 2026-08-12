import { getCollection } from 'astro:content';

type DatedContentEntry = {
  id: string;
  data: { date: Date };
};

/** Content queries shared by lists, detail routes, feeds, and the sitemap. */
export function getPublishedEssays() {
  return getCollection('essays', ({ data }) => !data.draft);
}

export function getPublishedNotes() {
  return getCollection('notes', ({ data }) => !data.draft);
}

export function getPublishedDetailedNotes() {
  return getCollection(
    'notes',
    ({ data }) => !data.draft && data.hasDetail !== false
  );
}

/** Newest first; the entry id keeps same-day content deterministic everywhere. */
export function compareContentNewestFirst(a: DatedContentEntry, b: DatedContentEntry) {
  const dateDifference = b.data.date.valueOf() - a.data.date.valueOf();
  return dateDifference || a.id.localeCompare(b.id, 'en');
}

/** Frontmatter dates are parsed as UTC, so display them in UTC as well. */
export function formatContentDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}
