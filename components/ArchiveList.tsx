'use client';

import { useState } from 'react';
import { ArticlePreviewCard } from './ArticlePreviewCard';
import { Article } from '../lib/content/types';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

type ArchiveListProps = {
    articlesByYear: Record<string, Article[]>;
    years: string[];
};

export function ArchiveList({ articlesByYear, years }: ArchiveListProps) {
    const [visibleYears, setVisibleYears] = useState(1);

    const displayedYears = years.slice(0, visibleYears);
    const hasMoreYears = visibleYears < years.length;

    return (
        <div className="flex flex-col gap-12">
            {displayedYears.map((year, yearIndex) => (
                <div key={year} className="flex flex-col gap-6 animate-fade-up" style={{ animationDelay: `${yearIndex * 50}ms` }}>
                    <h3 className="text-2xl font-semibold text-foreground border-b border-border pb-2">{year}</h3>
                    <div className="flex flex-col gap-4">
                        {articlesByYear[year].map((article, index) => (
                            <ArticlePreviewCard
                                key={article.slug}
                                article={article}
                                variant="compact"
                                className="w-full"
                            />
                        ))}
                    </div>
                </div>
            ))}

            {hasMoreYears && (
                <div className="flex justify-center pt-8">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setVisibleYears(prev => prev + 1)}
                    >
                        Load older articles
                    </Button>
                </div>
            )}
        </div>
    );
}
