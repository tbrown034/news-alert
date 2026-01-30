'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { ArrowLeftIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RollingAverage {
  region: string;
  avg_posts_6h: number;
  sample_count: number;
  min_posts: number;
  max_posts: number;
  latest_count: number;
}

interface ActivityLogEntry {
  id: number;
  bucket_timestamp: string;
  region: string;
  post_count: number;
  source_count: number;
  region_breakdown: Record<string, number> | null;
  platform_breakdown: Record<string, number> | null;
  recorded_at: string;
  fetch_duration_ms: number | null;
}

interface ActivityData {
  averages: RollingAverage[];
  recentLogs: ActivityLogEntry[];
  meta: {
    generatedAt: string;
    windowDays: number;
  };
}

export default function ActivityPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/');
    }
  }, [session, isPending, router]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/activity?view=overview');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBucket = (ts: string) => {
    const date = new Date(ts);
    const hour = date.getUTCHours();
    const bucketLabel = hour === 0 ? '00-06' : hour === 6 ? '06-12' : hour === 12 ? '12-18' : '18-00';
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${bucketLabel} UTC`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Admin</span>
            </Link>
            <div className="flex items-center gap-3">
              <ChartBarIcon className="w-5 h-5 text-blue-500" />
              <h1 className="text-lg font-semibold">Activity Monitor</h1>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Status Banner */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Data Collection Active</strong> - Logging post counts every 6 hours.
                Rolling averages will be accurate after 14 days of data.
                Currently have <strong>{data.recentLogs.length}</strong> log entries.
              </p>
            </div>

            {/* Rolling Averages */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">14-Day Rolling Averages (per 6h)</h2>
              {data.averages.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                  <p className="text-slate-500 dark:text-slate-400">No data yet. Averages will appear after the first fetch cycle.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {data.averages.map((avg) => (
                    <div
                      key={avg.region}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                    >
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {avg.region}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {Math.round(avg.avg_posts_6h)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        posts/6h avg
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Latest</span>
                          <span className="font-medium text-slate-600 dark:text-slate-300">{avg.latest_count}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-slate-400">Range</span>
                          <span className="font-medium text-slate-600 dark:text-slate-300">{avg.min_posts}-{avg.max_posts}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-slate-400">Samples</span>
                          <span className="font-medium text-slate-600 dark:text-slate-300">{avg.sample_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Logs Table */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Recent Activity Logs</h2>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Bucket
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Region
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Posts
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Sources
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Fetch Time
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Recorded
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.recentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-300">
                            {formatBucket(log.bucket_timestamp)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                              {log.region}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {log.post_count.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                            {log.source_count}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                            {log.fetch_duration_ms ? `${(log.fetch_duration_ms / 1000).toFixed(1)}s` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                            {formatTimestamp(log.recorded_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {data.recentLogs.length === 0 && (
                  <div className="px-4 py-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400">No activity logs yet. Data will appear after the first news fetch.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Meta info */}
            <p className="mt-6 text-xs text-slate-400 text-center">
              Data generated at {formatTimestamp(data.meta.generatedAt)} · {data.meta.windowDays}-day rolling window
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
