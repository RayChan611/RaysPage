import { o as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_DWVLDh39.mjs';
import '@astrojs/internal-helpers/path';
import { Image as $$Image } from './_astro_assets_ByRBUaOh.mjs';
import 'clsx';

const frontmatter = {
  "title": "选择的代价",
  "date": "2026-07-01",
  "description": "关于选择与代价的思考：每个选择都有价格，只是高低不同。",
  "excerpt": "\"我只能说，给出的条件够不够让你做出那个选择。\"——每个选择都有价格，只是高低不同。",
  "tags": ["Choice"],
  "ogImage": "https://www.raychan.top/assets/og/essay-choice.png"
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
            children: "选择的代价"
          })
        }), createVNode("div", {
          class: "essay-meta",
          children: [createVNode("span", {
            class: "essay-date",
            children: createVNode(_components.p, {
              children: "2026.07.01"
            })
          }), createVNode("span", {
            class: "essay-tag",
            children: createVNode(_components.p, {
              children: "Choice"
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
          children: [createVNode("h2", {
            children: createVNode(_components.p, {
              children: "每个选择都有价格"
            })
          }), createVNode("p", {
            children: createVNode(_components.p, {
              children: "选择从来不是孤立的，它依赖于当时能看到的条件。人能做出的选择，永远被当时能接触到的条件所框定。不是不想跳，是脚下没有可以落脚的石头。"
            })
          }), createVNode("p", {
            children: [createVNode(_components.p, {
              children: "每一个选择都有价格。不是说有的选择没代价，只是看你愿不愿意正视它。"
            }), createVNode("strong", {
              children: createVNode(_components.p, {
                children: "没有”免费的选择”，只有隐藏的账单。"
              })
            })]
          }), createVNode("h2", {
            children: createVNode(_components.p, {
              children: "价格是相对的"
            })
          }), createVNode("p", {
            children: createVNode(_components.p, {
              children: "同样一件事，对不同的人价格不一样。价格不是客观的，是相对于你的处境、阶段、资源结构而言的。所以不要用你的选择去判断别人——你不知道他看到的价格是多少。"
            })
          }), createVNode("h2", {
            children: createVNode(_components.p, {
              children: "不选也是选"
            })
          }), createVNode("p", {
            children: createVNode(_components.p, {
              children: "人性就是会为看不到代价的选择，付出更高的代价。我们以为不选就不用付，其实不选本身就是一个选择——代价是别人在替你选、时代在替你选、惰性在替你选。"
            })
          }), createVNode("p", {
            children: [createVNode(_components.p, {
              children: "真正的成熟，不是看穿所有代价，而是知道："
            }), createVNode("strong", {
              children: createVNode(_components.p, {
                children: "每个选择都有价，差别只在于那个价，你愿不愿意付。"
              })
            })]
          }), createVNode("h2", {
            children: createVNode(_components.p, {
              children: "知道自己的价位"
            })
          }), createVNode("p", {
            children: createVNode(_components.p, {
              children: "成熟的决策者，不是不计代价，而是提前知道自己的价位：能承受多少、不能承受什么、愿意为哪些东西放弃哪些东西。有了价位，决策就成了主动的筛选——你不是在选”最对的”，而是在选”我愿意为之付的”。"
            })
          }), createVNode("h2", {
            children: createVNode(_components.p, {
              children: "相变的潜热"
            })
          }), createVNode("p", {
            children: [createVNode(_components.p, {
              children: "万物运行的逻辑都差不多。分裂、聚变是怎么来的？都是粒子在”选择”——在外力作用下，跨过一个能垒，落到能量更低的态。人也是如此："
            }), createVNode("strong", {
              children: createVNode(_components.p, {
                children: "每一个选择都是一次相变，跨过临界点，世界就不一样了。"
              })
            }), createVNode(_components.p, {
              children: "价格不是代价，价格是相变的潜热。你付了，才能变。"
            })]
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

const url = "site/src/content/essays/choice.mdx";
const file = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/choice.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/choice.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, __usesAstroImage, Content as default, file, frontmatter, getHeadings, url };
