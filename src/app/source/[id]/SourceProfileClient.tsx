'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { TieredSource } from '@/lib/sources-clean';
import { getEffectivePPD } from '@/lib/baselineUtils';
import { PlatformIcon, platformColors, platformBadgeStyles } from '@/components/PlatformIcon';
import { formatTimeAgo, regionBadges, sourceTypeColors, sourceTypeLabels, platformNames } from '@/lib/formatUtils';
import { NewsCard } from '@/components/NewsCard';
import { NewsItem } from '@/types';

interface SourceProfileClientProps {
  source: TieredSource;
}

function SourceAvatar({ avatarUrl, platform, name, size = 64 }: {
  avatarUrl?: string;
  platform: string;
  name: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <div
        className="relative rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 ring-2 ring-slate-300 dark:ring-slate-600 flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={avatarUrl}
          alt={`${name} avatar`}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700"
      style={{ width: size, height: size }}
    >
      <span className={platformColors[platform] || platformColors.rss}>
        <PlatformIcon platform={platform} className="w-8 h-8" />
      </span>
    </div>
  );
}

export default function SourceProfileClient({ source }: SourceProfileClientProps) {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveActivity, setLiveActivity] = useState<{
    recentCount: number;
    anomalyRatio: number;
    isAnomalous: boolean;
  } | null>(null);

  const regionBadge = regionBadges[source.region] || regionBadges['all'];
  const sourceTypeStyle = sourceTypeColors[source.sourceType] || sourceTypeColors.osint;
  const sourceTypeLabel = sourceTypeLabels[source.sourceType] || source.sourceType;
  const platformBadge = platformBadgeStyles[source.platform] || platformBadgeStyles.rss;
  const platformName = platformNames[source.platform] || source.platform;
  const effectivePPD = getEffectivePPD(source);
  const measured = !!source.baselineMeasuredAt;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPosts() {
      try {
        const res = await fetch(`/api/news?region=all&hours=24&limit=5000`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();

        // Parse timestamps
        const allItems: NewsItem[] = (data.items || []).map((item: NewsItem & { timestamp: string }) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));

        // Filter to this source
        const sourcePosts = allItems.filter(item => item.source.id === source.id);
        setPosts(sourcePosts);

        // Extract live activity from the first matching post
        const withActivity = sourcePosts.find(p => p.sourceActivity);
        if (withActivity?.sourceActivity) {
          setLiveActivity({
            recentCount: withActivity.sourceActivity.recentCount,
            anomalyRatio: withActivity.sourceActivity.anomalyRatio,
            isAnomalous: withActivity.sourceActivity.isAnomalous,
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Failed to fetch source posts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
    return () => controller.abort();
  }, [source.id]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--foreground-light)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Pulse</span>
            </Link>
            <h1 className="text-base font-serif font-semibold text-[var(--foreground)] tracking-tight truncate max-w-[60%]">
              {source.name}
            </h1>
            <div className="w-12" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Identity Card */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <SourceAvatar
              avatarUrl={source.avatarUrl}
              platform={source.platform}
              name={source.name}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-[var(--foreground)] truncate">{source.name}</h2>
              {source.handle && (
                <p className="text-sm text-[var(--foreground-light)] truncate">{source.handle}</p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {/* Platform */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${platformBadge}`}>
              <PlatformIcon platform={source.platform} className="w-3.5 h-3.5" />
              {platformName}
            </span>
            {/* Source type */}
            <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-lg border ${sourceTypeStyle}`}>
              {sourceTypeLabel}
            </span>
            {/* Region */}
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${regionBadge.color}`}>
              {regionBadge.label}
            </span>
            {/* Tier */}
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border-light)]">
              Tier {source.fetchTier.replace('T', '')}
            </span>
          </div>

          {/* State-sponsored warning */}
          {source.isStateSponsored && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-[var(--color-elevated-muted)] text-[var(--color-elevated)]">
              <BuildingLibraryIcon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">State-sponsored media</span>
            </div>
          )}

          {/* Confidence */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--foreground-light)]">Confidence</span>
              <span className="text-xs font-medium text-[var(--foreground-muted)]">{source.confidence}/100</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--background-secondary)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${source.confidence}%` }}
              />
            </div>
          </div>

          {/* External link */}
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-[var(--foreground-light)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              View on {platformName}
            </a>
          )}
        </section>

        {/* Activity Stats */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Posts per day */}
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {effectivePPD < 1 ? effectivePPD.toFixed(1) : Math.round(effectivePPD)}
              </p>
              <p className="text-xs text-[var(--foreground-light)]">
                posts/day {measured ? '(measured)' : source.estimatedPPD ? '(estimated)' : '(default)'}
              </p>
            </div>

            {/* Recent posts */}
            <div>
              {loading ? (
                <div className="h-8 w-16 bg-[var(--background-secondary)] rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {liveActivity?.recentCount ?? posts.length}
                </p>
              )}
              <p className="text-xs text-[var(--foreground-light)]">
                posts in last {liveActivity ? '6h' : '24h'}
              </p>
            </div>

            {/* Activity ratio */}
            {liveActivity && (
              <div>
                <p className={`text-2xl font-bold ${liveActivity.isAnomalous ? 'text-amber-500' : 'text-[var(--foreground)]'}`}>
                  {liveActivity.anomalyRatio.toFixed(1)}x
                </p>
                <p className="text-xs text-[var(--foreground-light)]">
                  {liveActivity.isAnomalous ? 'above normal' : 'vs baseline'}
                </p>
              </div>
            )}

            {/* Fetch tier */}
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{source.fetchTier}</p>
              <p className="text-xs text-[var(--foreground-light)]">fetch priority</p>
            </div>
          </div>

          {(source.baselineMeasuredAt || source.estimatedAt) && (
            <p className="text-xs text-[var(--foreground-light)] mt-4 pt-3 border-t border-[var(--border-card)]">
              {source.baselineMeasuredAt
                ? `Baseline measured ${source.baselineMeasuredAt}`
                : `Estimated ${source.estimatedAt}`}
            </p>
          )}
        </section>

        {/* Recent Posts */}
        <section>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
            Recent Posts
            {!loading && ` (${posts.length})`}
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] p-4 animate-pulse">
                  <div className="h-4 bg-[var(--background-secondary)] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[var(--background-secondary)] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map(post => (
                <NewsCard key={post.id} item={post} />
              ))}
            </div>
          ) : (
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] p-6 text-center">
              <p className="text-sm text-[var(--foreground-light)]">No posts in the last 24 hours</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
