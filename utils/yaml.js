import { load } from 'js-yaml';

export const parseFrontMatter = (md) => {
  const lines = md.split(/\r?\n/);
  const heading = lines[0].replace(/#\s+/, '').trim() ?? null;
  const [ _, frontMatter, ...body ] = (lines[0].startsWith('---')) && md.split(/---\s*\r?\n/);

  return (!frontMatter)
    ? {
      markdown: md,
      title: heading
    }
    : {
      markdown: body.join('---\n'),
      ...load(frontMatter)
    };
};
