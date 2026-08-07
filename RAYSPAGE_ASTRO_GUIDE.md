# RaysPage (Astro) — 完整设计 / 架构 / 代码 / 踩坑 交接文档
> **面向读者**：接手本项目的下一位开发者，或下一个 AI 助手。
> **目标**：不依赖口口相传，让你快速、准确地理解这个站点的一切——设计理念、设计思路、逻辑、具体样式风格、架构逻辑、代码思路、踩过的坑、各种细节。
> **阅读顺序建议**：先读 §0–§2 建立心智模型 → §3 看样式 → §4 看架构 → §5 看代码（尤其 search 动画与双管理器）→ §9（坑）必读 → §10–§11 上手干活。
>
> *本文档更新日期：2026-08-08。当前状态：已升级至 Astro 7 / Content Layer API，Node 最低版本为 22.12；search 清空动画已升级为 WAAPI FLIP（含 retype 与可访问性修复）；内容日期按 UTC 稳定解析；GitHub Actions 会自动执行安全审计、类型检查、构建与静态产物校验；源码 + 构建产物 `dist/` 一并提交，EdgeOne 直接托管 `dist/` 静态文件。*

---

## 0. 一句话概览 & 关键事实

RaysPage 是个人网站（**https://www.raychan.top**），作者 Ray Chan。当前版本用 **Astro 7** 构建，是一个**零客户端框架运行时、纯静态**站点，100% 保留了原版视觉特效（自定义光标、Hero 满屏背景、粒子背景、刮刮乐联系方式、磁性按钮、滚动揭示动画、页面转场遮罩、阅读进度条、搜索过滤动画等）。所有交互用**原生 JS（IIFE / ES5 风格，无打包）+ 少量 Lenis（CDN 平滑滚动）**实现，没有使用 React/Vue 等客户端框架。

**最重要的前提**：本项目是「原版静态 HTML 站点的逐页 Astro 化」，目标是 **100% 还原原版内容与视觉效果**，不是重写。所以绝大部分「业务逻辑」在 `site/public/js/*.js` 和 `site/public/css/*.css` 里，Astro 只是把这些内容壳子化、组件化、加上构建期优化。**还原优先于创新**——任何视觉/内容改动都要保证与原站等价（除非用户明确要求新设计）。

| 项 | 内容 |
|---|---|
| 站点 | https://www.raychan.top （部署在 **EdgeOne**） |
| 作者 | Ray Chan |
| 新版仓库 | `RayChan611/RaysPage` 的 `main` 分支（Astro 源码在 `site/`，`dist/` 已提交） |
| 旧版存档 | `RayChan611/RaysPage-legacy`（原版纯 HTML 站，107 commits 完整历史，作参考） |
| 成功标准 | 当前 21 个生成 HTML 页面内容正确、链接完整，关键页面与交互通过自动化浏览器回归 |
| 部署方式 | 提交 `dist/` 静态产物 → EdgeOne 直接服务 `dist/`（**不**让 EdgeOne 自己 `npm run build`，详见 §7） |

---

## 1. 技术栈

- **Astro 7.2**（`package.json` 中 `astro: ^7.2.0`；`@astrojs/mdx: ^7.0.5` 用于 Content Collections，`@astrojs/rss` 用于 RSS）
- **Node.js ≥ 22.12.0**（Astro 7 的最低运行版本；仓库 `.nvmrc` 与 CI 固定为 `22.12.0`）
- **构建输出**：`build.format: 'file'` → 输出 `index.html` / `essays.html` / `essay-choice.html` 等（保持 URL 与原站一致，已有外链零破坏）
- **客户端 JS**：原生 ES5 风格 IIFE（无打包、无转译，浏览器直接跑），唯一例外是 **Lenis**（CDN 引入的平滑滚动库）
- **样式**：手写 CSS（`style.css` 全局设计系统 + 各页专属 CSS），无 Tailwind / CSS-in-JS
- **字体**：Google Fonts — `Inter`（sans，300–700）+ `JetBrains Mono`（mono，400/500），使用 preconnect + 标准 stylesheet 加载
- **分析**：Umami（`cloud.umami.is`，BaseLayout 中 `<script defer>` 引入）
- **部署**：EdgeOne（连 GitHub `RayChan611/RaysPage` 仓库触发）

无客户端 TypeScript 框架、无 CSS 预处理器、无组件库。TypeScript 仅用于 Astro 类型检查。保持极简。

---

## 2. 设计理念与设计思路 (Design Philosophy & Thinking)

这部分是审美演进的底座。**改设计前先读**。

### 2.1 整体调性
- **极简黑白（Minimal B&W）**：近黑背景 `#0a0a0a`，近白文字 `#faf9f5`。彩色仅用于 About 区两团极淡的极光光晕（indigo/violet，透明度 ~0.07–0.11，几乎不可见但增加深度），以及 Hero 背景真人照片。
- **「Premium craftsmanship」**：每个像素都应有意图；动效不是装饰而是体验；性能与美感必须共存。
- **克制（Restraint）**：动画曲线统一用 `cubic-bezier(0.16, 1, 0.3, 1)`（快起慢停，不回弹、不「弹跳糖」感），这是全站统一「高级感」的来源。

### 2.2 动效哲学（重点）
- **入场**：元素从 `translateY(18~32px)` + 透明 淡入，缓动 `cubic-bezier(0.16,1,0.3,1)`，约 0.85s。
- **Hero 名字**：逐词（word）在独立合成层淡入（避免双层 opacity 复合导致的性能问题），用 `translate3d` 强制 GPU 层（`.hero-name-line` 上 `will-change: transform, opacity`）。
- **导航 logo**：hover 时「Ray Chan」从「RC」展开（clip-path + max-width 动画；展开无宽限期，收起有 220ms 宽限期避免急促——见 `style.css` 的 `.nav-logo-expand` 系列规则）。
- **光标**：桌面自定义「星尘喷射」光标——头部 1:1 实时跟手，移动时洒落一颗颗**独立发光粒子**（`#cursorStream` 满屏 `canvas` 绘制），粒子继承头部速度、受 `DAMP(0.92)` 阻力减速、`GRAVITY(0.06)` 轻微下沉、随机扰动后渐隐消散；**无连线丝带**，只有疏朗星尘。移动端（≤768px）禁用。
- **滚动揭示**：`IntersectionObserver`（`nav.js`）给 `.animate-on-scroll` 加 `.visible`。
- **页面转场**：点击链接 → 全屏遮罩 `#0a0a0a` 淡入 → 跳转 → 新页遮罩淡出。初始 `opacity:1` 防止首屏闪白（见 BaseLayout 的 `#pageTransitionOverlay`）。
- **搜索过滤**：essays/notes 列表的实时搜索——匹配卡片重排到顶部、不匹配卡片错峰模糊淡出 + 高度折叠；清空时用 **WAAPI FLIP** 让所有卡片平滑归位、隐藏卡片「浮上来」淡入（详见 §5.5）。

### 2.3 无障碍 (Accessibility)
- **`prefers-reduced-motion`**：全局把所有动画时长压到 `0.01ms`、隐藏自定义光标、`animate-on-scroll` 直接显示。每个效果脚本（`cursor.js` / `hero-sparkle.js` / `search.js`）也单独判断 reduced-motion 直接 return 或走无动画分支。
- 选区、焦点、ARIA（nav `aria-label`、button `aria-label`/`aria-expanded`、卡片 `role="button" tabindex="0"`）都有。

### 2.4 设计来源
视觉灵感来自 **Inspira UI**（光标、刮刮乐、粒子 Sparkles 均从那里移植），黑白调性参考 Inspira 的 minimal 风格。原版还有一份更详尽的 `DESIGN.md`（在旧版 `RaysPage-legacy` 仓库根，约 35KB），如需深究某组件的设计意图可去翻。

---

## 3. 具体样式风格 (Design System)

全部定义在 **`site/public/css/style.css`** 的 `:root` 和全局规则里。改设计优先改这里，不要散落在页面。

### 3.1 CSS 变量（`style.css` 第 7–23 行）
```css
:root {
  --bg-primary: #0a0a0a;      /* 页面底色，也是转场遮罩色、hero 底部溶解目标色 */
  --bg-secondary: #111111;
  --bg-card: #1a1a1a;
  --bg-card-hover: #222222;
  --text-primary: #faf9f5;    /* 近白，非纯白，更柔和 */
  --text-secondary: #a3a3a3;
  --text-muted: #666666;
  --accent: #ffffff;
  --accent-subtle: rgba(255,255,255,0.08);
  --border: rgba(255,255,255,0.08);
  --border-hover: rgba(255,255,255,0.18);
  --font-sans: 'Inter', -apple-system, ...;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);  /* 曾被漏定义导致返回按钮 hover 失效，已修 */
}
```
**配色纪律**：所有颜色走变量。不要硬编码 `#fff`/`#000`（光标/边框等少数基础值除外，但新增样式请用变量）。

### 3.2 字体与排版
- Sans：`Inter`（300/400/500/600/700）；Mono：`JetBrains Mono`（400/500）。
- 标题用负字距（`letter-spacing: -0.02em ~ -0.03em`）营造紧凑高级感。
- 正文 `line-height: 1.6`；About 区 bio 用 mono 字体 + `letter-spacing: 0.04em`。
- 字号用 `clamp()` 流式缩放（如 `.section-title: clamp(1.8rem, 4vw, 2.8rem)`）。

### 3.3 间距与布局
- 区块 `.section` 纵向 `padding: 120px 40px`（移动端 `80px 24px`）。
- 容器最大宽 `1200px` 居中。
- 桌面断点 `768px`（导航、hero、about、contact、光标均在此断点切换；自定义光标在 `>768px` 启用，`≤768px` `display:none`）。

### 3.4 动效曲线（统一，重要）
| 用途 | 曲线 |
|---|---|
| 通用过渡 | `cubic-bezier(0.4, 0, 0.2, 1)`（Material 标准） |
| 入场/揭示/高级感 | `cubic-bezier(0.16, 1, 0.3, 1)`（快起慢停，主曲线） |
| Hero 名字/logo 展开 | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 光标拖尾丝带 | **弹簧链物理**：`N(14)` 个节点，节点 0 钉在头部，其余每帧 `vx+=(前节点-自身)×STIFF(0.30)`、`vy+=(前节点-自身)×STIFF+GRAVITY(0.10)`、`v×=DAMP(0.80)`，产生惯性/重量感（快速移动滞后、停手有余韵与轻微下垂）；`buildPath` 二次贝塞尔中点平滑成连续曲线，渐变 `streamGrad` tail→head（透明→0.5）+ `streamSoft` 高斯模糊 `stdDeviation 1.1` 柔化；全局 `fade`(`FADE_EASE 0.10`) 随移动柔和淡入淡出 |
| 搜索不匹配卡片淡出 | `cubic-bezier(0.4, 0, 0.8, 0.25)`（在 `search.css` 的 `.is-hidden`） |

**新增动画请沿用这几条，不要发明新曲线**，否则会破坏统一调性。

### 3.5 组件视觉语言
- **卡片**：`--bg-card` 底 + `1px` 半透明白边框，hover 边框变亮 + 背景变 `--bg-card-hover` + `translateY(-2px)`（`.contact-card` 等）。
- **按钮 `.btn-primary`**：无填充、字距 `0.28em` 大写、底部细线 hover 从中心展开（`::after` + `transform: translateX(-50%)` width 0→100%）+ 箭头 `arrow-breathe` 呼吸。
- **导航链接 `.nav-link`**：hover 底部 `1px` 白线 `width:0→100%`。
- **标签 `.tag`**：mono 字体、半透明边框（About 区已去边框融入文本流——`.about-tags .tag` 覆盖）。
- **Back to Top**：纯图标按钮（无容器），`fixed bottom/right`，`opacity/visibility/translateY` 三态过渡，`scrollY>400` 显示。

---

## 4. 整体架构逻辑 (Architecture)

### 4.1 目录结构
```
rayspage-astro/
├── package.json            # 依赖 + 开发、检查、构建、验证脚本
├── package-lock.json
├── .nvmrc                  # 本地与 CI 使用 Node 22.12.0
├── .github/workflows/ci.yml # main 的 push / PR 自动校验
├── astro.config.mjs        # 构建配置（见 4.5）
├── edgeone.json            # EdgeOne 响应头：HTML 重验证 + 基础安全头
├── scripts/validate-dist.mjs # 静态产物、资源引用、响应头配置校验
├── tsconfig.json
├── .gitignore              # 忽略 node_modules / .astro / .DS_Store
├── site/                   # ← 用户的网站源码（手写部分）
│   ├── src/
│   │   ├── env.d.ts
│   │   ├── content.config.ts # Content Layer loaders + essays / notes schema
│   │   ├── content/        # ★ Content Collections（见 4.6）
│   │   │   ├── essays/*.mdx   # 14 篇随笔（MDX 内容工程化）
│   │   │   └── notes/*.mdx    # 7 条笔记（MDX，2 条 hasDetail）
│   │   ├── layouts/
│   │   │   └── BaseLayout.astro   # ★ 全站静态外壳（nav/footer/cursor/转场/进度条/回顶）
│   │   └── pages/          # 静态页 + 动态路由 + XML endpoints
│   │       ├── index.astro / 404.astro / photos.astro   # 正文用 bodyHtml 字符串注入
│   │       ├── essays.astro / notes.astro               # 列表页，getCollection 渲染卡片
│   │       ├── essay-[slug].astro / note-[slug].astro   # 动态路由，渲染 <Content />
│   │       └── sitemap.xml.js                           # 构建期自动生成 sitemap
│   ├── public/             # ← 原样拷进构建产物根目录的静态资产
│   │   ├── css/            # style.css（全局设计系统）+ 页专属（essays/notes/photos/reading-progress/search/404）
│   │   ├── js/             # 12 个客户端脚本（见 5.3）+ back-lift.js（详情页返回按钮）
│   │   ├── assets/         # og 图（default + 各文章）、ray-photo.webp
│   │   ├── photos/         # 多个照片系列（qingdao/sanya/f1-2025-shanghai + 6 张 moments）
│   │   ├── favicon.svg, robots.txt
├── node_modules/           # 依赖（不提交，被 .gitignore 忽略）
├── dist/                   # 构建产物（已提交，EdgeOne 直接托管静态文件）
└── .astro/                 # Astro 缓存（不提交）
```

**目录重构说明**：`site/` 子目录是为了把「手写网站文件」和「构建工具/依赖」分离（Node 要求 `node_modules` 紧贴 `package.json`，不能移走，所以反过来把网站收进 `site/`）。`astro.config.mjs` 用 `srcDir: './site/src'` 和 `publicDir: './site/public'` 指向它。

### 4.2 分层职责
| 层 | 文件 | 职责 |
|---|---|---|
| 外壳层 | `BaseLayout.astro` | 渲染所有页面共享的 chrome（head meta/OG、nav、footer、cursor、转场遮罩、进度条、回顶按钮），按依赖顺序引入全局脚本 |
| 页面层 | `src/pages/*.astro` | 每个页面 = `BaseLayout` + 一段 `bodyHtml`（正文，字符串注入）+ 页专属 `extraCss`/`pageScripts`/`inlineStyles` |
| 样式层 | `public/css/style.css` + 页专属 css | 全局设计系统 + 局部样式 |
| 运行时层 | `public/js/site.js` | 共享管理器（`RayRAF`/`RayScroll`）+ 转场/进度条/回顶/分析初始化 |
| 效果层 | `public/js/*.js`（nav/cursor/smooth-scroll/hero-sparkle/search/...） | 各自独立效果，注册到共享管理器 |

### 4.3 BaseLayout（静态外壳，核心）
文件：`site/src/layouts/BaseLayout.astro`

**Props（每个页面通过 frontmatter 传入）**：
```ts
title, description, canonical, ogType, ogImage, ogUrl, twitterImage,
extraCss?: string[],     // 页专属 CSS，如 ["css/essays.css","css/reading-progress.css"]
current?: string,        // 导航高亮：home|about|contact|photos|notes|essays|other
preloadPhoto?: boolean,  // 仅首页 true（预加载 ray-photo.webp）
inlineStyles?: string[], // 页专属内联 <style>（来自原站提取，见 9.2 坑，绝不能删）
```

**它静态渲染的东西**（新架构关键，原版这些是 JS 注入的）：
- `<head>`：meta/OG/Twitter、字体 preload、`/css/style.css`、extraCss、inlineStyles、Umami 脚本、`preloadPhoto` 时预载 `ray-photo.webp`。
- 脚本加载顺序（**顺序很重要**）：
  1. `site.js`（同步 `<script is:inline>`，最先，定义 `window.RayRAF`/`window.RayScroll`，供后续脚本注册）
  2. 页面自己的 `pageScripts`（defer，由各页面在 `<slot/>` 后注入）
  3. 全局尾部脚本（BaseLayout 末尾）：`lenis.min.js`(CDN) → `smooth-scroll.js` → `cursor.js` → `nav.js`
- `<body>` 内静态节点：`#pageTransitionOverlay`（初始 `opacity:1` 防闪白）、`#readingProgress`、`#cursorStream`（星尘喷射 canvas）/`#cursorComet`（头部）、`<nav>`（current 决定高亮）、`<slot/>`（页面正文）、`<footer>`、`#backToTop`。

**导航高亮逻辑**：`NAV_ITEMS` 固定 5 项（About/Contact/Photos/Notes/Essays）。首页/about/contact 时 About/Contact 渲染为页内锚点 `#about`/`#contact`，其余渲染为跳转到 `index.html#about` 等；`current` 决定哪个显示 `nav-link-active`。

### 4.4 页面生成模式（index / photos / 404 等仍用此模式）
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const meta = { title, description, canonical, og*, extraCss: [...], current: "photos", preloadPhoto: false };
const bodyHtml = "<section class=\"section\">...</section>"; // 原站 <body> 正文，JSON 转义字符串
const pageScripts = ["js/photos.js","js/photos-data.js"];
---
<BaseLayout {...meta}>
  <Fragment set:html={bodyHtml} />
  {pageScripts.map((s) => <script is:inline defer src={'/' + s}></script>)}
</BaseLayout>
```
**正文是字符串通过 `<Fragment set:html={...}>` 注入**——这是为了保证「内容/效果 100% 等价原站」。改页面正文直接改这个字符串。

> ⚠️ 随笔（essays）与读书笔记（notes）已迁移到 **Astro Content Collections + MDX**（见 4.6），不再用 `bodyHtml` 模式，而是写在 `site/src/content/essays/*.mdx`、`site/src/content/notes/*.mdx`，由动态路由渲染。

### 4.5 Astro 配置（`astro.config.mjs`）
```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
export default defineConfig({
  srcDir: './site/src',          // 网站源码在 ./site
  publicDir: './site/public',    // 静态资产在 ./site/public
  build: { format: 'file' },     // 输出 index.html/essays.html，URL 与原站一致
  trailingSlash: 'ignore',
  integrations: [mdx()]          // 启用 MDX（essays/notes 内容工程化）
});
```
- `format: 'file'` 是**硬约束**：保证外部链接（如 `raychan.top/essays.html`）和站内 `href="essays.html"` 不破坏。**不要改成 `directory`**。
- `publicDir` 内容原样进 `dist/` 根（所以 JS/CSS 用绝对路径 `/js/...` `/css/...` 引用）。
- `mdx()` 集成用于 Content Collections 的 `*.mdx` 文件（`@astrojs/mdx` v7，兼容 Astro 7）。

### 4.6 内容工程化：Content Collections + MDX（essays / notes）
随笔与读书笔记已「壳化」迁移到 Content Collections，拿到 MDX 的内容工程化红利（frontmatter 类型约束、构建期校验、`getCollection` 聚合）。

**目录与结构（Astro 6+ Content Layer API）**
```
site/src/content.config.ts # glob loaders + essays / notes 的 zod schema
site/src/content/
  essays/*.mdx         # 14 篇随笔
  notes/*.mdx          # 7 条笔记（principles/katwu-lenny + extra-1..5）
site/src/pages/
  essay-[slug].astro   # getStaticPaths → 渲染 <Content />，输出 essay-${slug}.html
  note-[slug].astro    # 仅 hasDetail:true 的笔记生成详情页，输出 note-${slug}.html
  essays.astro         # getCollection('essays') 按 date 倒序渲染卡片
  notes.astro          # getCollection('notes') 渲染卡片（hasDetail 为链接，否则为静态摘录）
```
- `build.format:'file'` 下，动态路由使用 Content Layer 的 `entry.id`，输出文件名 = `essay-${id}.html` / `note-${id}.html`，**URL 与旧站完全一致**，SEO/外链零破坏。
- `notes` 集合有混合结构：2 条有详情页（`hasDetail:true`，`principles`/`katwu-lenny`），5 条只有列表摘录卡片（`hasDetail:false`，`extra-1..5`，原站本就无详情页）。`note-[slug].astro` 用 `getCollection('notes').filter(n=>n.data.hasDetail)` 只生成详情页，避免为摘录卡生成空详情页。
- **日期已校正**（2026-07 审计中）：7 篇笔记的 `date` 现为合理阅读时间（extra-5 平凡的世界 2024-03-15 / extra-1 股票大作手 2024-05-20 / extra-2 芒格 2024-07-10 / extra-3 AI交易 2024-09-05 / extra-4 精神内耗 2024-11-12 / principles 2025-02-18 / katwu-lenny 2025-06-30）。`date` 仅用于排序不渲染。`content.config.ts` 使用自定义 UTC 解析器，稳定接受 `Date`、`YYYY-MM-DD` 与 `YYYY.MM.DD`。

**MDX 文件长这样**
```mdx
---
title: "Kat Wu × Lenny 播客访谈"
book: "Kat Wu × Lenny 播客访谈"
date: "2025-06-30"
description: "..."
excerpt: "<div class=\"note-excerpt\">...</div>"
tags: ["PM · AI"]
ogImage: "https://www.raychan.top/assets/og/note-katwu-lenny.png"
hasDetail: true
---
<div id="global-bg-effect" class="hero-bg-effect"> ... </div>
<main class="note-page"> ... </main>
```
正文 HTML 写在 frontmatter 之后，由动态路由 `const { Content } = await render(entry);` + `<Content />` 渲染。

**样式 / 脚本复用**：原各详情页的 `inlineStyles` 已提升到共享 `public/css/essays.css`；尾部「返回」按钮的 `inlineScripts` 已提升为共享 `public/js/back-lift.js`（对缺失按钮自动 no-op）。动态路由统一加载 `hero-sparkle.js` + `back-lift.js`。

### 4.7 客户端脚本加载顺序（不可乱）
1. `site.js` → 定义 `RayRAF`/`RayScroll` 单例
2. 页面 `pageScripts`（defer）→ 各效果脚本（hero-sparkle/search/photos/card-tilt/button-effects/hero-typewriter/scratch-to-reveal 等），运行时会 `window.RayRAF.register(...)` / `window.RayScroll.add(...)`
3. 全局尾部：`lenis` → `smooth-scroll` → `cursor` → `nav`（必须最后，且 lenis 在 smooth-scroll 前）

---

## 5. 代码思路 (Code Approach)

### 5.1 共享运行时：`site.js`（最重要的一块 JS）
文件：`site/public/js/site.js`。定义了两个**全局单例管理器**，是性能优化的核心（把原来分散的多个监听器合并）：

**`window.RayRAF`** — 共享 rAF 可见性管理器
- 单个 `visibilitychange` 监听器，暂停/恢复所有注册动画循环。
- `register({start, stop})` / `unregister(loop)`。
- 注册者：cursor 的 outline 循环、smooth-scroll 的 lenis raf、hero-sparkle 的粒子循环。
- 收益：3 个独立 `visibilitychange` 监听 → 1 个。

**`window.RayScroll`** — 共享滚动管理器
- 单个 `passive` scroll 监听 + `requestAnimationFrame` 节流，驱动所有注册的处理器。
- `add(fn)` / `remove(fn)`。`add` 会立即跑一次让处理器设初始状态（如刷新后停在滚动位置）。
- 注册者：readingProgress 更新、backToTop 显隐、nav 滚动态、文章 scroll-depth 分析。
- 收益：4 个独立 scroll 监听 → 1 个。

**其余 init 函数**（都在 `initAll()` 里调用）：
- `initPageTransition()`：点击 `<a>`（非 `#`/非 http/非 javascript:/非 `_blank`/非同文件）时遮罩淡入 → 320ms 后跳转。⚠️ **`javascript:` 链接必须放行**（如 `<a href="javascript:history.back()">`），否则用 `window.location.href='javascript:...'` 会 deprecated/被 CSP 拦/静默失效。这是修过的 bug。
- `initReadingProgress()`：找 `.essay-content`/`.essays-list`/`.notes-list`/`.note-body` 作为内容容器，按滚动比例设 `#readingProgress` 宽度。
- `initBackToTop()`：`scrollY > 400` 显示，点击平滑回顶。
- `initAnalytics()`：Umami 自定义事件（outbound_link / back_button / scroll_depth 25/50/75/100%），带队列+重试（Umami 可能晚加载）。

### 5.2 各客户端效果脚本清单（`site/public/js/`）
| 文件 | 职责 | 注册到 | 备注 |
|---|---|---|---|
| `site.js` | 运行时管理器 + 转场/进度条/回顶/分析 | — | 全局最先加载 |
| `smooth-scroll.js` | Lenis 平滑滚动 + 锚点跳转 + hash 定位 | RayRAF | `history.scrollRestoration='manual'`；`window.lenis` 暴露 |
| `cursor.js` | 自定义光标（头部 1:1 + canvas 粒子喷射拖尾） | RayRAF | 仅桌面(>768)、reduced-motion 直接 return、首次移动才显示、translate3d GPU 合成、canvas 绘制粒子 |
| `nav.js` | nav 滚动态 + 移动端菜单 + IntersectionObserver 揭示 + Hero 入场 | RayScroll | 移动端菜单用事件委托 |
| `hero-sparkle.js` | canvas 粒子背景（notes/essays/photos 页） | RayRAF | `position:fixed` 满屏；reduced-motion 隐藏；MAX_PARTICLES=80 低端机封顶；inline draw 无 shadowBlur 高性能 |
| `search.js` | essays/notes 页搜索过滤（WAAPI FLIP） | — | 依赖 `#searchInput`/`#notesList`/`#essaysList` |
| `photos.js` + `photos-data.js` | 照片页网格渲染 + 数据 | — | `photos-data.js` 是单一数据源（PHOTO_SERIES 数组），`photos.js` 渲染灯箱 |
| `card-tilt.js` | 卡片 3D 倾斜 hover | — | essay/note 卡片 |
| `button-effects.js` | 磁性按钮效果 | — | |
| `hero-typewriter.js` | Hero 打字机标语 | — | 首页 |
| `scratch-to-reveal.js` | 联系卡刮刮乐 canvas | — | 首页 contact-card |
| `back-lift.js` | 详情页返回按钮上浮效果 | — | 对缺失按钮自动 no-op |
| `components.js` | **已删除**（原版注入 nav/footer/cursor 的脚本，新架构改 BaseLayout 静态渲染） | — | 不要恢复它 |

### 5.3 平滑滚动 (Lenis)
- CDN 引入 `unpkg.com/lenis@1.1.18/dist/lenis.min.js`（BaseLayout 末尾）。
- `smooth-scroll.js` 实例化 Lenis（`duration:1.0`，`smoothTouch:false` 触屏不平滑，避免移动端怪异）。
- 锚点链接（如导航 About/Contact）通过事件委托，用 `lenis.scrollTo(targetPos, {duration})`，并减去 nav 高度偏移。

### 5.4 自定义光标 & 粒子背景
- **光标（星尘喷射，canvas 粒子）**：仅桌面 `innerWidth>768`，CSS `@media (max-width:768px)` 也 `display:none`。`cursor.js` 给 `body` 加 `.custom-cursor-active`（CSS 里 `.custom-cursor-active *{cursor:none}` 隐藏系统光标）。头部 `#cursorComet` 用 `pointermove` 1:1 定位（`translate3d`，不触发 layout）；拖尾 `#cursorStream` 是满屏 `<canvas>`（DPR-aware 缩放），**每个粒子是一颗独立发光圆点**（非连线）。头部移动时每隔 `EMIT_DIST(6.5px)` 发射一个粒子，继承头部速度 `×0.32` 并叠加 `JITTER(±0.4)` 随机扰动；每帧粒子受 `DAMP(0.92)` 阻力减速、`GRAVITY(0.15)` 下沉（`2026-07` 由 `0.06` 加重到 `0.15`，明显下落重量感，commit `568b2d9`）、`life` 衰减，`MAX_PARTICLES(60)` 封顶保护性能。绘制用 `ctx.arc` + `shadowBlur(4)` 柔光、`rgba(255,255,255,α)` 随 `life` 渐隐，无 SVG 丝带/渐变/滤镜。全局 `fade`(`FADE_EASE 0.12`) 柔和淡入淡出（canvas opacity 纯 JS 每帧控制）。hover 到 `a/button/.contact-card/.tag/.social-link/.gallery-item/.essay-card` 时 `body.cursor-hover` 让头部放大、粒子亮度 `baseA` 由 0.5 升到 0.8（`hover` 缓动）。
- **粒子背景**：出现在 notes/essays/photos 内页的 `#global-bg-effect` 容器内（首页用真实 Hero 背景图，无粒子）。canvas `position:fixed` 满屏，只在 tab 隐藏时暂停。性能：粒子数按面积算、封顶 80；绘制不用 `save/restore`/`shadowBlur`。

### 5.5 ★ 搜索过滤动画：WAAPI FLIP（重点代码思路）
文件：`site/public/js/search.js` + `site/public/css/search.css`。这是近期重写的重点，逻辑较巧妙，单列说明。

**过滤流程（输入关键词）**
1. **相关性评分 `scoreMatch`**：标题命中 +100（开头再 +20），正文命中 +50（开头再 +10）。命中的卡片按分数降序重排到列表顶部。
2. **错峰淡出（Phase 1）**：不匹配卡片加 `.is-hidden`（CSS 里 `blur(4px) brightness(0.3)` + `translateY(-6px) scale(0.96)` + `opacity:0`，错峰 `STAGGER=38ms`），`placeholder` 卡（占位）推到最底并隐藏。
3. **精确高度折叠（Phase 2）**：`COLLAPSE_AT=160ms` 后，对隐藏卡读取 `offsetHeight` 设为显式值 → 强制 reflow → 把 height/margin/padding 设为 0，CSS `transition` 平滑折叠（避免 `display:none` 的硬跳）。

**清空流程（删除关键词 → 全部归位）— 用 WAAPI FLIP 消除「中间顿挫」**
早期实现用 CSS 高度折叠恢复会「卡一下」，后改为 **FLIP + Web Animations API** 直接走合成器（compositor），无布局抖动：
1. 先快照每张卡的 `is-hidden` 状态到 `hiddenSnapshot`（清场前必须，否则 `cleanupCard` 会误把隐藏卡显示）。
2. `runFilter` 开头统一 `cancel()` 在途 WAAPI 动画 + `cleanupCard` 清场——**修复了「清空途中重新输入导致卡片卡在隐藏/模糊态」的 retype bug**（见 9.7）。
3. **FLIP 六步**：
   - (1) 捕获当前位置 `firstRects`（所有卡，含隐藏卡）
   - (2) 去掉隐藏卡的 `is-hidden`，但 inline 维持 `opacity:0 / blur(4px) brightness(0.3) / translateY(-6px) scale(0.96)`（视觉上零闪烁）
   - (3) 按 `originalOrder`（初始化时捕获的 DOM 顺序）恢复 DOM
   - (4) `void list.offsetHeight` 强制布局，测最终位置 `lastRects`
   - (5) 计算 dx/dy 偏移，把每张卡 snap 回「变化前」位置（隐藏卡叠加 `translateY(-12px) scale(0.96)`），`transition:none` + 加 `.is-flipping`（`will-change:transform,opacity`）
   - (6) 双 `requestAnimationFrame` 后调用 `el.animate(keyframes, opts)`：可见卡只做位移归位（760ms）；隐藏卡从 blur/暗/下移到清晰/正常（720ms），并加 `delay = min(i*26, 240)` 让隐藏卡像「浮上来」般错峰绽放。
4. **动画收尾**：`onfinish` → `cleanupCard` 清 inline style + 移除 class；兜底 `setTimeout(1300ms)` 防 onfinish 不触发。
5. **降级**：`reduce-motion` 或浏览器不支持 `Element.animate` → 直接恢复 DOM + `cleanupCard`，无动画。

**关键 CSS 类（`search.css`）**
- `.is-hidden`：不匹配卡淡出+模糊（filter/transform/opacity，!important）
- `.is-revealing`：重新出现卡的轻微上浮（filter 分支用）
- `.is-flipping`：`will-change: transform, opacity`，隔离合成层
- `cleanupCard()`（JS）：重置 height/margin/padding/overflow/opacity/filter/transform/pointerEvents/transition 并移除三个 class——所有动画结束都走它收尾，保证状态干净。

### 5.6 迁移脚本（已移除，仅作历史参考）
`migrate.mjs` / `migrate-content.mjs` 是一次性脚本，已于 2026 审计中**从仓库移除**（内容迁移已全部完成，正文现为手写 `*.astro` 或 `*.mdx`）。机制要点（帮助理解内容来源）：
- `migrate.mjs`：遍历旧站 `*.html`，提取 meta/正文/页专属脚本/内联 `<style>`，生成 `*.astro`（正文为 `bodyHtml` 字符串，用 `<Fragment set:html>` 注入）。
- `migrate-content.mjs`：从旧 `essay-*.astro`/`note-*.astro` 抽取 `bodyHtml` + 元数据，生成 MDX；内含 `normalizeVoid()`（void 元素自闭合）和 prettify（每行一个标签）处理 MDX 的 JSX 解析严格性（见 9.8）。
- **重跑前提**：脚本依赖原始 `*.astro` 源文件（已从 git 删除，但 `git HEAD` 仍保留——`git checkout HEAD -- site/src/pages/essay-*.astro` 才能重跑）。日常维护**无需**重跑。

---

## 6. 照片页数据模式（PHOTO_SERIES）
文件：`site/public/js/photos-data.js` 是单一数据源——`PHOTO_SERIES` 数组，每个系列含 `id/galleryId/name/photos[]`。`renderGalleries()` 把每个系列的 `photos` 渲染进对应 `galleryId` 容器（带 `animate-on-scroll`、`loading="lazy"`、`role="button" tabindex="0"` 灯箱交互）。新增照片系列只需往数组追加一项，无需改 HTML。

---

## 7. 部署逻辑 (Deployment)

### 7.1 当前部署方式
- **EdgeOne** 连 GitHub 仓库 **`RayChan611/RaysPage`** 的 `main` 分支，push 触发重新部署。
- 站点域名 `www.raychan.top`。
- **策略**：仓库同时提交 Astro 源码 (`site/`) 和构建产物 (`dist/`)。EdgeOne 配置为**直接服务 `dist/` 目录的静态文件**，不依赖 EdgeOne 的 `npm ci` 构建环境。
- 根目录 `edgeone.json` 为所有响应补充基础安全头，并将根目录 `*.html` 设为 `max-age=0, must-revalidate`；避免文章页和 404 被浏览器按 immutable 长缓存，同时保留图片/CSS/JS 的平台默认静态缓存。

### 7.2 本地构建与提交流程
```bash
npm test              # 类型检查 + 构建 + 静态产物验证
npm run audit         # 高危依赖安全审计
git add -A            # 包含 site/ 源码改动 + dist/ 产物更新
git commit -m "..."
git push origin main  # 触发 EdgeOne 重新部署
```

### 7.3 EdgeOne 控制台配置
```
框架预设: Static / 静态站点 / Other（不要让 EdgeOne 自动识别 Astro）
安装命令: （留空）
构建命令: （留空）
输出目录: dist
```
> 如果 EdgeOne 强制要求填写构建命令，填 `echo "static dist"` 之类 no-op。

### 7.4 ⚠️ 关键部署陷阱
- **不要只改源码忘记 build**：`dist/` 是 EdgeOne 实际服务的目录。只改 `site/` 没跑 `npm run build`，线上不更新。
- **不要提交 `node_modules`/`.astro`**：始终被 `.gitignore` 忽略。
- **不要提交 `.DS_Store`**：macOS 自动文件，已加 `.gitignore`，偶尔需手动清理。

### 7.5 自动化校验
- `.github/workflows/ci.yml` 在面向 `main` 的 push 与 pull request 上运行，使用 Node 22.12.0。
- `npm run audit` 阻止 high / critical 级依赖漏洞通过；`npm test` 依次执行 `astro check`、生产构建和 `scripts/validate-dist.mjs`。
- 产物校验覆盖必需页面、站内 HTML/CSS/JS/图片引用、OG 图片、RSS、sitemap、公共 JS 语法以及 `edgeone.json` 的安全头和 HTML 缓存策略。

---

## 8. 版本控制与推送约定

| 仓库 | 内容 | 状态 |
|---|---|---|
| `RayChan611/RaysPage` | 本 Astro 新版（源码 + 构建产物） | `main` 分支，源码在 `site/`，`dist/` 已提交，EdgeOne 直接服务 `dist/` |
| `RayChan611/RaysPage-legacy` | 旧版原生 JS 站存档 | 107 commits 完整历史，作参考 |

**推送约定（重要）**：用户要求「说推送才推」。日常改动先本地 commit，等用户明确说「推送 / 推吧」再 `git push origin main`。**不要主动 push**。force push 需极度谨慎（覆盖线上历史，旧版在 `RaysPage-legacy`）。

---

## 9. ⚠️ 踩坑与注意事项（接手者必读）

这些都是实打实踩过、修过的。改代码前先过一遍，避免重蹈覆辙。

### 9.1 `#readingProgress` 元素缺失（严重）
- 现象：阅读进度条功能死。根因：原由已删的 `components.js` 注入，BaseLayout 重构时漏加。修复：BaseLayout 静态渲染 `<div class="reading-progress" id="readingProgress">`。**教训**：任何「原 components.js 注入的节点」迁移到 BaseLayout 时都要显式加回。

### 9.2 内联 `<style>` 提取遗漏（严重，影响视觉）
- 现象：子页 Back 按钮飘到左上角（应为左下固定），所有页专属视觉样式丢失。根因：原迁移只收集内联 `<script>`，漏了内联 `<style>`（`.note-back-fixed`、`.pdca-*`、`.dialogue`、`.highlight*`、`.note-*` 等）。修复：migrate 增加 `<style>` 提取 → `inlineStyles` → BaseLayout `<style is:inline>` 渲染。**教训**：`inlineStyles` 里的页专属 `<style>` **绝不可删**（删了 Back 按钮等会错位）。现已统一提升到 `essays.css` / `reading-progress.css` 等共享文件，但 `index`/`photos`/`404` 等仍可能有 `inlineStyles`，改动前先确认。

### 9.3 `photos/` 图片目录漏拷（严重）
- 现象：照片页图片全 404。根因：搭建骨架时 `cp` 只复制了 css/js/assets，漏了 photos。修复：`cp -R RaysPage/photos public/photos`（注意别嵌套出 `public/photos/photos/`）。**教训**：新增 `public/` 资源目录要全量核对。

### 9.4 `javascript:` 返回链接被误拦截（缺陷）
- 现象：`essay-*` 页 Back 按钮（`href="javascript:history.back()"`）失效。根因：site.js 转场点击处理器拦截了所有 `<a>`，改用 `window.location.href='javascript:...'`（deprecated + CSP 可拦）。修复：点击处理器对 `javascript:` 链接 `return` 放行。**教训**：永远不要拦截/改写 `javascript:` 链接。

### 9.5 `--transition-fast` 未定义（CSS bug）
- 曾因变量漏定义在 `:root`，导致某 hover 过渡失效。已补 `0.15s cubic-bezier(0.4,0,0.2,1)`。新增过渡优先复用变量。

### 9.6 `build.format` 不能改
- 改成 `directory` 会破坏所有 `.html` 外链和站内 `href="xxx.html"`。保持 `'file'`。

### 9.7 搜索清空动画的 retype bug（已修）
- 现象：用户在清空动画播放途中重新输入，部分卡片卡在隐藏/模糊态不回来。根因：`runFilter` 没有取消在途的 WAAPI 动画，上一个动画的 `onfinish` 里的 `cleanupCard` 会误把刚重新过滤的卡片 `is-hidden` 去掉、导致冒出或卡死。修复：`runFilter` 开头先 `hiddenSnapshot` 快照 → 再 `items.forEach(cancel + cleanupCard)` 清场，并在 `cleanupCard` 中移除 `is-restoring` 等死 class（死代码 `RESTORE_MS`/`is-restoring` 已删）。**教训**：动画状态机每次重入必须完全清场。

### 9.8 MDX 内嵌 HTML 的解析坑（迁移 essays/notes 时必踩）
MDX 把内嵌 HTML 交给 **JSX 解析器**（`mdast-util-mdx-jsx`），比浏览器 HTML 解析严很多。直接把旧站 `<body>` 正文贴进 `.mdx` 会报 `Expected a closing tag for <div> ...`。两个必须处理的点：
1. **void 元素必须自闭合**：`<br>`→`<br />`, `<img ...>`→`<img ... />`。否则报 `Unexpected closing tag </h1>`。
2. **每个标签必须独占一行**：若一行里多个标签、且开标签跨到下一行，JSX 解析器会误判「段落里开了个未闭合 `<div>`」。需 prettify（每个非自闭合 `>` 后、`每个 `<` 前断行）。
- 另外：MDX 正文里不要出现裸 `{` / `}`（会被当 JSX 表达式）；HTML 注释 `<!-- -->` 也可能触发解析问题。
- 新增笔记若用纯 markdown 书写更省心；沿用旧站 HTML 则注意断行。

### 9.9 死代码/冗余（已清理，勿复活）
- `essays.astro`/`notes.astro` 曾有误写的 `.nav{padding:14px}`（被 BaseLayout scoped 20px 永久覆盖，死代码，已删）。
- `components.js` 已删除，相关「components.js 注入 DOM」注释已改为「BaseLayout 静态渲染」。
- `migrate.mjs` / `migrate-content.mjs` 已删除（内容迁移完成）。
- 搜索逻辑中的 `RESTORE_MS` 常量、`is-restoring` class 已删除（见 9.7）。
- **2026-07-14 审计确认：无 JS 死代码**。`site/public/js/` 下 13 个脚本全部有引用——`site.js`/`smooth-scroll.js`/`cursor.js`/`nav.js` 经 `BaseLayout`；`hero-sparkle.js`/`back-lift.js` 经 `essay-[slug].astro`/`note-[slug].astro`；`search.js`/`card-tilt.js` 经 `essays.astro`/`notes.astro`；`photos.js`/`photos-data.js` 经 `photos.astro`；`hero-typewriter.js`/`button-effects.js`/`scratch-to-reveal.js` 经 `index.astro`。均采用各页面 `pageScripts` 数组动态加载（路径为 `js/xxx.js` 无前导斜杠，静态 grep `/js/` 会漏判，需注意）。

### 9.10 验证环境陷阱（headless 测试时）
- 旧的 static server / 浏览器缓存会在多次验证间造成严重误导（曾误报「readingProgress 消失」）。每次 headless 验证前：**重启 server + 清 Chrome profile + 用 `?cb=` 缓存破坏 URL**。
- 自动化浏览器工具（如 agent-browser / Playwright）对 `fill ""`、连续 `Backspace` 可能无法触发 `input` 事件；`Control+a` 可能误选整个页面导致黑屏。验证搜索动画**优先人工在浏览器肉眼验收**（见 §11.1）。

### 9.11 公共路径
- `public/` 内容输出到 `dist/` 根。JS/CSS 引用必须用绝对路径 `/js/...` `/css/...` `/assets/...` `/photos/...`。页面用相对路径 `../layouts/BaseLayout.astro` 引入布局（因在 `site/src/pages` 下）。

### 9.12 EdgeOne「安装依赖」失败（本项目已踩）
- 现象：push Astro 源码到 `RaysPage` 后，EdgeOne 部署日志显示「安装依赖 失败」/「No server-handler detected」。根因：EdgeOne 自动构建环境未能正确安装依赖或识别 Astro（自定义 `srcDir`/`publicDir` 也加大识别难度）。修复：改为「提交 `dist/` 静态产物 + EdgeOne 直接服务 `dist/`」模式。**教训**：部署方式要根据平台实际表现调整，不要假设「它应该能构建」。

### 9.13 SSH push 卡顿
- 用 SSH (`git@github.com:...`) push 曾卡 5 分钟无输出（实际在传，只是缓冲没刷）。改用 **https + gh token**（`gh auth setup-git` 配置 credential helper）稳定快速。

### 9.14 sitemap.xml 由构建期自动生成
- 源文件是 `site/src/pages/sitemap.xml.js`，构建时输出 `dist/sitemap.xml`；不要再在 `site/public/` 下新增同名静态文件。
- 固定页面在 `STATIC_ROUTES` 中维护；essay 与有详情页的 note 通过 `site/src/lib/content.ts` 的统一发布查询自动收集。
- `draft: true` 的内容会同时从列表、详情路由、RSS 和 sitemap 排除，新增文章后不再需要手动补 `<url>`。
- **essays 现状（2026-08-08）**：共 14 篇。新增内容会由列表、详情路由、RSS 和 sitemap 自动发现。

### 9.15 Astro 6+ Content Layer 约束
- 旧版 `site/src/content/config.ts`、collection `type: 'content'` 与 `entry.slug` 已被 Astro 移除。配置必须放在 `site/src/content.config.ts`，集合使用 `glob()` loader，zod 从 `astro/zod` 导入，路由标识使用 `entry.id`。
- 不要把配置迁回 `content/` 目录，也不要恢复 `slug` 访问，否则升级后的构建会失败。

---

## 10. 关键约定 (Conventions)

1. **导航高亮 `current`**：每个页面 frontmatter 必须设对（home/about/contact/photos/notes/essays/other），否则导航高亮错位。
2. **页专属 CSS → `extraCss`**：页面需要的额外 CSS 放进 `extraCss` 数组（如 `"css/reading-progress.css"`），BaseLayout 会 `<link>` 引入。不要塞进 `style.css` 全局（除非真的全局用）。
3. **页专属内联样式 → `inlineStyles`**：原站页面里的 `<style>` 块由 BaseLayout 用 `<style is:inline>` 渲染，**绝不可删**。
4. **页专属脚本 → `pageScripts`**：页面以 `<script defer>` 引入。新增页脚本放 `public/js/` 并加入页面 `pageScripts`。
5. **GLOBAL 脚本不要每页重复**：`lenis`/`smooth-scroll`/`cursor`/`nav` 由 BaseLayout 全局引入，页面不要重复加。
6. **动画循环必须注册到 RayRAF**：新增 rAF 循环用 `window.RayRAF.register({start,stop})`，不要自己加 `visibilitychange`。
7. **滚动处理必须注册到 RayScroll**：新增 scroll 监听用 `window.RayScroll.add(fn)`，不要自己 `addEventListener('scroll')`。
8. **reduced-motion 门控**：新增动效必须在脚本顶部或 CSS 里尊重 `prefers-reduced-motion`。
9. **公共资产绝对路径**：`public/` 下资源引用用 `/js/...`、`/css/...`、`/assets/...`、`/photos/...`。
10. **URL 用 `.html`**：站内链接写 `essays.html`/`notes.html`（因 `build.format:'file'`），不要写 `/essays/`。

---

## 11. 常见任务怎么做 (How-to)

### 11.1 本地运行 / 构建 / 验收
```bash
cd <RaysPage 仓库目录>
npm ci                # 按 lockfile 安装；需要 Node >= 22.12.0
npm run dev           # 开发服务器，默认 http://localhost:4321
npm run check         # Astro / TypeScript 静态检查
npm test              # check + build + dist 完整性验证（当前 21 个 HTML 页面）
npm run audit         # high / critical 依赖漏洞检查
npm run preview       # 预览构建产物
```
⚠️ 启动前确认 4321 端口没被旧 dev server 占着（曾累积 3 个残留实例）。用 `lsof -i:4321` 查，必要时杀掉再起。
⚠️ **动效/视觉效果务必同时做自动化浏览器回归与人工肉眼验收**；自动化适合检查 DOM、可访问性状态和几何关系，但不能完全替代对光标、粒子、缓动节奏的主观视觉判断。

### 11.2 加一个新页面
1. 在 `site/src/pages/` 新建 `xxx.astro`（结构见 §4.4），`current` 设对；需要额外 CSS 就加 `extraCss` + 在 `public/css/` 建文件；需要脚本就加 `pageScripts` 并在 `public/js/` 建文件。
2. 正文直接编辑 `bodyHtml` 字符串（index/photos/404 等模式）。

### 11.3 加一个新的客户端效果
1. 在 `public/js/` 新建 `xxx.js`（IIFE，ES5 风格，无打包）。
2. 如需 rAF 循环：`window.RayRAF.register({start, stop})`；如需 scroll：`window.RayScroll.add(fn)`。
3. 在对应页面 `pageScripts` 加入 `'js/xxx.js'`（defer 自动加载）。
4. 尊重 `prefers-reduced-motion`。
5. `npm run build` 验证。

### 11.4 改设计（配色/字体/间距）
- 优先改 `site/public/css/style.css` 的 `:root` 变量（配色、字体、过渡曲线）。
- 组件样式在同文件对应区块改；页专属样式改 `public/css/essays.css` 等或页面 `inlineStyles`。
- 动效曲线沿用 §3.4 的统一曲线，不要发明新曲线。

### 11.5 改内容
- **随笔 / 读书笔记（MDX）**：直接编辑 `site/src/content/essays/*.mdx` 或 `site/src/content/notes/*.mdx`。
  - frontmatter（`title`/`date`/`description`/`excerpt`/`tags`/`ogImage`/`hasDetail`/`book`）受 `site/src/content.config.ts` 的 zod schema 约束，构建期校验，写错类型会构建失败。
  - 正文 HTML 写在 frontmatter 之后，按 9.8 规则：**void 元素自闭合、每个标签独占一行**。
  - 改完执行 `npm test` 验证（动态路由自动按文件 `id` 生成页面）。
- **其他页面（index / photos / 404）**：正文仍在 `*.astro` 的 `bodyHtml` 字符串里，直接编辑对应 `*.astro`。

### 11.6 加一个照片系列
- 编辑 `site/public/js/photos-data.js`，往 `PHOTO_SERIES` 数组追加一项（`id`/`galleryId`/`name`/`photos[]`），图片放到 `site/public/photos/<id>/`。无需改 HTML（渲染由 `photos.js` 完成）。

### 11.7 同步旧站更新
- 旧站内容已**全部迁移完成**，一次性迁移脚本已从仓库移除。正文编辑直接改源文件（`*.astro` 的 `bodyHtml` 或 `*.mdx`），无需重跑任何迁移脚本。新增文章/笔记直接新建 `site/src/content/essays/*.mdx` 或 `notes/*.mdx`，动态路由自动生成页面。

---

## 12. AI 快速上手清单 (Onboarding Checklist)

接手本项目时，按此顺序建立认知：

- [ ] 读 `astro.config.mjs` → 理解 `format:'file'` 和 `site/` 结构
- [ ] 读 `site/src/layouts/BaseLayout.astro` → 理解静态外壳 + 脚本加载顺序 + Props
- [ ] 读一个列表页（如 `notes.astro`）→ 理解 `getCollection('notes')` + 卡片渲染（`note-card`/`note-card-link`）模式
- [ ] 读 `site/src/content.config.ts` + 一个 `essays/*.mdx` → 理解 Content Layer loader、frontmatter schema 与正文渲染（§4.6）
- [ ] 读一个动态路由（如 `essay-[slug].astro`）→ 理解 `getStaticPaths` + `render(entry)` + `<Content />`
- [ ] 读 `site/public/js/site.js` → 理解 `RayRAF`/`RayScroll` 双管理器（性能核心）
- [ ] 读 `site/public/js/search.js` + `search.css` → 理解 WAAPI FLIP 清空动画与 retype 修复（§5.5）
- [ ] 读 `site/public/css/style.css` 的 `:root` → 理解设计系统变量
- [ ] 读第 7 节「部署」→ 理解 `dist/` 已提交，改源码后必须 `npm run build` 并 commit 新的 `dist/`
- [ ] 读第 9 节「踩坑」→ 避免重犯已知错误
- [ ] 本地 `npm test` 后用 `npm run preview` 起服务，执行关键页面浏览器回归并肉眼验收动效

**不要做的事（Don'ts）**：
- ❌ 不要改 `build.format` 为 `directory`
- ❌ 不要恢复已删除的 `components.js`（BaseLayout 已静态渲染它的职责）
- ❌ 不要动 `inlineStyles` 里的页专属 `<style>`（丢了 Back 按钮等会错位）
- ❌ 不要拦截/改写 `javascript:` 链接
- ❌ 不要自己加 `visibilitychange`/`scroll` 监听（用 RayRAF/RayScroll）
- ❌ 不要把 `node_modules` 提交进 git
- ❌ 改源码后不要只 commit 源码而忘记 `npm run build` 并 commit 新的 `dist/`
- ❌ 不要发明新的动画曲线（用 §3.4 的统一曲线）
- ❌ 未经用户确认不要主动 `git push`（用户要求「说推才推」）；force push 覆盖 `RaysPage` 前确认旧版已存档 `RaysPage-legacy`

**核心心智模型**：这是「原版静态站的 Astro 壳化」，**还原优先于创新**。任何视觉/内容改动都要保证与原站等价（除非用户明确要求新设计）。所有「魔法」在 `site/public/` 的 JS/CSS 里，Astro 层只是组织与构建优化。

---

*文档更新日期：2026-08-08。覆盖：设计理念/思路、具体样式、架构逻辑、代码思路（含 search WAAPI FLIP）、部署、踩坑、约定、上手清单。如有代码演进，请以实际文件为准并同步更新本文件。*
