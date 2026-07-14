import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "真实的 PDCA",
  "date": "2026-07-06",
  "description": "Plan-delay-cancel-apologize。",
  "excerpt": "Plan-delay-cancel-apologize",
  "tags": ["Quote"],
  "ogImage": "https://www.raychan.top/assets/og/essay-pdca.png"
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
            children: "真实的 PDCA"
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
              children: "Quote"
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
                children: "和项目管理的朋友聊天，谈到了 PDCA 循环管理方法。"
              })
            }), createVNode("p", {
              class: "essay-quote-text",
              children: createVNode("span", {
                class: "pdca-line pdca-ideal",
                children: createVNode(_components.p, {
                  children: "理想的 PDCA: Plan-do-check-act"
                })
              })
            }), createVNode("p", {
              class: "essay-quote-text",
              children: createVNode("span", {
                class: "pdca-line pdca-real",
                children: createVNode(_components.p, {
                  children: "真实的 PDCA: Plan-delay-cancel-apologize"
                })
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

const url = "site/src/content/essays/pdca.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/pdca.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/pdca.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
