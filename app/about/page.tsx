import type { Metadata } from 'next';
import { PageContainer } from '../../components/PageContainer';
import { PageHeader } from '../../components/PageHeader';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About',
  description: 'Background, professional experience, and past projects.',
};

export default function AboutPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader
        title="About"
        description={
          "Hi, I'm Sidnei Teixeira — a software engineer working through graphics, cryptography, " +
          'and DSP one concept at a time. This site is where that work lives: notes as I learn, ' +
          "essays once an opinion has formed, and a log of what I'm building."
        }
      />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-foreground">Background</h2>
        <p className="text-base text-muted-foreground">
          More to come here.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-foreground">Professional experience</h2>
        <p className="text-base text-muted-foreground">
          More to come here.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-foreground">Past projects</h2>
        <p className="text-base text-muted-foreground">
          More to come here.
        </p>
      </section>
    </PageContainer>
  );
}
