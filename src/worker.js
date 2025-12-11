import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    const options = {
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      ASSET_MANIFEST: assetManifest,
    };

    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        options
      );
    } catch (e) {
      // SPA Fallback
      try {
        return await getAssetFromKV(
          {
            request: new Request(new URL(request.url).origin + '/index.html', request),
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          options
        );
      } catch (indexError) {
        return new Response('Not found', { status: 404 });
      }
    }
  },
};
