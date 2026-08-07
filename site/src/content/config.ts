import { defineCollection, z } from 'astro:content';

/**
 * Content Collections schema.
 *
 * Essays and Notes were previously hard-coded `.astro` pages whose article
 * HTML was passed in as a `bodyHtml` string prop. Moving them into Content
 * Collections unlocks frontmatter metadata, build-time type checking, and
 * `getCollection()` queries — so listing pages are generated from data
 * instead of hand-maintained card markup.
 *
 * The article body itself stays as hand-written HTML (embedded in MDX) to
 * preserve the exact design/system. Only the *metadata* becomes structured.
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
  // Parse date-only metadata at UTC midnight. This keeps 2026.07.01 from
  // becoming June 30 when a build runs in a positive-offset timezone.
  date: contentDate,
  description: z.string().optional(),
  // Listing-card excerpt. May contain a little HTML (notes standalone cards
  // keep their multi-paragraph excerpt markup). Rendered with set:html.
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  ogImage: z.string().optional(),
  draft: z.boolean().default(false),
});

const essays = defineCollection({
  type: 'content',
  schema: base.extend({
    description: z.string().min(1),
    excerpt: z.string().min(1),
    tags: z.array(z.string()).min(1),
    ogImage: z.string().url(),
  }),
});

const notes = defineCollection({
  type: 'content',
  schema: base.extend({
    // Book / source name shown as `note-book-name` on the listing card.
    book: z.string().min(1),
    excerpt: z.string().min(1),
    tags: z.array(z.string()).min(1),
    // false = listing-only excerpt card with no dedicated detail page.
    hasDetail: z.boolean().default(true),
  }),
});

export const collections = { essays, notes };
