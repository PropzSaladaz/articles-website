import assert from 'node:assert/strict';
import test from 'node:test';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import rehypeCollectHeadings from '../../lib/markdown/rehype/collect-headings.ts';

async function render(markdown, options) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeCollectHeadings, options)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown);

  return {
    html: String(file),
    headings: file.data.headings,
  };
}

test('keeps inline and math-only expressions in TOC labels and ids', async () => {
  const result = await render(`
## Restrict the Input $x$ to Field Elements

## Compare $x$ with $y^2$

## $z^2$
`);

  assert.deepEqual(result.headings, [
    {
      id: 'restrict-the-input-x-to-field-elements',
      text: 'Restrict the Input x to Field Elements',
      level: 2,
    },
    { id: 'compare-x-with-y2', text: 'Compare x with y^2', level: 2 },
    { id: 'z2', text: 'z^2', level: 2 },
  ]);
  assert.match(result.html, /id="restrict-the-input-x-to-field-elements"/);
  assert.match(result.html, /id="compare-x-with-y2"/);
  assert.match(result.html, /id="z2"/);
});

test('deduplicates headings at the same level', async () => {
  const result = await render('## Same\n\n## Same');

  assert.deepEqual(
    result.headings.map(({ id }) => id),
    ['same', 'same-1']
  );
});

test('lets non-TOC headings reserve slugs', async () => {
  const result = await render('### Same\n\n## Same');

  assert.deepEqual(result.headings, [{ id: 'same-1', text: 'Same', level: 2 }]);
  assert.match(result.html, /<h3 id="same">/);
  assert.match(result.html, /<h2 id="same-1">/);
});

test('collects raw HTML headings and preserves authored ids', async () => {
  const result = await render('<h2 id="authored">Raw <em>heading</em></h2>');

  assert.deepEqual(result.headings, [
    { id: 'authored', text: 'Raw heading', level: 2 },
  ]);
  assert.match(result.html, /<h2 id="authored">Raw <em>heading<\/em><\/h2>/);
});

test('numbers rendered headings and TOC entries without changing ids', async () => {
  const result = await render(
    '# First\n\n## Child\n\n### Detail\n\n## Next child\n\n# Second',
    { numberHeadings: true }
  );

  assert.deepEqual(result.headings, [
    { id: 'first', text: 'First', level: 1, number: '1' },
    { id: 'child', text: 'Child', level: 2, number: '1.1' },
    { id: 'next-child', text: 'Next child', level: 2, number: '1.2' },
    { id: 'second', text: 'Second', level: 1, number: '2' },
  ]);
  assert.match(
    result.html,
    /<h1 id="first"><span class="md-section-number">1<\/span> First<\/h1>/
  );
  assert.match(
    result.html,
    /<h3 id="detail"><span class="md-section-number">1\.1\.1<\/span> Detail<\/h3>/
  );
  assert.doesNotMatch(result.html, /id="1-first"/);
});
