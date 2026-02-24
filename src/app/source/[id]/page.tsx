import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getSourceById } from '@/lib/sources-clean';
import SourceProfileClient from './SourceProfileClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const source = getSourceById(id);
  if (!source) return { title: 'Source Not Found' };
  return {
    title: `${source.name} | Pulse`,
    description: `${source.name} — ${source.sourceType} source covering ${source.region} on Pulse.`,
  };
}

export default async function SourceProfilePage({ params }: Props) {
  const { id } = await params;
  const source = getSourceById(id);
  if (!source) notFound();

  // Serialize for client component (TieredSource is a plain object, safe to pass)
  return <SourceProfileClient source={source} />;
}
