import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

function generateId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API: Create Share
    if (request.method === 'POST' && url.pathname === '/api/share') {
      try {
        const data = await request.json();
        const id = generateId();
        await env.CODE_STORE.put(id, JSON.stringify(data));
        return new Response(JSON.stringify({ id }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response('Error saving code', { status: 500 });
      }
    }

    // API: Get Share
    if (request.method === 'GET' && url.pathname.startsWith('/api/share/')) {
      const id = url.pathname.split('/').pop();
      const data = await env.CODE_STORE.get(id);
      if (!data) return new Response('Not found', { status: 404 });
      return new Response(data, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hosted View: /view/:id
    if (request.method === 'GET' && url.pathname.startsWith('/view/')) {
      const id = url.pathname.split('/').pop();
      const dataStr = await env.CODE_STORE.get(id);
      if (!dataStr) return new Response('Not found', { status: 404 });
      
      const { html, css, js } = JSON.parse(dataStr);
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>
              try {
                ${js}
              } catch (err) {
                console.error(err);
              }
            </script>
          </body>
        </html>
      `;
      return new Response(fullHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

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
