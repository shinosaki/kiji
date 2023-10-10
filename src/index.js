import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { promises as fs } from 'fs';
import config from '$config';
import App from './app';

const app = new Hono();

if (config.cache?.maxAge) {
  app.use('*', async (c, next) => {
    c.header('Cache-Control', `max-age=${config.cache.maxAge ?? 86400}`);
    await next();
  });
};

app.use('*', async (c, next) => {
  c.fetch = (path, type = 'text') => fs.readFile(`./assets/${path}`).then(r =>
    (type === 'json') ? JSON.parse(r)
    : (type === 'arrayBuffer') ? r
    : r.toString()
  );

  await next();
});

app.route('/', App);

app.use('/static/*', serveStatic({ root: './assets' }));
app.use('/posts/img/*', serveStatic({ root: '.' }));

export default app;
