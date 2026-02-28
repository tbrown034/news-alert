'use client';

import Link from "next/link";
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

// Static mockup data for the activity bars demo
const DEMO_BARS = [
  { label: 'All', multiplier: 2.1, count: 187, baseline: 89, level: 'normal' as const },
  { label: 'US', multiplier: 1.1, count: 42, baseline: 38, level: 'normal' as const },
  { label: 'MidEast', multiplier: 3.2, count: 68, baseline: 21, level: 'elevated' as const },
  { label: 'Europe', multiplier: 5.8, count: 93, baseline: 16, level: 'critical' as const },
];

const MAX_SCALE = 6;
const BASELINE_PCT = (1 / MAX_SCALE) * 100;

function DemoBar({ label, multiplier, level }: { label: string; multiplier: number; count: number; baseline: number; level: 'normal' | 'elevated' | 'critical' }) {
  const fillPct = Math.min((multiplier / MAX_SCALE) * 100, 100);

  const barColor = level === 'critical'
    ? 'bg-red-500'
    : level === 'elevated'
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const textColor = level === 'critical'
    ? 'text-red-500'
    : level === 'elevated'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-600 dark:text-slate-300';

  return (
    <div className="flex items-center gap-2">
      <div className="w-14 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
        {label}
      </div>
      <div className="flex-1 relative h-2.5 bg-slate-200/60 dark:bg-slate-800/80 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
          style={{ width: `${fillPct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-900/20 dark:bg-white/20 z-10"
          style={{ left: `${BASELINE_PCT}%` }}
        />
      </div>
      <div className="w-12 shrink-0">
        <span className={`text-sm font-semibold tabular-nums leading-none ${textColor}`}>
          {multiplier.toFixed(1)}×
        </span>
      </div>
    </div>
  );
}

export default function AboutPage() {
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
            <div className="flex items-center gap-2.5">
              <InformationCircleIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
              <h1 className="text-base font-serif font-semibold text-[var(--foreground)] tracking-tight">About</h1>
            </div>
            <div className="w-12" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero */}
        <section className="py-4 sm:py-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2 tracking-tight">
            Pulse
          </h2>
          <p className="text-[var(--foreground-muted)] leading-relaxed max-w-xl">
            A real-time news dashboard. Hundreds of sources, chronological feed, no algorithm.
            When something breaks, you see it here first.
          </p>
        </section>

        {/* Activity Detection — lead section */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <div className="px-5 sm:px-6 py-5 border-b border-[var(--border-card)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Activity Detection
            </h2>
            <p className="text-sm text-[var(--foreground-light)] mt-1">
              How Pulse spots breaking news without anyone flagging it
            </p>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-5 text-[var(--foreground-muted)]">
            <p className="text-sm leading-relaxed">
              Every region has a measured baseline — how many posts typically come in over a 6-hour window. When posts spike above that baseline, the bar grows and changes color. Nobody decides what&apos;s &quot;breaking.&quot; The volume does.
            </p>

            {/* Live-style bar mockup */}
            <div className="bg-[var(--background-secondary)] rounded-lg border border-[var(--border-light)] p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Feed Activity</span>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Normal</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Elevated</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Critical</span>
                </div>
              </div>

              {DEMO_BARS.map((bar) => (
                <DemoBar key={bar.label} {...bar} />
              ))}

              {/* Baseline label */}
              <div className="flex items-center gap-2 -mt-0.5">
                <div className="w-14 shrink-0" />
                <div className="flex-1 relative">
                  <div
                    className="text-[9px] text-slate-500 dark:text-slate-400 leading-none"
                    style={{ paddingLeft: `calc(${BASELINE_PCT}% - 6px)` }}
                  >
                    1×
                  </div>
                </div>
                <div className="w-12 shrink-0" />
              </div>
            </div>

            <p className="text-xs text-[var(--foreground-light)]">
              The thin tick marks the baseline (1×). In this example, Europe is at 5.8× its normal rate — almost certainly
              a major story developing. Middle East is elevated. The US is quiet.
            </p>

            {/* Thresholds */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-red-500/5 border border-red-900/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-[var(--foreground)]">Critical</span>
                <span className="ml-auto font-mono text-xs text-red-500">5× baseline or higher</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-900/20">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[var(--foreground)]">Elevated</span>
                <span className="ml-auto font-mono text-xs text-amber-600 dark:text-amber-400">2.5× baseline or higher</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-light)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[var(--foreground)]">Normal</span>
                <span className="ml-auto font-mono text-xs text-[var(--foreground-light)]">Below 2.5×</span>
              </div>
            </div>

            <p className="text-sm leading-relaxed">
              Baselines are measured from 14 days of real data, so they adjust as sources are added or go quiet.
              No manual tuning needed.
            </p>
          </div>
        </section>

        {/* Sources */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <div className="px-5 sm:px-6 py-5 border-b border-[var(--border-card)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              The Feed
            </h2>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-4 text-[var(--foreground-muted)]">
            <p className="text-sm leading-relaxed">
              600+ sources across Bluesky, RSS, Telegram, Mastodon, Reddit, and YouTube.
              Wire services, OSINT analysts, journalists, government accounts, and regional outlets.
              Everything shows up newest-first. No engagement ranking, no editorial picks.
            </p>

            <div className="flex flex-wrap gap-2">
              {['Breaking News', 'Earthquakes', 'Wildfires', 'Severe Weather', 'Internet Outages', 'Travel Advisories'].map((item) => (
                <span key={item} className="px-3 py-1 bg-[var(--background-secondary)] text-[var(--foreground-light)] text-xs rounded-full border border-[var(--border-light)]">
                  {item}
                </span>
              ))}
            </div>

            <p className="text-sm leading-relaxed">
              Sources are hand-picked — each one is checked before it gets added.
              The mix covers 6 regions: US, Middle East, Europe &amp; Russia, Asia, Latin America, and Africa.
            </p>

            <Link
              href="/sources"
              className="inline-flex items-center text-sm font-medium text-[var(--color-elevated)] hover:underline"
            >
              Browse all sources
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* AI Briefings — brief */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <div className="px-5 sm:px-6 py-5">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              AI Summaries
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
              There&apos;s an optional AI summary that reads the latest posts and writes a short situation overview.
              It uses Claude (by Anthropic) at three speed tiers. It&apos;s there if you want a quick
              catch-up, but the raw feed is always the ground truth. Summaries can miss things or get details wrong —
              treat them as a starting point, not gospel.
            </p>
          </div>
        </section>

        {/* Built by */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <div className="px-5 sm:px-6 py-5">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Built by Trevor Brown
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed mb-4">
              Journalist turned developer. Spent years in newsrooms chasing public records, now I build
              tools to make sense of the noise.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://github.com/tbrown034"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 bg-[var(--background-secondary)] hover:bg-[var(--border-light)] rounded-lg transition-colors border border-[var(--border-light)]"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                <span className="text-sm font-medium">GitHub</span>
              </a>
              <a
                href="https://linkedin.com/in/trevorabrown"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 bg-[var(--background-secondary)] hover:bg-[var(--border-light)] rounded-lg transition-colors border border-[var(--border-light)]"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
              <a
                href="https://trevorthewebdeveloper.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 bg-[var(--background-secondary)] hover:bg-[var(--border-light)] rounded-lg transition-colors border border-[var(--border-light)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.466.729-3.559" /></svg>
                <span className="text-sm font-medium">Website</span>
              </a>
            </div>
          </div>
        </section>

        {/* Transparency */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <div className="px-5 sm:px-6 py-5 border-b border-[var(--border-card)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Transparency
            </h2>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-4 text-sm text-[var(--foreground-muted)] leading-relaxed">
            <div>
              <h3 className="font-medium text-[var(--foreground)] mb-1">Sources</h3>
              <p>
                Pulse pulls from 600+ sources — wire services, OSINT analysts, journalists,
                government accounts, and regional outlets. Most were individually reviewed before
                being added, though coverage varies by region and some sources were added in bulk
                based on platform activity and relevance. The list is actively maintained and
                curated over time.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-[var(--foreground)] mb-1">AI-generated content</h3>
              <p>
                AI summaries are clearly labeled and optional. They&apos;re generated by Claude
                (Anthropic) from the raw feed and can miss things or get details wrong. The raw
                posts are always the ground truth. AI was also used in development — I built this
                with Claude Code as a coding partner.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-[var(--foreground)] mb-1">Work in progress</h3>
              <p>
                Pulse is an early-stage project with rough edges. Source coverage is uneven across
                regions, the UI has known quirks, and things will break. I&apos;m shipping it now
                because it&apos;s useful, not because it&apos;s finished.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-[var(--foreground)] mb-1">Report issues</h3>
              <p>
                Found a bug, bad source, or have feedback? Open an issue on{' '}
                <a
                  href="https://github.com/tbrown034/news-alert/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-elevated)] hover:underline"
                >
                  GitHub
                </a>{' '}
                or reach out on{' '}
                <a
                  href="https://linkedin.com/in/trevorabrown"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-elevated)] hover:underline"
                >
                  LinkedIn
                </a>.
              </p>
            </div>
          </div>
        </section>

        {/* Media Literacy */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <Link href="/misinformation" className="block p-5 sm:p-6 hover:bg-[var(--background-secondary)] transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-elevated-muted)] flex items-center justify-center flex-shrink-0">
                <ShieldCheckIcon className="w-5 h-5 text-[var(--color-elevated)]" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">
                  Media Literacy Guide
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                  How to spot misinformation and evaluate sources. Nobody&apos;s immune to it.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-[var(--color-elevated)] mt-2">
                  Read the guide
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
