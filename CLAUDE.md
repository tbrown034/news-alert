# Pulse (news-alert)

Real-time global intelligence dashboard for monitoring breaking news, seismic activity, and geopolitical events.

## Quick Start
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # Production build
vercel             # Deploy
```

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── news/route.ts       # Main feed - RSS/Bluesky/Telegram/Reddit/YouTube
│   │   ├── summary/route.ts    # AI briefing generation (Claude)
│   │   ├── seismic/route.ts    # USGS earthquake data
│   │   ├── weather/route.ts    # NOAA/EONET/GDACS alerts
│   │   ├── fires/route.ts      # NASA FIRMS wildfire data
│   │   ├── outages/route.ts    # Internet outage tracking
│   │   ├── travel/route.ts     # State Dept advisories
│   │   └── briefing-followup/  # AI follow-up Q&A
│   ├── layout.tsx
│   └── page.tsx
├── components/                  # 15 React components (maps, feeds, cards)
├── lib/
│   ├── sources-clean.ts        # MAIN SOURCE FILE (475 sources)
│   ├── rss.ts                  # Multi-platform fetcher (1300+ lines)
│   ├── regionDetection.ts      # Keyword-based geo classification
│   ├── activityDetection.ts    # Regional activity levels
│   ├── aiSummary.ts            # Claude API integration
│   ├── newsCache.ts            # 5min TTL cache
│   ├── rateLimit.ts            # 60 req/min per IP
│   └── blocklist.ts            # Rejected sources registry
└── types/                       # TypeScript definitions
```

## Environment Variables
```env
ANTHROPIC_API_KEY=     # Required - AI features
NASA_FIRMS_API_KEY=    # Required - Wildfire data
BLUESKY_IDENTIFIER=    # Optional - Higher rate limits
BLUESKY_APP_PASSWORD=  # Optional
```

## Tech Stack
Next.js 15 | TypeScript | Tailwind CSS | react-simple-maps | Claude API | Heroicons

---

## Source System

### Source Count
- **475 total sources** (229 Bluesky, 214 RSS, 11 Telegram, 8 Reddit, 7 YouTube, 6 Mastodon)

### Source Types (for categorization, not ranking)
- `official` - Government, military, institutional
- `news-org` - News organizations (AP, Reuters)
- `reporter` - Individual journalists
- `osint` - Open-source intelligence (Bellingcat, ISW)
- `aggregator` - News aggregators (BNO, War Monitor)
- `analyst` - Think tanks, experts
- `ground` - On-the-ground, local reporters
- `bot` - Automated feeds

### Platforms Supported
- **Bluesky** - RSS feeds via bsky.app/profile/{handle}/rss
- **RSS/Atom** - Native XML parsing
- **Telegram** - Web scrape t.me/s/{channel}
- **Reddit** - JSON API /r/{sub}/hot.json
- **YouTube** - Feed XML
- **Mastodon** - ActivityPub API

### Feed Philosophy
- **Chronological order** - newest posts first, no algorithmic ranking
- **Activity detection** - frequency-based surge detection per region
- **Source diversity** - 20% OSINT balance to prevent wire service dominance

---

## Source Discovery & Maintenance

### Finding New Sources

**Step 1: Search**
```bash
# Use existing scripts
npx tsx scripts/comprehensive-source-search.js "iran news"
npx tsx scripts/search-bluesky-accounts.js "osint ukraine"
```

**Step 2: Verify**
```bash
# Test the source works
npx tsx scripts/test-new-sources.ts
```

**Step 3: Add to sources-clean.ts**
```typescript
{
  id: 'unique-id',
  name: 'Display Name',
  handle: 'handle.bsky.social',  // for Bluesky
  platform: 'bluesky',
  sourceType: 'osint',
  confidence: 85,
  region: 'middle-east',
  fetchTier: 'T2',
  baselinePPD: 5,
  feedUrl: 'https://bsky.app/profile/handle.bsky.social/rss'
}
```

**Step 4: Audit periodically**
```bash
npx tsx scripts/audit-sources.ts
```

### Blocklist - Sources We've Rejected

**Location:** `src/lib/blocklist.ts`

Before searching for new sources, check this file to avoid re-evaluating rejected sources.

**Current blocked sources:**
- Kathmandu Post - Off-topic for regional feeds
- Dark Reading - Cybersecurity only
- Marginal Revolution - Economics blog
- Bleeping Computer - Tech news only
- socialistdogmom - Off-topic

**To add a rejected source:**
```typescript
// In src/lib/blocklist.ts
{
  id: 'source-id',
  name: 'Source Name',
  reason: 'Why rejected',
  dateBlocked: '2026-01-27',
}
```

### Sources We've Already Searched
Track searches to avoid duplicating effort:

| Date | Search Query | Platform | Sources Found | Added |
|------|-------------|----------|---------------|-------|
| 2026-01 | "iran osint" | Bluesky | 12 | 8 |
| 2026-01 | "ukraine war" | Bluesky | 20 | 15 |
| 2026-01 | Middle East RSS | RSS | 30 | 22 |

---

## Activity Detection

Two separate systems. **Do not cross-wire them.**

### System 1: Detection (live, per-request)

**Files:** `activityDetection.ts` (region-level), `sourceActivity.ts` (per-source)

Compares actual post count in a 6-hour window against DB-derived baselines.

```
Baseline = 14-day rolling average of actual posts per 6h bucket (from post_activity_logs)
Fallback = PPD-sum from sources-clean.ts ÷ 4 (used if DB has no data)

Region-level thresholds (against baseline):
  Multiplier >= 5.0 AND count >= 50 → CRITICAL
  Multiplier >= 2.5 AND count >= 25 → ELEVATED
  Otherwise → NORMAL

Source-level thresholds:
  Multiplier >= 2.5 AND count >= 3 → ANOMALOUS
```

**Baselines come from the database** — `getRegionBaselineAverages()` in `activityLogging.ts` queries 14-day rolling averages from the `region_breakdown` JSONB column in `post_activity_logs`. This captures actual post distribution after region reclassification, so baselines are self-correcting when sources are added/removed.

**Fallback:** If the DB has insufficient data (<4 samples), baselines fall back to summing `getEffectivePPD()` values (`baselinePPD ?? estimatedPPD ?? 3`) from `sources-clean.ts`. Baselines are cached for 30 minutes with background refresh.

Excluded regions (always NORMAL): LATAM, Asia, Africa — insufficient source coverage.

### System 2: Observability Logging (live, write-only)

**Files:** `activityLogging.ts`, DB table `post_activity_logs`

Writes 6-hour-bucketed snapshots (post counts, region/platform breakdowns, fetch duration) to the database on every fetch. Buckets align to 00:00/06:00/12:00/18:00 UTC.

**This data IS used by the detection system** — `getRegionBaselineAverages()` derives baselines from 14-day rolling averages of these snapshots. It also powers the activity history chart on the conditions page via `/api/analytics/activity?view=history`.

### Keeping Baselines Fresh

Baselines update automatically from the database. No manual intervention needed unless the DB is reset.

For per-source PPD measurement (used for source-level anomaly detection), run periodically:
```bash
npx tsx scripts/measure-source-baselines.ts           # Update all platforms
npx tsx scripts/measure-source-baselines.ts --dry-run  # Preview without writing
npx tsx scripts/measure-source-baselines.ts --platform bluesky  # One platform only
```

### Design Decisions

- **DB-derived baselines** — 14-day rolling average from `post_activity_logs.region_breakdown` JSONB. Self-correcting when sources are added/removed. Solves the region:'all' baseline leak (sources tagged 'all' produce posts classified to specific regions, and DB captures actual distribution).
- **No time-of-day multipliers** — empirical data showed posting is nearly flat across UTC slots (0.92-1.04), so multipliers were removed in favor of a flat baseline.
- **Per-source anomaly data is computed but not yet displayed in the UI** — attached to each NewsItem as `sourceActivity` but NewsCard/NewsFeed don't render it.
- **Activity history chart** on conditions page (`ActivityChart.tsx`) — uses recharts `AreaChart` with time range selector (24h/3d/7d/14d) and region toggles.

---

## Scripts Reference

### Active (Keep)
| Script | Purpose |
|--------|---------|
| `measure-source-baselines.ts` | Measure baselinePPD for all sources (run monthly) |
| `estimate-ppd.ts` | Quick PPD estimate from ~100 posts (`--region`, `--platform`, `--dry-run`) |
| `test-new-sources.ts` | Test newly added sources |
| `audit-sources.ts` | Validate all sources, find 404s/inactive |
| `audit-sources-quick.ts` | Quick alive-check with PPD comparison (`--region`, `--platform`) |
| `test-bluesky-accounts.ts` | Performance diagnostics |
| `test-region-detection.ts` | 90-test suite for region detection |
| `telegram-auth.ts` | Telegram session re-authentication |
| `test-telegram-session.ts` | Verify Telegram session works |
| `test-ai-models.ts` | AI model comparison (Sonnet vs Haiku) |
| `test-tiers.ts` | Source tier testing |

### Archive (One-time use)
All one-time scripts live in `scripts/archive/`. Check there before creating new utility scripts.

---

## Error Handling

### Bluesky
| Status | Handling |
|--------|----------|
| 400/404 | Cached 1 hour, silent after first log |
| 429 | Logged (rate limit), not cached |
| 401/403 | Logged - check credentials |
| 500-504 | Logged, not cached |

### All Platforms
- Timeout: 15s default, 8s for Telegram
- Invalid handles cached to prevent repeated failures
- Partial failures return available data
- Stale-while-revalidate: 15 min fallback

---

## Known Technical Debt

No major debt items. Last cleanup: Feb 2026 (removed dead components, unused exports, archived one-off scripts).

---

## AI Briefing Feature

### Overview
The AI briefing generates a situation summary using Claude. Located in `src/lib/aiSummary.ts`.

### How It Works
1. **Select** - Takes the 25 most recent posts (simple recency, no scoring)
2. **Deduplicate** - Removes similar headlines
3. **Synthesize** - Claude generates overview + 2-3 key developments

### Model Tiers
- **Quick** - Claude Haiku 4.5 (fast, economical)
- **Advanced** - Claude Sonnet 4 (balanced)
- **Pro** - Claude Opus 4.5 (most capable)

### Caching
- Server: 10-minute cache
- Client: 3-minute cache

### Components
- `InlineBriefing.tsx` - Compact inline version (main feed)
- `SituationBriefing.tsx` - Full modal version
- `aiSummary.ts` - Post selection and API call

---

## Principles
- **KISS** - Keep It Simple
- **Chronological** - No algorithmic ranking, newest first
- **Transparent** - Show where every story comes from
- **Frequency-based** - Activity detection without ML complexity
- **Mobile-first** - Dark theme, responsive design
