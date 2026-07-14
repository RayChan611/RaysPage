import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "精神内耗",
  "book": "精神内耗",
  "date": "2024-11-12",
  "excerpt": "\n<p class=\"note-quote\">\n说白了就是自己心里的戏太多\n</p>\n<p class=\"note-quote\">\n言未出，结局已演千百遍\n</p>\n<p class=\"note-quote\">\n身未动，心中已过万重山\n</p>\n<p class=\"note-quote\">\n行未果，假象苦难愁不展\n</p>\n<p class=\"note-quote\">\n事已毕，过往仍在脑中演\n</p>\n<p style=\"text-align: right; color: var(--text-muted); margin-top: 16px;\">\n—— 余华\n</p>\n",
  "tags": ["余华"],
  "hasDetail": false
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
    children: [createVNode("p", {
      class: "note-quote",
      children: createVNode(_components.p, {
        children: "说白了就是自己心里的戏太多"
      })
    }), "\n", createVNode("p", {
      class: "note-quote",
      children: createVNode(_components.p, {
        children: "言未出，结局已演千百遍"
      })
    }), "\n", createVNode("p", {
      class: "note-quote",
      children: createVNode(_components.p, {
        children: "身未动，心中已过万重山"
      })
    }), "\n", createVNode("p", {
      class: "note-quote",
      children: createVNode(_components.p, {
        children: "行未果，假象苦难愁不展"
      })
    }), "\n", createVNode("p", {
      class: "note-quote",
      children: createVNode(_components.p, {
        children: "事已毕，过往仍在脑中演"
      })
    }), "\n", createVNode("p", {
      style: "text-align: right; color: var(--text-muted); margin-top: 16px;",
      children: createVNode(_components.p, {
        children: "—— 余华"
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

const url = "site/src/content/notes/extra-4.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-4.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-4.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
