import { c as createComponent, r as renderHead, d as renderComponent, F as Fragment, e as renderTemplate, u as unescapeHTML } from '../chunks/astro/server_DWVLDh39.mjs';
import 'kleur/colors';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$404 = createComponent(($$result, $$props, $$slots) => {
  const bodyHtml = `<canvas id="particleCanvas"></canvas>
  
  <div class="error-code">404</div>
  <h1 class="error-title">Page Not Found</h1>
  <p class="error-desc">The page you're looking for doesn't exist or has been moved.</p>
  <a href="/" class="btn-home">Go Home</a>`;
  const inlineScripts = ["// Simple particle effect for 404 page\n    (function() {\n      const canvas = document.getElementById('particleCanvas');\n      const ctx = canvas.getContext('2d');\n      let w, h, particles = [];\n      \n      function resize() {\n        w = canvas.width = window.innerWidth;\n        h = canvas.height = window.innerHeight;\n      }\n      \n      function createParticle() {\n        return {\n          x: Math.random() * w,\n          y: h + 10,\n          r: Math.random() * 1.5 + 0.5,\n          vx: (Math.random() - 0.5) * 0.3,\n          vy: -(Math.random() * 0.5 + 0.2),\n          alpha: Math.random() * 0.5 + 0.2\n        };\n      }\n      \n      function animate() {\n        ctx.clearRect(0, 0, w, h);\n        while (particles.length < 50) particles.push(createParticle());\n        \n        for (let i = particles.length - 1; i >= 0; i--) {\n          const p = particles[i];\n          p.x += p.vx;\n          p.y += p.vy;\n          p.alpha -= 0.002;\n          \n          if (p.alpha <= 0 || p.y < -10) {\n            particles.splice(i, 1);\n            continue;\n          }\n          \n          ctx.beginPath();\n          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);\n          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;\n          ctx.fill();\n        }\n        \n        requestAnimationFrame(animate);\n      }\n      \n      resize();\n      animate();\n      window.addEventListener('resize', resize);\n    })();"];
  return renderTemplate`<html lang="zh-CN"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>404 - Page Not Found | Ray Chan</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'"><link rel="stylesheet" href="/css/404.css">${renderHead()}</head> <body> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate`${unescapeHTML(bodyHtml)}` })} ${inlineScripts.map((c) => renderTemplate(_a || (_a = __template(["<script>", "<\/script>"])), unescapeHTML(c)))} </body> </html>`;
}, "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/404.astro", void 0);

const $$file = "/Users/ray/PersonalProject/rayspage-astro/site/src/pages/404.astro";
const $$url = "/404.html";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
