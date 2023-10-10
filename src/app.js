import { Hono } from 'hono';
import { getRuntimeKey } from 'hono/adapter';
import { z } from 'zod';
import { marked } from 'marked';
import config from '$config';
import { yyyymmdd, pagination, parseFrontMatter, escaping } from '$utils';

const app = new Hono();

app.use('*', async (c, next) => {
  const url = new URL(c.req.url);

  if (config.onion) {
    c.header('Onion-Location', `http://${config.onion}${url.pathname}`);
  };

  await next();
});

app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const data = await c.fetch('posts.json', 'json');

  c.setRenderer((children, props = {}) => c.html(`<!DOCTYPE html>
<html lang="${config.lang ?? 'en'}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="/static/style.css" rel="stylesheet">
    <title>${props.title ? escaping(props.title) + ' - ' : ''}${config.app.name}</title>
  </head>
  <body>
    <div class="min-h-screen text-gray-100 bg-stone-800">
      <header class="px-20 py-10 flex items-center justify-between shadow-lg border-b border-white/30">
        <a href="/" class="contents">
          <p class="text-4xl font-bold text-center">${config.app.name}</p>
        </a>
        <ul class="hidden md:flex gap-10">
          ${config.menus?.map(({ title, link }) => 
            <li class="text-lg">
              <a href={link}>{title}</a>
            </li>
          ).join('')}
          <li class="text-lg ${(config.onion) ?? 'hidden'}">
            <a href="${`http://${config.onion}${url.pathname}`}">Onion Service</a>
          </li>
        </ul>
      </header>
      <main class="mx-10 md:mx-20 py-16 flex flex-col md:grid md:grid-cols-5 gap-10">
        <div class="col-span-4">${children}</div>
        <div class="grid grid-cols-2 gap-6 md:flex flex-col shrink-0 md:gap-10">
          <div>
            <p class="mb-1.5 text-xl font-bold">Pages</p>
            <ul>
              <li>
                <a href="/">Posts</a>
              </li>
              <!-- <li>
                <a href="/about">About</a>
              </li> -->
              <li>
                <a href="/search">Search</a>
              </li>
              <li>
                <a href="/feed">RSS</a>
              </li>
            </ul>
          </div>
          <div>
            <p class="mb-1.5 text-xl font-bold">Links</p>
            <ul>
              ${config.links?.map(({ title, link }) => 
                <li>
                  <a href={link}>{title}</a>
                </li>
              ).join('')}
            </ul>
          </div>
          <div>
            <p class="mb-1.5 text-xl font-bold">Categories</p>
            <ul>
              ${data.categories.map(v => 
                <li>
                  <a href={`/category/${v}`}>{v}</a>
                </li>
              ).join('')}
            </ul>
          </div>
          <div class="col-span-2">
            <p class="mb-1.5 text-xl font-bold">Tags</p>
            <div>
              ${data.tags.map(v => 
                <a href={`/tag/${v}`} class="mr-2 last:mr-0">{v}</a>
              ).join('')}
            </div>
          </div>
        </div>
      </main>
      <footer class="mt-auto py-14 flex items-center justify-center border-t border-white/30">
        <span>&copy;&nbsp;</span>
        ${config.app.copy.link
          ? `<a href="${config.app.copy.link}">${config.app.copy.name}</a>`
          : `<span>${config.app.copy.name}</span>`
        }
        <span>&nbsp;|&nbsp;Powered by&nbsp;</span>
        <a href="https://github.com/shinosaki/kiji">kiji</a>
      </footer>
    </div>
  </body>
</html>`));
  await next();
});

const Posts = (props) => (
  <main class="grid">
    {props.items[props.page - 1].map(({ id, title, date, categories, tags, summary }) => (
      <article class="py-5 flex flex-col gap-3 border-b last:border-b-0 border-white/30">
        <header>
          <p class="mb-1 flex justify-between">
            <a href={`/category/${categories}`}>{categories}</a>
            <span>{yyyymmdd(date)}</span>
          </p>
          <h2 class="text-3xl font-bold">
            <a href={`/posts/${id}`} class="contents">{title}</a>
          </h2>
        </header>
        <main class="text-gray-300/90">{summary}</main>
        <footer class="flex justify-end gap-2">
          {tags.map(v => <a href={`/tag/${v}`}>{v}</a>)}
        </footer>
      </article>
    ))}
    <footer class="mt-5 text-lg flex justify-center items-center gap-10">
      <a class="page-btn" href={(props.page > 1) ? `/?p=${props.page - 1}` : ''}>Prev</a>
      <span>{props.page} / {props.items.length}</span>
      <a class="page-btn" href={(props.page < props.items.length) ? `/?p=${props.page + 1}` : ''}>Next</a>
    </footer>
  </main>
);

app.get('/', async (c) => {
  const data = await c.fetch('posts.json', 'json');
  const items = pagination(data.posts.filter(v => !v.draft), 12);

  const parsed = z.coerce
    .number()
    .min(1)
    .safeParse(c.req.query('p'));

  const page = (parsed.success) ? parsed.data : 1;

  return c.render(
    <Posts {...{ page, items }} />
  );
});

app.get('/posts/:id', async (c) => {
  const { id } = c.req.param();

  const md = await c.fetch(`posts/${id}${(id.endsWith('.md')) ? '' : '.md'}`);
  const { markdown, title, draft } = parseFrontMatter(md);

  return (draft) ? c.notFound()
    : (id.endsWith('.md')) ? c.text(md) : c.render((`
      <article class="post">
        <h1>${title}</h1>
        ${marked(markdown)}
      </article>
    `), { title });
});

app.get('/tag/:tag', async (c, next) => {
  const { tag } = c.req.param();

  const data = await c.fetch('posts.json', 'json');
  const items = pagination(
    data.posts
      .filter(v => !v.draft)
      .filter(({ tags }) => tags.includes(tag))
  , 12);

  const parsed = z.coerce
    .number()
    .min(1)
    .safeParse(c.req.query('p'));

  const page = (parsed.success) ? parsed.data : 1;

  return c.render((
    <Posts {...{ page, items }} />
  ), { title: `"${tag}" タグの記事一覧` });
});

app.get('/category/:category', async (c, next) => {
  const { category } = c.req.param();

  const data = await c.fetch('posts.json', 'json');
  const items = pagination(
    data.posts
      .filter(v => !v.draft)
      .filter(({ categories }) => categories.includes(category))
  , 12);

  const parsed = z.coerce
    .number()
    .min(1)
    .safeParse(c.req.query('p'));

  const page = (parsed.success) ? parsed.data : 1;

  return c.render((
    <Posts {...{ page, items }} />
  ), { title: `"${category}" カテゴリの記事一覧` });
});



app.get('/search', async (c) => {
  const Search = (props) => (
    <form method="GET" class="pb-10 border-b border-white/30">
      <p class="mb-2">💡 検索対象は記事のID・タイトル・カテゴリ・タグ・要約のみです。記事の全文検索には対応していません。</p>
      <label class="relative">
        <input type="text" name="q" class="w-full h-10 bg-inherit border border-white" />
        <button class="contents">
          <p class="absolute inset-y-0 right-2">Search</p>
        </button>
      </label>
    </form>
  );

  const { q } = c.req.query();
  if (!q || !q.length) {
    return c.render((
      <Search />
    ), { title: `記事の検索` });
  };

  const data = await c.fetch('posts.json', 'json');

  const regex = new RegExp(`${q}`, 'gi');
  const items = pagination(
    data.posts
      .filter(v => !v.draft)
      .filter(({ id, title, categories, tags, summary }) =>
        regex.test(id)
        || regex.test(title)
        || regex.test(categories)
        || regex.test(summary)
        || tags.map(v => regex.test(v)).some(v=>v)
      )
  , 12);

  const parsed = z.coerce
    .number()
    .min(1)
    .safeParse(c.req.query('p'));

  const page = (parsed.success) ? parsed.data : 1;

  return c.render((
    <div>
      <Search />
      {items.length
        ? <Posts {...{ page, items }} />
        : <p class="text-center">"{q}" に一致する記事はありませんでした。</p>
      }
    </div>
  ), { title: `"${q}" の検索結果` });
});



app.use('/feed', async (c, next) => {
  const url = new URL(c.req.url);

  c.setRenderer((children, props = {}) => c.html(`<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>${config.app.name}</title>
        <link>${url.origin}/</link>
        <description>${config.app.description}</description>
        <generator>https://github.com/shinosaki/kiji</generator>
        <language>${config.lang ?? 'en'}</language>
        <atom:link href="${c.req.url}" rel="self" type="application/rss+xml"/>
        ${children}
      </channel>
    </rss>
  `));

  await next();
  c.header('content-type', 'application/rss+xml; charset=utf8');
});

app.get('/atom', (c) => c.redirect('/feed'));
app.get('/rss',  (c) => c.redirect('/feed'));
app.get('/feed', async (c) => {
  const url = new URL(c.req.url);
  const data = await c.fetch('posts.json', 'json');
  const items = data.posts.filter(v => !v.draft);

  return c.render(items.map(({ id, title, date, summary }) => (`
    <item>
      <title>${title}</title>
      <link>${url.origin}/posts/${id}</link>
      <pubDate>${new Date(date).toUTCString()}</pubDate>
      <guid isPermaLink="true">${url.origin}/posts/${id}</guid>
      <description>${summary}</description>
    </item>
  `)).join(''));
});

export default app;
