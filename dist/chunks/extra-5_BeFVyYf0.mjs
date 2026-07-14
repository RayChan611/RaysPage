import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "平凡的世界",
  "book": "平凡的世界",
  "date": "2024-03-15",
  "excerpt": "\n<p class=\"note-quote\">\n谁让你读了这么多书，又知道了双水村以外还有个大世界……如果从小你就在这个天地里日出而作，日落而息，那你现在就会和众乡亲抱同一理想：经过几年的辛劳，像大哥一样娶个满意的媳妇，生个胖儿子，加上你的体魄，会成为一名出色的庄稼人。\n</p>\n<p class=\"note-quote\">\n不幸的是，你知道的太多了，思考的太多了，因此才有了这种不能为周围人所理解的苦恼。\n</p>\n",
  "tags": ["路遥"],
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
        children: "谁让你读了这么多书，又知道了双水村以外还有个大世界……如果从小你就在这个天地里日出而作，日落而息，那你现在就会和众乡亲抱同一理想：经过几年的辛劳，像大哥一样娶个满意的媳妇，生个胖儿子，加上你的体魄，会成为一名出色的庄稼人。"
      })
    }), "\n", createVNode("p", {
      class: "note-quote",
      children: createVNode(_components.p, {
        children: "不幸的是，你知道的太多了，思考的太多了，因此才有了这种不能为周围人所理解的苦恼。"
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

const url = "site/src/content/notes/extra-5.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-5.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-5.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
