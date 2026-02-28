import { Metadata } from 'next';
import { allTieredSources } from '@/lib/sources-clean';
import SourcesClient from './SourcesClient';

export const metadata: Metadata = {
  title: 'Sources | Pulse',
  description: 'Browse all hand-curated news and intelligence sources monitored by Pulse.',
};

export interface PublicSource {
  id: string;
  name: string;
  handle?: string;
  platform: string;
  sourceType: string;
  category: 'news' | 'intelligence' | 'community';
  region: string;
  url?: string;
  isStateSponsored?: boolean;
}

function getPublicCategory(sourceType: string): 'news' | 'intelligence' | 'community' {
  if (['news-org', 'reporter'].includes(sourceType)) return 'news';
  if (['osint', 'analyst', 'official'].includes(sourceType)) return 'intelligence';
  return 'community';
}

export default function SourcesPage() {
  const sources: PublicSource[] = allTieredSources.map((s) => ({
    id: s.id,
    name: s.name,
    handle: s.handle,
    platform: s.platform,
    sourceType: s.sourceType,
    category: getPublicCategory(s.sourceType),
    region: s.region,
    url: s.url,
    isStateSponsored: s.isStateSponsored || undefined,
  }));

  return <SourcesClient sources={sources} />;
}
