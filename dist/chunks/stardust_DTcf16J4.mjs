import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "星辰之子",
  "date": "2026-07-07",
  "description": "关于宇宙与生命的思考：我们身体里的每一种元素，都来自亿万光年外的星尘。",
  "tags": ["Cosmos"],
  "ogImage": "https://www.raychan.top/assets/og/essay-stardust.png"
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
      href: "javascript:history.back()",
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
            children: "星辰之子"
          })
        }), createVNode("div", {
          class: "essay-meta",
          children: [createVNode("span", {
            class: "essay-date",
            children: createVNode(_components.p, {
              children: "2026.07.07"
            })
          }), createVNode("span", {
            class: "essay-tag",
            children: createVNode(_components.p, {
              children: "Cosmos"
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
          children: [createVNode("p", {
            class: "essay-quote-text",
            children: createVNode(_components.p, {
              children: "“地球这样的行星，是产生不了重元素的，你身体里的铁，来自璀璨的超新星爆炸”"
            })
          }), createVNode("p", {
            class: "essay-quote-text",
            children: createVNode(_components.p, {
              children: "“血液里的锌，源自两次中子星对撞后喷射向宇宙的尘埃”"
            })
          }), createVNode("p", {
            class: "essay-quote-text",
            children: createVNode(_components.p, {
              children: "“那微量的铜，更是需要见证一颗白矮星的死亡，即使是最微不足道的钴，也源自几十亿光年外的星云”"
            })
          }), createVNode("p", {
            class: "essay-quote-text",
            children: createVNode(_components.p, {
              children: "“某种意义上讲，人类对星空怀有好奇，是正常的。”"
            })
          }), createVNode("p", {
            class: "essay-quote-text",
            children: createVNode(_components.p, {
              children: "“渴望见证星河大海的极限，因为我们本就是星辰之子。”"
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

const url = "site/src/content/essays/stardust.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/stardust.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/stardust.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
