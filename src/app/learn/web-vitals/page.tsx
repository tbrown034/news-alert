'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

function MetricCard({
  name,
  fullName,
  description,
  good,
  poor,
  unit,
  isCore,
  color,
}: {
  name: string;
  fullName: string;
  description: string;
  good: string;
  poor: string;
  unit: string;
  isCore: boolean;
  color: string;
}) {
  return (
    <div className="bg-background-card border border-border-card rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${color}`}>{name}</span>
        {isCore && <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Core</span>}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{fullName}</h3>
      <p className="text-sm text-foreground-muted mb-4">{description}</p>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-foreground-light">Good: {good}{unit}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-foreground-light">Poor: {poor}{unit}</span>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-4 overflow-x-auto text-sm font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-serif text-2xl font-bold text-foreground mt-12 mb-4 scroll-mt-20">
      {children}
    </h2>
  );
}

export default function WebVitalsLearnPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-foreground-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <section className="text-center py-6 sm:py-8 mb-4">
          <p className="text-xs uppercase tracking-widest text-amber-500 font-semibold mb-3">Performance Guide</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
            Understanding Web Vitals
          </h2>
          <p className="text-foreground-muted max-w-xl mx-auto leading-relaxed">
            Web Vitals are a set of metrics that measure real-world user experience on the web.
            They quantify how fast your page loads, how quickly it responds, and how stable it is visually.
          </p>
        </section>

        {/* TOC */}
        <nav className="bg-background-card border border-border-card rounded-xl p-5 mb-8">
          <p className="text-xs uppercase tracking-wider text-foreground-light font-semibold mb-3">Contents</p>
          <ol className="space-y-1.5 text-sm">
            {[
              { id: 'what', label: 'What Are Web Vitals?' },
              { id: 'metrics', label: 'The Six Metrics' },
              { id: 'thresholds', label: 'Thresholds & Ratings' },
              { id: 'how-pulse', label: 'How Pulse Tracks Them' },
              { id: 'architecture', label: 'Architecture' },
              { id: 'interpreting', label: 'Interpreting Your Data' },
            ].map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                  {i + 1}. {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Section 1 */}
        <SectionHeading id="what">What Are Web Vitals?</SectionHeading>
        <div className="prose-custom space-y-4 text-foreground-muted leading-relaxed">
          <p>
            Web Vitals is an initiative by Google to provide unified guidance for quality signals
            that are essential to delivering a great user experience on the web.
          </p>
          <p>
            <strong className="text-foreground">Core Web Vitals</strong> are the subset that applies
            to all web pages, and are measured by Google as part of their search ranking algorithm. There are three:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-foreground">LCP</strong> — Loading performance</li>
            <li><strong className="text-foreground">INP</strong> — Interactivity</li>
            <li><strong className="text-foreground">CLS</strong> — Visual stability</li>
          </ul>
          <p>
            Three additional <strong className="text-foreground">diagnostic metrics</strong> (FCP, TTFB, FID)
            help pinpoint root causes when a Core Web Vital needs improvement.
          </p>
        </div>

        {/* Section 2 */}
        <SectionHeading id="metrics">The Six Metrics</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            name="LCP" fullName="Largest Contentful Paint" isCore={true}
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            description="Measures loading performance. LCP marks the point when the largest image or text block becomes visible in the viewport. A fast LCP reassures users that the page is useful."
            good="&#8804; 2.5s" poor="> 4s" unit=""
          />
          <MetricCard
            name="INP" fullName="Interaction to Next Paint" isCore={true}
            color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            description="Measures responsiveness. INP observes every click, tap, and keyboard interaction, then reports the worst latency. It replaced FID as a Core Web Vital in March 2024."
            good="&#8804; 200ms" poor="> 500ms" unit=""
          />
          <MetricCard
            name="CLS" fullName="Cumulative Layout Shift" isCore={true}
            color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            description="Measures visual stability. CLS quantifies how much visible content shifts unexpectedly during the page lifecycle. A low CLS means the page feels solid and predictable."
            good="&#8804; 0.1" poor="> 0.25" unit=""
          />
          <MetricCard
            name="FCP" fullName="First Contentful Paint" isCore={false}
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            description="Measures the time from navigation start to when the browser renders the first bit of content. A fast FCP gives users early feedback that the page is loading."
            good="&#8804; 1.8s" poor="> 3s" unit=""
          />
          <MetricCard
            name="TTFB" fullName="Time to First Byte" isCore={false}
            color="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
            description="Measures server responsiveness. TTFB is the time between the browser requesting a page and receiving the first byte of the response. A high TTFB delays every other metric."
            good="&#8804; 800ms" poor="> 1.8s" unit=""
          />
          <MetricCard
            name="FID" fullName="First Input Delay" isCore={false}
            color="bg-slate-500/10 text-slate-600 dark:text-slate-400"
            description="Legacy metric that measured the delay before the browser could respond to the first user interaction. Replaced by INP in 2024, which measures all interactions, not just the first."
            good="&#8804; 100ms" poor="> 300ms" unit=""
          />
        </div>

        {/* Section 3 */}
        <SectionHeading id="thresholds">Thresholds &amp; Ratings</SectionHeading>
        <div className="space-y-4 text-foreground-muted leading-relaxed">
          <p>
            Each metric measurement is automatically classified into one of three ratings:
          </p>
          <div className="flex items-center gap-6 py-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-foreground">Good</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-foreground">Needs Improvement</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-foreground">Poor</span>
            </div>
          </div>

          <div className="bg-background-card border border-border-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-card bg-slate-50 dark:bg-slate-800/30">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Metric</th>
                  <th className="text-center px-4 py-3 font-semibold text-emerald-500">Good</th>
                  <th className="text-center px-4 py-3 font-semibold text-amber-500">Needs Work</th>
                  <th className="text-center px-4 py-3 font-semibold text-red-500">Poor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-card">
                {[
                  { name: 'LCP', good: '≤ 2,500ms', mid: '2,500–4,000ms', poor: '> 4,000ms' },
                  { name: 'INP', good: '≤ 200ms', mid: '200–500ms', poor: '> 500ms' },
                  { name: 'CLS', good: '≤ 0.1', mid: '0.1–0.25', poor: '> 0.25' },
                  { name: 'FCP', good: '≤ 1,800ms', mid: '1,800–3,000ms', poor: '> 3,000ms' },
                  { name: 'TTFB', good: '≤ 800ms', mid: '800–1,800ms', poor: '> 1,800ms' },
                  { name: 'FID', good: '≤ 100ms', mid: '100–300ms', poor: '> 300ms' },
                ].map(row => (
                  <tr key={row.name}>
                    <td className="px-4 py-2.5 font-mono font-bold text-foreground">{row.name}</td>
                    <td className="px-4 py-2.5 text-center text-emerald-600 dark:text-emerald-400">{row.good}</td>
                    <td className="px-4 py-2.5 text-center text-amber-600 dark:text-amber-400">{row.mid}</td>
                    <td className="px-4 py-2.5 text-center text-red-600 dark:text-red-400">{row.poor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            Google assesses a site as having &quot;good&quot; Core Web Vitals when the <strong className="text-foreground">75th percentile (p75)</strong> of
            page loads falls within the &quot;good&quot; threshold. This means 75% of your visitors must have a good experience.
          </p>
        </div>

        {/* Section 4 */}
        <SectionHeading id="how-pulse">How Pulse Tracks Them</SectionHeading>
        <div className="space-y-4 text-foreground-muted leading-relaxed">
          <p>
            Pulse uses the <strong className="text-foreground">Next.js useReportWebVitals hook</strong>, which
            wraps Google&apos;s <code className="text-sm bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400">web-vitals</code> library.
            Every real page load reports metrics directly from the user&apos;s browser.
          </p>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">1. Client collects metrics</p>
            <CodeBlock>{`// components/WebVitals.tsx
'use client';
import { useReportWebVitals } from 'next/web-vitals';

function reportMetric(metric) {
  queue.push(metric);
  // Flush via sendBeacon on page hide
}

export function WebVitals() {
  useReportWebVitals(reportMetric);
  return null;
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">2. Beacon sends to API</p>
            <CodeBlock>{`// Metrics are batched and sent via navigator.sendBeacon
// on visibilitychange (tab switch / navigation)
// Falls back to fetch with keepalive: true
navigator.sendBeacon('/api/vitals', JSON.stringify(queue));`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">3. API stores in Postgres</p>
            <CodeBlock>{`// POST /api/vitals → web_vitals table
INSERT INTO web_vitals
  (metric_name, value, delta, rating, metric_id, page_path)
VALUES
  ('LCP', 1847.5, 1847.5, 'good', 'v4-1709...', '/');`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">4. Admin dashboard queries p75</p>
            <CodeBlock>{`-- The standard Google uses: 75th percentile
SELECT metric_name,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) as p75
FROM web_vitals
WHERE recorded_at > NOW() - INTERVAL '7 days'
GROUP BY metric_name;`}</CodeBlock>
          </div>
        </div>

        {/* Section 5 */}
        <SectionHeading id="architecture">Architecture</SectionHeading>
        <div className="bg-background-card border border-border-card rounded-xl p-5 font-mono text-sm leading-loose text-foreground-muted">
          <pre>{`Browser (real user)
  │
  ├─ useReportWebVitals() captures LCP, INP, CLS, FCP, TTFB
  │
  ├─ Metrics queued in memory (batched)
  │
  ├─ visibilitychange → sendBeacon('/api/vitals')
  │
  ▼
POST /api/vitals
  │
  ├─ Rate limit: 30 req/min per IP
  ├─ Validate metric names (allowlist)
  ├─ Extract page path from Referer header
  │
  ▼
Postgres: web_vitals table
  │
  ├─ Indexed on metric_name + recorded_at
  ├─ 90-day retention
  │
  ▼
GET /api/analytics/vitals
  │
  ├─ ?view=overview  → p75, median, rating distribution
  ├─ ?view=timeline  → 6-hour bucketed p75 trends
  │
  ▼
/admin/vitals dashboard`}</pre>
        </div>

        {/* Section 6 */}
        <SectionHeading id="interpreting">Interpreting Your Data</SectionHeading>
        <div className="space-y-4 text-foreground-muted leading-relaxed">
          <p>
            <strong className="text-foreground">Always look at p75, not averages.</strong> Averages
            are skewed by outliers. The p75 tells you what 75% of your users actually experience,
            which is the same standard Google uses.
          </p>

          <div className="bg-background-card border border-border-card rounded-xl p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">High LCP?</p>
              <p className="text-sm">Check image sizes, server response time (TTFB), and render-blocking resources. The largest visible element is often a hero image or headline text block.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">High INP?</p>
              <p className="text-sm">Look for expensive event handlers, heavy JavaScript on the main thread, or layout thrashing triggered by user interactions.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">High CLS?</p>
              <p className="text-sm">Images or ads loading without reserved dimensions, dynamic content injected above the fold, or web fonts causing a layout shift on render.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">High TTFB?</p>
              <p className="text-sm">Server-side rendering time, database queries, or distance from user to server. Edge deployment (like Vercel) helps reduce geographic latency.</p>
            </div>
          </div>

          <p>
            <strong className="text-foreground">Sample size matters.</strong> With fewer than 50 measurements,
            your p75 may not be stable. Let data accumulate for a week before drawing conclusions.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border-light text-center text-sm text-foreground-light">
          <p>
            Data source: <a href="https://web.dev/articles/vitals" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">web.dev/vitals</a>
            {' · '}
            Collected via <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-600 dark:text-amber-400">next/web-vitals</code>
            {' · '}
            Stored in Postgres
          </p>
        </div>
    </main>
  );
}
