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

function generateToken(length = 16) {
  return generateId(length);
}

function renderHtml(html, css, js) {
  return `
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
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // API: Create Share (short links)
    if (request.method === 'POST' && pathname === '/api/share') {
      try {
        const data = await request.json();
        const id = generateId(6);
        const editToken = generateToken(16);
        await env.CODE_STORE.put(`view:${id}`, JSON.stringify(data));
        await env.CODE_STORE.put(`edit:${editToken}`, id);
        return new Response(JSON.stringify({ id, editToken }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response('Error saving code', { status: 500 });
      }
    }

    // API: Get Share by ID
    if (request.method === 'GET' && pathname.startsWith('/api/share/')) {
      const id = pathname.split('/').pop();
      const data = await env.CODE_STORE.get(`view:${id}`);
      if (!data) return new Response('Not found', { status: 404 });
      return new Response(data, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // API: Get Share by edit token
    if (request.method === 'GET' && pathname.startsWith('/api/share-edit/')) {
      const token = pathname.split('/').pop();
      const id = token ? await env.CODE_STORE.get(`edit:${token}`) : null;
      if (!id) return new Response('Not found', { status: 404 });
      const data = await env.CODE_STORE.get(`view:${id}`);
      if (!data) return new Response('Not found', { status: 404 });
      return new Response(data, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hosted View: short path /:id (no extension) — only when no edit token is present
    if (
      request.method === 'GET' &&
      !pathname.includes('.') &&
      pathname !== '/' &&
      !pathname.startsWith('/api/') &&
      !url.searchParams.has('e')
    ) {
      const id = pathname.slice(1);
      const dataStr = await env.CODE_STORE.get(`view:${id}`);
      if (dataStr) {
        const { html, css, js } = JSON.parse(dataStr);
        return new Response(renderHtml(html, css, js), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
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
