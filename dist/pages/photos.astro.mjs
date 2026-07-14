import { c as createComponent, d as renderComponent, e as renderTemplate, F as Fragment, u as unescapeHTML, g as addAttribute } from '../chunks/astro/server_DWVLDh39.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_Cyk_HrLs.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b;
const $$Photos = createComponent(($$result, $$props, $$slots) => {
  const meta = {
    title: "Photography | Ray Chan",
    description: "Photography by Ray Chan \u2014 moments captured in monochrome, grouped by series.",
    canonical: "https://www.raychan.top/photos.html",
    ogType: "website",
    ogImage: "https://www.raychan.top/assets/og/default.png",
    ogUrl: "https://www.raychan.top/photos.html",
    twitterImage: "https://www.raychan.top/assets/og/default.png",
    extraCss: ["css/photos.css"],
    current: "photos",
    preloadPhoto: false
  };
  const bodyHtml = '<div id="global-bg-effect" class="hero-bg-effect">\n    <div class="hero-glow-line hero-glow-line--indigo-blur"></div>\n    <div class="hero-glow-line hero-glow-line--indigo"></div>\n    <div class="hero-glow-line hero-glow-line--sky-blur"></div>\n    <div class="hero-glow-line hero-glow-line--sky"></div>\n    <canvas id="hero-sparkle-canvas"></canvas>\n  </div>\n\n  \n  \n\n  <section class="photos-hero">\n    <div class="container">\n      <h1 class="photos-title">Photography</h1>\n      <p class="photos-subtitle">Moments captured in monochrome, grouped by series.</p>\n    </div>\n  </section>\n\n  \n  <nav class="series-nav" id="seriesNav" aria-label="Photo series">\n    <div class="container">\n      <a href="#series-qingdao" class="series-nav-link active" data-target="series-qingdao">\u9752\u5C9B Qingdao</a>\n      <span class="series-nav-divider" aria-hidden="true">/</span>\n      <a href="#series-sanya" class="series-nav-link" data-target="series-sanya">\u4E09\u4E9A Sanya</a>\n      <span class="series-nav-divider" aria-hidden="true">/</span>\n      <a href="#series-f1-2025" class="series-nav-link" data-target="series-f1-2025">F1 2025</a>\n      <span class="series-nav-divider" aria-hidden="true">/</span>\n      <a href="#series-moments" class="series-nav-link" data-target="series-moments">Moments</a>\n    </div>\n  </nav>\n\n  \n  <section class="series-section" id="series-qingdao" aria-labelledby="qingdao-title">\n    <div class="container">\n      <div class="series-header animate-on-scroll">\n        <div class="series-header-left">\n          <div class="series-title-block">\n            <h2 class="series-name" id="qingdao-title">\u9752\u5C9B</h2>\n            <span class="series-meta">Qingdao \xB7 18 photos</span>\n          </div>\n        </div>\n        <p class="series-desc">\u6D77\u98CE\u3001\u8001\u8857\u4E0E\u65E5\u843D\u3002\u6CBF\u7740\u6D77\u5CB8\u7EBF\u8D70\u8FC7\u7684\u90A3\u4E9B\u5348\u540E\u3002</p>\n      </div>\n\n      <div class="gallery-grid" id="gallery-qingdao">\n        \n      </div>\n    </div>\n  </section>\n\n  \n  <section class="series-section" id="series-sanya" aria-labelledby="sanya-title">\n    <div class="container">\n      <div class="series-header animate-on-scroll">\n        <div class="series-header-left">\n          <div class="series-title-block">\n            <h2 class="series-name" id="sanya-title">\u4E09\u4E9A</h2>\n            <span class="series-meta">Sanya \xB7 7 photos</span>\n          </div>\n        </div>\n        <p class="series-desc">\u70ED\u5E26\u7684\u6D77\uFF0C\u5357\u56FD\u7684\u5149\u3002</p>\n      </div>\n\n      <div class="gallery-grid" id="gallery-sanya">\n        \n      </div>\n    </div>\n  </section>\n\n  \n  <section class="series-section" id="series-f1-2025" aria-labelledby="f1-2025-title">\n    <div class="container">\n      <div class="series-header animate-on-scroll">\n        <div class="series-header-left">\n          <div class="series-title-block">\n            <h2 class="series-name" id="f1-2025-title">F1 2025 \u4E0A\u6D77</h2>\n            <span class="series-meta">F1 2025 Shanghai \xB7 8 photos</span>\n          </div>\n        </div>\n        <p class="series-desc">\u5F15\u64CE\u8F70\u9E23\uFF0C\u8D5B\u9053\u4E0E\u901F\u5EA6\u3002</p>\n      </div>\n\n      <div class="gallery-grid" id="gallery-f1-2025">\n        \n      </div>\n    </div>\n  </section>\n\n  \n  <section class="series-section" id="series-moments" aria-labelledby="moments-title">\n    <div class="container">\n      <div class="series-header animate-on-scroll">\n        <div class="series-header-left">\n          <div class="series-title-block">\n            <h2 class="series-name" id="moments-title">Moments</h2>\n            <span class="series-meta">Miscellaneous \xB7 6 photos</span>\n          </div>\n        </div>\n        <p class="series-desc">\u6563\u843D\u7684\u77AC\u95F4\uFF0C\u8D5B\u9053\u3001\u96E8\u540E\u3001\u82B1\u5B63\u4E0E\u6D77\u3002</p>\n      </div>\n\n      <div class="gallery-grid" id="gallery-moments">\n        \n      </div>\n    </div>\n  </section>\n\n  \n  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" aria-hidden="true">\n    <button class="lightbox-close" aria-label="Close">&times;</button>\n    <button class="lightbox-prev" aria-label="Previous image">&#8249;</button>\n    <button class="lightbox-next" aria-label="Next image">&#8250;</button>\n    <div class="lightbox-content">\n      <img src="" alt="" id="lightboxImg" />\n    </div>\n    <div class="lightbox-info">\n      <span class="lightbox-title" id="lightboxTitle"></span>\n      <span class="lightbox-counter" id="lightboxCounter"></span>\n    </div>\n  </div>';
  const pageScripts = ["js/card-tilt.js", "js/hero-sparkle.js", "js/photos-data.js", "js/photos.js"];
  const inlineScripts = [];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { ...meta }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate`${unescapeHTML(bodyHtml)}` })} ${pageScripts.map((s) => renderTemplate(_a || (_a = __template(["<script defer", "><\/script>"])), addAttribute("/" + s, "src")))}${inlineScripts.map((c) => renderTemplate(_b || (_b = __template(["<script>", "<\/script>"])), unescapeHTML(c)))}` })}`;
}, "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/photos.astro", void 0);

const $$file = "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/photos.astro";
const $$url = "/photos.html";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Photos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
