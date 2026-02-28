'use client';

import { useMemo, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { tier1Sources, tier2Sources, tier3Sources, TieredSource } from '@/lib/sources-clean';
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            <h1 className="text-sm font-semibold">Admin</h1>
            <div className="w-14" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{allSources.length} sources</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {feedSources.length} feed · {newsSources.length} news
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 mb-8">
          {sections.map(s => (
            <Link key={s.href} href={s.href} className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors first:rounded-t-xl last:rounded-b-xl">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.detail}</p>
                {s.sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.sub}</p>}
              </div>
              <ChevronRightIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Regional Baselines */}
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Regional Baselines</p>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-2.5 px-4 font-medium">Region</th>
                  <th className="text-right py-2.5 px-4 font-medium">Sources</th>
                  <th className="text-right py-2.5 px-4 font-medium">PPD</th>
                  <th className="text-right py-2.5 px-4 font-medium">6h Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {regionBaselines.map(rb => (
                  <tr key={rb.region}>
                    <td className="py-2.5 px-4 text-slate-900 dark:text-white">{regionDisplayNames[rb.region] || rb.region}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">{rb.feedSources}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">{rb.trustedPpd}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-900 dark:text-white">{rb.baseline6h}</td>
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
