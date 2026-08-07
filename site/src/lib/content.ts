import { getCollection } from 'astro:content';

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

/** Frontmatter dates are parsed as UTC, so display them in UTC as well. */
export function formatContentDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}
