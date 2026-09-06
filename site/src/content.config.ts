import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content Layer schemas for essays and reading notes.
 *
 * The glob loaders replace Astro 4's legacy content collections. Entries keep
 * living under `site/src/content/`, while their generated `id` is the filename
 * slug used by list links, detail routes, RSS, and the sitemap.
 */

const contentDate = z.preprocess((value) => {
  if (typeof value !== 'string') return value;

  const match = /^(\d{4})[.-](\d{2})[.-](\d{2})$/.exec(value.trim());
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Date.UTC normalises invalid inputs (e.g. Feb 31); turn those into an
  // Invalid Date so Zod reports the frontmatter error during the build.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return new Date(Number.NaN);
  }
  return date;
}, z.date());

const base = z.object({
  title: z.string(),
  // Parse date-only metadata at UTC midnight so builds are timezone-stable.
  date: contentDate,
  description: z.string().optional(),
  // Listing-card excerpt. Notes may contain trusted, hand-authored HTML and
  // are rendered with set:html on the listing page.
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  ogImage: z.string().optional(),
  draft: z.boolean().default(false),
});

const essays = defineCollection({
  loader: glob({
    base: './site/src/content/essays',
    pattern: '**/*.{md,mdx}',
  }),
  schema: base.extend({
    // 显式区分扉页与内页，不用字数或 Quote 标签猜测文章的排版意图。
    presentation: z.enum(['article', 'quote', 'poem']).default('article'),
    description: z.string().min(1),
    excerpt: z.string().min(1),
    tags: z.array(z.string()).min(1),
    ogImage: z.url(),
  }),
});

const notes = defineCollection({
  loader: glob({
    base: './site/src/content/notes',
    pattern: '**/*.{md,mdx}',
  }),
  schema: base.extend({
    // Book / source name shown as `note-book-name` on the listing card.
    book: z.string().min(1),
    // Optional detail-page presentation metadata. Keeping it in frontmatter
    // prevents titles/authors/tags from being duplicated in the MDX body.
    author: z.string().min(1).optional(),
    detailTitle: z.string().min(1).optional(),
    detailTags: z.array(z.string()).min(1).optional(),
    excerpt: z.string().min(1),
    tags: z.array(z.string()).min(1),
    // false = listing-only excerpt card with no dedicated detail page.
    hasDetail: z.boolean().default(true),
  }),
});

export const collections = { essays, notes };
