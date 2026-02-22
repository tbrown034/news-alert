'use client';

import Link from "next/link";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserGroupIcon,
  HeartIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function MisinformationGuidePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/about"
              className="flex items-center gap-2 text-[var(--foreground-light)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">About</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <ShieldCheckIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
              <h1 className="text-base font-serif font-semibold text-[var(--foreground)] tracking-tight">Media Literacy</h1>
            </div>
            {/* Spacer for centering */}
            <div className="w-12" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
            <ShieldCheckIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Media Literacy Guide
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            How to navigate the information landscape, spot manipulation, and become a smarter news consumer.
          </p>
        </section>

        {/* Intro Card */}
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-6 space-y-4">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            In the age of instant information, distinguishing truth from manipulation is a critical skill.
            This guide isn&apos;t about telling you what to believe—it&apos;s about giving you tools to
            evaluate information for yourself. The goal is healthy skepticism, not paranoia.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This guide draws from my reporting on misinformation at{' '}
            <a
              href="https://oklahomawatch.org/2020/11/02/fight-back-against-misinformation-using-these-tips/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 dark:text-amber-400 hover:underline font-medium"
            >
              Oklahoma Watch
            </a>
            , including insights from{' '}
            <a
              href="https://www.climatechangecommunication.org/debunking-handbook-2020/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 dark:text-amber-400 hover:underline"
            >
              The Debunking Handbook 2020
            </a>
            .
          </p>
        </section>

        {/* Core Principle */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <LightBulbIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                The Core Principle
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4">
            <p className="text-2xl font-semibold text-slate-900 dark:text-white text-center py-4">
              No one is immune to propaganda.
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              This includes you. This includes me. This includes the smartest people you know.
              The belief that &quot;I&apos;m too smart to be fooled&quot; is itself a vulnerability.
              Modern disinformation is sophisticated, well-funded, and specifically designed to
              bypass critical thinking.
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Accepting this isn&apos;t defeatist—it&apos;s the first step toward building real defenses.
              Humility about our own biases makes us harder to manipulate.
            </p>
          </div>
        </section>

        {/* Emotional Manipulation */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <HeartIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Watch Your Emotions
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-6 text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-900 dark:text-white">If a post makes you feel intense emotion, pause.</strong>
              {' '}Research shows that misinformation specifically designed to mislead typically seeks to evoke
              a strong emotional response from its audience. Outrage, fear, triumphant vindication—these are
              the emotions that spread content fastest. Disinformation operators know this.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
              <p className="font-medium text-slate-900 dark:text-white">Ask yourself:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">?</span>
                  <span>Did the person posting this <em>want</em> me to feel this way? Why?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">?</span>
                  <span>Am I being motivated to share before I verify?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">?</span>
                  <span>Does this confirm something I already believe a little too perfectly?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">?</span>
                  <span>Would I be embarrassed if this turned out to be false?</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              The stronger your emotional reaction, the more carefully you should verify before sharing.
            </p>
          </div>
        </section>

        {/* Analyze Your Sources */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MagnifyingGlassIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Analyze Your Sources
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-6 text-slate-600 dark:text-slate-300">
            <p>
              Not all sources are equal. Understanding where information comes from helps you weight it appropriately.
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Primary vs Secondary Sources</h3>
                <p className="text-sm">
                  <strong className="text-green-600 dark:text-green-400">Primary:</strong> Original documents, official statements, direct footage, first-hand accounts.
                  <br />
                  <strong className="text-amber-600 dark:text-amber-400">Secondary:</strong> News reports, analysis, commentary on primary sources.
                </p>
                <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
                  Secondary sources can add valuable context, but always try to find the primary source when possible.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Step 1: Check Where It Came From</h3>
                <p className="text-sm mb-2">
                  Your first step should always be examining where the article, meme, or content originally came from.
                  Don&apos;t just look at who shared it—trace it back to the original source.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Step 2: Evaluate Credibility</h3>
                <p className="text-sm mb-3">
                  Once you know where information began, ask yourself:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">-</span>
                    <span>Is this source credible? Have they trafficked in misinformation before?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">-</span>
                    <span>Do you know the political leaning of the source?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">-</span>
                    <span>Who wrote it? What&apos;s the journalist&apos;s track record?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">-</span>
                    <span>Do they cite their sources, or just make claims?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">-</span>
                    <span>Are they reporting facts or editorializing?</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Breaking News Caution */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Breaking News Is Often Wrong
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4 text-slate-600 dark:text-slate-300">
            <p>
              The first reports about any major event are almost always partially wrong.
              This isn&apos;t necessarily malicious—it&apos;s the nature of chaotic, fast-moving situations.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50">
                <p className="font-medium text-red-800 dark:text-red-200 mb-2">In the first hours:</p>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>- Casualty numbers shift dramatically</li>
                  <li>- Perpetrator identities change</li>
                  <li>- Motives are speculated</li>
                  <li>- Eyewitness accounts conflict</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/50">
                <p className="font-medium text-green-800 dark:text-green-200 mb-2">Better approach:</p>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>- Note claims as &quot;unverified&quot;</li>
                  <li>- Wait for multiple confirmations</li>
                  <li>- Look for official sources</li>
                  <li>- Accept uncertainty</li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              It&apos;s okay to say &quot;I don&apos;t know yet.&quot; That&apos;s often the most honest position.
            </p>
          </div>
        </section>

        {/* Common Tactics */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Common Manipulation Tactics
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4 text-slate-600 dark:text-slate-300">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Decontextualization</h3>
                <p className="text-sm">
                  Real photos, quotes, or videos taken out of context to imply something different.
                  The content is authentic; the framing is the lie.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Firehose of Falsehood</h3>
                <p className="text-sm">
                  Flooding the zone with so many claims that verification becomes exhausting.
                  The goal isn&apos;t to convince—it&apos;s to confuse and exhaust.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Amplification Networks</h3>
                <p className="text-sm">
                  Coordinated accounts boosting specific narratives to make fringe views seem mainstream.
                  High engagement doesn&apos;t mean high truth.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Kernel of Truth</h3>
                <p className="text-sm">
                  Starting with a real fact, then building false conclusions on top.
                  The foundation is true; the house is fiction.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">&quot;Just Asking Questions&quot;</h3>
                <p className="text-sm">
                  Implying false narratives through leading questions while maintaining deniability.
                  &quot;I&apos;m not saying it&apos;s true, but isn&apos;t it suspicious that...&quot;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Tools */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <DocumentMagnifyingGlassIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Verification Tools
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4 text-slate-600 dark:text-slate-300">
            <p>These free tools can help you verify claims:</p>

            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href="https://images.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <p className="font-medium text-slate-900 dark:text-white">Google Reverse Image Search</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Find where images originated</p>
              </a>
              <a
                href="https://www.snopes.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <p className="font-medium text-slate-900 dark:text-white">Snopes</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Fact-checking database</p>
              </a>
              <a
                href="https://archive.org/web/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <p className="font-medium text-slate-900 dark:text-white">Wayback Machine</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">See what pages said originally</p>
              </a>
              <a
                href="https://www.bellingcat.com/resources/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <p className="font-medium text-slate-900 dark:text-white">Bellingcat Toolkit</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">OSINT verification resources</p>
              </a>
            </div>
          </div>
        </section>

        {/* Social Media Specific */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Social Media Red Flags
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4 text-slate-600 dark:text-slate-300">
            <p>Be extra skeptical when you see:</p>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
                </span>
                <span>Accounts created recently that post with unusual frequency</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
                </span>
                <span>Screenshots of tweets/posts instead of links (easy to fake)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
                </span>
                <span>&quot;BREAKING&quot; without any source cited</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
                </span>
                <span>Viral content from accounts you&apos;ve never seen before</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
                </span>
                <span>Content that&apos;s too perfect for your existing beliefs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
                </span>
                <span>Claims that &quot;mainstream media won&apos;t cover this&quot;</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Building Good Habits */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Building Good Habits
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4 text-slate-600 dark:text-slate-300">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">1</span>
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Diversify your sources</p>
                  <p className="text-sm">Read across the political spectrum. If you only consume one perspective, you&apos;re getting a filtered view.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">2</span>
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Slow down before sharing</p>
                  <p className="text-sm">The share button is designed to be fast. Verification takes time. That tension is by design.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">3</span>
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Follow corrections</p>
                  <p className="text-sm">Good outlets issue corrections. Note which sources correct themselves—that&apos;s a sign of integrity, not weakness.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">4</span>
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Be willing to be wrong</p>
                  <p className="text-sm">The ability to update your beliefs when presented with new evidence is a strength, not a weakness.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">5</span>
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Take breaks</p>
                  <p className="text-sm">Information fatigue makes you more vulnerable. A tired mind is more susceptible to manipulation.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Final Note */}
        <section className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 p-6 text-center">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            The goal isn&apos;t to trust nothing—it&apos;s to trust thoughtfully.
            Healthy skepticism means asking questions, not rejecting everything.
            The best defense against manipulation is an informed, curious mind that remains open to evidence.
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Written by{' '}
            <a
              href="https://oklahomawatch.org/author/trevorbrown/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-300 hover:underline"
            >
              Trevor Brown
            </a>
            , former investigative reporter at Oklahoma Watch covering democracy and misinformation.
          </p>
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Return to News Pulse
          </Link>
        </footer>
      </main>
    </div>
  );
}
