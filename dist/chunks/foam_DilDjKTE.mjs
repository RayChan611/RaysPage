import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "泡沫消散之后",
  "date": "2026-07-06",
  "description": "人只能活在真实的爱、到手的钱和落地的实事中。",
  "excerpt": "人只能活在真实的爱、到手的钱和落地的实事中。",
  "tags": ["Life"],
  "ogImage": "https://www.raychan.top/assets/og/essay-foam.png"
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
            children: "泡沫消散之后"
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
              children: "Life"
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
          children: createVNode("div", {
            class: "essay-quote-block",
            children: [createVNode("p", {
              class: "essay-quote-text",
              children: createVNode(_components.p, {
                children: "当泡沫渐渐消散，才会发现真实的世界，那些虚幻的、昂贵的、光鲜的都只是生活的点缀。"
              })
            }), createVNode("p", {
              class: "essay-quote-text",
              children: createVNode(_components.p, {
                children: "人只能活在真实的爱、到手的钱和落地的实事中，其他的什么 drama 剧情 idolize big name 都只是餐盘边缘的鱼子酱，加一点会很漂亮，吃了也有可能会想吐。"
              })
            })]
          })
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

const url = "site/src/content/essays/foam.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/foam.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/foam.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
