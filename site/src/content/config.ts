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

const base = z.object({
  title: z.string(),
  // Accepts '2026-07-01' / '2026.07.01' in frontmatter via coerce.
  date: z.coerce.date(),
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
  schema: base,
});

const notes = defineCollection({
  type: 'content',
  schema: base.extend({
    // Book / source name shown as `note-book-name` on the listing card.
    book: z.string().optional(),
    // false = listing-only excerpt card with no dedicated detail page.
    hasDetail: z.boolean().default(true),
  }),
});

export const collections = { essays, notes };
