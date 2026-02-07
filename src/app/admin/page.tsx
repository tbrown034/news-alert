'use client';

import { useMemo, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { tier1Sources, tier2Sources, tier3Sources, TieredSource } from '@/lib/sources-clean';
import { ArrowLeftIcon, ChartBarIcon, PencilSquareIcon, SignalIcon, NewspaperIcon } from '@heroicons/react/24/outline';
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
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) return null;

  const feedSources = allSources.filter(s => FEED_PLATFORMS.has(s.platform));
  const newsSources = allSources.filter(s => NEWS_PLATFORMS.has(s.platform));
  const blueskyCount = allSources.filter(s => s.platform === 'bluesky').length;
  const telegramCount = allSources.filter(s => s.platform === 'telegram').length;
  const mastodonCount = allSources.filter(s => s.platform === 'mastodon').length;
  const rssCount = allSources.filter(s => s.platform === 'rss').length;
  const redditCount = allSources.filter(s => s.platform === 'reddit').length;
  const youtubeCount = allSources.filter(s => s.platform === 'youtube').length;
  const measuredCount = feedSources.filter(s => s.baselineMeasuredAt).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <h1 className="text-lg font-semibold">Pulse Admin</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{allSources.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Total Sources</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/50 p-5">
            <p className="text-3xl font-bold text-emerald-600">{feedSources.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Feed Sources</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-800/50 p-5">
            <p className="text-3xl font-bold text-orange-600">{newsSources.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">News Sources</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Feed Sources Card */}
          <Link
            href="/admin/feed"
            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <SignalIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Feed Sources</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live Wire + activity detection</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-blue-600 font-medium">{blueskyCount} Bluesky</span>
              <span className="text-violet-600 font-medium">{telegramCount} Telegram</span>
              <span className="text-teal-600 font-medium">{mastodonCount} Mastodon</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{measuredCount} of {feedSources.length} baselines measured</p>
          </Link>

          {/* News Sources Card */}
          <Link
            href="/admin/news"
            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <NewspaperIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">News Sources</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mainstream wire services + news orgs</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-orange-600 font-medium">{rssCount} RSS</span>
              <span className="text-rose-600 font-medium">{redditCount} Reddit</span>
              <span className="text-red-600 font-medium">{youtubeCount} YouTube</span>
            </div>
          </Link>

          {/* Activity Monitor Card */}
          <Link
            href="/admin/activity"
            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Activity Monitor</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Regional activity levels + logging</p>
              </div>
            </div>
          </Link>

          {/* Editorial Posts Card */}
          <Link
            href="/admin/editorial"
            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <PencilSquareIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Editorial Posts</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Breaking news + editorial content</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Regional Baselines */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Regional Activity Baselines</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Computed from feed source postsPerDay. Used for activity surge detection.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 pr-4">Region</th>
                  <th className="text-right py-2 px-3">Sources</th>
                  <th className="text-right py-2 px-3">Daily PPD</th>
                  <th className="text-right py-2 pl-3">6h Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {regionBaselines.map(rb => (
                  <tr key={rb.region}>
                    <td className="py-2 pr-4 font-medium text-slate-900 dark:text-white">
                      {regionDisplayNames[rb.region] || rb.region}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{rb.feedSources}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{rb.trustedPpd}</td>
                    <td className="py-2 pl-3 text-right font-mono font-bold text-slate-900 dark:text-white">{rb.baseline6h}</td>
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
