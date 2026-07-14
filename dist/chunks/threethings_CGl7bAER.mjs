import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "三件事",
  "date": "2026-07-07",
  "description": "低谷期只需要在乎三件事：你自己，你的钱，你内心的平静。",
  "excerpt": "你自己，你的钱，你内心的平静。",
  "tags": ["Life"],
  "ogImage": "https://www.raychan.top/assets/og/essay-threethings.png"
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
            children: "三件事"
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
          children: [createVNode("p", {
            children: createVNode(_components.p, {
              children: "你处在低谷期的时候"
            })
          }), createVNode("p", {
            class: "meta-line",
            children: createVNode(_components.p, {
              children: "When you’re down in the dumps"
            })
          }), createVNode("p", {
            children: createVNode(_components.p, {
              children: "只需要在乎三件事情"
            })
          }), createVNode("p", {
            class: "meta-line",
            children: createVNode(_components.p, {
              children: "Only need to care about three things"
            })
          }), createVNode("p", {
            children: createVNode(_components.p, {
              children: "你自己，你的钱，你内心的平静"
            })
          }), createVNode("p", {
            class: "meta-line",
            children: createVNode(_components.p, {
              children: "Yourself, your money, and your inner peace"
            })
          }), createVNode("p", {
            children: createVNode(_components.p, {
              children: "生命周期性的暗潮只是暂时的"
            })
          }), createVNode("p", {
            class: "meta-line",
            children: createVNode(_components.p, {
              children: "The cyclic undercurrent of life is just temporary"
            })
          }), createVNode("p", {
            children: createVNode(_components.p, {
              children: "你正在死去"
            })
          }), createVNode("p", {
            class: "meta-line",
            children: createVNode(_components.p, {
              children: "You are dying"
            })
          }), createVNode("p", {
            children: createVNode(_components.p, {
              children: "但也将迎来重生"
            })
          }), createVNode("p", {
            class: "meta-line",
            children: createVNode(_components.p, {
              children: "But also bring about rebirth"
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

const url = "site/src/content/essays/threethings.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/threethings.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/threethings.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
