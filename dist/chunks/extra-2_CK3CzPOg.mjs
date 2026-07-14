import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "查理·芒格的原则",
  "book": "查理·芒格的原则",
  "date": "2024-07-10",
  "excerpt": "\n<p>\n<strong>\n好球理论\n</strong>\n</p>\n<p class=\"note-quote\">\n一些格子。在大多数时候，你什么也不用做，只要看着就好了。每隔一段时间，你将会发现一个速度很慢、线路又直，而且正好落在你最爱的格子中间的\"好球\"，那时你就全力出击。这样呢，不管你的天分如何，你都能极大地提高你的上垒率。\n</p>\n\n\n<p>\n<strong>\n挥棒太频繁\n</strong>\n</p>\n<p class=\"note-quote\">\n许多投资者的共同问题是他们\n<strong>\n挥棒太过频繁\n</strong>\n。无论是个人投资者，还是受\"机构行为铁律\"所驱使的专业投资者，他们都有这种倾向。这种\"机构行为铁律\"的某一变种也是让我离开同时做长线和短线投资的对冲基金的原因。\n</p>\n\n\n<p>\n<strong>\n资本的集中\n</strong>\n</p>\n<p class=\"note-quote\">\n另外一个与挥棒太频繁相对立的问题也同样有害于长期的结果：你发现一个\"好球\"，却\n<strong>\n无法用全部的资本去出击\n</strong>\n。\n</p>\n",
  "tags": ["Investing"],
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
      children: createVNode("strong", {
        children: createVNode(_components.p, {
          children: "好球理论"
        })
      })
    }), "\n", createVNode("p", {
      class: "note-quote",
      children: createVNode(_components.p, {
        children: "一些格子。在大多数时候，你什么也不用做，只要看着就好了。每隔一段时间，你将会发现一个速度很慢、线路又直，而且正好落在你最爱的格子中间的”好球”，那时你就全力出击。这样呢，不管你的天分如何，你都能极大地提高你的上垒率。"
      })
    }), "\n", createVNode("p", {
      children: createVNode("strong", {
        children: createVNode(_components.p, {
          children: "挥棒太频繁"
        })
      })
    }), "\n", createVNode("p", {
      class: "note-quote",
      children: [createVNode(_components.p, {
        children: "许多投资者的共同问题是他们"
      }), createVNode("strong", {
        children: createVNode(_components.p, {
          children: "挥棒太过频繁"
        })
      }), createVNode(_components.p, {
        children: "。无论是个人投资者，还是受”机构行为铁律”所驱使的专业投资者，他们都有这种倾向。这种”机构行为铁律”的某一变种也是让我离开同时做长线和短线投资的对冲基金的原因。"
      })]
    }), "\n", createVNode("p", {
      children: createVNode("strong", {
        children: createVNode(_components.p, {
          children: "资本的集中"
        })
      })
    }), "\n", createVNode("p", {
      class: "note-quote",
      children: [createVNode(_components.p, {
        children: "另外一个与挥棒太频繁相对立的问题也同样有害于长期的结果：你发现一个”好球”，却"
      }), createVNode("strong", {
        children: createVNode(_components.p, {
          children: "无法用全部的资本去出击"
        })
      }), createVNode(_components.p, {
        children: "。"
      })]
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

const url = "site/src/content/notes/extra-2.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-2.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-2.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
