import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: __STATIC_CONTENT_MANIFEST,
        }
      );
    } catch (e) {
      // If the asset is not found, return a 404
      let pathname = new URL(request.url).pathname;
      return new Response(`Asset ${pathname} not found`, {
        status: 404,
        statusText: 'not found',
      });
    }
  },
};
