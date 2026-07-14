import { c as createComponent, d as renderComponent, e as renderTemplate, g as addAttribute, m as maybeRenderHead, u as unescapeHTML } from '../chunks/astro/server_DWVLDh39.mjs';
import 'kleur/colors';
import { g as getCollection } from '../chunks/_astro_content_D8Ww09Bd.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_Cyk_HrLs.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Notes = createComponent(async ($$result, $$props, $$slots) => {
  const meta = {
    title: "Reading Notes | Ray Chan",
    description: "Reading notes and book excerpts by Ray Chan.",
    canonical: "https://www.raychan.top/notes.html",
    ogType: "website",
    ogImage: "https://www.raychan.top/assets/og/default.png",
    ogUrl: "https://www.raychan.top/notes.html",
    twitterImage: "https://www.raychan.top/assets/og/default.png",
    extraCss: ["css/essays.css", "css/reading-progress.css", "css/search.css"],
    current: "notes",
    preloadPhoto: false
  };
  const notes = (await getCollection("notes")).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  const pageScripts = ["js/search.js", "js/card-tilt.js", "js/hero-sparkle.js"];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { ...meta }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div id="global-bg-effect" class="hero-bg-effect"> <div class="hero-glow-line hero-glow-line--indigo-blur"></div> <div class="hero-glow-line hero-glow-line--indigo"></div> <div class="hero-glow-line hero-glow-line--sky-blur"></div> <div class="hero-glow-line hero-glow-line--sky"></div> <canvas id="hero-sparkle-canvas"></canvas> </div> <section class="essays-hero"> <div class="container"> <h1 class="essays-title">Reading Notes</h1> <p class="essays-subtitle">Excerpts from books I've read.</p> </div> </section> <section class="essays-section section" aria-label="Reading notes"> <div class="container"> <div class="search-container"> <input type="text" class="search-input" id="searchInput" placeholder="Search notes..." aria-label="Search notes"> <div class="search-no-results" id="searchNoResults">No matching notes found.</div> </div> <div class="notes-list" id="notesList"> ${notes.map((n) => {
    const inner = renderTemplate`<div class="note-card-header"> <span class="note-book-name">${n.data.book || n.data.title}</span> <span class="note-card-tag">${n.data.tags[0] || "Note"}</span> </div>
            <div class="note-excerpt">${unescapeHTML(n.data.excerpt || "")}</div>`;
    return n.data.hasDetail ? renderTemplate`<a${addAttribute(`note-${n.slug}.html`, "href")} class="note-card note-card-link animate-on-scroll">${inner}</a>` : renderTemplate`<article class="note-card animate-on-scroll">${inner}</article>`;
  })} </div> </div> </section> ` })} ${pageScripts.map((s) => renderTemplate(_a || (_a = __template(["<script defer", "><\/script>"])), addAttribute("/" + s, "src")))}`;
}, "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/notes.astro", void 0);

const $$file = "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/notes.astro";
const $$url = "/notes.html";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Notes,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
