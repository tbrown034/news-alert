'use client';

import { useMemo, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { tier1Sources, tier2Sources, tier3Sources, TieredSource } from '@/lib/sources-clean';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FEED_PLATFORMS, NEWS_PLATFORMS, regionDisplayNames, calculateRegionBaselines } from './shared';

const allSources: TieredSource[] = [...tier1Sources, ...tier2Sources, ...tier3Sources];

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/');
    }
  }, [session, isPending, router]);

  const regionBaselines = useMemo(() => calculateRegionBaselines(allSources), []);

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) return null;

  const feedSources = allSources.filter(s => FEED_PLATFORMS.has(s.platform));
  const newsSources = allSources.filter(s => NEWS_PLATFORMS.has(s.platform));
  const measuredCount = feedSources.filter(s => s.baselineMeasuredAt).length;

  const sections = [
    {
      href: '/admin/feed',
      label: 'Feed Sources',
      detail: `${feedSources.length} sources — Bluesky, Telegram, Mastodon`,
      sub: `${measuredCount} of ${feedSources.length} baselines measured`,
    },
    {
      href: '/admin/news',
      label: 'News Sources',
      detail: `${newsSources.length} sources — RSS, Reddit, YouTube`,
    },
    {
      href: '/admin/activity',
      label: 'Post Log',
      detail: 'Historical post fetch logs',
    },
    {
      href: '/admin/editorial',
      label: 'Editorial Posts',
      detail: 'Breaking news + editorial content',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground mb-1">Admin</h1>
          <p className="text-2xl font-bold text-foreground">{allSources.length} sources</p>
          <p className="text-sm text-foreground-muted mt-1">
            {feedSources.length} feed · {newsSources.length} news
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-background-card rounded-xl border border-border-card divide-y divide-border-card mb-8">
          {sections.map(s => (
            <Link key={s.href} href={s.href} className="flex items-center justify-between px-4 py-4 hover:bg-background-secondary transition-colors first:rounded-t-xl last:rounded-b-xl">
              <div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{s.detail}</p>
                {s.sub && <p className="text-xs text-foreground-muted mt-0.5">{s.sub}</p>}
              </div>
              <ChevronRightIcon className="w-4 h-4 text-foreground-muted flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Regional Baselines */}
        <div>
          <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3">Regional Baselines</p>
          <div className="bg-background-card rounded-xl border border-border-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-foreground-muted border-b border-border-card">
                  <th className="text-left py-2.5 px-4 font-medium">Region</th>
                  <th className="text-right py-2.5 px-4 font-medium">Sources</th>
                  <th className="text-right py-2.5 px-4 font-medium">PPD</th>
                  <th className="text-right py-2.5 px-4 font-medium">6h Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-card">
                {regionBaselines.map(rb => (
                  <tr key={rb.region}>
                    <td className="py-2.5 px-4 text-foreground">{regionDisplayNames[rb.region] || rb.region}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-foreground-muted">{rb.feedSources}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-foreground-muted">{rb.trustedPpd}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-foreground">{rb.baseline6h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
