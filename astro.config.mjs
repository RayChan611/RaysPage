import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
// build.format:'file' keeps output URLs identical to the current site
// (index.html, essays.html, essay-choice.html, ...) so existing links keep working.
export default defineConfig({
  // Website source lives in ./site so hand-written files are separate from build tooling
  srcDir: './site/src',
  publicDir: './site/public',
  build: { format: 'file' },
  trailingSlash: 'ignore',
  // Content Collections use MDX for essays / reading notes.
  integrations: [mdx()]
});
