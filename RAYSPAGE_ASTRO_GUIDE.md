# RaysPage (Astro) — 开发者交接指南 / AI Onboarding Guide

> 本文件面向**接手本项目的下一位开发者（或 AI 助手）**。目标：让你在不依赖口口相传的情况下，快速、准确地理解这个项目的一切——设计理念、架构、技术细节、关键约定，以及我们踩过的所有坑。
>
> 阅读顺序建议：第 0–3 节建立心智模型 → 第 5 节看架构 → 第 10 节（坑）必读 → 第 11–12 节上手干活。

---

## 0. 一句话概览

RaysPage 是个人网站（raychan.top），作者 Ray Chan。当前版本用 **Astro 4** 重建，是一个**零运行时、纯静态**的站点，保留了原版的所有视觉特效（自定义光标、Hero 满屏背景、粒子背景、刮刮乐联系方式、磁性按钮、滚动揭示动画、页面转场遮罩、阅读进度条等）。所有交互用**原生 JS + 少量 Lenis** 实现，没有用任何前端框架（React/Vue 等）。

**最重要的前提**：本项目是「原版静态 HTML 站点的逐页 Astro 化」，**目标是 100% 还原原版内容与视觉效果**，不是重写。所以绝大部分「业务逻辑」在 `site/public/js/*.js` 和 `site/public/css/style.css` 里，Astro 只是把这些内容壳子化、组件化、加上构建期优化。

---

## 1. 项目背景与目标

| 项 | 内容 |
|---|---|
| 站点 | https://www.raychan.top （部署在 EdgeOne） |
| 作者 | Ray Chan |
| 旧版 | 原生 HTML/CSS/JS（仓库 `RayChan611/RaysPage` 旧历史，已存档到 `RayChan611/RaysPage-legacy`） |
| 新版 | Astro 重建（本仓库 `RayChan611/RaysPage` 的 `main` 分支，force push 覆盖旧历史） |
| 重建动机 | 原站 13 个 HTML 文件大量重复（nav/footer/cursor 每页手写）、无构建优化、无图片优化。Astro 提供组件复用、构建期校验、View Transitions 友好、零客户端 JS 运行时 |
| 成功标准 | 14 个页面**内容与视觉效果逐页等价**原站（已逐页 headless 比对验证 100% 一致） |

**关键事实**：旧版 `RaysPage` 的完整 git 历史已在 **`RayChan611/RaysPage-legacy`** 保全。如果新版出大问题，可回滚参考，但注意 `RaysPage` 仓库本身的 `main` 历史已被新版 force push 覆盖。

---

## 2. 技术栈

- **Astro 4.15**（`package.json` 中 `astro: ^4.15.0`，唯一依赖）
- **构建输出**：`build.format: 'file'` → 输出 `index.html` / `essays.html` / `essay-choice.html` 等（保持 URL 与原站一致，已有外链零破坏）
- **客户端 JS**：原生 ES5 风格 IIFE（无打包、无转译，浏览器直接跑），唯一例外是 **Lenis**（CDN 引入的平滑滚动库）
- **样式**：手写 CSS（`style.css` 全局设计系统 + 各页专属 CSS），无 Tailwind/CSS-in-JS
- **字体**：Google Fonts — `Inter`（sans）+ `JetBrains Mono`（mono），用 preload + `media="print" onload` 异步加载技巧
- **分析**：Umami（`cloud.umami.is`，BaseLayout 中 `<script defer>` 引入）
- **部署**：EdgeOne（连 GitHub `RayChan611/RaysPage` 仓库触发）

无 TypeScript 框架、无 CSS 预处理器、无组件库。保持极简。

---

## 3. 设计理念 (Design Philosophy)

这部分是为「下一步审美演进」打底的，改设计前先读。

### 3.1 整体调性
- **极简黑白（Minimal B&W）**：近黑背景 `#0a0a0a`，近白文字 `#faf9f5`。彩色仅用于 About 区两团极淡的极光光晕（indigo/violet，透明度 ~0.1，几乎不可见但增加深度）。
- **「Premium craftsmanship」**：每个像素都应有意图；动效不是装饰而是体验；性能与美感必须共存。
- **克制**：动画曲线统一用 `cubic-bezier(0.16, 1, 0.3, 1)`（快起慢停，不回弹、不「弹跳糖」感），这是全站统一的「高级感」来源。

### 3.2 动效哲学（重点）
- **入场**：元素从 `translateY(18~32px)` + 透明 淡入，缓动 `cubic-bezier(0.16,1,0.3,1)`，约 0.85s。
- **Hero 名字**：逐词（word）在独立合成层淡入（避免双层 opacity 复合导致的性能问题），用 `translate3d` 强制 GPU 层。
- **导航 logo**：hover 时「Ray Chan」从「RC」展开（clip-path + max-width 动画，有 220ms 收起宽限期避免急促）。
- **光标**：桌面自定义光标（dot 即时跟随 + outline lerp 0.12 缓动跟进），移动端禁用。
- **滚动揭示**：IntersectionObserver 给 `.animate-on-scroll` 加 `.visible`。
- **页面转场**：点击链接 → 全屏遮罩 `#0a0a0a` 淡入 → 跳转 → 新页遮罩淡出。初始 `opacity:1` 防止首屏闪白。

### 3.3 无障碍 (Accessibility)
- **`prefers-reduced-motion`**：全局把所有动画时长压到 `0.01ms`、隐藏自定义光标、`animate-on-scroll` 直接显示。每个效果脚本（cursor/hero-sparkle）也单独判断 reduced-motion 直接 return 或隐藏 canvas。
- 选区、焦点、ARIA（nav `aria-label`、button `aria-label`/`aria-expanded`）都有。

### 3.4 设计来源
视觉灵感来自 **Inspira UI**（光标、刮刮乐、粒子 Sparkles 均从那里移植），黑白调性参考 Inspira 的 minimal 风格。原版还有一份更详尽的 `DESIGN.md`（在旧版 RaysPage 仓库根，约 35KB），如需深究某组件的设计意图可去 `RaysPage-legacy` 翻。

---

## 4. 设计系统 (Design System)

全部定义在 **`site/public/css/style.css`** 的 `:root` 和全局规则里。改设计优先改这里，不要散落在页面。

### 4.1 CSS 变量（`style.css` 第 7–23 行）
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
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);  /* 注意：曾被漏定义导致返回按钮 hover 失效，已修 */
}
```
**配色纪律**：所有颜色走变量。不要硬编码 `#fff`/`#000`（光标/边框等少数基础值除外，但新增样式请用变量）。

### 4.2 字体与排版
- Sans：`Inter`（300/400/500/600/700）；Mono：`JetBrains Mono`（400/500）。
- 标题用负字距（`letter-spacing: -0.02em ~ -0.03em`）营造紧凑高级感。
- 正文 `line-height: 1.6`；About 区 bio 用 mono 字体 + `letter-spacing: 0.04em`。
- 字号用 `clamp()` 流式缩放（如 `.section-title: clamp(1.8rem, 4vw, 2.8rem)`）。

### 4.3 间距与布局
- 区块 `.section` 纵向 `padding: 120px 40px`（移动端 80px 24px）。
- 容器最大宽 `1200px` 居中。
- 桌面断点 `768px`（导航、hero、about、contact、光标均在此断点切换）。

### 4.4 动效曲线（统一，重要）
| 用途 | 曲线 |
|---|---|
| 通用过渡 | `cubic-bezier(0.4, 0, 0.2, 1)`（Material 标准） |
| 入场/揭示/高级感 | `cubic-bezier(0.16, 1, 0.3, 1)`（快起慢停，主曲线） |
| Hero 名字/logo 展开 | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 光标 outline 缓动 | JS 中 `lerp 0.12` |

**新增动画请沿用这几条，不要发明新曲线**，否则会破坏统一调性。

### 4.5 组件视觉语言
- 卡片：`--bg-card` 底 + `1px` 半透明白边框，hover 边框变亮 + 背景变 `--bg-card-hover` + `translateY(-2px)`。
- 按钮 `.btn-primary`：无填充、字距 `0.28em` 大写、底部细线 hover 从中心展开 + 箭头 `arrow-breathe` 呼吸。
- 导航链接：hover 底部 `1px` 白线 `width:0→100%`。
- 标签 `.tag`：mono 字体、半透明边框，About 区已去边框融入文本流。

---

## 5. 整体架构 (Architecture)

### 5.1 目录结构
```
rayspage-astro/
├── package.json            # 仅 astro 依赖 + dev/build/preview 脚本
├── package-lock.json
├── astro.config.mjs        # 构建配置（见 6.1）
├── tsconfig.json
├── .gitignore              # 忽略 node_modules / .astro / .DS_Store
├── site/                   # ← 用户的网站源码（手写部分）
│   ├── src/
│   │   ├── env.d.ts
│   │   ├── content/        # ★ Content Collections（见 5.6）
│   │   │   ├── config.ts   #   essays / notes 的 zod schema
│   │   │   ├── essays/*.mdx   # 7 篇随笔（MDX 内容工程化）
│   │   │   └── notes/*.mdx    # 7 条笔记（MDX，部分 hasDetail）
│   │   ├── layouts/
│   │   │   └── BaseLayout.astro   # ★ 全站静态外壳（nav/footer/cursor/转场/进度条/回顶）
│   │   └── pages/          # ★ 14 个页面（index/essays/notes/photos/404 + 7 essays + 2 notes）
│   │       ├── essay-[slug].astro / note-[slug].astro  # 动态路由，渲染 <Content />
│   ├── public/             # ← 原样拷进构建产物根目录的静态资产
│   │   ├── css/            # style.css（全局设计系统）+ 页专属（essays/notes/photos/reading-progress/search/404）
│   │   ├── js/             # 12 个客户端脚本（见 6.4）+ back-lift.js（返回按钮，由 MDX 详情页用）
│   │   ├── assets/         # og 图（default + 各文章）、ray-photo.webp
│   │   ├── photos/         # 9 张照片（照片页用）
│   │   ├── favicon.svg, robots.txt, sitemap.xml, rss.xml, rss-notes.xml
│   └── (一次性迁移脚本 migrate.mjs / migrate-content.mjs 已于审计中移除：内容迁移已完成，正文/详情页均为手写 .astro / .mdx)
├── node_modules/           # 依赖（不提交）
├── dist/                   # 构建产物（已提交，EdgeOne 直接托管静态文件）
└── .astro/                 # Astro 缓存（不提交）
```

**目录重构说明**：`site/` 子目录是为了把「手写网站文件」和「构建工具/依赖」分离（Node 要求 `node_modules` 紧贴 `package.json`，不能移走，所以反过来把网站收进 `site/`）。`astro.config.mjs` 用 `srcDir: './site/src'` 和 `publicDir: './site/public'` 指向它。

### 5.2 分层职责
| 层 | 文件 | 职责 |
|---|---|---|
| 外壳层 | `BaseLayout.astro` | 渲染所有页面共享的 chrome（head meta/OG、nav、footer、cursor、转场遮罩、进度条、回顶按钮），按依赖顺序引入全局脚本 |
| 页面层 | `src/pages/*.astro` | 每个页面 = `BaseLayout` + 一段 `bodyHtml`（正文，字符串注入）+ 页专属 `extraCss`/`pageScripts`/`inlineStyles` |
| 样式层 | `public/css/style.css` + 页专属 css | 全局设计系统 + 局部样式 |
| 运行时层 | `public/js/site.js` | 共享管理器（RayRAF/RayScroll）+ 转场/进度条/回顶/分析初始化 |
| 效果层 | `public/js/*.js`（nav/cursor/smooth-scroll/hero-sparkle/search/...） | 各自独立效果，注册到共享管理器 |

### 5.3 BaseLayout（静态外壳，核心）
文件：`site/src/layouts/BaseLayout.astro`

**Props（每个页面通过 frontmatter 传入）**：
```ts
title, description, canonical, ogType, ogImage, ogUrl, twitterImage,
extraCss?: string[],     // 页专属 CSS，如 ["css/essays.css","css/reading-progress.css"]
current?: string,        // 导航高亮：home|about|contact|photos|notes|essays|other
preloadPhoto?: boolean,  // 仅首页 true（预加载 ray-photo.webp）
inlineStyles?: string[], // 页专属内联 <style>（来自原站提取，见 6.9 坑）
```

**它静态渲染的东西**（新架构关键，原版这些是 JS 注入的）：
- `<head>`：meta/OG/Twitter、字体 preload、`<link rel="stylesheet" href="/css/style.css">`、extraCss、inlineStyles、Umami 脚本
- 脚本加载顺序（**顺序很重要**）：
  1. `site.js`（同步 `<script is:inline>`，最先，定义 `window.RayRAF`/`window.RayScroll`，供后续脚本注册）
  2. 页面自己的 `pageScripts`（defer，由各页面在 `<slot/>` 后注入）
  3. 全局尾部脚本（BaseLayout 末尾）：`lenis.min.js`(CDN) → `smooth-scroll.js` → `cursor.js` → `nav.js`
- `<body>` 内静态节点：`#pageTransitionOverlay`（初始 `opacity:1` 防闪白）、`#readingProgress`、`#cursorDot`/`#cursorOutline`、`<nav>`（current 决定高亮）、`<slot/>`（页面正文）、`<footer>`、`#backToTop`

**导航高亮逻辑**：`NAV_ITEMS` 固定 5 项（About/Contact/Photos/Notes/Essays）。`current` 决定哪个显示 `nav-link-active`；首页/about/contact 时 About/Contact 渲染为页内锚点 `#about`/`#contact`，其余渲染为跳转到 `index.html#about` 等。

### 5.4 页面生成模式（migrate.mjs → *.astro）
每个 `*.astro` 页面由 `migrate.mjs` 从旧站 HTML 自动生成，长这样（以 notes.astro 为例）：
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const meta = { title, description, canonical, og*, extraCss: [...], current: "notes", preloadPhoto: false };
const bodyHtml = "<div id=\"global-bg-effect\">...</div> <section>...</section>"; // 原站 <body> 正文，JSON 转义字符串
const pageScripts = ["js/search.js","js/card-tilt.js","js/hero-sparkle.js"];
const inlineScripts = [];
---
<BaseLayout {...meta}>
  <Fragment set:html={bodyHtml} />
  {pageScripts.map((s) => <script is:inline defer src={'/' + s}></script>)}
  {inlineScripts.map((c) => <script is:inline set:html={c}></script>)}
</BaseLayout>
```
**正文是字符串通过 `<Fragment set:html={...}>` 注入**——这是为了保证「内容/效果 100% 等价原站」。改页面正文直接改这个字符串（或重跑 migrate）。

> ⚠️ 更新：随笔（essays）与读书笔记（notes）已从「硬编码 `bodyHtml` 字符串」迁移到 **Astro Content Collections + MDX**（见 5.6）。这两类内容不再用上面的 `bodyHtml` 模式，而是写在 `site/src/content/essays/*.mdx`、`site/src/content/notes/*.mdx`，由动态路由 `essay-[slug].astro` / `note-[slug].astro` 渲染。index / photos / 404 等页面仍用本节的 `bodyHtml` 模式。

### 5.5 客户端脚本加载顺序（不可乱）
1. `site.js` → 定义 `RayRAF`/`RayScroll` 单例
2. 页面 `pageScripts`（defer）→ 各效果脚本（hero-sparkle/search/photos/card-tilt/button-effects/hero-typewriter/scratch-to-reveal 等），它们运行时会 `window.RayRAF.register(...)` / `window.RayScroll.add(...)`
3. 全局尾部：`lenis` → `smooth-scroll` → `cursor` → `nav`（这些必须最后，且 lenis 在 smooth-scroll 前）

### 5.6 内容工程化：Content Collections + MDX（essays / notes）
随笔与读书笔记已「壳化」迁移到 Content Collections，拿到 MDX 的内容工程化红利（frontmatter 类型约束、构建期校验、`getCollection` 聚合、未来可用原生 MDX 书写）。

**目录与结构**
```
site/src/content/
  config.ts            # defineCollection: essays / notes（zod schema）
  essays/*.mdx         # 7 篇随笔（choice/foam/pdca/right/stardust/threethings/trial）
  notes/*.mdx          # 7 条笔记（principles/katwu-lenny + extra-1..5）
site/src/pages/
  essay-[slug].astro   # getStaticPaths → 渲染 <Content />，输出 essay-${slug}.html
  note-[slug].astro    # 仅 hasDetail:true 的笔记生成详情页，输出 note-${slug}.html
  essays.astro         # getCollection('essays') 按 date 倒序渲染卡片
  notes.astro          # getCollection('notes') 渲染卡片（hasDetail 为链接，否则为静态摘录）
```
- `build.format:'file'` 下，动态路由输出文件名 = `essay-${slug}.html` / `note-${slug}.html`，**URL 与旧站完全一致**，SEO/外链零破坏。
- `notes` 集合有混合结构：2 条有详情页（`hasDetail:true`，`principles`/`katwu-lenny`），5 条只有列表摘录卡片（`hasDetail:false`，`extra-1..5`，原站本就无详情页）。`note-[slug].astro` 用 `getCollection('notes').filter(n=>n.data.hasDetail)` 只生成详情页，避免为摘录卡生成空详情页。

**MDX 文件长这样**
```mdx
---
title: "Kat Wu × Lenny 播客访谈"
book: "Kat Wu × Lenny 播客访谈"
date: "2025-01-02"
description: "..."
excerpt: "<div class=\"note-excerpt\">...</div>"
tags: ["PM · AI"]
ogImage: "https://www.raychan.top/assets/og/note-katwu-lenny.png"
hasDetail: true
---
<div id="global-bg-effect" class="hero-bg-effect">
  <div class="hero-glow-line hero-glow-line--indigo-blur"></div>
  ...
</div>
<main class="note-page">
  ...
</main>
```
正文 HTML 写在 frontmatter 之后，由动态路由 `const { Content } = await render(entry);` + `<Content />` 渲染。

**样式 / 脚本复用**：原各详情页的 `inlineStyles` 已提升到共享 `public/css/essays.css`；尾部「返回」按钮的 `inlineScripts` 已提升为共享 `public/js/back-lift.js`（对缺失按钮自动 no-op）。动态路由统一加载 `hero-sparkle.js` + `back-lift.js`。

**迁移脚本（一次性）**：`site/migrate-content.mjs` 从旧 `*.astro` 详情页抽取 `bodyHtml` + 元数据，生成 MDX。**重跑需要原始 `*.astro` 源文件**（已从 git 删除，但 `git HEAD` 仍保留——恢复 `git checkout HEAD -- site/src/pages/essay-*.astro ...` 才能重跑）。详见 10.14 的 MDX 解析坑。

---

## 6. 技术细节 (Technical Details)

### 6.1 Astro 配置（`astro.config.mjs`）
```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  srcDir: './site/src',
  publicDir: './site/public',
  build: { format: 'file' },     // 输出 index.html/essays.html，URL 与原站一致
  trailingSlash: 'ignore',
  integrations: [mdx()]           // 启用 MDX（essays/notes 内容工程化）
});
```
- `format: 'file'` 是**硬约束**：保证外部链接（如其他站指向 `raychan.top/essays.html`）和站内 `href="essays.html"` 不破坏。不要改成 `directory`。
- `publicDir` 内容原样进 `dist/` 根（所以 JS/CSS 用绝对路径 `/js/...` `/css/...` 引用）。
- `mdx()` 集成用于 Content Collections 的 `*.mdx` 文件（`@astrojs/mdx` v3，兼容 Astro 4）。

### 6.2 共享运行时：`site.js`（最重要的一块 JS）
文件：`site/public/js/site.js`。定义了两个**全局单例管理器**，是性能优化的核心（把原来分散的多个监听器合并）：

**`window.RayRAF`** — 共享 RAF 可见性管理器
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
- `initPageTransition()`：点击 `<a>`（非 `#`/非 http/非 javascript:/非 `_blank`/非同文件）时遮罩淡入 → 320ms 后跳转。
  - ⚠️ **`javascript:` 链接必须放行**（如 `<a href="javascript:history.back()">`），否则用 `window.location.href='javascript:...'` 会 deprecated/被 CSP 拦/静默失效。这是修过的 bug。
- `initReadingProgress()`：找 `.essay-content`/`.essays-list`/`.notes-list`/`.note-body` 作为内容容器，按滚动比例设 `#readingProgress` 宽度。
- `initBackToTop()`：`scrollY > 400` 显示，点击平滑回顶。
- `initAnalytics()`：Umami 自定义事件（outbound_link / back_button / scroll_depth 25/50/75/100%），带队列+重试（Umami 可能晚加载）。

### 6.3 各客户端效果脚本清单（`site/public/js/`）
| 文件 | 职责 | 注册到 | 备注 |
|---|---|---|---|
| `site.js` | 运行时管理器 + 转场/进度条/回顶/分析 | — | 全局最先加载 |
| `smooth-scroll.js` | Lenis 平滑滚动 + 锚点跳转 + hash 定位 | RayRAF | `history.scrollRestoration='manual'`；`window.lenis` 暴露 |
| `cursor.js` | 自定义光标（dot 即时 + outline lerp） | RayRAF | 仅桌面(>768)、reduced-motion 直接 return、首次移动才显示防(0,0)闪 |
| `nav.js` | nav 滚动态 + 移动端菜单 + IntersectionObserver 揭示 + Hero 入场 | RayScroll | 移动端菜单用事件委托 |
| `hero-sparkle.js` | canvas 粒子背景（notes/essays/photos 页） | RayRAF | `position:fixed` 满屏；reduced-motion 隐藏；MAX_PARTICLES=80 低端机封顶；inline draw 无 shadowBlur 高性能 |
| `search.js` | essays/notes 页搜索过滤 | — | 依赖 `#searchInput`/`#notesList` 等 |
| `photos.js` + `photos-data.js` | 照片页网格 + 数据 | — | 照片页专属 |
| `card-tilt.js` | 卡片 3D 倾斜 hover | — | essay/note 卡片 |
| `button-effects.js` | 磁性按钮效果 | — | |
| `hero-typewriter.js` | Hero 打字机标语 | — | 首页 |
| `scratch-to-reveal.js` | 联系卡刮刮乐 canvas | — | 首页 contact-card |
| `components.js` | **已删除**（原版注入 nav/footer/cursor 的脚本，新架构改 BaseLayout 静态渲染） | — | 不要恢复它 |

### 6.4 平滑滚动 (Lenis)
- CDN 引入 `unpkg.com/lenis@1.1.18/dist/lenis.min.js`（BaseLayout 末尾）。
- `smooth-scroll.js` 实例化 Lenis（`duration:1.0`，`smoothTouch:false` 触屏不平滑，避免移动端怪异）。
- 锚点链接（如导航 About/Contact）通过事件委托，用 `lenis.scrollTo(targetPos, {duration})`，并减去 nav 高度偏移。

### 6.5 自定义光标
- 仅桌面：JS 判断 `innerWidth>768`，CSS `@media (max-width:768px)` 也 `display:none`。
- `cursor.js` 给 `body` 加 `.custom-cursor-active`（CSS 里 `.custom-cursor-active *{cursor:none}` 隐藏系统光标）。
- dot 用 `pointermove` 立即定位；outline 用 lerp 0.12 跟随，接近时停 RAF 省 CPU。
- hover 到 `a/button/.contact-card/.tag/.social-link/.gallery-item/.essay-card` 时放大。

### 6.6 粒子背景 (hero-sparkle)
- 出现在 notes/essays/photos 内页的 `#global-bg-effect` 容器内（首页用真实 Hero 背景图，无粒子）。
- canvas `position:fixed` 满屏，滚动时持续（只在 tab 隐藏时暂停，不随滚动停）。
- 性能：粒子数按面积算、封顶 80；绘制不用 `save/restore`/`shadowBlur`。

### 6.7 迁移脚本 `migrate.mjs`（历史参考，已移除）
文件：`site/migrate.mjs`（一次性脚本，已于审计中移除；以下内容仅作历史参考，帮助理解内容来源）。

机制：
- `SRC = '/Users/ray/PersonalProject/RaysPage'`（旧站绝对路径，**硬编码**，换机要改）
- `OUT = '/Users/ray/PersonalProject/rayspage-astro/site/src/pages'`
- 遍历 `SRC/*.html`，对每个文件：
  1. 提取 `<title>`/`<meta description>`/canonical/OG/Twitter
  2. 提取 `<body>` 正文
  3. 扫描**整个文档**收集页专属外部脚本（`pageScripts`，排除 GLOBAL + umami，去重）→ 以 `<script defer>` 重发
  4. 保留内联 `<script>`（无 src）→ `inlineScripts`
  5. **保留内联 `<style>` 块** → `inlineStyles`（⚠️ 见 10.2，这是修过的致命 bug）
  6. 剥离 chrome slots（`#cursor-slot`/`#nav-slot`/`#footer-slot`）、转场 overlay、HTML 注释、`<link>`（外部脚本标签也剥，防重复 emit）
  7. 收集页专属 stylesheet → `extraCss`（排除 `css/style.css`）
  8. `current` 由文件名映射（`index→home`, `essays→essays`, `notes→notes`, `photos→photos`, 其他→`other`）；`preloadPhoto` 仅 `index.html` 为 true
  9. 生成 `*.astro`（404 特殊处理）
- 生成的页面用 `<Fragment set:html={bodyHtml}>` 注入正文。

**脚本已移除**：内容迁移已全部完成，正文现为手写 `*.astro` / `*.mdx`，直接编辑源文件即可，无需重跑。

---

## 7. 部署 (Deployment)

### 7.1 当前部署方式
- **EdgeOne** 连 GitHub 仓库 **`RayChan611/RaysPage`** 的 `main` 分支，push 触发重新部署。
- 站点域名 `www.raychan.top`。
- **策略**：仓库同时提交 Astro 源码 (`site/`) 和构建产物 (`dist/`)。EdgeOne 配置为**直接服务 `dist/` 目录的静态文件**，不依赖 EdgeOne 的 `npm ci` 构建环境。
  - 好处：避免 EdgeOne 安装依赖失败、Node 版本不匹配、框架识别错误等问题。
  - 代价：每次改源码后必须本地 `npm run build`，再把新的 `dist/` 一起 commit/push。

### 7.2 本地构建与提交流程
```bash
npm run build         # 生成 dist/（14 页 + 静态资源）
git add -A            # 包含 site/ 源码改动 + dist/ 产物更新
git commit -m "..."
git push origin main  # 触发 EdgeOne 重新部署
```

### 7.3 EdgeOne 控制台配置建议
如果你需要手动检查或重建 EdgeOne 项目，使用以下设置：
```
框架预设: Static / 静态站点 / Other（不要让 EdgeOne 自动识别 Astro）
安装命令: （留空，不需要安装）
构建命令: （留空，不需要构建）
输出目录: dist
根目录:   /（默认）
```
> 如果 EdgeOne 强制要求填写构建命令，可以填 `echo "static dist"` 之类的 no-op。

### 7.4 ⚠️ 关键部署陷阱
- **不要只改源码忘记 build**：`dist/` 是 EdgeOne 实际服务的目录。如果只改了 `site/` 但没跑 `npm run build`，线上不会更新。
- **不要提交 `node_modules`/` .astro`**：这些始终被 `.gitignore` 忽略。
- **不要提交 `.DS_Store`**：macOS 自动文件，已加 `.gitignore`，偶尔需要手动清理。
- 如果未来想改回「框架构建」模式（让 EdgeOne 自己 `npm run build`），需要：
  1. 把 `dist` 重新加回 `.gitignore`；
  2. 在 EdgeOne 里把框架改回 Astro / 自定义构建；
  3. 填写安装命令 `npm ci`、构建命令 `npm run build`、输出目录 `dist`。
  4. 但该项目已经验证 EdgeOne 的 `npm ci` 会失败，所以不建议改回。

---

## 8. 版本控制与仓库状态

| 仓库 | 内容 | 状态 |
|---|---|---|
| `RayChan611/RaysPage` | **本 Astro 新版**（源码 + 构建产物） | `main` 分支，源码在 `site/`，`dist/` 已提交，EdgeOne 直接服务 `dist/` |
| `RayChan611/RaysPage-legacy` | 旧版原生 JS 站存档 | 107 commits 完整历史，作基础参考 |

本地 `rayspage-astro` 目录：`git init` 过，已 commit（`.gitignore` 忽略 node_modules/.astro，提交根配置 + `site/` + `dist/`），`origin` 指向 `RaysPage`。

**推送约定**：用户要求「说推送才推」。日常改动先本地 commit，等用户明确说「推送/推」再 `git push origin main`。注意是 force 场景需谨慎（覆盖线上）。

两个 remote 历史备注（旧版 RaysPage 目录另有 `origin`=RaysPage、`archive`=RaysPage-legacy，但那是另一个目录，与本仓库无关）。

---

## 9. 关键约定 (Conventions)

1. **导航高亮 `current`**：每个页面 frontmatter 必须设对 `current`（home/about/contact/photos/notes/essays/other），否则导航高亮错位。
2. **页专属 CSS → `extraCss`**：页面需要的额外 CSS 放进 `extraCss` 数组（路径如 `"css/reading-progress.css"`），BaseLayout 会 `<link>` 引入。不要塞进 `style.css` 全局（除非真的全局用）。
3. **页专属内联样式 → `inlineStyles`**：原站页面里的 `<style>` 块会被 migrate 提取到 `inlineStyles`，BaseLayout 用 `<style is:inline>` 渲染。**绝不可删**（删了 Back 按钮等页专属样式会丢，见 10.2）。
4. **页专属脚本 → `pageScripts`**：migrate 自动收集，页面以 `<script defer>` 引入。新增页脚本放 `public/js/` 并加入页面的 `pageScripts`。
5. **GLOBAL 脚本不要每页重复**：`lenis`/`smooth-scroll`/`cursor`/`nav`（及已删的 `components.js`）由 BaseLayout 全局引入，迁移时从页面剥离。
6. **动画循环必须注册到 RayRAF**：新增 rAF 循环（光标/粒子/lenis 类）用 `window.RayRAF.register({start,stop})`，让单例统一管理可见性暂停，不要自己加 `visibilitychange`。
7. **滚动处理必须注册到 RayScroll**：新增 scroll 监听用 `window.RayScroll.add(fn)`，不要自己 `addEventListener('scroll')`。
8. **reduced-motion 门控**：新增动效必须在脚本顶部或 CSS 里尊重 `prefers-reduced-motion`，否则破坏无障碍。
9. **公共资产绝对路径**：`public/` 下资源在构建后位于根，引用用 `/js/...`、`/css/...`、`/assets/...`、`/photos/...`。
10. **URL 用 `.html`**：站内链接写 `essays.html`/`notes.html`（因 `build.format:'file'`），不要写 `/essays/`。

---

## 10. ⚠️ 踩坑与注意事项（接手者必读）

这些都是我们实打实踩过、修过的。改代码前先过一遍，避免重蹈覆辙。

### 10.1 `#readingProgress` 元素缺失（严重）
- 现象：阅读进度条功能死。
- 根因：原由已删的 `components.js` 注入，BaseLayout 重构时漏加。
- 修复：BaseLayout 静态渲染 `<div class="reading-progress" id="readingProgress">`。
- **教训**：任何「原 components.js 注入的节点」迁移到 BaseLayout 时都要显式加回来。

### 10.2 内联 `<style>` 提取遗漏（严重，影响视觉）
- 现象：子页 Back 按钮飘到左上角（应为左下固定），所有页专属视觉样式丢失。
- 根因：`migrate.mjs` 最初只收集内联 `<script>`，**漏了内联 `<style>`**。原站 13 个 HTML 都有内联 `<style>`（`.note-back-fixed`、`.pdca-*`、`.dialogue`、`.highlight*`、`.note-*` 等）。
- 修复：migrate 增加 `<style>` 提取 → `inlineStyles` → BaseLayout `<style is:inline>` 渲染。
- **教训**：改 `migrate.mjs` 或手写页面时，页专属 `<style>` 必须进 `inlineStyles`，绝不能丢。

### 10.3 `photos/` 图片目录漏拷（严重）
- 现象：照片页 40 张图全 404（实际现 9 张）。
- 根因：搭建骨架时 `cp` 只复制了 css/js/assets，漏了 photos。
- 修复：`cp -R RaysPage/photos public/photos`（注意别嵌套出 `public/photos/photos/`）。
- **教训**：新增 `public/` 下的资源目录要全量核对。

### 10.4 `javascript:` 返回链接被误拦截（缺陷）
- 现象：`essay-*` 页 Back 按钮（`href="javascript:history.back()"`）失效。
- 根因：site.js 转场点击处理器拦截了所有 `<a>`，改用 `window.location.href='javascript:...'`（deprecated+CSP 可拦）。
- 修复：点击处理器对 `javascript:` 链接 `return` 放行，让浏览器原生处理。
- **教训**：永远不要拦截/改写 `javascript:` 链接。

### 10.5 `--transition-fast` 未定义（CSS bug）
- 曾因变量漏定义在 `:root`，导致某 hover 过渡失效。已补 `0.15s cubic-bezier(0.4,0,0.2,1)`。新增过渡优先复用变量。

### 10.6 `build.format` 不能改
- 改成 `directory` 会破坏所有 `.html` 外链和站内 `href="xxx.html"`。保持 `'file'`。

### 10.7 `dist` 现在需要提交，`node_modules` 永不提交
- **`dist/`**：已改为提交到仓库，因为 EdgeOne 直接服务 `dist/` 静态文件（见第 7 节）。每次改源码后必须 `npm run build` 并 commit 新的 `dist/`。
- **`node_modules/` / `.astro/`**：始终被 `.gitignore` 忽略，不要 `git add` 它们。`node_modules` 约 146M，误提交会爆炸。

### 10.8 SSH push 卡顿
- 用 SSH (`git@github.com:...`) push 曾卡 5 分钟无输出（实际在传，只是 `tail` 缓冲没刷）。改用 **https + gh token**（`gh auth setup-git` 配置 credential helper）稳定快速。
- 推仓库用 `git push origin main`（或 `HEAD:main`）。

### 10.9 force push 覆盖历史
- 当前 `RaysPage` 的 `main` 是被 force push 覆盖的（旧版历史在 `RaysPage-legacy`）。再次推送若非 fast-forward，需 `git push origin main --force`（或 `--force-with-lease`）。**覆盖前确认旧版已存档**。

### 10.10 死代码/冗余（已清理，勿复活）
- `essays.astro`/`notes.astro` 曾有误写的 `.nav{padding:14px}`（被 BaseLayout scoped 20px 永久覆盖，死代码，已删）。
- `components.js` 已删除，相关「components.js 注入 DOM」注释已改为「BaseLayout 静态渲染」。

### 10.11 验证环境陷阱（headless 测试时）
- 旧的 static server / 浏览器缓存会在多次验证间造成严重误导（曾误报「readingProgress 消失」）。每次 headless 验证前：**重启 server + 清 Chrome profile + 用 `?cb=` 缓存破坏 URL**。
- CDP 必须连**页面级 target**（不是浏览器级 WS），否则报 `-32601`。

### 10.12 公共路径
- `public/` 内容输出到 `dist/` 根。JS/CSS 引用必须用绝对路径 `/js/...` `/css/...`。页面用相对路径 `../layouts/BaseLayout.astro` 引入布局（因在 `site/src/pages` 下）。

### 10.13 EdgeOne「安装依赖」失败（本项目已踩）
- 现象：push Astro 源码到 `RaysPage` 后，EdgeOne 部署日志显示「安装依赖 失败」/「No server-handler detected」。
- 根因：EdgeOne 的自动构建环境未能正确安装依赖或识别 Astro（本项目使用了自定义 `srcDir`/`publicDir` 也可能加大识别难度）。
- 修复：改为「提交 `dist/` 静态产物 + EdgeOne 直接服务 `dist/`」模式（见第 7 节）。
- **教训**：部署方式要根据平台实际表现调整，不要假设「它应该能构建」。

### 10.14 MDX 内嵌 HTML 的解析坑（迁移 essays/notes 时必踩）
MDX 把内嵌 HTML 交给 **JSX 解析器**（`mdast-util-mdx-jsx`）处理，比浏览器 HTML 解析器严很多。直接把旧站 `<body>` 正文贴进 `.mdx` 会报 `Expected a closing tag for <div> ... before the end of paragraph`。两个必须处理的点（已写进 `migrate-content.mjs`）：

1. **void 元素必须自闭合**：HTML 的 `<br>`、`<img ...>`、`<hr>`、`<input ...>` 在 MDX 里必须写成 `<br />`、`<img ... />`。否则报 `Unexpected closing tag </h1>, expected corresponding closing tag for <br>`。`migrate-content.mjs` 的 `normalizeVoid()` 自动把 `<br>` → `<br />`。
2. **每个标签必须独占一行（pretty-print）**：若一行里多个标签、且其中一个**开标签跨到下一行**（如 `<div class="dialogue"><div class="speaker">x</div><div class="text">` 后接下一行的 `<p>`），JSX 解析器会误判成「段落里开了个未闭合 `<div>`」而报错。`migrate-content.mjs` 的 `stripBlankLines()`（实为 prettify：在每个非自闭合 `>` 后、`每个 `<` 前断行）解决了它。
- 另外：MDX 正文里不要出现裸 `{` / `}`（会被当 JSX 表达式）；HTML 注释 `<!-- -->` 也可能触发解析问题——迁移脚本已确认正文无这两类字符。
- **重跑迁移脚本的前提**：脚本从旧的 `essay-*.astro` / `note-*.astro` 详情页抽取正文，但这些文件构建期已被删除。重跑前必须先 `git checkout HEAD -- site/src/pages/essay-*.astro site/src/pages/note-*.astro`（恢复源），跑完再删回、并还原已重写的 `essays.astro`/`notes.astro` 列表页。

---

## 11. 常见任务怎么做 (How-to)

### 11.1 本地运行 / 构建
```bash
cd /Users/ray/PersonalProject/rayspage-astro
npm install            # 首次或依赖变更
npm run dev           # 开发服务器，默认 http://localhost:4321
npm run build         # 构建到 dist/（14 页）
npm run preview       # 预览构建产物
```
⚠️ 启动前确认 4321 端口没被旧 dev server 占着（曾累积 3 个残留实例）。用 `lsof -i:4321` 查，必要时杀掉再起。

### 11.2 加一个新页面
1. 在 `site/src/pages/` 新建 `xxx.astro`：
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const meta = { title, description, canonical, ogImage, extraCss: [], current: "other", preloadPhoto: false };
const bodyHtml = `<section class="section"><div class="container">...</div></section>`;
const pageScripts = [];
const inlineScripts = [];
---
<BaseLayout {...meta}>
  <Fragment set:html={bodyHtml} />
  {pageScripts.map((s) => <script is:inline defer src={'/' + s}></script>)}
  {inlineScripts.map((c) => <script is:inline set:html={c}></script>)}
</BaseLayout>
```
2. `current` 设对（导航高亮）；需要额外 CSS 就加 `extraCss` + 在 `public/css/` 建文件；需要脚本就加 `pageScripts`。
3. 旧站内容已迁移完成，正文为手写 `.astro` / `*.mdx`，直接编辑即可，无需重跑迁移脚本（脚本已移除）。

### 11.3 加一个新的客户端效果
1. 在 `public/js/` 新建 `xxx.js`（IIFE，ES5 风格，无打包）。
2. 如需 rAF 循环：`window.RayRAF.register({start, stop})`；如需 scroll：`window.RayScroll.add(fn)`。
3. 在对应页面 `pageScripts` 加入 `'js/xxx.js'`（defer 自动加载）。
4. 尊重 `prefers-reduced-motion`（脚本顶部判断或 CSS 处理）。
5. `npm run build` 验证。

### 11.4 改设计（配色/字体/间距）
- 优先改 `site/public/css/style.css` 的 `:root` 变量（配色、字体、过渡曲线）。
- 组件样式在同文件对应区块改。
- 页专属样式改 `public/css/essays.css` 等或页面的 `inlineStyles`。
- 动效曲线沿用第 4.4 节的统一曲线，不要发明新曲线。

### 11.5 改内容
- **随笔 / 读书笔记（MDX）**：直接编辑 `site/src/content/essays/*.mdx` 或 `site/src/content/notes/*.mdx`。
  - frontmatter（`title`/`date`/`description`/`excerpt`/`tags`/`ogImage`/`hasDetail`）受 `site/src/content/config.ts` 的 zod schema 约束，构建期校验，写错类型会构建失败。
  - 正文 HTML 写在 frontmatter 之后，按 10.14 的规则：**void 元素自闭合、每个标签独占一行**。新增笔记若用纯 markdown 书写更省心；沿用旧站 HTML 则注意断行。
  - 改完 `npm run build` 验证（动态路由 `essay-[slug].astro`/`note-[slug].astro` 自动按 slug 生成页面）。
  - ⚠️ `notes` 里 `extra-1..5` 的 `date` 是占位值（`2024-01-0N`），`principles`/`katwu-lenny` 的日期也需按真实阅读时间校正。
- **其他页面（index / photos / 404）**：正文仍在 `*.astro` 的 `bodyHtml` 字符串里，直接编辑对应 `*.astro` 即可。

### 11.6 同步旧站更新
- 旧站内容已**全部迁移完成**，一次性迁移脚本（`migrate.mjs` / `migrate-content.mjs`）已从仓库移除，日常维护不再依赖它们。
- **正文编辑**：所有页面正文都是手写 `*.astro`（`bodyHtml` 模式）或 `*.mdx`（Content Collections），直接编辑源文件即可，无需重跑任何迁移脚本。
- **新增文章/笔记**：直接新建 `site/src/content/essays/*.mdx` 或 `notes/*.mdx`（frontmatter 见 11.5），动态路由会自动生成页面。

---

## 12. AI 快速上手清单 (Onboarding Checklist)

接手本项目时，按此顺序建立认知：

- [ ] 读 `astro.config.mjs` → 理解 `format:'file'` 和 `site/` 结构
- [ ] 读 `site/src/layouts/BaseLayout.astro` → 理解静态外壳 + 脚本加载顺序 + Props
- [ ] 读一个列表页（如 `notes.astro`）→ 理解 `getCollection('notes')` + 卡片渲染（`note-card`/`note-card-link`）模式
- [ ] 读 `site/src/content/config.ts` + 一个 `essays/*.mdx` → 理解 Content Collections 的 frontmatter schema 与正文渲染（5.6）
- [ ] 读一个动态路由（如 `essay-[slug].astro`）→ 理解 `getStaticPaths` + `render(entry)` + `<Content />`（替代旧 `bodyHtml` 模式）
- [ ] 读 `site/public/js/site.js` → 理解 `RayRAF`/`RayScroll` 双管理器（性能核心）
- [ ] 读 `site/public/css/style.css` 的 `:root` → 理解设计系统变量
- [ ] （历史）迁移脚本已移除：内容现已是手写 `*.astro` / `*.mdx`，直接编辑即可（详见 11.5 / 11.6）
- [ ] 读第 7 节「部署」→ 理解 `dist/` 已提交，改源码后必须 `npm run build` 并 commit 新的 `dist/`
- [ ] 读第 10 节「踩坑」→ 避免重犯已知错误
- [ ] 本地 `npm run dev` 起服务，肉眼验收（headless 不能替代肉眼看动效/视觉）

**不要做的事（Don'ts）**：
- ❌ 不要改 `build.format` 为 `directory`
- ❌ 不要恢复已删除的 `components.js`（BaseLayout 已静态渲染它的职责）
- ❌ 不要动 `inlineStyles` 里的页专属 `<style>`（丢了 Back 按钮等会错位）
- ❌ 不要拦截/改写 `javascript:` 链接
- ❌ 不要自己加 `visibilitychange`/`scroll` 监听（用 RayRAF/RayScroll）
- ❌ 不要把 `node_modules` 提交进 git
- ❌ 改源码后不要只 commit 源码而忘记 `npm run build` 并 commit 新的 `dist/`
- ❌ 不要发明新的动画曲线（用第 4.4 节的统一曲线）
- ❌ 未经确认不要 force push 覆盖 `RaysPage`（旧版历史在 `RaysPage-legacy`）

**核心心智模型**：这是「原版静态站的 Astro 壳化」，**还原优先于创新**。任何视觉/内容改动都要保证与原站等价（除非用户明确要求新设计）。所有「魔法」在 `site/public/` 的 JS/CSS 里，Astro 层只是组织与构建优化。

---

*文档更新日期：2026-07-09。本次更新：因 EdgeOne 构建失败，改为提交 `dist/` 并由 EdgeOne 直接服务静态产物。如有代码演进，请以实际文件为准并同步更新本文件。*
