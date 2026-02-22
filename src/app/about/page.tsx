'use client';

import { useState } from 'react';
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChartBarIcon,
  UserIcon,
  GlobeAltIcon,
  BoltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChevronDownIcon,
  CodeBracketIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export default function AboutPage() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showDataFlow, setShowDataFlow] = useState(false);
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header - matches /news style */}
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
            {/* Spacer for centering */}
            <div className="w-12" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero Section */}
        <section className="text-center py-6 sm:py-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-3 tracking-tight">
            About News Pulse
          </h2>
          <p className="text-[var(--foreground-muted)] max-w-2xl mx-auto leading-relaxed">
            Real-time global intelligence monitoring for those who need to know first.
          </p>
        </section>

        {/* What is News Pulse */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <div className="px-5 sm:px-6 py-5 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-blue-light)] flex items-center justify-center">
                <GlobeAltIcon className="w-5 h-5 text-[var(--accent-blue)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                What is News Pulse?
              </h2>
            </div>
          </div>
          <div className="px-5 sm:px-6 py-5 space-y-4 text-[var(--foreground-muted)]">
            <p className="leading-relaxed">
              News Pulse is a real-time global intelligence dashboard that aggregates and analyzes
              <strong className="text-[var(--foreground)]"> 618 verified OSINT sources</strong> to
              deliver breaking news before it hits mainstream media.
            </p>
            <p className="text-sm leading-relaxed">
              The platform monitors 209 RSS feeds from major news organizations, wire services, and regional
              outlets alongside 329 curated Bluesky accounts from journalists, analysts, and official
              government channels, plus 47 Telegram channels, 15 Reddit communities, 11 Mastodon accounts, and 7 YouTube feeds.
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { value: '618', label: 'Sources', color: 'text-blue-500' },
                { value: '6', label: 'Platforms', color: 'text-emerald-500' },
                { value: '6', label: 'Regions', color: 'text-amber-500' },
                { value: '24/7', label: 'Monitoring', color: 'text-rose-500' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3.5 bg-[var(--background-secondary)] rounded-lg border border-[var(--border-light)]">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-[var(--foreground-light)] uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Source breakdown */}
            <div className="pt-2 space-y-2.5">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Source Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { platform: 'Bluesky', count: 329 },
                  { platform: 'RSS', count: 209 },
                  { platform: 'Telegram', count: 47 },
                  { platform: 'Reddit', count: 15 },
                  { platform: 'Mastodon', count: 11 },
                  { platform: 'YouTube', count: 7 },
                ].map(({ platform, count }) => (
                  <div key={platform} className="flex items-center justify-between px-3 py-2 bg-[var(--background-secondary)] rounded-lg border border-[var(--border-light)]">
                    <span className="text-sm text-[var(--foreground-muted)]">{platform}</span>
                    <span className="text-sm font-mono font-medium text-[var(--foreground)]">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Coverage Areas</h3>
              <div className="flex flex-wrap gap-2">
                {['Breaking News', 'Earthquakes (6.0+)', 'Wildfires', 'Weather Alerts', 'Internet Outages', 'Travel Advisories'].map((item) => (
                  <span key={item} className="px-3 py-1 bg-[var(--background-secondary)] text-[var(--foreground-muted)] text-sm rounded-full border border-[var(--border-light)]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How Ranking Works */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <div className="px-5 sm:px-6 py-5 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-purple-light)] flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-[var(--accent-purple)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                How the Ranking Works
              </h2>
            </div>
          </div>
          <div className="px-5 sm:px-6 py-5 space-y-5 text-[var(--foreground-muted)]">
            <p className="leading-relaxed">
              News Pulse keeps it simple: posts appear in <strong className="text-[var(--foreground)]">chronological order</strong> (newest first)
              from all sources. No algorithmic manipulation or engagement-based ranking. What you see is what&apos;s happening, as it happens.
            </p>

            {/* Activity Surge */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BoltIcon className="w-4.5 h-4.5 text-[var(--accent-amber)]" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Activity Surge Detection</h3>
              </div>
              <p className="text-sm leading-relaxed">
                Instead of static rankings, News Pulse monitors <strong className="text-[var(--foreground)]">posting frequency</strong> in
                real-time. Each region has a baseline rate of normal activity. When posts spike above that baseline, the system flags it:
              </p>
              <div className="bg-[var(--background-secondary)] rounded-lg p-4 space-y-3 border border-[var(--border-light)]">
                <p className="text-xs font-mono text-[var(--foreground-light)]">
                  posts in last 6h &divide; time-adjusted baseline = activity multiplier
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2.5 bg-[var(--color-critical-muted)] rounded-lg border border-red-900/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-critical)] animate-pulse"></span>
                      <span className="font-medium text-[var(--foreground)]">Critical</span>
                    </div>
                    <span className="font-mono text-[var(--color-critical)] text-xs">&ge; 5x baseline</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[var(--color-elevated-muted)] rounded-lg border border-orange-900/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-elevated)]"></span>
                      <span className="font-medium text-[var(--foreground)]">Elevated</span>
                    </div>
                    <span className="font-mono text-[var(--color-elevated)] text-xs">&ge; 2.5x baseline</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[var(--background-card)] rounded-lg border border-[var(--border-card)]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--foreground-light)]"></span>
                      <span className="font-medium text-[var(--foreground)]">Normal</span>
                    </div>
                    <span className="font-mono text-[var(--foreground-light)] text-xs">&lt; 2.5x baseline</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[var(--foreground-light)]">
                This approach surfaces breaking news organically &mdash; when many sources start posting about the same event,
                the activity spike becomes visible without needing to manually flag stories as &quot;breaking.&quot;
              </p>
            </div>
          </div>
        </section>

        {/* About Trevor */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <div className="bg-[var(--background-secondary)] px-5 sm:px-6 py-6 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--border-card)] flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-[var(--foreground-muted)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Trevor Brown</h2>
                <p className="text-sm text-[var(--foreground-light)]">
                  Investigative journalist &bull; Developer &bull; Data visualizer
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-5 text-[var(--foreground-muted)]">
            <p className="leading-relaxed">
              I spent 15+ years chasing public records and holding power accountable as an
              investigative reporter. Now I build interactive tools that transform complex data
              into accessible insights.
            </p>

            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Background</h3>
              <ul className="space-y-2 text-sm">
                {[
                  'Editor-in-Chief at The Indiana Daily Student',
                  'Statehouse reporter for Wyoming Tribune Eagle',
                  'Investigative reporter with Oklahoma Watch (nonprofit newsroom)',
                  'Multiple first-place awards from Oklahoma SPJ for investigative and government reporting',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-[var(--foreground-light)] mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Why I Built News Pulse</h3>
              <p className="text-sm leading-relaxed">
                As a journalist, I know the value of being first with accurate information.
                I built News Pulse to aggregate the sources I already trust into a single dashboard,
                surfacing breaking news faster than traditional media with full transparency about
                where every story comes from.
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Connect</h3>
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
                  <GlobeAltIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Website</span>
                </a>
                <a
                  href="mailto:trevorbrown.web@gmail.com"
                  className="flex items-center gap-2 px-3.5 py-2 bg-[var(--background-secondary)] hover:bg-[var(--border-light)] rounded-lg transition-colors border border-[var(--border-light)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-medium">Email</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* AI Transparency */}
        <section className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] overflow-hidden">
          <div className="px-5 sm:px-6 py-5 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-purple-light)] flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-[var(--accent-purple)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                AI Transparency
              </h2>
            </div>
          </div>
          <div className="px-5 sm:px-6 py-5 space-y-5 text-[var(--foreground-muted)]">
            <p className="leading-relaxed">
              News Pulse uses AI in two distinct ways: as a development tool and as a user-facing feature.
              Here&apos;s an honest breakdown of both.
            </p>

            {/* Development Process */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">How This Site Was Built</h3>
              <p className="text-sm leading-relaxed">
                I built News Pulse using{' '}
                <a
                  href="https://www.anthropic.com/claude-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-purple)] hover:underline"
                >
                  Claude Code
                </a>
                , Anthropic&apos;s AI coding assistant. But this wasn&apos;t &quot;vibe coding&quot; where you
                describe an app and hope for the best. I drove every decision:
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Architecture decisions', desc: 'I chose Next.js, the source curation approach, and the activity detection system' },
                  { label: 'Code review', desc: 'I inspect every change Claude suggests, often requesting modifications or rejecting approaches' },
                  { label: 'Iterative refinement', desc: 'Features evolve through back-and-forth conversation, not one-shot prompts' },
                  { label: 'Domain expertise', desc: 'My journalism background shapes what sources to trust, how to rank content, and what matters in breaking news' },
                ].map(({ label, desc }) => (
                  <li key={label} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-purple)] mt-2 flex-shrink-0" />
                    <span><strong className="text-[var(--foreground)]">{label}</strong> &mdash; {desc}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[var(--foreground-light)] italic">
                Think of it like pair programming with a very fast junior developer who needs constant direction.
              </p>
            </div>

            {/* AI-Generated Briefings */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">AI-Generated Situation Briefings</h3>
              <p className="text-sm leading-relaxed">
                The &quot;AI Summary&quot; feature on the main page uses{' '}
                <a
                  href="https://www.anthropic.com/claude"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-purple)] hover:underline"
                >
                  Claude
                </a>
                {' '}to synthesize recent posts into a situation overview. Here&apos;s how it works:
              </p>

              <div className="grid sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { step: '1', title: 'Select', desc: 'The 25 most recent posts are selected from the feed', color: 'text-emerald-500' },
                  { step: '2', title: 'Analyze', desc: 'Claude reads headlines, content, and source metadata', color: 'text-blue-500' },
                  { step: '3', title: 'Synthesize', desc: 'Returns a big-picture overview with 2-3 key developments', color: 'text-[var(--accent-purple)]' },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="p-3.5 bg-[var(--background-secondary)] rounded-lg border border-[var(--border-light)]">
                    <div className={`w-7 h-7 rounded-md bg-[var(--background-card)] border border-[var(--border-card)] flex items-center justify-center mb-2`}>
                      <span className={`${color} font-bold text-sm`}>{step}</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
                    <p className="text-xs text-[var(--foreground-light)] mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-1 text-sm">
                <strong className="text-[var(--foreground)]">Model tiers:</strong>
                <ul className="mt-1.5 space-y-1">
                  <li><span className="text-emerald-500 font-mono text-xs">Quick</span> &mdash; Claude Haiku 4.5 (fast, economical)</li>
                  <li><span className="text-blue-500 font-mono text-xs">Advanced</span> &mdash; Claude Sonnet 4 (balanced)</li>
                  <li><span className="text-[var(--accent-purple)] font-mono text-xs">Pro</span> &mdash; Claude Opus 4.5 (most capable)</li>
                </ul>
              </div>
            </div>

            {/* The Actual Prompt - collapsible */}
            <div className="space-y-3">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent-purple)] transition-colors cursor-pointer"
              >
                <CodeBracketIcon className="w-4.5 h-4.5" />
                <span>See the Actual Prompt</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showPrompt ? 'rotate-180' : ''}`} />
              </button>

              {showPrompt && (
                <div className="bg-[var(--background)] rounded-lg p-4 overflow-x-auto border border-[var(--border)]">
                  <pre className="text-xs text-[var(--foreground-muted)] font-mono whitespace-pre-wrap leading-relaxed">
{`You are a news editor writing a brief situation update for {region}.

Current time: {currentTime}
Window: {startTime} to {nowTime} ({timeWindowHours}h)

<posts>
{postsJson}  // Compact JSON with: source, sourceType, minutesAgo, title, content
</posts>

Write a concise briefing in JSON:
{
  "overview": "1-2 sentences. What's the overall picture? Are tensions rising, stable, or easing? Give context.",
  "developments": [
    "Specific event + source (e.g., 'Ukraine reported 49 clashes since dawn - Ukrinform')",
    "Another key development + source",
    "Third if significant, otherwise omit"
  ]
}

Rules:
- Overview = big picture assessment, not a list of events
- Developments = 2-3 specific items with sources, each one line
- Reference time naturally (this morning, overnight, since dawn)
- No jargon, no severity labels, no scores`}
                  </pre>
                </div>
              )}
            </div>

            {/* Data Flow & Privacy - collapsible */}
            <div className="space-y-3">
              <button
                onClick={() => setShowDataFlow(!showDataFlow)}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent-purple)] transition-colors cursor-pointer"
              >
                <ShieldCheckIcon className="w-4.5 h-4.5" />
                <span>Data Flow & Privacy</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showDataFlow ? 'rotate-180' : ''}`} />
              </button>

              {showDataFlow && (
                <div className="text-sm space-y-3 pl-6">
                  <div className="space-y-1.5">
                    <p className="font-medium text-[var(--foreground)]">What gets sent to Claude:</p>
                    <ul className="space-y-1 text-[var(--foreground-light)] text-xs">
                      <li>&bull; Post headlines and content (public news)</li>
                      <li>&bull; Source names and types</li>
                      <li>&bull; Timestamps</li>
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-[var(--foreground)]">What&apos;s NOT sent:</p>
                    <ul className="space-y-1 text-[var(--foreground-light)] text-xs">
                      <li>&bull; Your IP address or identity</li>
                      <li>&bull; Any user data or preferences</li>
                      <li>&bull; Which region you&apos;re viewing</li>
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-[var(--foreground)]">Caching:</p>
                    <p className="text-[var(--foreground-light)] text-xs">
                      Summaries are cached for 10 minutes on the server. Multiple users requesting the same
                      region will get the cached result, reducing API calls and cost.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Why Anthropic */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Why Anthropic?</h3>
              <p className="text-sm leading-relaxed">
                I chose{' '}
                <a
                  href="https://www.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-purple)] hover:underline"
                >
                  Anthropic
                </a>
                {' '}for a few reasons:
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Safety focus', desc: 'Their research on AI safety aligns with my concerns about responsible AI deployment' },
                  { label: 'Writing quality', desc: 'Claude produces more natural, less "AI-sounding" text for news synthesis' },
                  { label: 'Claude Code', desc: 'Their developer tools made building this site more collaborative than other options' },
                  { label: 'Cost structure', desc: 'Tiered models (Haiku/Sonnet/Opus) let me offer different quality levels' },
                ].map(({ label, desc }) => (
                  <li key={label} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-purple)] mt-2 flex-shrink-0" />
                    <span><strong className="text-[var(--foreground)]">{label}</strong> &mdash; {desc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Limitations */}
            <div className="p-4 bg-[var(--color-elevated-muted)] rounded-lg border border-orange-900/30">
              <p className="font-medium text-[var(--color-elevated)] text-sm mb-1.5">AI Limitations</p>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                AI summaries can make mistakes. They may miss important context, misinterpret sources,
                or occasionally hallucinate details. The summary is meant to complement the raw feed,
                not replace it. Always check the source posts for critical information.
              </p>
            </div>
          </div>
        </section>

        {/* Media Literacy Guide */}
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
                <p className="text-sm text-[var(--foreground-muted)] mb-2.5 leading-relaxed">
                  Learn how to spot misinformation, evaluate sources, and become a smarter news consumer.
                  No one is immune to propaganda &mdash; here&apos;s how to build your defenses.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-[var(--color-elevated)]">
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
