'use client';

import Link from 'next/link';
import { Article } from '../lib/content/types';
import { formatDate } from '../lib/format';
import { Card, CardContent } from './ui/card';

export function ArticleCard({ article }: { article: Article }) {
  const baseHref = article.collectionSlug ? `/collections/${article.slug}/` : `/articles/${article.slug}/`;
  const articleHref = `${baseHref}?view=full`;

  return (
    <Card className="group flex flex-col gap-5 overflow-hidden border-none border-border bg-card p-6 transition-all duration-300 hover:shadow-subtle">
      <CardContent className="flex flex-col gap-5 p-0">
        <header className="flex flex-col gap-2">
          <Link href={articleHref} className="text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {article.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            <span aria-hidden="true">•</span>
            <span>{article.readingTime.text}</span>
          </div>
        </header>

        {article.summary.text && (
          <p className="text-muted-foreground line-clamp-2">
            {article.summary.text}
          </p>
        )}

        <div>
          <Link
            href={articleHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-300 group-hover:gap-3"
          >
            Read
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

