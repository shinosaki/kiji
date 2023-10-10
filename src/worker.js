import { Hono } from 'hono';
import { cache } from 'hono/cache'
import { serveStatic } from 'hono/cloudflare-workers';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import config from '$config';
import App from './app';

const app = new Hono();

if (config.cache?.maxAge) {
  app.use('*', cache({
    cacheName: 'blog',
    cacheControl: `max-age=${config.cache.maxAge}`
  }));
};

app.use('*', async (c, next) => {
  const kv = c.env.__STATIC_CONTENT;
  const manifest = JSON.parse(manifestJSON);

  c.fetch = (path, type = 'text') => kv.get(manifest[path], { type });

  await next();
});

app.route('/', App);

app.use('/static/*', serveStatic({ root: '.' }));
app.use('/posts/img/*', serveStatic({ root: '.' }));

export default app;
