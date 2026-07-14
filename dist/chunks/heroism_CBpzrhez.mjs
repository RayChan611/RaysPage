import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "真正的英雄主义",
  "date": "2026-07-13",
  "description": "罗曼·罗兰：世界上只有一种真正的英雄主义，那就是在认清生活的真相后，依旧热爱生活。",
  "excerpt": "在认清生活的真相后，依旧热爱生活。",
  "tags": ["Life", "Quote"],
  "ogImage": "https://www.raychan.top/images/essays/heroism-2026-07-13.jpg"
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
            children: "真正的英雄主义"
          })
        }), createVNode("div", {
          class: "essay-meta",
          children: [createVNode("span", {
            class: "essay-date",
            children: createVNode(_components.p, {
              children: "2026.07.13"
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
          children: [createVNode("div", {
            class: "essay-quote-block",
            children: createVNode("p", {
              class: "essay-quote-text",
              children: createVNode(_components.p, {
                children: "“世界上只有一种真正的英雄主义，那就是在认清生活的真相后，依旧热爱生活。”"
              })
            })
          }), createVNode("p", {
            class: "meta-line",
            children: createVNode(_components.p, {
              children: "— Romain Rolland"
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

const url = "site/src/content/essays/heroism.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/heroism.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/heroism.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
