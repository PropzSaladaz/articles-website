import type { ArticlePreview } from '../../lib/content/types';
import { articlePath } from '../../lib/content/urls';
import { formatDate } from '../../lib/format';
import { ContentCard } from './ContentCard';

/** A `ContentCard` for a dated article: "date · reading time" eyebrow, summary and tags. */
export function ArticleCard({ article }: { article: ArticlePreview }) {
  return (
    <ContentCard
      href={articlePath(article)}
      title={article.title}
      eyebrow={`${formatDate(article.date)} · ${article.readingTime.text}`}
      description={article.description}
      tags={article.tags}
    />
  );
}
