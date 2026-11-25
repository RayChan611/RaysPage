# Ray Chan 个人网站技术问答

## 网站有哪些内容？

`www.raychan.top` 收录个人介绍、Soul-Searching 文章、读书笔记和摄影作品。首页的 Recent Entries 会展示最新文章、最新读书笔记，以及一组轮播照片。 [首页模板](../site/src/pages/index.astro) · [项目说明](../README.md)

## Astro 架构是什么？和手写网页有什么区别？

这个站使用 Astro 7 做**静态站点生成（SSG）**。构建时，Astro 读取内容、套用模板，提前生成 HTML。访客访问时，浏览器收到的仍然是普通的 HTML、CSS 和 JavaScript。 [Astro 配置](../astro.config.mjs)

手写 HTML 时，通常直接编辑最终的网页文件。这里把文章内容和页面模板分开维护。一份文章内容可以同时生成正文页、首页入口和目录条目。全站共用的导航和页脚也能在同一个模板里修改。每次内容更新都通过一次构建和发布交付。 [共用布局](../site/src/layouts/BaseLayout.astro) · [文章模板](../site/src/pages/essay-%5Bslug%5D.astro)

## 一篇文章怎么变成网页？

以《一知半解》为例。正文写在 `yizhibanjie.mdx`，顶部记录标题、日期和排版方式。MDX 是可以嵌入网页组件的 Markdown。Astro 的内容集合会统一读取文章和笔记，并检查日期、必填字段等规则。 [文章源文件](../site/src/content/essays/yizhibanjie.mdx) · [内容规则](../site/src/content.config.ts)

文章模板为每篇已发布的文章生成独立地址。《一知半解》的地址是 `/essay-yizhibanjie.html`。首页按日期选出最新文章，目录、搜索索引、RSS 订阅和站点地图也会在构建时更新。 [文章模板](../site/src/pages/essay-%5Bslug%5D.astro) · [首页模板](../site/src/pages/index.astro) · [搜索索引生成](../site/src/pages/search-index.json.ts)

## 静态网站怎么实现搜索和轮播？

JavaScript 在访客的浏览器里处理打字机、照片轮播和搜索等交互。打开全站搜索时，浏览器读取构建时生成的 `search-index.json`，然后在本地匹配关键词。摄影集也预先生成了不同尺寸的 WebP 图片，浏览器可以按屏幕和使用场景加载合适的版本。 [搜索脚本](../site/public/js/quick-search.js) · [轮播脚本](../site/public/js/recent-entries.js) · [图片维护说明](../README.md#内容维护)

## 源文件、模板和发布文件分别放在哪里？

| 路径 | 用途 |
| --- | --- |
| [`site/src/content/`](../site/src/content/) | 文章和读书笔记 |
| [`site/src/pages/`](../site/src/pages/) | 页面模板，以及搜索索引、RSS 和站点地图的生成入口 |
| [`site/src/layouts/`](../site/src/layouts/) | 导航、页脚等全站共用的页面布局 |
| [`site/src/data/photos.ts`](../site/src/data/photos.ts) | 摄影系列、图片标题和替代文本 |
| [`site/public/`](../site/public/) | 样式、脚本、图片等随站点发布的资源 |
| [`dist/`](../dist/) | 构建生成并提交到 GitHub 的成品文件 |
| `docs/` | 在 GitHub 仓库中阅读的项目文档 |

## 从修改到上线经过哪些步骤？

1. 在工作分支修改源文件。本地运行 `npm test`，依次进行代码检查、构建和成品校验。Node.js 提供构建环境，npm 负责安装依赖和运行项目命令。 [项目命令](../package.json) · [Node.js 版本配置](../.nvmrc)
2. 把源文件和生成好的 `dist/` 一起提交，再向 `main` 发起合并请求。GitHub Actions 会重新构建、运行浏览器测试，并核对重建的文件和仓库里提交的 `dist/` 是否一致。 [自动检查配置](../.github/workflows/ci.yml)
3. 所需的 `validate` 检查通过后，合并请求可以进入受保护的 `main` 分支。EdgeOne Pages 随后发布仓库中准备好的 `dist/`。 [发布说明](../README.md#构建与发布)

## EdgeOne 在这个站里做什么？

- **静态托管和 CDN。** EdgeOne Pages 托管 HTML、图片等成品。CDN 是分布式的内容分发节点，可以把缓存的文件直接发送给访客。
- **域名和 HTTPS。** `www.raychan.top` 通过 CNAME（域名别名）指向 EdgeOne Pages。访客用 HTTPS 加密访问。`raychan.top` 会通过 301 永久跳转到带 `www` 的域名。
- **缓存和浏览器规则。** `edgeone.json` 设置页面的缓存规则和安全响应头。HTML 缓存副本复用前需要确认是否更新。构建脚本还会给 CSS 和 JavaScript 的文件名加上按内容计算的版本标识，让新版网页引用对应版本的样式和脚本。 [EdgeOne 配置](../edgeone.json) · [资源版本化脚本](../scripts/version-static-assets.mjs)

## 本地怎么查看和验证网站？

使用仓库 [`.nvmrc`](../.nvmrc) 指定的 Node.js 版本，在仓库根目录运行这些命令。首次运行浏览器测试所需的准备步骤见项目说明。 [本地开发说明](../README.md#本地运行)

| 命令 | 用途 |
| --- | --- |
| `npm ci` | 按依赖版本锁定文件安装依赖 |
| `npm run dev` | 启动本地开发预览，适合边改边看 |
| `npm test` | 检查代码、生成 `dist/`，并校验成品 |
| `npm run preview` | 预览刚构建的成品 |
| `npm run test:e2e` | 用 Playwright 驱动浏览器，测试桌面和手机访问流程 |

## 为什么这套架构适合这个网站？

文章、笔记和照片按次更新，构建时可以把同一份内容同步到正文、目录和搜索。浏览器拿到完整 HTML 后就可以开始渲染。线上主要由静态托管和 CDN 提供文件，Node.js 的运行集中在构建和检查阶段。 [构建与发布](../README.md#构建与发布)
