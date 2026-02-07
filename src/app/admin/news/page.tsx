'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { tier1Sources, tier2Sources, tier3Sources, TieredSource } from '@/lib/sources-clean';
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NEWS_PLATFORMS, platformBadgeClass, regionDisplayNames } from '../shared';

const allSources: TieredSource[] = [...tier1Sources, ...tier2Sources, ...tier3Sources];
const newsSources = allSources.filter(s => NEWS_PLATFORMS.has(s.platform));

type SortField = 'name' | 'platform' | 'sourceType' | 'fetchTier' | 'confidence' | 'region';
type SortDirection = 'asc' | 'desc';

export default function NewsSourcesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedSource, setSelectedSource] = useState<TieredSource | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) router.push('/');
  }, [session, isPending, router]);

  const platforms = useMemo(() => [...new Set(newsSources.map(s => s.platform))], []);
  const sourceTypes = useMemo(() => [...new Set(newsSources.map(s => s.sourceType))], []);
  const regions = useMemo(() => [...new Set(newsSources.map(s => s.region))], []);

  const filteredSources = useMemo(() => {
    let result = newsSources;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.handle?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
    if (platformFilter !== 'all') result = result.filter(s => s.platform === platformFilter);
    if (typeFilter !== 'all') result = result.filter(s => s.sourceType === typeFilter);
    if (regionFilter !== 'all') result = result.filter(s => s.region === regionFilter);

    return [...result].sort((a, b) => {
      let aVal = a[sortField], bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [search, platformFilter, typeFilter, regionFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  if (isPending) return <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!session?.user) return null;

  const rssCount = newsSources.filter(s => s.platform === 'rss').length;
  const redditCount = newsSources.filter(s => s.platform === 'reddit').length;
  const youtubeCount = newsSources.filter(s => s.platform === 'youtube').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/admin" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Admin</span>
            </Link>
            <h1 className="text-lg font-semibold">News Sources</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{newsSources.length}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{rssCount}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">RSS</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{redditCount}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Reddit</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{youtubeCount}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">YouTube</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4"><FunnelIcon className="w-4 h-4 text-slate-500" /><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400" />
            </div>
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="all">All Platforms</option>
              {platforms.map(p => <option key={p} value={p}>{p === 'rss' ? 'RSS' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="all">All Types</option>
              {sourceTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="all">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{regionDisplayNames[r] || r}</option>)}
            </select>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Showing <span className="font-medium text-slate-700 dark:text-slate-200">{filteredSources.length}</span> of {newsSources.length} news sources</p>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  {(['name', 'platform', 'sourceType', 'region', 'confidence'] as SortField[]).map(field => (
                    <th key={field} className="text-left px-4 py-3">
                      <button onClick={() => handleSort(field)} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        {field === 'sourceType' ? 'Type' : field.charAt(0).toUpperCase() + field.slice(1)}
                        <ChevronUpDownIcon className="w-4 h-4" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSources.map(source => (
                  <tr key={source.id} onClick={() => { setSelectedSource(selectedSource?.id === source.id ? null : source); }} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-slate-900 dark:text-white">{source.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{source.handle || source.id}</p></td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${platformBadgeClass(source.platform)}`}>{source.platform === 'rss' ? 'RSS' : source.platform}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">{source.sourceType}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-600 dark:text-slate-300">{regionDisplayNames[source.region] || source.region}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${source.confidence >= 90 ? 'bg-green-500' : source.confidence >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${source.confidence}%` }} /></div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{source.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSources.length === 0 && <div className="px-4 py-12 text-center"><p className="text-slate-500 dark:text-slate-400">No sources match your filters</p></div>}
        </div>
      </main>

      {/* Detail slide-over */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedSource(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{selectedSource.name}</h2>
              <button onClick={() => setSelectedSource(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><XMarkIcon className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${platformBadgeClass(selectedSource.platform)}`}>{selectedSource.platform === 'rss' ? 'RSS' : selectedSource.platform}</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">{selectedSource.sourceType}</span>
                <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-md ${selectedSource.fetchTier === 'T1' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : selectedSource.fetchTier === 'T2' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{selectedSource.fetchTier}</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">NEWS</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-500 uppercase">ID</p><p className="font-mono text-slate-700 dark:text-slate-300 text-xs break-all">{selectedSource.id}</p></div>
                <div><p className="text-xs text-slate-500 uppercase">Handle</p><p className="font-mono text-slate-700 dark:text-slate-300 text-xs break-all">{selectedSource.handle || '—'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase">Region</p><p className="text-slate-700 dark:text-slate-300">{regionDisplayNames[selectedSource.region] || selectedSource.region}</p></div>
                <div><p className="text-xs text-slate-500 uppercase">Confidence</p><p className="text-slate-700 dark:text-slate-300">{selectedSource.confidence}%</p></div>
                <div><p className="text-xs text-slate-500 uppercase">Tier</p><p className="text-slate-700 dark:text-slate-300">{selectedSource.fetchTier}</p></div>
              </div>
              <div><p className="text-xs text-slate-500 uppercase mb-1">Feed URL</p><a href={selectedSource.feedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">{selectedSource.feedUrl}</a></div>
              {selectedSource.url && <div><p className="text-xs text-slate-500 uppercase mb-1">Source URL</p><a href={selectedSource.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">{selectedSource.url}</a></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
