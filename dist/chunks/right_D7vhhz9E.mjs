import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "不是做错什么，而是没做对什么",
  "date": "2026-07-06",
  "description": "有时候不是你做错什么，而是你没做对什么。",
  "excerpt": "有时候不是你做错什么，而是你没做对什么。",
  "tags": ["Business"],
  "ogImage": "https://www.raychan.top/assets/og/essay-right.png"
};
function getHeadings() {
  return [];
}
const __usesAstroImage = true;
function _createMdxContent(props) {
  const _components = {
    p: "p",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode("div", {
      id: "global-bg-effect",
      class: "hero-bg-effect",
      children: [createVNode("div", {
        class: "hero-glow-line hero-glow-line--indigo-blur"
      }), createVNode("div", {
        class: "hero-glow-line hero-glow-line--indigo"
      }), createVNode("div", {
        class: "hero-glow-line hero-glow-line--sky-blur"
      }), createVNode("div", {
        class: "hero-glow-line hero-glow-line--sky"
      }), createVNode("canvas", {
        id: "hero-sparkle-canvas"
      })]
    }), "\n", createVNode("a", {
      href: "essays.html",
      class: "note-back-fixed",
      "data-lenis-prevent": true,
      children: createVNode(_components.p, {
        children: "← Back"
      })
    }), "\n", createVNode("section", {
      class: "essay-hero",
      children: createVNode("div", {
        class: "container",
        children: [createVNode("h1", {
          class: "essay-hero-title",
          children: createVNode(_components.p, {
            children: ["不是做错什么，\n", createVNode("br", {}), "而是没做对什么"]
          })
        }), createVNode("div", {
          class: "essay-meta",
          children: [createVNode("span", {
            class: "essay-date",
            children: createVNode(_components.p, {
              children: "2026.07.06"
            })
          }), createVNode("span", {
            class: "essay-tag",
            children: createVNode(_components.p, {
              children: "Business"
            })
          })]
        })]
      })
    }), "\n", createVNode("article", {
      class: "essay-content section",
      children: createVNode("div", {
        class: "container",
        children: createVNode("div", {
          class: "essay-body",
          children: [createVNode("div", {
            class: "essay-quote-block",
            children: [createVNode("p", {
              class: "essay-quote-text",
              children: createVNode(_components.p, {
                children: "今天刷到一个非常感慨的事情，健身服务 Keep 因递交招股书 6 个月内未通过聆讯，IPO 申请状态已转为「失败」，这大概率意味着本次冲刺 IPO 失败了。"
              })
            }), createVNode("p", {
              class: "essay-quote-text",
              children: createVNode(_components.p, {
                children: "9 轮融资了超过 8 亿美金、估值 130 亿如今沦为「卖货」平台，2021 年前三个季度，Keep 亏损更是达到 24.58 亿元。在 Web2.0 的世界里，资本退出最大的路径就是上市，但大环境直接扼杀了这条路径。"
              })
            }), createVNode("p", {
              class: "essay-quote-text",
              children: createVNode(_components.p, {
                children: "对比下类似的 Web3 应用 Stepn，同样赛道、相似的用户群、百分之一的用户数，上线不到一年估值就超过了 10 亿美金，更关键的是，项目方赚钱啊，实实在在的真金白银，Stepn 月收入超 7 亿元，每日交易费用净利润达 3342 万元，而 Stepn 用户仅仅有 300 万不到，Keep 用户超过 3 亿。"
              })
            })]
          }), createVNode("p", {
            class: "essay-conclusion",
            children: createVNode(_components.p, {
              children: "有时候不是你做错什么，而是你没做对什么。"
            })
          })]
        })
      })
    })]
  });
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? createVNode(MDXLayout, {
    ...props,
    children: createVNode(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}

const url = "site/src/content/essays/right.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/right.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/right.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
