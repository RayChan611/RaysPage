import { c as createComponent, d as renderComponent, e as renderTemplate, F as Fragment, u as unescapeHTML, g as addAttribute } from '../chunks/astro/server_DWVLDh39.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_Cyk_HrLs.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const meta = {
    title: "Ray Chan",
    description: "Ray Chan - Ground-up rebuild, quant strategies, full-stack engineering, personal reconstruction.",
    canonical: "https://www.raychan.top/",
    ogType: "website",
    ogImage: "https://www.raychan.top/assets/og/default.png",
    ogUrl: "https://www.raychan.top/",
    twitterImage: "https://www.raychan.top/assets/og/default.png",
    extraCss: [],
    current: "home",
    preloadPhoto: true
  };
  const bodyHtml = '<section class="hero" id="hero">\n    \n    <div class="hero-bg">\n        <img src="assets/ray-photo.webp" alt="" class="hero-bg-img" fetchpriority="high" decoding="async" width="2400" height="1600" />\n    </div>\n    \n    <div class="hero-overlay" aria-hidden="true"></div>\n\n    <div class="hero-content">\n      \n      <div class="hero-text">\n        <h1 class="hero-name">\n          <span class="hero-name-line">Ray</span>\n          <span class="hero-name-line hero-name-accent">Chan</span>\n        </h1>\n        <p class="hero-tagline" id="hero-tagline"></p>\n        <div class="hero-cta">\n          <div class="btn-magnetic">\n            <a href="#about" class="btn-primary"><span>Explore</span><span class="btn-arrow"> \u2193</span></a>\n          </div>\n        </div>\n      </div>\n    </div>\n\n  </section>\n\n  \n  <section class="section" id="about" aria-labelledby="about-title">\n    <div class="container">\n      <div class="section-header animate-on-scroll">\n        <h2 class="section-title" id="about-title">About Me</h2>\n        <div class="section-line"></div>\n      </div>\n\n      <div class="about-layout">\n        \n        <div class="about-text">\n            <p class="about-bio">\n              Cherish \xB7 Remain&emsp;&emsp;\u6E29\u67D4\u6C38\u5B58 \xB7 \u5C81\u5C81\u76F8\u4F34\n            </p>\n          <div class="about-tags">\n            <span class="tag">Project Manager</span>\n          </div>\n          <div class="about-focus">\n            <span class="about-focus-label">Currently focused on</span>\n            <p class="about-focus-text">\u91CF\u5316\u7B56\u7565 \xB7 \u5168\u6808\u5DE5\u7A0B</p>\n          </div>\n        </div>\n\n        \n        <div class="about-experience">\n          <div class="timeline">\n            <div class="timeline-item">\n              <span class="timeline-year">2022 \u2013 2025</span>\n              <span class="timeline-logo">TCL</span>\n            </div>\n            <div class="timeline-item">\n              <span class="timeline-year">2025 \u2013 2026</span>\n              <span class="timeline-logo">CMB</span>\n            </div>\n            <div class="timeline-item timeline-item--current">\n              <span class="timeline-year">2026 \u2013 Now</span>\n              <span class="timeline-logo">Manycore Tech</span>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </section>\n\n  \n  <section class="section section-dark" id="contact" aria-labelledby="contact-title">\n    <div class="container">\n      <div class="section-header animate-on-scroll">\n        <h2 class="section-title" id="contact-title">Get In Touch</h2>\n        <div class="section-line"></div>\n      </div>\n\n      <div class="contact-grid">\n        <div class="contact-card" data-href="mailto:chenrui0411@outlook.com">\n          <div class="contact-icon" aria-hidden="true">\u27F6</div>\n          <div>\n            <h4>Email</h4>\n            <p>chenrui0411@outlook.com</p>\n          </div>\n        </div>\n        <div class="contact-card" data-href="tel:+8619874061160">\n          <div class="contact-icon" aria-hidden="true">\u27F6</div>\n          <div>\n            <h4>WeChat / Phone</h4>\n            <p>19874061160</p>\n          </div>\n        </div>\n        <div class="contact-card">\n          <div class="contact-icon" aria-hidden="true">\u27F6</div>\n          <div>\n            <h4>Location</h4>\n            <p>\u5E7F\u5DDE</p>\n          </div>\n        </div>\n      </div>\n\n      <div class="social-links">\n        <a href="https://github.com/RayChan611" target="_blank" rel="noopener" class="social-link" aria-label="GitHub">GitHub \u2197</a>\n        <a href="https://www.linkedin.com/in/raychan611" target="_blank" rel="noopener" class="social-link" aria-label="LinkedIn">LinkedIn \u2197</a>\n        <a href="https://x.com/raychan22" target="_blank" rel="noopener" class="social-link" aria-label="X">X \u2197</a>\n        <a href="https://okjk.co/94n6Iu" target="_blank" rel="noopener" class="social-link" aria-label="Jike">Jike \u2197</a>\n      </div>\n    </div>\n  </section>';
  const pageScripts = ["js/hero-typewriter.js", "js/button-effects.js", "js/card-tilt.js", "js/scratch-to-reveal.js"];
  const inlineScripts = [];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { ...meta }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate`${unescapeHTML(bodyHtml)}` })} ${pageScripts.map((s) => renderTemplate(_a || (_a = __template(["<script defer", "><\/script>"])), addAttribute("/" + s, "src")))}${inlineScripts.map((c) => renderTemplate(_b || (_b = __template(["<script>", "<\/script>"])), unescapeHTML(c)))}` })}`;
}, "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/index.astro", void 0);

const $$file = "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
