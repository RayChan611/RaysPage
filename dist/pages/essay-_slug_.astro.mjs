import { c as createComponent, e as renderTemplate, d as renderComponent, f as createAstro } from '../chunks/astro/server_DWVLDh39.mjs';
import 'kleur/colors';
import { r as renderEntry, g as getCollection } from '../chunks/_astro_content_D8Ww09Bd.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_Cyk_HrLs.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
async function getStaticPaths() {
  const essays = await getCollection("essays");
  return essays.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry }
  }));
}
const $$Essayslug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Essayslug;
  const { entry } = Astro2.props;
  const { Content } = await renderEntry(entry);
  const { title, description, ogImage } = entry.data;
  const pageUrl = `https://www.raychan.top/essay-${entry.slug}.html`;
  return renderTemplate(_a || (_a = __template(["", ' <script defer src="/js/hero-sparkle.js"><\/script> <script defer src="/js/back-lift.js"><\/script>'])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": `${title} | Ray Chan`, "description": description, "canonical": pageUrl, "ogType": "article", "ogImage": ogImage, "ogUrl": pageUrl, "twitterImage": ogImage, "extraCss": ["css/essays.css", "css/reading-progress.css"], "current": "other" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Content", Content, {})} ` }));
}, "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/essay-[slug].astro", void 0);

const $$file = "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/essay-[slug].astro";
const $$url = "/essay-[slug].html";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Essayslug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
