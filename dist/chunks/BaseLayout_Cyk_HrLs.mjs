import { c as createComponent, e as renderTemplate, l as renderSlot, g as addAttribute, r as renderHead, u as unescapeHTML, f as createAstro } from './astro/server_DWVLDh39.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const {
    title = "Ray Chan",
    description = "Ray Chan - Ground-up rebuild, quant strategies, full-stack engineering, personal reconstruction.",
    canonical = "https://www.raychan.top/",
    ogType = "website",
    ogImage = "https://www.raychan.top/assets/og/default.png",
    ogUrl = canonical,
    twitterImage = ogImage,
    extraCss = [],
    current = "home",
    preloadPhoto = false,
    inlineStyles = []
  } = Astro2.props;
  const NAV_ITEMS = [
    { href: "index.html#about", label: "About", key: "about" },
    { href: "index.html#contact", label: "Contact", key: "contact" },
    { href: "photos.html", label: "Photos", key: "photos" },
    { href: "notes.html", label: "Notes", key: "notes" },
    { href: "essays.html", label: "Essays", key: "essays" }
  ];
  const onIndex = current === "home" || current === "about" || current === "contact";
  return renderTemplate(_a || (_a = __template(['<html lang="zh-CN" data-astro-cid-ixa6lmsc> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="baidu-site-verification" content="codeva-FkS9J5NQKE"><title>', '</title><meta name="description"', '><meta name="author" content="Ray Chan"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Ray Chan"><meta property="og:site_name" content="Ray Chan"><meta property="og:url"', '><meta property="og:type"', '><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', ">", `<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" media="print" onload="this.media='all'"><link rel="stylesheet" href="/css/style.css">`, "", '<script defer src="https://cloud.umami.is/script.js" data-website-id="05a8cc57-1dd2-4a0e-bc35-ff78348b4982"><\/script>', "", '</head> <body data-astro-cid-ixa6lmsc> <!-- RayRAF + page behaviours. Loaded synchronously BEFORE page scripts so\n       window.RayRAF exists when hero-sparkle / cursor / smooth-scroll register. --> <script src="/js/site.js"><\/script> <div class="page-transition-overlay" id="pageTransitionOverlay" aria-hidden="true" style="opacity:1;pointer-events:auto;transition:none;" data-astro-cid-ixa6lmsc></div> <!-- Reading progress bar (was injected by the old components.js; now static). --> <div class="reading-progress" id="readingProgress" aria-hidden="true" data-astro-cid-ixa6lmsc></div> <canvas class="cursor-stream" id="cursorStream" aria-hidden="true" data-astro-cid-ixa6lmsc></canvas> <div class="cursor-comet" id="cursorComet" aria-hidden="true" data-astro-cid-ixa6lmsc></div> <nav class="nav scrolled" id="nav" aria-label="Main navigation" data-astro-cid-ixa6lmsc> <div class="nav-inner" data-astro-cid-ixa6lmsc> <a href="index.html" class="nav-logo" aria-label="Ray Chan - Home" data-astro-cid-ixa6lmsc><span class="nav-logo-c" data-astro-cid-ixa6lmsc>R</span><span class="nav-logo-expand" data-astro-cid-ixa6lmsc>ay&nbsp;</span><span class="nav-logo-r" data-astro-cid-ixa6lmsc>C</span><span class="nav-logo-expand2" data-astro-cid-ixa6lmsc>han</span></a> <div class="nav-right" data-astro-cid-ixa6lmsc> <div class="nav-links" id="navLinks" data-astro-cid-ixa6lmsc> ', ' </div> <button class="nav-mobile-btn" id="navMobileBtn" aria-label="Menu" aria-expanded="false" aria-controls="navLinks" data-astro-cid-ixa6lmsc><span data-astro-cid-ixa6lmsc></span><span data-astro-cid-ixa6lmsc></span></button> </div> </div> </nav> ', ' <footer class="footer" data-astro-cid-ixa6lmsc> <div class="container" data-astro-cid-ixa6lmsc> <p class="footer-copy" data-astro-cid-ixa6lmsc>&copy; 2026 Ray Chan. Built with Devotion.</p> </div> </footer> <button class="back-to-top" id="backToTop" aria-label="Back to top" title="Back to top" data-astro-cid-ixa6lmsc> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-astro-cid-ixa6lmsc> <path d="M12 19V5" data-astro-cid-ixa6lmsc></path> <path d="M5 12l7-7 7 7" data-astro-cid-ixa6lmsc></path> </svg> </button> <!-- Global client scripts (load order matters: lenis before smooth-scroll). --> <script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"><\/script> <script src="/js/smooth-scroll.js"><\/script> <script src="/js/cursor.js"><\/script> <script src="/js/nav.js"><\/script>  </body></html>'])), title, addAttribute(description, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), addAttribute(ogUrl, "content"), addAttribute(ogType, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(twitterImage, "content"), canonical && renderTemplate`<link rel="canonical"${addAttribute(canonical, "href")}>`, extraCss.map((href) => renderTemplate`<link rel="stylesheet"${addAttribute("/" + href, "href")}>`), inlineStyles.map((css) => renderTemplate`<style>${unescapeHTML(css)}</style>`), preloadPhoto && renderTemplate`<link rel="preload" as="image" href="/assets/ray-photo.webp" fetchpriority="high">`, renderHead(), NAV_ITEMS.map((item) => {
    if (onIndex && (item.key === "about" || item.key === "contact")) {
      const isActive2 = item.key === current;
      return renderTemplate`<a${addAttribute(isActive2 ? "nav-link nav-link-active" : "nav-link", "class")}${addAttribute("#" + item.key, "href")}${addAttribute(isActive2 ? "page" : void 0, "aria-current")} data-astro-cid-ixa6lmsc>${item.label}</a>`;
    }
    const isActive = item.key === current;
    const cls = isActive ? "nav-link nav-link-active" : "nav-link";
    return isActive ? renderTemplate`<span${addAttribute(cls, "class")} aria-current="page" data-astro-cid-ixa6lmsc>${item.label}</span>` : renderTemplate`<a${addAttribute(cls, "class")}${addAttribute(item.href, "href")} data-astro-cid-ixa6lmsc>${item.label}</a>`;
  }), renderSlot($$result, $$slots["default"]));
}, "/Users/ray/PersonalProject/rayspage-astro/site/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
