# Ray's Page

Ray Chan 的个人网站，收录个人介绍、Soul-Searching 文章、阅读笔记与摄影作品。项目使用 Astro 生成静态 HTML，并由 EdgeOne 发布仓库中已构建的 `dist/` 目录。

## 技术栈

- Astro 7：静态站点生成器，负责页面、内容集合与构建。
- MDX：在 Markdown 内容中使用组件化结构。
- TypeScript：用于页面数据、内容模型与自动化测试。
- Playwright：在真实浏览器中检查桌面端、移动端、交互与无障碍问题。

## 本地运行

需要 Node.js 22.12.0 或更高版本；仓库的 `.nvmrc` 固定了团队使用的 Node.js 版本。

```bash
npm ci
npm run dev
```

开发服务器默认地址为 `http://localhost:4321`。

## 常用命令

```bash
npm run check      # Astro 与 TypeScript 检查
npm run build      # 构建静态网站到 dist/
npm run validate   # 校验构建产物、链接、HTML 结构与安全响应头配置
npm test           # 依次执行检查、构建和产物校验
npm run test:e2e   # 执行桌面端和移动端浏览器回归测试
npm run audit      # 检查高危依赖漏洞
npm run preview    # 本地预览 Astro 构建结果
```

首次执行端到端测试前，可能需要安装 Chromium：

```bash
npx playwright install chromium
```

## 项目结构

```text
site/src/content/   Soul-Searching 文章与阅读笔记（MDX）
site/src/data/      摄影作品等结构化数据
site/src/layouts/   全站共用页面骨架
site/src/pages/     页面与 JSON、RSS、Sitemap 输出入口
site/public/        样式、脚本、照片等静态资源
scripts/            构建产物校验和本地静态服务器
tests/              Playwright 浏览器回归测试
dist/               提交并用于线上发布的构建产物
```

## 内容维护

- 新文章放入 `site/src/content/essays/`，并沿用现有文件的 frontmatter（文件顶部元数据）字段。
- 新阅读笔记放入 `site/src/content/notes/`。
- 摄影系列与图片元数据维护在 `site/src/data/photos.ts`；每张图片都应提供能说明画面的 `alt` 替代文本。
- 内容日期相同时，网站会使用内容 ID 作为固定的第二排序条件，避免不同环境下顺序漂移。

## 构建与发布

GitHub Actions 会在推送或 Pull Request（合并请求）时执行依赖审计、类型检查、构建、产物校验和浏览器测试。EdgeOne 直接发布仓库内的 `dist/`，因此修改源代码后必须重新执行 `npm test`，并将对应的 `dist/` 变化一同提交，否则 CI 会失败。

`main` 是受保护分支：改动应提交到 `codex/*` 等工作分支，通过 Pull Request 合并；名为 `validate` 的 CI 检查必须通过，但个人仓库不要求额外审批。Dependabot 每周检查 npm 依赖、每月检查 GitHub Actions 依赖，安全修复会以可审核的 Pull Request 提交。

项目当前不需要本地环境变量，也不要把令牌、密码或私钥写入仓库。
