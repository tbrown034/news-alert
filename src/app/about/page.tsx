import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftIcon,
  NewspaperIcon,
  ChartBarIcon,
  UserIcon,
  GlobeAltIcon,
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Pulse, how our intelligence ranking system works, and the team behind it.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-8">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            About Pulse
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Real-time global intelligence monitoring for those who need to know first.
          </p>
        </section>

        {/* About the Site */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <GlobeAltIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                What is Pulse?
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4 text-slate-600 dark:text-slate-300">
            <p>
              Pulse is a real-time global intelligence dashboard that aggregates and analyzes
              <strong className="text-slate-900 dark:text-white"> 580+ verified OSINT sources</strong> to
              deliver breaking news before it hits mainstream media.
            </p>
            <p>
              The platform monitors RSS feeds from major news organizations, wire services, and regional
              outlets alongside 150+ curated Bluesky accounts from journalists, analysts, and official
              government channels.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">580+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sources</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">6</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Map Layers</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">5</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Regions</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">24/7</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monitoring</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">Coverage Areas</h3>
              <div className="flex flex-wrap gap-2">
                {['Breaking News', 'Earthquakes (6.0+)', 'Wildfires', 'Weather Alerts', 'Internet Outages', 'Travel Advisories'].map((item) => (
                  <span key={item} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How the Formulas Work */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                How the Ranking Works
              </h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-6 text-slate-600 dark:text-slate-300">
            <p>
              Pulse uses a multi-layered intelligence ranking system to surface the most important
              news first. Here&apos;s how it works:
            </p>

            {/* Source Tiers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Source Tiers</h3>
              </div>
              <p className="text-sm">
                Sources are organized into three fetch tiers based on activity level and reliability:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
                  <span className="w-8 h-8 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded">T1</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Critical (84 sources)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fetched first, always. Reuters, AP, BNO News, NOELREPORTS</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
                  <span className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded">T2</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Standard (76 sources)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fetched async, animated in. Regional analysts, secondary journalists</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="w-8 h-8 flex items-center justify-center bg-slate-500 text-white text-xs font-bold rounded">T3</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Archive (24 sources)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">On-demand fetching. Occasional commentators, specialists</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Types */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Source Type Scoring</h3>
              </div>
              <p className="text-sm">
                Each source type carries a different weight in our ranking algorithm:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 font-medium text-slate-900 dark:text-white">Source Type</th>
                      <th className="text-center py-2 font-medium text-slate-900 dark:text-white">Score</th>
                      <th className="text-left py-2 font-medium text-slate-900 dark:text-white">Examples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-2">Official</td>
                      <td className="py-2 text-center font-mono text-green-600 dark:text-green-400">5</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">Pentagon, White House, IDF</td>
                    </tr>
                    <tr>
                      <td className="py-2">News Org</td>
                      <td className="py-2 text-center font-mono text-green-600 dark:text-green-400">4</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">Reuters, AP, BBC</td>
                    </tr>
                    <tr>
                      <td className="py-2">OSINT</td>
                      <td className="py-2 text-center font-mono text-green-600 dark:text-green-400">4</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">NOELREPORTS, BNO News</td>
                    </tr>
                    <tr>
                      <td className="py-2">Reporter</td>
                      <td className="py-2 text-center font-mono text-blue-600 dark:text-blue-400">3</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">Christopher Miller, Jim Acosta</td>
                    </tr>
                    <tr>
                      <td className="py-2">Analyst</td>
                      <td className="py-2 text-center font-mono text-blue-600 dark:text-blue-400">3</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">ISW, CSIS</td>
                    </tr>
                    <tr>
                      <td className="py-2">Aggregator</td>
                      <td className="py-2 text-center font-mono text-slate-600 dark:text-slate-400">2</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">News aggregation accounts</td>
                    </tr>
                    <tr>
                      <td className="py-2">Ground</td>
                      <td className="py-2 text-center font-mono text-slate-600 dark:text-slate-400">2</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">On-the-ground reporters</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recency Bonus */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Recency Bonus</h3>
              </div>
              <p className="text-sm">
                Breaking news gets boosted based on how fresh it is:
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">+3</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">&lt; 30 min</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">+2</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">&lt; 60 min</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-lg font-bold text-slate-600 dark:text-slate-400">+1</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">&lt; 2 hours</p>
                </div>
              </div>
            </div>

            {/* Severity Detection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <NewspaperIcon className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Severity Detection</h3>
              </div>
              <p className="text-sm">
                Headlines are scanned for keywords that indicate urgency. Posts containing
                &quot;BREAKING&quot;, &quot;URGENT&quot;, or conflict-related terms get a <strong className="text-slate-900 dark:text-white">+2 boost</strong>.
              </p>
              <div className="flex flex-wrap gap-2">
                {['breaking', 'urgent', 'alert', 'strike', 'explosion', 'missile', 'invasion', 'casualties'].map((keyword) => (
                  <code key={keyword} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">
                    {keyword}
                  </code>
                ))}
              </div>
            </div>

            {/* Activity Surge */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">Activity Surge Detection</h3>
              <p className="text-sm">
                The system monitors posting rates against regional baselines. When activity exceeds
                normal levels, the dashboard indicates heightened activity:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span>Critical</span>
                  <span className="font-mono text-red-600 dark:text-red-400">&ge; 4x baseline</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                  <span>Elevated</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">&ge; 2x baseline</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                  <span>Normal</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">&lt; 2x baseline</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Me */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Trevor Brown</h2>
                <p className="text-slate-300 text-sm">
                  Investigative journalist + developer + data visualizer
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6 text-slate-600 dark:text-slate-300">
            <p>
              I spent 15+ years chasing public records and holding power accountable as an
              investigative reporter. Now I build interactive tools that transform complex data
              into accessible insights.
            </p>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">Background</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">-</span>
                  <span>Editor-in-Chief at The Indiana Daily Student</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">-</span>
                  <span>Statehouse reporter for Wyoming Tribune Eagle</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">-</span>
                  <span>Investigative reporter with Oklahoma Watch (nonprofit newsroom)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">-</span>
                  <span>Multiple first-place awards from Oklahoma SPJ for investigative and government reporting</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">Why I Built Pulse</h3>
              <p className="text-sm">
                As a journalist, I know the value of being first with accurate information.
                I built Pulse to aggregate the sources I already trust into a single dashboard,
                surfacing breaking news faster than traditional media while maintaining source
                credibility through transparent ranking.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">Connect</h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/tbrown034"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  <span className="text-sm font-medium">GitHub</span>
                </a>
                <a
                  href="https://linkedin.com/in/trevorabrown"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  <span className="text-sm font-medium">LinkedIn</span>
                </a>
                <a
                  href="https://trevorthewebdeveloper.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <GlobeAltIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Website</span>
                </a>
                <a
                  href="mailto:trevorbrown.web@gmail.com"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-medium">Email</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
          <p>Built with Next.js, TypeScript, and Claude AI</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} Pulse. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
