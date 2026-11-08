import type { Metadata } from 'next';
import { SECTIONS } from '../../lib/content/sections';
import { ChronologicalSectionPage } from '../../components/page/ChronologicalSectionPage';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const section = SECTIONS.writing;

export const metadata: Metadata = {
  title: section.label,
  description: section.tagline,
};

export default function WritingLandingPage() {
  return <ChronologicalSectionPage sectionId="writing" emptyText="No essays yet." />;
}
