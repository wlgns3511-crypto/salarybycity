import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  GLOSSARY,
  GLOSSARY_BY_SLUG,
  GLOSSARY_CATEGORY_LABELS,
} from '@/lib/glossary-data';
import { GlossaryEntryBody } from '@/components/glossary/GlossaryEntryBody';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return GLOSSARY.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const entry = GLOSSARY_BY_SLUG.get(slug);
  if (!entry) return {};
  // Use the first sentence of the definition as a meta description (capped).
  const firstSentence = entry.definition.split('. ')[0];
  const desc = (firstSentence + '.').slice(0, 200);
  return {
    title: `${entry.term} — definition · ${GLOSSARY_CATEGORY_LABELS[entry.category].title}`,
    description: desc,
    alternates: { canonical: `/glossary/${slug}/` },
    openGraph: { url: `/glossary/${slug}/` },
  };
}

export default async function GlossaryEntryPage({ params }: RouteParams) {
  const { slug } = await params;
  const entry = GLOSSARY_BY_SLUG.get(slug);
  if (!entry) notFound();

  return (
    <div>
      <nav className="mb-4 text-xs text-slate-500">
        <Link href="/glossary/" className="hover:text-blue-600">
          ← Glossary
        </Link>
      </nav>
      <GlossaryEntryBody entry={entry} />
    </div>
  );
}
