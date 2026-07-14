import { c as createComponent, d as renderComponent, e as renderTemplate, g as addAttribute, m as maybeRenderHead } from '../chunks/astro/server_DWVLDh39.mjs';
import 'kleur/colors';
import { g as getCollection } from '../chunks/_astro_content_D8Ww09Bd.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_Cyk_HrLs.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Essays = createComponent(async ($$result, $$props, $$slots) => {
  const meta = {
    title: "Essays | Ray Chan",
    description: "Personal essays and thoughts by Ray Chan.",
    canonical: "https://www.raychan.top/essays.html",
    ogType: "website",
    ogImage: "https://www.raychan.top/assets/og/default.png",
    ogUrl: "https://www.raychan.top/essays.html",
    twitterImage: "https://www.raychan.top/assets/og/default.png",
    extraCss: ["css/essays.css", "css/reading-progress.css", "css/search.css"],
    current: "essays",
    preloadPhoto: false
  };
  const essays = (await getCollection("essays")).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  const fmtDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  };
  const pageScripts = ["js/search.js", "js/card-tilt.js", "js/hero-sparkle.js"];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { ...meta }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div id="global-bg-effect" class="hero-bg-effect"> <div class="hero-glow-line hero-glow-line--indigo-blur"></div> <div class="hero-glow-line hero-glow-line--indigo"></div> <div class="hero-glow-line hero-glow-line--sky-blur"></div> <div class="hero-glow-line hero-glow-line--sky"></div> <canvas id="hero-sparkle-canvas"></canvas> </div> <section class="essays-hero"> <div class="container"> <h1 class="essays-title">Essays</h1> <p class="essays-subtitle">Thoughts, notes, and scattered ideas.</p> </div> </section> <section class="essays-section section" aria-label="Personal essays"> <div class="container"> <div class="search-container"> <input type="text" class="search-input" id="searchInput" placeholder="Search essays..." aria-label="Search essays"> <div class="search-no-results" id="searchNoResults">No matching essays found.</div> </div> <div class="essays-list" id="essaysList"> ${essays.map((e) => renderTemplate`<a${addAttribute(`essay-${e.slug}.html`, "href")} class="essay-card animate-on-scroll"> <span class="essay-date">${fmtDate(e.data.date)}</span> <div class="essay-card-body"> <h3 class="essay-card-title">${e.data.title}</h3> <p class="essay-card-excerpt">${e.data.excerpt}</p> </div> <span class="essay-card-tag">${e.data.tags[0] || "Essay"}</span> </a>`)} </div> </div> </section> ` })} ${pageScripts.map((s) => renderTemplate(_a || (_a = __template(["<script defer", "><\/script>"])), addAttribute("/" + s, "src")))}`;
}, "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/essays.astro", void 0);

const $$file = "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/essays.astro";
const $$url = "/essays.html";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Essays,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
