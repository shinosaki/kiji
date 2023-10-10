import { promises as fs } from 'fs';
import { marked } from 'marked';
import { parseFrontMatter } from './utils/yaml.js';
import { webcrypto as crypto } from 'crypto';

const BASE_PATH = './assets/posts';

const files = await fs.readdir(BASE_PATH);

const markdowns = await Promise.all(
  files
    .filter(v => v.endsWith('.md'))
    .map(async path =>
      fs.readFile(`${BASE_PATH}/${path}`, 'utf8')
        .then(md => ({ md, path }))
    )
);

const posts = await Promise.all(
  markdowns.map(async ({ md, path }) => {
    const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(md));

    const { markdown, title, description, date, tags, categories, draft } = parseFrontMatter(md)
    const html = marked(markdown)

    return {
      id: path.replace(/\.md$/, ''),
      hash: Buffer.from(hash).toString('hex'),
      title,
      date,
      categories,
      tags,
      draft,
      summary: description ?? html.replaceAll(/<.*?>/g, '').replaceAll(/\r?\n/g, ' ').slice(0, 150)
    }
  })
);

console.log(JSON.stringify({
  categories: [...new Set(posts.map(({categories}) => categories))].filter(v=>v),
  tags: [...new Set(posts.map(({tags}) => tags).flat())].filter(v=>v),
  posts: posts.sort((a, b) => new Date(b.date) - new Date(a.date)),
}, null, '  '));
