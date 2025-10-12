import { unified } from 'unified';
import remarkParse from 'remark-parse';
import strip from 'strip-markdown';
import remarkStringify from 'remark-stringify';

const SUMMARY_WORD_TARGET = 150;

function truncateToWordLimit(text: string, limit: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) {
    return text.trim();
  }
  return `${words.slice(0, limit).join(' ')}…`;
}

export async function generateSummary(markdown: string, fallback?: string): Promise<string> {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  const stripped = await unified()
    .use(remarkParse)
    .use(strip as any)
    .use(remarkStringify)
    .process(markdown);
  const plain = String(stripped).replace(/\s+/g, ' ').trim();
  return truncateToWordLimit(plain, SUMMARY_WORD_TARGET);
}
