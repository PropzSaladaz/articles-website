import type { Metadata } from 'next';
import Link from 'next/link';
import { getLatestBySection } from '../lib/content/content';
import { SECTIONS, SECTION_LIST, sectionOf } from '../lib/content/sections';
import { articlePath, contentPath } from '../lib/content/urls';
import { formatDate } from '../lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const RECENT_LIMIT = 8;

const bio =
  "Hi, I'm Sidnei Teixeira — a software engineer working through graphics, cryptography, " +
  'and DSP one concept at a time.';

export const metadata: Metadata = {
  title: 'Sid Makes Sense',
  description: bio,
};

export default async function HomePage() {
  const perSection = await Promise.all(SECTION_LIST.map((section) => getLatestBySection(section.id)));
  const recent = perSection
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, RECENT_LIMIT);

  return (
    <div className="max-w-2xl space-y-14">
      <header className="space-y-4">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Sid Makes Sense
        </h1>
        <p className="font-serif text-lg leading-relaxed text-muted-foreground">{bio}</p>
      </header>

      <section>
        <dl className="space-y-3">
          {SECTION_LIST.map((section) => (
            <div key={section.id} className="sm:flex sm:gap-4">
              <dt className="shrink-0 sm:w-24">
                <Link
                  href={contentPath(section.id)}
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {section.label}
                </Link>
              </dt>
              <dd className="text-muted-foreground">{section.tagline}</dd>
            </div>
          ))}
        </dl>
      </section>

      {recent.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Recent</h2>
          <ul className="divide-y divide-border border-y border-border">
            {recent.map((article) => {
              const section = sectionOf(article.slug);
              return (
                <li key={article.slug} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                  <time dateTime={article.date} className="shrink-0 text-sm tabular-nums text-muted-foreground sm:w-28">
                    {formatDate(article.date)}
                  </time>
                  <Link
                    href={articlePath(article)}
                    className="flex-1 font-serif text-lg text-foreground underline-offset-4 hover:underline"
                  >
                    {article.title}
                  </Link>
                  {section && (
                    <span className="shrink-0 text-sm text-muted-foreground">{SECTIONS[section].label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
