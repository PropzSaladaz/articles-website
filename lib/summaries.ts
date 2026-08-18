import { unified } from 'unified';
import remarkParse from 'remark-parse';
import strip from 'strip-markdown';
import remarkStringify from 'remark-stringify';

export async function markdownToPlainText(markdown: string): Promise<string> {
  const stripped = await unified()
    .use(remarkParse)
    .use(strip as any)
    .use(remarkStringify)
    .process(markdown);
  return String(stripped).replace(/\s+/g, ' ').trim();
}
