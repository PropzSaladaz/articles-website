import type { Metadata } from 'next';
import Link from 'next/link';
import { getLatestBySection } from '../lib/content/content';
import { SECTION_LIST } from '../lib/content/sections';
import { contentPath } from '../lib/content/urls';
import { ArticlePreviewCard } from '../components/ArticlePreviewCard';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const bio =
  "Hi, I'm Sidnei Teixeira — a software engineer working through graphics, cryptography, " +
  'and DSP one concept at a time.';

export const metadata: Metadata = {
  title: 'Sid Makes Sense',
  description: bio,
};

export default async function HomePage() {
  const [notesLatest, writingLatest, devlogLatest] = await Promise.all([
    getLatestBySection('notes', 1),
    getLatestBySection('writing', 1),
    getLatestBySection('devlog', 1),
  ]);
  const featured = [notesLatest[0], writingLatest[0], devlogLatest[0]].filter(Boolean);

  return (
    <div className="space-y-16">
      <header className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Sid Makes Sense</h1>
        <p className="text-lg text-muted-foreground">{bio}</p>
      </header>

      <section className="grid gap-6 sm:grid-cols-3">
        {SECTION_LIST.map((section) => (
          <Link
            key={section.id}
            href={contentPath(section.id)}
            className="flex flex-col gap-2 rounded-2xl border border-border p-6 transition-colors hover:bg-card"
          >
            <span className="text-xl font-semibold text-foreground">{section.label}</span>
            <span className="text-sm text-muted-foreground">{section.tagline}</span>
          </Link>
        ))}
      </section>

      {featured.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Latest</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((article) => (
              <ArticlePreviewCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
