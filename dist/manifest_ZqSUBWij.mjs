import '@astrojs/internal-helpers/path';
import 'cookie';
import 'kleur/colors';
import 'es-module-lexer';
import { N as NOOP_MIDDLEWARE_HEADER, s as decodeKey } from './chunks/astro/server_DWVLDh39.mjs';
import 'clsx';
import 'html-escaper';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from tRPC error code table
  // https://trpc.io/docs/server/error-handling#error-codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 405,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_CONTENT: 422,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
  INTERNAL_SERVER_ERROR: 500
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/ray/PersonalProject/rayspage-astro/","adapterName":"","routes":[{"file":"file:///Users/ray/PersonalProject/rayspage-astro/dist/404.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/404","isIndex":false,"type":"page","pattern":"^\\/404\\/?$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"site/src/pages/404.astro","pathname":"/404","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"file:///Users/ray/PersonalProject/rayspage-astro/dist/essays.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/essays","isIndex":false,"type":"page","pattern":"^\\/essays\\/?$","segments":[[{"content":"essays","dynamic":false,"spread":false}]],"params":[],"component":"site/src/pages/essays.astro","pathname":"/essays","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"file:///Users/ray/PersonalProject/rayspage-astro/dist/notes.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/notes","isIndex":false,"type":"page","pattern":"^\\/notes\\/?$","segments":[[{"content":"notes","dynamic":false,"spread":false}]],"params":[],"component":"site/src/pages/notes.astro","pathname":"/notes","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"file:///Users/ray/PersonalProject/rayspage-astro/dist/photos.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/photos","isIndex":false,"type":"page","pattern":"^\\/photos\\/?$","segments":[[{"content":"photos","dynamic":false,"spread":false}]],"params":[],"component":"site/src/pages/photos.astro","pathname":"/photos","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"file:///Users/ray/PersonalProject/rayspage-astro/dist/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"site/src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/ray/PersonalProject/rayspage-astro/site/src/pages/404.astro",{"propagation":"none","containsHead":true}],["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["/Users/ray/PersonalProject/rayspage-astro/site/src/pages/essay-[slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:site/src/pages/essay-[slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/ray/PersonalProject/rayspage-astro/site/src/pages/essays.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:site/src/pages/essays@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/ray/PersonalProject/rayspage-astro/site/src/pages/note-[slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:site/src/pages/note-[slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/ray/PersonalProject/rayspage-astro/site/src/pages/notes.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:site/src/pages/notes@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/ray/PersonalProject/rayspage-astro/site/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/Users/ray/PersonalProject/rayspage-astro/site/src/pages/photos.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(o,t)=>{let i=async()=>{await(await o())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astro-page:site/src/pages/404@_@astro":"pages/404.astro.mjs","\u0000@astro-page:site/src/pages/essay-[slug]@_@astro":"pages/essay-_slug_.astro.mjs","\u0000@astro-page:site/src/pages/essays@_@astro":"pages/essays.astro.mjs","\u0000@astro-page:site/src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-page:site/src/pages/note-[slug]@_@astro":"pages/note-_slug_.astro.mjs","\u0000@astro-page:site/src/pages/notes@_@astro":"pages/notes.astro.mjs","\u0000@astro-page:site/src/pages/photos@_@astro":"pages/photos.astro.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000@astrojs-manifest":"manifest_ZqSUBWij.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/choice.mdx?astroContentCollectionEntry=true":"chunks/choice_-qNHAjST.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/driving.mdx?astroContentCollectionEntry=true":"chunks/driving_DNq9oD5U.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/foam.mdx?astroContentCollectionEntry=true":"chunks/foam_DJ3x5ap6.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/heroism.mdx?astroContentCollectionEntry=true":"chunks/heroism_BqHMh5Km.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/pdca.mdx?astroContentCollectionEntry=true":"chunks/pdca_DRTCCG_p.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/right.mdx?astroContentCollectionEntry=true":"chunks/right_Cmsa20qT.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/stardust.mdx?astroContentCollectionEntry=true":"chunks/stardust_BmZd4Qug.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/threethings.mdx?astroContentCollectionEntry=true":"chunks/threethings_CQ6Y8FFN.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/trial.mdx?astroContentCollectionEntry=true":"chunks/trial_DetTZvMZ.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-1.mdx?astroContentCollectionEntry=true":"chunks/extra-1_CO-r2XkE.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-2.mdx?astroContentCollectionEntry=true":"chunks/extra-2_uIC3t6GS.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-3.mdx?astroContentCollectionEntry=true":"chunks/extra-3_f3Hlp-Ke.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-4.mdx?astroContentCollectionEntry=true":"chunks/extra-4_Cv90suXT.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-5.mdx?astroContentCollectionEntry=true":"chunks/extra-5_CDU-umdi.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/katwu-lenny.mdx?astroContentCollectionEntry=true":"chunks/katwu-lenny_B9UjC16u.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/principles.mdx?astroContentCollectionEntry=true":"chunks/principles_B3SOgRBZ.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/choice.mdx?astroPropagatedAssets":"chunks/choice_ynBdqXha.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/driving.mdx?astroPropagatedAssets":"chunks/driving_DwdXJ9OQ.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/foam.mdx?astroPropagatedAssets":"chunks/foam_DkSgBRky.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/heroism.mdx?astroPropagatedAssets":"chunks/heroism_NzO5B2CE.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/pdca.mdx?astroPropagatedAssets":"chunks/pdca_PVYAErQ3.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/right.mdx?astroPropagatedAssets":"chunks/right_BJtw-o5K.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/stardust.mdx?astroPropagatedAssets":"chunks/stardust_BIkGALmZ.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/threethings.mdx?astroPropagatedAssets":"chunks/threethings_CMnnj42w.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/trial.mdx?astroPropagatedAssets":"chunks/trial_DXFsqUpL.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-1.mdx?astroPropagatedAssets":"chunks/extra-1_CE8VDAJD.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-2.mdx?astroPropagatedAssets":"chunks/extra-2_CWt64apt.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-3.mdx?astroPropagatedAssets":"chunks/extra-3_DTBpUNU-.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-4.mdx?astroPropagatedAssets":"chunks/extra-4_Cg0p4_j7.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-5.mdx?astroPropagatedAssets":"chunks/extra-5_CY66cSuo.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/katwu-lenny.mdx?astroPropagatedAssets":"chunks/katwu-lenny_B3Y61GYt.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/principles.mdx?astroPropagatedAssets":"chunks/principles_DoKds2Ex.mjs","\u0000astro:asset-imports":"chunks/_astro_asset-imports_D9aVaOQr.mjs","\u0000astro:assets":"chunks/_astro_assets_ByRBUaOh.mjs","\u0000astro:content-module-imports":"chunks/_astro_content-module-imports_B0nxoYfl.mjs","\u0000astro:data-layer-content":"chunks/_astro_data-layer-content_BcEe_9wP.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/choice.mdx":"chunks/choice_Dfo_DLLO.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/driving.mdx":"chunks/driving_Phm6g5rv.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/foam.mdx":"chunks/foam_DilDjKTE.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/heroism.mdx":"chunks/heroism_CBpzrhez.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/pdca.mdx":"chunks/pdca_DpAHxyA-.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/right.mdx":"chunks/right_D7vhhz9E.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/stardust.mdx":"chunks/stardust_DTcf16J4.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/threethings.mdx":"chunks/threethings_CGl7bAER.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/essays/trial.mdx":"chunks/trial_D1csCsIs.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-1.mdx":"chunks/extra-1_C9DRBnSs.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-2.mdx":"chunks/extra-2_CK3CzPOg.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-3.mdx":"chunks/extra-3_Cv3MUDAt.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-4.mdx":"chunks/extra-4_YaAuKxzz.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/extra-5.mdx":"chunks/extra-5_BeFVyYf0.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/katwu-lenny.mdx":"chunks/katwu-lenny_CtHCPgwz.mjs","/Users/ray/PersonalProject/rayspage-astro/site/src/content/notes/principles.mdx":"chunks/principles_DfVRP0_9.mjs","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/file:///Users/ray/PersonalProject/rayspage-astro/dist/404.html","/file:///Users/ray/PersonalProject/rayspage-astro/dist/essays.html","/file:///Users/ray/PersonalProject/rayspage-astro/dist/notes.html","/file:///Users/ray/PersonalProject/rayspage-astro/dist/photos.html","/file:///Users/ray/PersonalProject/rayspage-astro/dist/index.html"],"buildFormat":"file","checkOrigin":false,"serverIslandNameMap":[],"key":"sI1wxegH75903VeGjJ6x4W4Li884WcxEYLT+9z0nKi8=","experimentalEnvGetSecretEnabled":false});

export { manifest };
