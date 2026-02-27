'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { ArrowLeftIcon, ArrowPathIcon, BoltIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WebVitalsSummary {
  metric_name: string;
  p75: number;
  median: number;
  avg: number;
  good_pct: number;
  needs_improvement_pct: number;
  poor_pct: number;
  sample_count: number;
}

interface WebVitalRecord {
  id: number;
  metric_name: string;
  value: number;
  delta: number;
  rating: string;
  metric_id: string;
  page_path: string | null;
  navigation_type: string | null;
  recorded_at: string;
}

interface VitalsData {
  summary: WebVitalsSummary[];
  recentLogs: WebVitalRecord[];
  meta: { generatedAt: string; days: number };
}

const METRIC_INFO: Record<string, { label: string; unit: string; good: number; poor: number; description: string }> = {
  LCP:  { label: 'Largest Contentful Paint', unit: 'ms', good: 2500, poor: 4000, description: 'Time to render the largest visible element' },
  INP:  { label: 'Interaction to Next Paint', unit: 'ms', good: 200,  poor: 500,  description: 'Responsiveness to user interactions' },
  CLS:  { label: 'Cumulative Layout Shift',  unit: '',   good: 0.1,  poor: 0.25, description: 'Visual stability of the page' },
  FCP:  { label: 'First Contentful Paint',    unit: 'ms', good: 1800, poor: 3000, description: 'Time to first visible content' },
  TTFB: { label: 'Time to First Byte',        unit: 'ms', good: 800,  poor: 1800, description: 'Server response time' },
  FID:  { label: 'First Input Delay',         unit: 'ms', good: 100,  poor: 300,  description: 'Delay before first interaction (legacy)' },
};

const CORE_VITALS = ['LCP', 'INP', 'CLS'];

function ratingColor(rating: string): string {
  if (rating === 'good') return 'text-emerald-500';
  if (rating === 'needs-improvement') return 'text-amber-500';
  return 'text-red-500';
}

function ratingBg(rating: string): string {
  if (rating === 'good') return 'bg-emerald-500/10 border-emerald-500/20';
  if (rating === 'needs-improvement') return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function getRating(value: number, metric: string): string {
  const info = METRIC_INFO[metric];
  if (!info) return 'good';
  if (value <= info.good) return 'good';
  if (value <= info.poor) return 'needs-improvement';
  return 'poor';
}

function formatValue(value: number, metric: string): string {
  if (metric === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

export default function VitalsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [data, setData] = useState<VitalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/');
    }
  }, [session, isPending, router]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/vitals?view=overview&days=${days}`);
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
  }, [session, days]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) return null;

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Separate core vitals from diagnostics
  const coreSummary = data?.summary.filter(s => CORE_VITALS.includes(s.metric_name)) || [];
  const diagSummary = data?.summary.filter(s => !CORE_VITALS.includes(s.metric_name)) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
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
              <BoltIcon className="w-5 h-5 text-amber-500" />
              <h1 className="text-lg font-semibold">Web Vitals</h1>
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

        {/* Time range selector */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-slate-500 dark:text-slate-400">Period:</span>
          {[1, 7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                days === d
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {d === 1 ? '24h' : `${d}d`}
            </button>
          ))}
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Status Banner */}
            {data.summary.length === 0 ? (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Collecting Data</strong> — Web Vitals are reported by real users as they browse the site.
                  Data will appear here once visitors start generating metrics.
                </p>
              </div>
            ) : null}

            {/* Core Web Vitals */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-1">Core Web Vitals</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                The three metrics Google uses to assess user experience. Target: p75 in the &quot;good&quot; range.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {CORE_VITALS.map(name => {
                  const s = coreSummary.find(s => s.metric_name === name);
                  const info = METRIC_INFO[name];
                  const p75Rating = s ? getRating(s.p75, name) : 'good';
                  return (
                    <div key={name} className={`rounded-xl border p-4 ${s ? ratingBg(p75Rating) : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{name}</span>
                        {s && <span className={`text-xs font-semibold uppercase ${ratingColor(p75Rating)}`}>{p75Rating.replace('-', ' ')}</span>}
                      </div>
                      <p className="text-3xl font-bold mb-1">
                        {s ? formatValue(s.p75, name) : '—'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{info.description}</p>
                      {s ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Median</span>
                            <span className="font-medium">{formatValue(s.median, name)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Samples</span>
                            <span className="font-medium">{s.sample_count}</span>
                          </div>
                          {/* Rating bar */}
                          <div className="flex h-2 rounded-full overflow-hidden mt-2">
                            <div className="bg-emerald-500" style={{ width: `${s.good_pct || 0}%` }} />
                            <div className="bg-amber-500" style={{ width: `${s.needs_improvement_pct || 0}%` }} />
                            <div className="bg-red-500" style={{ width: `${s.poor_pct || 0}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                            <span>{s.good_pct || 0}% good</span>
                            <span>{s.poor_pct || 0}% poor</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No data yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Diagnostic Metrics */}
            {diagSummary.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-1">Diagnostic Metrics</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Supporting metrics for deeper performance analysis.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {diagSummary.map(s => {
                    const info = METRIC_INFO[s.metric_name];
                    const p75Rating = getRating(s.p75, s.metric_name);
                    return (
                      <div key={s.metric_name} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.metric_name}</span>
                          <span className={`text-xs font-semibold ${ratingColor(p75Rating)}`}>{formatValue(s.p75, s.metric_name)}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{info?.description || s.metric_name}</p>
                        <div className="flex h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500" style={{ width: `${s.good_pct || 0}%` }} />
                          <div className="bg-amber-500" style={{ width: `${s.needs_improvement_pct || 0}%` }} />
                          <div className="bg-red-500" style={{ width: `${s.poor_pct || 0}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{s.sample_count} samples</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recent Logs Table */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Recent Measurements</h2>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Metric</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Value</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Rating</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Page</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Nav Type</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.recentLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono font-bold">{log.metric_name}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-mono">{formatValue(log.value, log.metric_name)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              log.rating === 'good' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                              log.rating === 'needs-improvement' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {log.rating === 'needs-improvement' ? 'meh' : log.rating}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
                            {log.page_path || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                            {log.navigation_type || '—'}
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
                    <p className="text-slate-500 dark:text-slate-400">No vitals recorded yet. Browse the site to generate data.</p>
                  </div>
                )}
              </div>
            </section>

            <p className="mt-6 text-xs text-slate-400 text-center">
              Data generated at {formatTimestamp(data.meta.generatedAt)} · {data.meta.days}-day window
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
