'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { tier1Sources, tier2Sources, tier3Sources, TieredSource } from '@/lib/sources-clean';
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon, ChevronUpDownIcon, ChartBarIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Combine all sources
const allSources: TieredSource[] = [...tier1Sources, ...tier2Sources, ...tier3Sources];

// Feed platforms (power the live wire + activity detection)
const FEED_PLATFORMS = new Set(['bluesky', 'telegram', 'mastodon']);
// News platforms (mainstream news area)
const NEWS_PLATFORMS = new Set(['rss', 'reddit', 'youtube']);

// Platform badge colors
function platformBadgeClass(platform: string): string {
  switch (platform) {
    case 'bluesky': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    case 'telegram': return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400';
    case 'mastodon': return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400';
    case 'rss': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    case 'reddit': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400';
    case 'youtube': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }
}

// Mirror activityDetection.ts baseline logic client-side
const CONSERVATIVE_DEFAULT = 3;
function isMeasuredValue(n: number): boolean {
  return n !== Math.floor(n);
}

interface RegionBaseline {
  region: string;
  feedSources: number;
  totalPpd: number;
  trustedPpd: number;
  baseline6h: number;
}

function calculateRegionBaselines(): RegionBaseline[] {
  const feedSources = allSources.filter(s => FEED_PLATFORMS.has(s.platform));
  const regionMap = new Map<string, { count: number; totalPpd: number; trustedPpd: number }>();

  for (const s of feedSources) {
    const r = s.region;
    if (!regionMap.has(r)) regionMap.set(r, { count: 0, totalPpd: 0, trustedPpd: 0 });
    const entry = regionMap.get(r)!;
    entry.count++;
    entry.totalPpd += s.postsPerDay || 0;
    entry.trustedPpd += isMeasuredValue(s.postsPerDay) ? s.postsPerDay : CONSERVATIVE_DEFAULT;
  }

  const results: RegionBaseline[] = [];
  const order = ['us', 'middle-east', 'europe-russia', 'latam', 'asia', 'all', 'seismic'];

  for (const region of order) {
    const entry = regionMap.get(region);
    if (!entry) continue;
    results.push({
      region,
      feedSources: entry.count,
      totalPpd: Math.round(entry.totalPpd * 10) / 10,
      trustedPpd: Math.round(entry.trustedPpd * 10) / 10,
      baseline6h: Math.round(entry.trustedPpd / 4),
    });
  }

  return results;
}

const regionDisplayNames: Record<string, string> = {
  'us': 'United States',
  'middle-east': 'Middle East',
  'europe-russia': 'Europe & Russia',
  'latam': 'Latin America',
  'asia': 'Asia-Pacific',
  'all': 'Global',
  'seismic': 'Seismic',
};

type SortField = 'name' | 'platform' | 'sourceType' | 'fetchTier' | 'confidence' | 'region' | 'postsPerDay';
type SortDirection = 'asc' | 'desc';

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Filter states
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Sort states
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Source detail panel
  const [selectedSource, setSelectedSource] = useState<TieredSource | null>(null);
  const [liveStats, setLiveStats] = useState<any>(null);
  const [liveStatsLoading, setLiveStatsLoading] = useState(false);

  // Test source states
  const [testHandle, setTestHandle] = useState('');
  const [testPlatform, setTestPlatform] = useState('bluesky');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/');
    }
  }, [session, isPending, router]);

  // Get unique values for filters
  const platforms = useMemo(() => [...new Set(allSources.map(s => s.platform))], []);
  const sourceTypes = useMemo(() => [...new Set(allSources.map(s => s.sourceType))], []);
  const tiers = ['T1', 'T2', 'T3'];
  const regions = useMemo(() => [...new Set(allSources.map(s => s.region))], []);

  // Regional baselines
  const regionBaselines = useMemo(() => calculateRegionBaselines(), []);

  // Filter and sort sources
  const filteredSources = useMemo(() => {
    let result = allSources;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.handle?.toLowerCase().includes(searchLower) ||
        s.id.toLowerCase().includes(searchLower)
      );
    }

    if (platformFilter !== 'all') {
      if (platformFilter === '_feed') {
        result = result.filter(s => FEED_PLATFORMS.has(s.platform));
      } else if (platformFilter === '_news') {
        result = result.filter(s => NEWS_PLATFORMS.has(s.platform));
      } else {
        result = result.filter(s => s.platform === platformFilter);
      }
    }

    if (typeFilter !== 'all') {
      result = result.filter(s => s.sourceType === typeFilter);
    }

    if (tierFilter !== 'all') {
      result = result.filter(s => s.fetchTier === tierFilter);
    }

    if (regionFilter !== 'all') {
      result = result.filter(s => s.region === regionFilter);
    }

    result = [...result].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [search, platformFilter, typeFilter, tierFilter, regionFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleTestSource = async (handle?: string, platform?: string) => {
    const h = handle || testHandle.trim();
    const p = platform || testPlatform;
    if (!h) return;
    setTestLoading(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/source-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: h, platform: p }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Failed to test source');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestLive = async (source: TieredSource) => {
    if (!FEED_PLATFORMS.has(source.platform)) return;
    setLiveStatsLoading(true);
    setLiveStats(null);
    try {
      const res = await fetch('/api/admin/source-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: source.handle, platform: source.platform }),
      });
      if (res.ok) {
        setLiveStats(await res.json());
      }
    } catch {
      // silent fail for live test
    } finally {
      setLiveStatsLoading(false);
    }
  };

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

  // Stats
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <h1 className="text-lg font-semibold">Pulse Admin</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Quick Nav */}
        <div className="flex gap-3 mb-6">
          <Link
            href="/admin/activity"
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <ChartBarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Activity Monitor</span>
          </Link>
          <Link
            href="/admin/editorial"
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Editorial Posts</span>
          </Link>
        </div>

        {/* Feed Sources (OSINT) */}
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Feed Sources <span className="text-slate-400 dark:text-slate-500 font-normal">— powers Live Wire + activity detection</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{feedSources.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Feed</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800/50 p-4">
              <p className="text-2xl font-bold text-blue-600">{blueskyCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bluesky</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-violet-200 dark:border-violet-800/50 p-4">
              <p className="text-2xl font-bold text-violet-600">{telegramCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Telegram</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-teal-200 dark:border-teal-800/50 p-4">
              <p className="text-2xl font-bold text-teal-600">{mastodonCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mastodon</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/50 p-4">
              <p className="text-2xl font-bold text-emerald-600">{measuredCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Measured</p>
            </div>
          </div>
        </div>

        {/* News Sources (Mainstream) */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            News Sources <span className="text-slate-400 dark:text-slate-500 font-normal">— mainstream wire services + news orgs</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{newsSources.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total News</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-800/50 p-4">
              <p className="text-2xl font-bold text-orange-600">{rssCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">RSS</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800/50 p-4">
              <p className="text-2xl font-bold text-rose-600">{redditCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reddit</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800/50 p-4">
              <p className="text-2xl font-bold text-red-600">{youtubeCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">YouTube</p>
            </div>
          </div>
        </div>

        {/* Regional Baselines */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Regional Activity Baselines</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Computed from feed source postsPerDay. Measured values trusted; round guesses use conservative default ({CONSERVATIVE_DEFAULT} ppd).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 pr-4">Region</th>
                  <th className="text-right py-2 px-3">Feed Sources</th>
                  <th className="text-right py-2 px-3">Raw PPD</th>
                  <th className="text-right py-2 px-3">Trusted PPD</th>
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
                    <td className="py-2 px-3 text-right font-mono text-slate-400 dark:text-slate-500">{rb.totalPpd}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{rb.trustedPpd}</td>
                    <td className="py-2 pl-3 text-right font-mono font-bold text-slate-900 dark:text-white">{rb.baseline6h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Source */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Test Source</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="handle.bsky.social or @channel"
              value={testHandle}
              onChange={(e) => setTestHandle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestSource()}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
            <select
              value={testPlatform}
              onChange={(e) => setTestPlatform(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="bluesky">Bluesky</option>
              <option value="mastodon">Mastodon</option>
              <option value="telegram">Telegram</option>
            </select>
            <button
              onClick={() => handleTestSource()}
              disabled={testLoading || !testHandle.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {testLoading ? 'Testing...' : 'Test'}
            </button>
          </div>

          {testError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{testError}</p>
            </div>
          )}

          {testResult && !testResult.error && (
            <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Posts/Day</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{testResult.postsPerDay}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Last Posted</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{testResult.lastPostedAgo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Sampled</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{testResult.totalPosts} posts / {testResult.spanDays}d</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Avg Gap</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{testResult.gapHoursAvg}h</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Last 6h</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{testResult.postsLast6h}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Last 12h</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{testResult.postsLast12h}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Last 24h</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{testResult.postsLast24h}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Last 48h</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{testResult.postsLast48h}</p>
                </div>
              </div>
            </div>
          )}

          {testResult?.error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{testResult.error}</p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search sources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="all">All Platforms</option>
              <option value="_feed">-- Feed Only --</option>
              <option value="_news">-- News Only --</option>
              {platforms.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="all">All Types</option>
              {sourceTypes.map(t => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="all">All Tiers</option>
              {tiers.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="all">All Regions</option>
              {regions.map(r => (
                <option key={r} value={r}>{regionDisplayNames[r] || r.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-700 dark:text-slate-200">{filteredSources.length}</span> of {allSources.length} sources
          </p>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Name
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('platform')}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Platform
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('sourceType')}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Type
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('region')}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Region
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('confidence')}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Confidence
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('postsPerDay')}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Posts/Day
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSources.map((source) => (
                  <tr
                    key={source.id}
                    onClick={() => {
                      setSelectedSource(selectedSource?.id === source.id ? null : source);
                      setLiveStats(null);
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{source.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{source.handle || source.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${platformBadgeClass(source.platform)}`}>
                        {source.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                        {source.sourceType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {regionDisplayNames[source.region] || source.region}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              source.confidence >= 90 ? 'bg-green-500' :
                              source.confidence >= 70 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${source.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{source.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                        {source.postsPerDay}
                      </span>
                      {source.baselineMeasuredAt && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {source.baselineMeasuredAt}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSources.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">No sources match your filters</p>
            </div>
          )}
        </div>
      </main>

      {/* Source Detail Slide-over */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedSource(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {selectedSource.name}
              </h2>
              <button
                onClick={() => setSelectedSource(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Platform + Type badges */}
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${platformBadgeClass(selectedSource.platform)}`}>
                  {selectedSource.platform}
                </span>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                  {selectedSource.sourceType}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-md ${
                  selectedSource.fetchTier === 'T1'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : selectedSource.fetchTier === 'T2'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {selectedSource.fetchTier}
                </span>
                {FEED_PLATFORMS.has(selectedSource.platform) && (
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    FEED
                  </span>
                )}
                {NEWS_PLATFORMS.has(selectedSource.platform) && (
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                    NEWS
                  </span>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase">ID</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300 text-xs break-all">{selectedSource.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Handle</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300 text-xs break-all">{selectedSource.handle || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Region</p>
                  <p className="text-slate-700 dark:text-slate-300">{regionDisplayNames[selectedSource.region] || selectedSource.region}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Confidence</p>
                  <p className="text-slate-700 dark:text-slate-300">{selectedSource.confidence}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Posts/Day</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{selectedSource.postsPerDay}</p>
                  {selectedSource.baselineMeasuredAt && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">measured {selectedSource.baselineMeasuredAt}</p>
                  )}
                  {!selectedSource.baselineMeasuredAt && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">estimated (not measured)</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Tier</p>
                  <p className="text-slate-700 dark:text-slate-300">{selectedSource.fetchTier}</p>
                </div>
              </div>

              {/* Feed URL */}
              <div>
                <p className="text-xs text-slate-500 uppercase mb-1">Feed URL</p>
                <a
                  href={selectedSource.feedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {selectedSource.feedUrl}
                </a>
              </div>

              {/* Source URL */}
              {selectedSource.url && (
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Source URL</p>
                  <a
                    href={selectedSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {selectedSource.url}
                  </a>
                </div>
              )}

              {/* Live Test (feed sources only) */}
              {FEED_PLATFORMS.has(selectedSource.platform) && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Live Stats</h3>
                    <button
                      onClick={() => handleTestLive(selectedSource)}
                      disabled={liveStatsLoading}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {liveStatsLoading ? 'Testing...' : 'Test Live'}
                    </button>
                  </div>

                  {liveStats && !liveStats.error && (
                    <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Posts/Day</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">{liveStats.postsPerDay}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Last Posted</p>
                        <p className="font-mono text-slate-700 dark:text-slate-300">{liveStats.lastPostedAgo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Sampled</p>
                        <p className="font-mono text-slate-700 dark:text-slate-300">{liveStats.totalPosts} / {liveStats.spanDays}d</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Avg Gap</p>
                        <p className="font-mono text-slate-700 dark:text-slate-300">{liveStats.gapHoursAvg}h</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Last 6h</p>
                        <p className="font-mono text-slate-700 dark:text-slate-300">{liveStats.postsLast6h}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Last 24h</p>
                        <p className="font-mono text-slate-700 dark:text-slate-300">{liveStats.postsLast24h}</p>
                      </div>
                    </div>
                  )}

                  {liveStats?.error && (
                    <p className="text-xs text-red-500">{liveStats.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
