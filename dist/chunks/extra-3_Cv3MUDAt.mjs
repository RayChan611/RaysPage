import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "AI 交易时代",
  "book": "AI 交易时代",
  "date": "2024-09-05",
  "excerpt": "\n<p class=\"note-quote\">\n不是每次都要赢，但每次都要成长——这才是交易真正教会我们的事。\n</p>\n\n\n<p class=\"note-quote\">\n在当下的 AI 交易时代，真正的优势不是跑得更快，而是想得更远。\n</p>\n",
  "tags": ["AI · Quant"],
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
        children: "不是每次都要赢，但每次都要成长——这才是交易真正教会我们的事。"
      })
    }), "\n", createVNode("p", {
      class: "note-quote",
      children: createVNode(_components.p, {
        children: "在当下的 AI 交易时代，真正的优势不是跑得更快，而是想得更远。"
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

const url = "site/src/content/notes/extra-3.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-3.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-3.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
