import { MetadataRoute } from 'next';
import { allTieredSources } from '@/lib/sources-clean';

const BASE_URL = 'https://news-pulse.org';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static, public content pages. /profile is an account page and
  // /learn/web-vitals is a perf-monitoring view, so both are excluded.
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'always', priority: 1 },
    { url: `${BASE_URL}/news`, lastModified: now, changeFrequency: 'always', priority: 0.9 },
    { url: `${BASE_URL}/conditions`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE_URL}/sources`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/misinformation`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // One profile page per monitored source (/source/[id]).
  const sourcePages: MetadataRoute.Sitemap = allTieredSources.map((source) => ({
    url: `${BASE_URL}/source/${source.id}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.4,
  }));

  return [...staticPages, ...sourcePages];
}
