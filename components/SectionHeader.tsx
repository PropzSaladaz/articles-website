import type { Section } from '../lib/content/sections';

export function SectionHeader({ section }: { section: Section }) {
  return (
    <header className="space-y-3">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{section.label}</h1>
      <p className="text-lg text-muted-foreground">{section.tagline}</p>
    </header>
  );
}
