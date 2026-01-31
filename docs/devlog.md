# Development Log

A chronological record of development sessions and significant changes.

---

## 2026-01-29 - New Posts Divider Feature

**Session Summary:**
- Added "new since you arrived" divider to the news feed
- Explored 4 UX approaches for indicating new posts when live updates are on
- User chose option 4: unread line marker showing where new content begins

**Key Decisions:**
- Used `initialSessionIds` state to capture items present at page load (frozen for session)
- Divider appears between new items and original items, showing count
- Per-tab tracking: switching regions resets the baseline so each tab has its own "arrival" state
- Chose subtle blue gradient line with centered count text - visible but not intrusive

**Notable Changes:**

*src/components/NewsFeed.tsx*
- Added `initialSessionIds` state to track items present when user first loaded page
- Added `newSinceArrivalCount` and `dividerIndex` memos to calculate divider position
- Renders divider line with count before first "old" item when new posts exist
- Reset `initialSessionIds` on tab change so each region gets fresh baseline

**Technical Notes:**
- Divider only renders when `dividerIndex > 0` (has new items) and `newSinceArrivalCount > 0`
- Feed is sorted newest-first, so new items always appear at top, divider marks the boundary
- Styling: `bg-gradient-to-r from-transparent via-blue-400/50 to-transparent` for fade-in effect

---

## 2026-01-29 - Favicon Redesign & RSS Date Fixes

**Session Summary:**
- Redesigned favicon using multi-agent approach (Gemini AI + hand-crafted SVGs)
- Generated 6 favicon options: Compass, Crosshair, Radar, Hexagon, Abstract Eye, EKG Pulse
- Selected Abstract Eye design - geometric "awareness" symbol with editorial weight
- Fixed RSS date parsing bug causing SIPRI/IAEA stories to always appear first
- Blocked broken RSS sources (Telegraph 403, MEMRI TV 404)

**Key Decisions:**
- Chose hand-crafted SVG over AI-generated PNGs for cleaner scaling
- Eye symbol chosen for: no text (rebrand-friendly), editorial weight like Bloomberg/Reuters
- Stroke-based design (not filled) maintains crispness at 16x16
- Installed librsvg via Homebrew for SVG→PNG conversion

**Notable Changes:**

*public/* (Favicon files)
- `favicon.svg` - New abstract eye design (geometric arcs + concentric circles)
- `favicon-16x16.png` - Generated from SVG
- `favicon-32x32.png` - Generated from SVG
- `apple-touch-icon.png` - 180x180 for iOS
- `favicon-192x192.png` - PWA icon
- `favicon-512x512.png` - PWA splash

*src/lib/rss.ts*
- Added CDATA wrapper stripping in `parsePubDate()`
- Added IAEA date format parsing (`YY-MM-DD HH:MM`)
- Fixed timezone abbreviation matching (word boundaries, length-ordered)

*src/lib/blocklist.ts*
- Added Telegraph (HTTP 403 - blocks RSS requests)
- Added MEMRI TV (YouTube 404 - channel removed/changed)

*src/lib/sources-clean.ts*
- Removed Telegraph and MEMRI TV entries

**Technical Notes:**
- SVG favicon uses quadratic bezier curves (`Q`) for smooth eye arcs
- `stroke-linecap="round"` for refined line terminals
- Timezone regex uses `\b` word boundaries to prevent partial matches (WET in WEST)
- IAEA uses non-standard date format `26-01-29 13:30` (YY-MM-DD)

---

## 2026-01-29 - Monetization Analysis

**Session Summary:**
- Conducted legal analysis for monetizing Pulse with a $1/week Pro tier (Opus AI access)
- Evaluated business model options including subscriptions, grants, API licensing, and editorial products
- Documented all findings for future reference

**Key Decisions:**
- Anthropic API commercial use: Low risk (standard SaaS model)
- News aggregation: Medium risk at small scale, higher at scale (fair use + transformative AI summaries help)
- Reddit integration: High risk, recommend dropping or paying for official API before monetizing
- Government data (USGS, NOAA, NASA): Very low risk (public domain)
- Recommended initial stack: Ko-fi tip jar + $5/mo Pro tier + grant applications

**Notable Changes:**

*Files Created:*
- `docs/plans/monetization-legal-analysis.md` - Comprehensive legal risk assessment covering API terms, content aggregation, platform ToS, compliance requirements
- `docs/plans/monetization-business-model.md` - Market comparables, 3 pricing models, 10+ alternative revenue streams, comparison matrix, editorial product ideas

**Technical Notes:**
- Transformative use (AI synthesis) strengthens fair use argument for aggregation
- Journalism grants (Knight, Google News Initiative, Mozilla) are viable funding source given OSINT/public interest angle
- Editorial layer ("Trevor's Takes") increases willingness to pay from ~$4/mo (tool) to ~$12/mo (personality + tool)

---

## 2026-01-29 - Source Discovery & Expansion

**Session Summary:**
- Conducted comprehensive source discovery using 6 parallel research agents
- Analyzed existing 476 sources for gaps (found LATAM underrepresented at 2.3%)
- Searched Bluesky starter packs, Mastodon journalism instances, and competitor aggregators
- Tested 32 potential new sources, verified 29 working
- Added 8 new Bluesky accounts after deduplication analysis against existing RSS/Mastodon feeds

**Key Decisions:**
- Kept RSS versions of news orgs (more reliable) instead of adding duplicate Bluesky feeds
- Skipped 12 accounts that would duplicate existing content (bellingcat, foreignpolicy, etc.)
- Prioritized Middle East coverage as requested, but found most gaps in Europe-Russia OSINT
- Placed very active accounts in T1, less active (bglaser) in T2

**Notable Changes:**

*src/lib/sources-clean.ts*
- Added 8 new Bluesky sources (476 → 484 total)

*New Sources Added:*
| ID | Handle | Region | Type |
|----|--------|--------|------|
| ruth-michaelson | @ruthmichaelson.com | middle-east | reporter |
| vatniksoup | @vatniksoup.bsky.social | europe-russia | osint |
| chriso-wiki | @chriso-wiki.bsky.social | europe-russia | osint |
| shashank-joshi | @shashj.bsky.social | all | analyst |
| michael-colborne | @colborne.bsky.social | europe-russia | reporter |
| militarynewsua | @militarynewsua.bsky.social | europe-russia | news-org |
| occrp | @occrp.org | all | news-org |
| bonnie-glaser | @bglaser.bsky.social | asia | analyst |

*Files Created:*
- `docs/source-discovery-2026-01-29.md` - Full research report with 100+ potential future sources
- `docs/discovered-bluesky-accounts.md` - Network analysis of existing source connections
- `scripts/test-discovered-sources.ts` - Source verification script

**Technical Notes:**
- Bluesky RSS feeds: `https://bsky.app/profile/{handle}/rss`
- Mastodon RSS feeds: `https://{instance}/@{user}.rss`
- Many OSINT accounts (Intel Crab, OSINTtechnical) are stale on Bluesky but active on X

---

## 2026-01-29 - UI Consolidation & Bug Fixes

**Session Summary:**
- Consolidated map UI into a cohesive unit with integrated header, tabs, and status bar
- Stylized Live Wire header to match Global Monitor design language
- Fixed timezone parsing bug in RSS date handling
- Improved spacing and layout throughout the dashboard

**Key Decisions:**
- Moved map view tabs (Main/Seismic/Weather/etc.) into the map header instead of separate bar above
- Connected status bar flush to map bottom using split border-radius technique
- Adopted consistent header pattern: translucent bg, icon left, info/controls right

**Notable Changes:**

*src/lib/rss.ts*
- Fixed timezone abbreviation partial matching bug (WET was matching in WEST)
- Added word boundary regex and ordered longer abbreviations first
- Added IAEA date format parsing (YY-MM-DD HH:MM)

*src/components/WorldMap.tsx*
- Reduced map height (200→140px mobile, 260→180px desktop)
- Added stats bar below map showing post count and largest earthquake

*src/components/NewsFeed.tsx*
- Moved "Live updates" toggle into stats header (was separate section)
- Increased horizontal padding from px-2 to px-3/px-4 for better spacing

*src/components/InlineBriefing.tsx*
- Changed margin from `my-3` to `mt-4 mb-3` for better separation from filter bar

*src/app/HomeClient.tsx*
- Integrated view tabs into map header (title left, tabs right, hide button)
- Map container now `rounded-t-2xl`, status bar `rounded-b-2xl` with `-mt-[1px]`
- Simplified "Show Map" button when collapsed (shows current view name)
- Restyled Live Wire header to match Global Monitor (translucent bg, post count)
- Removed unused `xlDropdownRef`

**Technical Notes:**
- `-mt-[1px]` eliminates hairline gaps between adjacent elements
- `backdrop-blur-sm` with semi-transparent bg creates frosted glass effect
- Word boundary regex `\b` prevents partial matches in timezone parsing

---

## 2026-01-29 - Reply Filtering & Competitive Analysis

**Session Summary:**
- Fixed issue with contextless reply posts appearing in feed (e.g., "log is the least appetizing name" without the Pizza Logs context)
- Added `filter=posts_no_replies` to Bluesky API call - single line fix
- Conducted comprehensive competitive research on news aggregation space
- Created detailed competitive analysis dossier with 10 competitors

**Key Decisions:**
- Chose to filter ALL replies rather than just orphaned ones (no parent context) - cleaner for news dashboard
- Matches existing Mastodon behavior (`exclude_replies=true`)
- Native API filtering is better than client-side heuristics

**Notable Changes:**

*src/lib/rss.ts*
- Line ~1035: Added `&filter=posts_no_replies` to Bluesky `getAuthorFeed` API URL
- This filters replies at the API level, preventing contextless conversation posts

*docs/competitive-analysis.md* (NEW)
- 10 competitors analyzed: Feedly, Inoreader, Ground News, Flipboard, Techmeme, BNO News, LiveUAMap, Recorded Future, Maltego, Meltwater
- Comparison matrix with pricing, features, and differentiators
- Technical details on deduplication algorithms (Feedly's LSH finds 80% of articles are duplicates!)
- Why Artifact failed (Instagram founders' news app - identity crisis, low downloads)
- Positioning map showing where Pulse fits in the landscape
- Actionable opportunities: story clustering, better deduplication, source transparency

**Technical Notes:**
- Bluesky `getAuthorFeed` supports `filter` param: `posts_no_replies`, `posts_with_media`, `posts_and_author_threads`
- Feedly uses Locality Sensitive Hashing (LSH) at 80-85% similarity threshold
- Our current dedup (80-char title prefix) is primitive compared to LSH
- Story clustering (grouping related articles) identified as biggest UX opportunity

**Research Sources:**
- Feedly Engineering: https://feedly.com/engineering/posts/reducing-clustering-latency
- Ground News: https://ground.news/rating-system
- Techmeme 20 years: https://news.techmeme.com/250912/20-years
- Artifact post-mortem: https://techcrunch.com/2024/01/18/why-artifact-from-instagrams-founders-failed-shut-down/

---

## 2026-01-29 - Created Devlog Skill

**Session Summary:**
- Created a new `/devlog` skill for Claude Code
- Skill automatically manages `docs/devlog.md` files across projects
- Set up initial devlog for the news-alert project

**Notable Changes:**
- Added `~/.claude/skills/devlog/SKILL.md` - personal skill that works across all projects
- Skill triggers on `/devlog` command or after significant code changes
- Entry format includes date, summary, and notable technical details

**Files Created:**
- `~/.claude/skills/devlog/SKILL.md` - the skill definition
- `docs/devlog.md` - this file (project-specific log)

---

## 2026-01-29 - AI Summary Redesign

**Session Summary:**
- Completely redesigned the AI Summary component (InlineBriefing) from a card-based design to a full-width header section
- Fixed critical header visibility bug where the sticky filter bar was covering the AI Summary header
- Simplified the visual design to be less "AI feely" per user feedback
- Tested across mobile (375px), tablet (768px), and desktop (1280px) using Playwright

**Key Decisions:**
- Full-width design (no horizontal margins) to visually differentiate from news message cards
- Simple bullet points (•) instead of numbered circles with gradient backgrounds
- Moved InlineBriefing INSIDE the sticky header section rather than below it
- KISS approach: no gradients, no shadows, just clean borders and subtle backgrounds

**Notable Changes:**

*src/components/InlineBriefing.tsx*
- Removed `mx-3 sm:mx-4` margins - now spans full width of container
- Changed from rounded card (`rounded-2xl`) to border-bottom separator (`border-b`)
- Simplified header: lightning icon + "Summary" + model link + cache indicator + Hide button
- Replaced numbered bullets (`<span className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br...">1</span>`) with simple bullet character (`• `)
- Background: `bg-slate-50 dark:bg-slate-900/50` with `border-slate-200 dark:border-slate-800`

*src/components/NewsFeed.tsx*
- **Critical fix**: Moved `<InlineBriefing>` from line ~725 (inside feed-panel div) to line ~670 (inside sticky header div)
- This ensures the AI Summary stays visible above messages and isn't hidden behind the z-30 sticky filter bar
- Component now renders as part of the sticky section, appearing between filter bar and scrollable feed

**Technical Notes:**
- The bug occurred because InlineBriefing was rendered AFTER the sticky header's closing `</div>`, so when users scrolled, the sticky filter bar (z-index: 30) would overlay the AI Summary header
- Fix was structural: placing the component INSIDE the sticky section means it's part of the same stacking context
- Tested with Playwright's `browser_resize` and `browser_take_screenshot` tools across 3 breakpoints
- Used `localStorage.removeItem('ai-summary-collapsed')` during testing to reset collapsed state

**Design Evolution:**
1. Started: Rounded card with margins, attached below filter bar
2. User feedback: "Too attached to filter bar, should be its own card"
3. Added spacing, rounded corners, gradients
4. User feedback: "Should take full width to differentiate"
5. Made full-width with border-b separator
6. User feedback: "Too AI feely, don't like numbered bullets"
7. Simplified to plain bullets, removed gradients
8. User feedback: "Header is hidden behind sticky bar"
9. Moved inside sticky section - final fix

---

## 2026-01-29 - Logo & Favicon Unification

**Session Summary:**
- Discovered header logo (globe with meridians) didn't match favicon (eye symbol) after earlier favicon redesign
- User rejected both designs - tried Option 4 (P with signal waves) but was too small/looked like "P with a hat"
- Settled on Option 6: Bold white P with cyan pulse/heartbeat line underneath
- Regenerated all favicon PNG sizes and removed redundant ICO file

**Key Decisions:**
- Chose Option 6 over Option 4 for better readability at small sizes
- Bold white P on black background with cyan (#22d3ee) EKG-style pulse line
- Removed `src/app/favicon.ico` - redundant since layout.tsx configures SVG/PNG icons
- Used rsvg-convert (librsvg) for SVG→PNG conversion at all required sizes

**Notable Changes:**

*public/favicon.svg*
- Replaced eye design with bold P + pulse line
- Black background (#0a0a0a), white P, cyan pulse path

*src/app/HomeClient.tsx* (lines 417-432)
- Updated header logo SVG to match new favicon design
- Changed container from gradient bg to solid `bg-black`
- Increased SVG size from `w-5 h-5 sm:w-6 sm:h-6` to `w-6 h-6 sm:w-7 sm:h-7`

*public/* (regenerated PNGs)
- favicon-16x16.png
- favicon-32x32.png
- favicon-192x192.png
- favicon-512x512.png
- apple-touch-icon.png (180x180)

*src/app/favicon.ico*
- Deleted - layout.tsx metadata already serves SVG/PNG versions

**Technical Notes:**
- Pulse line SVG path: `M4 26 L10 26 L12 23 L14 29 L16 24 L18 26 L28 26` (flat→spike→spike→flat)
- Font in SVG: `system-ui, -apple-system, sans-serif` for cross-platform consistency
- rsvg-convert command: `rsvg-convert -w {size} -h {size} favicon.svg -o favicon-{size}x{size}.png`

---

## 2026-01-29 - 6-Hour Window Fix & Activity Detection Overhaul

**Session Summary:**
- Discovered and fixed critical bug where API was capping posts at 200 instead of fetching full 6-hour window
- Raised API limits from 200→2000 to capture true post volume (now getting ~870 posts vs 200)
- Updated Live Wire header to show meaningful stats: "871 posts · 164 sources · last 6h"
- Removed over-engineered message-level deduplication that was conflicting with activity detection goals
- Cleaned up duplicate sources (Bellingcat, NOELREPORTS, OSINTtechnical had both Bluesky and Mastodon)
- Fixed activity detection baselines to use 6-hour window instead of 1-hour

**Key Decisions:**
- Server-side render (page.tsx) and client-side fetch (HomeClient.tsx) must use same limit
- Removed 3 layers of message deduplication - kept only ID-based dedup per user's explicit request
- Source-level dedup preferred over message-level dedup (if org has Bluesky + Mastodon, keep Bluesky only)
- Activity detection should compare 6h actual vs 6h baseline (simple mental model)

**Notable Changes:**

*src/app/page.tsx*
- Line 31: Changed `limit=200` to `limit=2000` for SSR fetch

*src/app/HomeClient.tsx*
- Redesigned Live Wire header subtitle
- Old: `"50 of 200 posts · 6h window"` (pagination-focused)
- New: `"871 posts · 164 sources · last 6h"` (volume + diversity focused)
- Source count calculated via `new Set(newsItems.map(i => i.source.id)).size`

*src/app/api/news/route.ts*
- Raised DEFAULT_LIMIT from 200 to 2000
- Raised MAX_LIMIT from 1000 to 5000
- Removed cross-platform content deduplication (was comparing normalized titles)
- Removed per-source limit of 3 posts
- Kept only ID-based deduplication

*src/lib/activityDetection.ts*
- Changed from 1-hour to 6-hour activity window
- Updated baselines from hourly to 6-hour values:
  - US: 10/hr → 60/6h
  - LATAM: 6/hr → 36/6h
  - Middle East: 15/hr → 90/6h
  - Europe-Russia: 18/hr → 108/6h
  - Asia: 10/hr → 60/6h
  - All: 50/hr → 300/6h

*src/lib/sources-clean.ts*
- Removed Bellingcat Mastodon (already have Bluesky)
- Removed NOELREPORTS Mastodon (already have Bluesky)
- Removed OSINTtechnical Mastodon duplicate

*src/lib/rss.ts*
- Reduced Bluesky fetch from 20→10 posts per source (still captures full activity)

**Technical Notes:**
- The "1 sources" bug was caused by accessing `item.sourceId` instead of `item.source.id`
- NewsItem has nested `source: Source` object, not flat `sourceId` field
- SSR provides initial data, so users see capped data on first load even if client fetch uses higher limit
- Dual-fetch architecture means both page.tsx (SSR) and HomeClient.tsx (client) need matching limits

**User Requirements Clarified:**
- Activity detection goal: "Show me everything from last 6 hours, compare to usual 6-hour baseline"
- Not: "Compare last hour vs hourly average" (previous implementation)
- Simple math: 871 posts vs 300 baseline = 2.9x activity (elevated)

---

## 2026-01-29 - Feed UI Cleanup & Filter Consolidation

**Session Summary:**
- Removed green left border "very recent" indicator from news cards (was showing for posts <5 min old)
- User preferred the existing "new since you arrived" divider as the sole new-content indicator
- Consolidated filter bar from 2 rows to 1 row by removing post count and Live updates toggle
- Explored ghost button styling for filters, user rejected it, reverted to original pill style
- Discussed `useMemo` with real codebase examples for educational purposes
- Currently exploring alternatives to dropdown filters (horizontal tabs)

**Key Decisions:**
- Removed `isVeryRecent()` function and green border styling - redundant with divider
- Live updates now always ON (no toggle) - can add to settings page later if needed
- Removed "x posts" count from filter bar - users care about content, not count
- Filter bar is now single row: [Region ▾] [Sources ▾] ... last updated 🔄
- Refresh button is icon-only (no text label) to save space

**Notable Changes:**

*src/components/NewsCard.tsx*
- Removed `isVeryRecent()` helper function (lines 275-279)
- Removed `veryRecent` variable and conditional `border-l-4 border-l-emerald-500` styling
- Cards no longer have visual indicator for <5 minute old posts

*src/components/NewsFeed.tsx*
- Consolidated filter bar from `space-y-2` (two rows) to single flex row
- Removed "x posts" count display
- Removed Live updates toggle button and "Live updating..." indicator
- Removed `pendingCount`, `onShowPending`, `autoUpdate`, `onToggleAutoUpdate` from destructuring (props kept in interface for backwards compatibility)
- Removed `SignalIcon` import (no longer used)
- Refresh button: changed from `[🔄 Refresh]` pill to just `🔄` icon button
- Last updated timestamp moved to right side, hidden on mobile (`hidden sm:inline`)

**Technical Notes:**
- The "new since you arrived" divider (using `initialSessionIds` and `dividerIndex`) remains the sole new-content indicator
- Props still exist in `NewsFeedProps` interface so parent components don't break
- Ghost button experiment (removed backgrounds/borders) was reverted after user feedback

**UX Discussion:**
- Explored useMemo through 5 real examples: `filteredItems`, `sortedItems`, `regionCounts`, `displayText`, `dividerIndex`
- User asked about replacing dropdowns with horizontal scrollable tabs for regions - decision pending

---

## 2026-01-30 - AI Briefing Card Styling & Feed Header Fix

**Session Summary:**
- Restyled AI Briefing Card to match regular NewsCard appearance (same structure, distinct border)
- Attempted to reorganize Live Wire header - caused layout chaos due to hidden CSS issue
- Discovered root cause: `overflow-hidden` on parent container was breaking sticky positioning
- Used parallel agents to investigate - found the issue in 30 seconds
- Fixed by removing `overflow-hidden` and restructuring header to match Global Monitor pattern

**Key Decisions:**
- AI Briefing Card uses same `bg-[var(--background-card)]` as NewsCard, but with `border-2 border-slate-400 dark:border-slate-500` for subtle distinction
- Removed sticky positioning from NewsFeed header - it was fighting with the parent container
- Adopted Global Monitor's header pattern: inside bordered container with `border-b` separator
- Consolidated Live Wire title into NewsFeed component (was duplicated in HomeClient)

**Notable Changes:**

*src/components/BriefingCard.tsx*
- Changed from cyan gradient background to neutral `bg-[var(--background-card)]`
- Added thicker, more visible border (`border-2 border-slate-400 dark:border-slate-500`)
- Moved sources count, timestamp, and refresh button to header row
- Added `ArrowPathIcon` import for refresh functionality

*src/components/NewsFeed.tsx*
- Removed sticky `top-14 sm:top-16 z-30` wrapper - was breaking due to parent `overflow-hidden`
- Changed header to match Global Monitor: `relative z-10` with `border-b border-slate-200/50 dark:border-slate-700/50 rounded-t-2xl`
- Added `SignalIcon` for Live Wire title
- Added `totalPosts`, `uniqueSources`, `hoursWindow` props for stats display
- Consolidated title + stats + filters into single header section

*src/app/HomeClient.tsx*
- Removed `overflow-hidden` from NewsFeed container (line 1170) - **this was the root cause**
- Removed duplicate "Live Wire" header (now handled by NewsFeed)
- Added new props to NewsFeed: `totalPosts`, `uniqueSources`, `hoursWindow`

**Technical Notes:**
- `overflow: hidden` creates a containing block that traps sticky elements - sticky children cannot escape parent bounds
- Lesson learned: always check parent overflow properties when sticky positioning fails
- Used parallel Task agents (Explore type) to investigate - much faster than blind iteration
- Global Monitor works because its header is INSIDE the bordered container, not fighting overflow

**Debugging Approach:**
1. Spawned 3 parallel agents to investigate:
   - Agent 1: NewsFeed structure analysis
   - Agent 2: Global Monitor vs Live Wire comparison
   - Agent 3: CSS/layout issue scan
2. Agent 3 found `overflow-hidden` on parent container immediately
3. Agent 2 explained WHY Global Monitor works (header inside container)
4. Applied both fixes: remove overflow-hidden + restructure header

---

## 2026-01-30 - Editorial Tag Styling Redesign

**Session Summary:**
- Redesigned source type tags in NewsCard.tsx from faded uniform gray to distinct color-coded editorial styling
- Applied matching editorial styling to AI tag in BriefingCard.tsx
- Tags now use solid backgrounds for better contrast and visual hierarchy

**Key Decisions:**
- Replaced opacity-based backgrounds (`dark:bg-slate-800/60`) with solid colors for legibility
- Each source type gets semantically meaningful color: OSINT amber/gold, Official slate, News Org zinc, Reporter stone, Ground emerald
- All tags share consistent typography: `text-[10px] tracking-wide uppercase rounded-sm`
- AI tag updated to match: solid cyan background instead of bordered light/dark variant

**Notable Changes:**

*src/components/NewsCard.tsx*
- Completely rewrote `sourceTypeColors` mapping with distinct editorial palette:
  - `official`: Authoritative blue-gray (slate-800/slate-200)
  - `news-org`: Classic newspaper charcoal (zinc-700/zinc-300)
  - `osint`: Intelligence amber/gold accent (amber-600/amber-500)
  - `reporter`: Subtle warm gray (stone-500/stone-400)
  - `analyst`: Refined slate (slate-600/slate-400)
  - `aggregator`: Muted neutral (neutral-500)
  - `ground`: Earthy emerald (emerald-700/emerald-600)
  - `bot`: Subtle italic gray (gray-400/gray-600)
- Updated tag rendering: `px-2 py-0.5 text-[10px] tracking-wide uppercase rounded-sm`

*src/components/BriefingCard.tsx*
- AI tag restyled from `bg-cyan-100 dark:bg-cyan-900/40` to `bg-cyan-600 dark:bg-cyan-500`
- Text changed from `text-cyan-700 dark:text-cyan-300` to `text-white dark:text-cyan-950`
- Removed border, added `tracking-wide uppercase font-semibold`

**Technical Notes:**
- Solid backgrounds perform better than opacity-based in both light and dark modes
- `tracking-wide` adds 0.025em letter-spacing, improving readability of uppercase labels
- `rounded-sm` (2px) gives sharper editorial look vs `rounded` (4px)

---

## 2026-01-30 - Live Wire UX Improvements & Activity Threshold Tuning

**Session Summary:**
- Fixed cramped mobile layout in Live Wire header using flex-wrap
- Reformatted stats as readable sentence: "Fetched X posts from Y sources in last six hours"
- Moved refresh button next to title with "Refresh Feed" label and actual timestamp
- Removed refresh from Pulse AI card (auto-refreshes on region change)
- Tightened activity detection thresholds to prevent false positives in low-source regions
- Fixed stats to show filtered counts when viewing specific regions

**Key Decisions:**
- Actual timestamp ("3:45 PM") instead of relative ("just now") - more useful
- Stats now reflect filtered view: "Showing 12 posts from 8 sources (filtered)" when viewing Asia
- Activity thresholds raised: elevated requires 2.5x baseline + 25 posts, critical requires 5x + 50 posts
- Global sources (`region: 'all'`) don't inflate regional activity - only detected regional posts count

**Notable Changes:**

*src/components/NewsFeed.tsx*
- Header restructured with `flex-wrap` for mobile
- Stats use `filteredItems` instead of total items for accurate filtered counts
- Added `formatActualTime()` helper for timestamp display
- Changed wording: "Fetched" for all regions, "Showing" when filtered
- Refresh button now text-based with timestamp below

*src/components/BriefingCard.tsx*
- Removed refresh button (icon and handler)
- Cleaned up unused `ArrowPathIcon` import

*src/lib/activityDetection.ts*
- Elevated: 2x → 2.5x multiplier, added 25 post minimum
- Critical: 4x → 5x multiplier, added 50 post minimum
- Prevents Asia (low sources) from false positives with small post counts

**Technical Notes:**
- `flex-wrap` + `gap-x-3 gap-y-1` allows header elements to wrap naturally on mobile
- `w-full sm:w-auto` on stats forces wrap on mobile, stays inline on desktop
- Minimum post counts prevent low-baseline regions from triggering with noise
- Baselines are calculated from source `postsPerDay` but global source posts get assigned to regions via content detection - this mismatch is acceptable with tightened thresholds

---

## 2026-01-29 - Hydration Mismatch Fix & useClock Hook

**Session Summary:**
- Diagnosed and fixed React hydration mismatch error caused by live clock displaying different times on server vs client
- Created reusable `useClock` custom hook following React best practices
- Educational session covering SSR hydration, the "You Might Not Need an Effect" article, and when Effects ARE appropriate

**Key Decisions:**
- Extracted clock logic into `src/hooks/useClock.ts` for reusability
- Initialize time as `null` during SSR, set real value only in `useEffect` (client-only)
- Display `"—"` placeholder during hydration to ensure server/client match
- Confirmed this is a valid useEffect use case (synchronizing with external system: browser timer)

**Notable Changes:**

*src/hooks/useClock.ts* (NEW)
- Custom hook returning `Date | null`
- Initializes to `null`, sets time in `useEffect` to avoid hydration mismatch
- Updates every second via `setInterval`
- Accepts optional `intervalMs` parameter (default: 1000)

*src/app/HomeClient.tsx*
- Added import for `useClock` hook
- Replaced inline `useState` + `useEffect` combo with single `const currentTime = useClock()`
- Reduced 8 lines to 1 line in the component

**Technical Notes:**
- Hydration mismatch occurs when `new Date()` runs on server (e.g., 22:45:49) then again on client (22:45:50)
- React compares server HTML to client virtual DOM; any difference forces full re-render
- `useEffect` never runs on server (no DOM), making it the escape hatch for client-only values
- This pattern passes the "You Might Not Need an Effect" test: timer subscriptions ARE valid Effect use cases

**The Pattern:**
```tsx
// Bad: new Date() runs on both server and client
const [time, setTime] = useState(new Date());

// Good: null on both, real value only on client
const [time, setTime] = useState<Date | null>(null);
useEffect(() => { setTime(new Date()); ... }, []);
```

---

## 2026-01-30 - Live Wire UX, Activity Thresholds & Map Reset

**Session Summary:**
- Fixed cramped mobile layout in Live Wire header
- Tightened activity detection thresholds to prevent false positives
- Fixed stats showing paginated count (50) instead of real total (870+)
- Added "Checking feed activity..." loading state to prevent stale cache flash
- Removed stale sources (potustracker.us, militarylandnet)
- Added globe button and ocean click to reset map to all regions
- Improved RSS error logging to include URLs

**Key Decisions:**
- Stats show "Fetched X posts from Y sources in last six hours" as readable sentence
- Activity thresholds raised: elevated 2.5x+25 posts, critical 5x+50 posts (was 2x/4x)
- `activityConfirmed` state prevents stale SSR cache from showing false elevated/critical
- Map reset via globe button (obvious) + ocean click (natural) - two ways to discover

**Notable Changes:**

*src/components/NewsFeed.tsx*
- Header uses `flex-wrap` for mobile layout
- Stats use `totalPosts`/`uniqueSources` props when unfiltered, `filteredItems` when filtered
- Shows "Showing X posts (filtered)" vs "Fetched X posts in last six hours"
- Actual timestamp ("3:45 PM") instead of relative ("just now")

*src/lib/activityDetection.ts*
- Elevated: 2x → 2.5x multiplier + minimum 25 posts
- Critical: 4x → 5x multiplier + minimum 50 posts
- Prevents low-source regions (Asia) from false positives

*src/app/HomeClient.tsx*
- Added `activityConfirmed` state, starts false
- Shows "Checking feed activity..." until client fetch confirms fresh data
- Set true after successful fetchNews or fetchIncremental

*src/components/WorldMap.tsx*
- Globe button at top of zoom controls, highlights blue when "All" selected
- Transparent rect behind map catches ocean clicks
- Land clicks use `stopPropagation()` to avoid accidental resets
- `handleShowAll()` resets both map position AND region filter

*src/lib/rss.ts*
- Error logs now include source URL for easier debugging
- Specific detection for redirect loop errors

*src/lib/sources-clean.ts & blocklist.ts*
- Removed: potustracker.us (Bluesky gone), militarylandnet (Telegram private)
- Added both to blocklist with reason

**Technical Notes:**
- Ocean click uses oversized `<rect x={-1000} y={-1000} width={3000} height={2000}>` to catch all empty areas
- `activityConfirmed` pattern: don't trust SSR data for time-sensitive indicators, wait for client fetch
- Pagination (`displayLimit=50`) is for render performance; stats should show true totals from props

---

## 2026-01-30 - Dev Server Cleanup & Cloudflare Source Removal

**Session Summary:**
- Fixed multiple dev server warnings/errors that were cluttering logs
- Removed 4 sources that are now behind Cloudflare bot protection (require JS challenge)
- Updated ReliefWeb feed URL (they moved their RSS endpoint)
- Added cache bypass for large feeds exceeding Next.js 2MB limit

**Key Decisions:**
- `allowedDevOrigins` uses hostname-only format (no protocol, no port): `'192.168.1.35'`
- Browser-like User-Agent for RSS fetches - some sites block bot UAs
- Large feeds (Substack, JustSecurity) skip Next.js cache to avoid 2MB limit errors
- Cloudflare-protected sources removed rather than left to fail silently (cleaner logs)

**Notable Changes:**

*next.config.ts*
- Fixed `allowedDevOrigins` format from `['http://192.168.1.35:3000']` to `['192.168.1.35']`
- Next.js 16 requires hostname-only, no protocol/port

*src/lib/db.ts*
- Auto-upgrade `sslmode=require` → `sslmode=verify-full` in connection string
- Silences pg v9 deprecation warning about SSL mode semantics

*src/lib/rss.ts*
- Changed User-Agent from bot-like (`PulseAlert/1.0`) to browser-like (Chrome UA)
- Added proper Accept header for RSS content types
- Added `LARGE_FEEDS` list: chinainarms.substack.com, justsecurity.org, substack.com
- Large feeds use `cache: 'no-store'` instead of `next: { revalidate: 60 }`

*src/lib/sources-clean.ts*
- Updated ReliefWeb URL: `/headlines/rss.xml` → `/updates/rss.xml?view=headlines` (301 redirect fix)
- Removed GIJN, Politico US, Politico EU, Euractiv (Cloudflare bot protection)
- Left comments at removal points explaining why

*src/lib/blocklist.ts*
- Added 4 new entries with reason "Cloudflare bot protection - requires JS challenge to access RSS":
  - gijn-rss
  - politico-us-rss
  - politico-eu-rss
  - euractiv-rss

**Technical Notes:**
- Cloudflare's `cf-mitigated: challenge` header = JS challenge required, not bypassable with headers alone
- ReliefWeb returned 406 (Not Acceptable) because old URL redirects, and Node fetch doesn't follow cross-protocol redirects
- Next.js fetch cache has hard 2MB limit - Substack feeds can be 5MB+ due to full post content in RSS
- Source count: 479 → 475 after removals

**Errors Fixed:**
| Error | Root Cause | Fix |
|-------|-----------|-----|
| Cross-origin blocked | Wrong allowedDevOrigins format | Hostname only |
| Politico/Euractiv 403 | Cloudflare bot protection | Removed sources |
| ReliefWeb 406 | Feed URL moved | Updated URL |
| SSL mode warning | Deprecated pg sslmode | Auto-upgrade to verify-full |
| Cache 2MB exceeded | Large Substack feeds | Skip cache for large feeds |

---

## 2026-01-30 - Comprehensive Site Testing & Critical Bug Fix

**Session Summary:**
- Conducted full-scale testing operation with 5 parallel agent squads
- Found and fixed critical bug: feed not auto-loading when SSR fails
- Validated all 475 sources - zero data quality issues
- All performance metrics passed targets
- Created testing infrastructure with organized log files

**Key Findings:**

| Squad | Status | Findings |
|-------|--------|----------|
| Code Review | Done | 3 real issues, 1 false positive filtered |
| Live Site | Done | **Critical bug found** |
| Sources | Done | 475/475 valid |
| Performance | Done | All pass |
| UX Review | Done | Mobile/dark mode pass |

**Critical Bug Fixed:**

*HomeClient.tsx:338* - Feed not auto-loading when SSR fails/times out

```javascript
// BEFORE (bug) - only fetches if SSR succeeded
useEffect(() => {
  if (hasInitialData.current) {
    fetchIncrementalRef.current();
  }
}, []);

// AFTER (fixed) - fetches regardless of SSR success
useEffect(() => {
  if (hasInitialData.current) {
    hasInitialData.current = false;
    fetchIncrementalRef.current();
  } else {
    fetchNewsRef.current();  // NEW: handles SSR failure
  }
}, []);
```

**Root Cause:** When `initialData` is null (SSR failed/timed out), `hasInitialData.current = false` (line 161), so the useEffect condition failed and NO FETCH OCCURRED. First-time visitors saw empty dashboard.

**Other Issues Found:**
- Unsafe JSON.parse in aiSummary.ts:274 (no try/catch)
- Missing try/catch around logActivitySnapshot in news/route.ts:339
- Division display issue when baseline=0 in activityDetection.ts:106

**Testing Infrastructure Created:**
- `/scratchpad/pulse-testing/errors.md` - All bugs with fixes
- `/scratchpad/pulse-testing/performance.md` - Timing data
- `/scratchpad/pulse-testing/ux-issues.md` - UX findings
- `/scratchpad/pulse-testing/sources.md` - Source audit results
- `/scratchpad/pulse-testing/mistakes.md` - False positives logged

**Performance Results (All Pass):**
| Metric | Value | Target |
|--------|-------|--------|
| /api/news | 1.86s | <2s |
| /api/summary | 4.25s | <5s |
| First Paint | 300ms | <1.5s |
| TTI | 319ms | <3s |

**Lessons Learned:**
- Squad 1 reported "critical syntax error" in fires/route.ts that was a false positive
- Cross-referencing code review with runtime tests catches false positives
- The endpoint returned 200 during testing, proving code compiles and runs

**Technical Notes:**
- Testing used browser automation via Claude-in-Chrome MCP
- Background agents ran in parallel for code review and source validation
- Source validation confirmed all 475 sources have valid schemas, URLs, and no duplicates
- 22 sources intentionally have low confidence (<80) for state-sponsored/partisan content monitoring

---

## 2026-01-30 - Trending Keywords Feature

**Session Summary:**
- Built trending topics feature reusing existing regionDetection keyword infrastructure (467 patterns)
- Placed "Trending" button with fire icon next to "All Sources" dropdown
- Click reveals popup with top 15 keywords ranked by count
- Fixed pagination bug where only 50 posts were analyzed instead of full ~1,000+ set

**Key Decisions:**
- KISS approach: reuse `detectRegion()` to extract keyword matches, no new ML/NLP infrastructure
- Signal purity: only count explicit keyword matches, not source region fallbacks
- Per-item deduplication: same keyword 5x in one post = 1 count (prevents spam inflation)
- Separated concerns: trending analyzes all items; pagination only affects display rendering

**Notable Changes:**

*src/lib/trendingKeywords.ts* (NEW)
- Core extraction and counting logic
- `extractKeywordsFromItem()` runs detectRegion on title+content, collects matched keywords
- `countKeywords()` aggregates across items with per-item deduplication
- `getTrendingKeywords()` returns sorted keywords with metadata

*src/lib/__tests__/trendingKeywords.test.ts* (NEW)
- 11 tests using Node's built-in test runner with tsx
- Tests cover: keyword extraction, counting, sorting, deduplication, region tracking, empty input

*src/components/TrendingKeywords.tsx* (NEW)
- Fire icon button with "Trending" label
- Dropdown popup showing ranked keywords with counts
- Header displays "From X of Y posts" stats
- Uses useMemo to compute trending data only when items change

*src/components/NewsFeed.tsx*
- Added `allItemsForTrending?: NewsItem[]` prop to interface
- Integrated TrendingKeywords next to "All Sources" dropdown
- Passes full item set for trending vs paginated subset for display

*src/app/HomeClient.tsx*
- Added `allItemsForTrending={newsItems}` prop to NewsFeed
- Ensures trending analyzes all ~1,000+ posts, not just displayed 50

**Technical Notes:**
- Pagination bug: NewsFeed received `newsItems.slice(0, displayLimit)` where displayLimit=50
- Fix: separate prop `allItemsForTrending` passes full array for analysis
- Result: "From 601 of 1057 posts" with accurate keyword counts (trump 197, federal 65, ukraine 59, etc.)
- Tests run with: `npx tsx --test src/lib/__tests__/trendingKeywords.test.ts`

**Design Pattern:**
```typescript
// TrendingKeywords gets full set for analysis
<TrendingKeywords items={allItemsForTrending || items} />

// Feed list gets paginated subset for rendering
{items.map(item => <NewsCard key={item.id} item={item} />)}
```

---

## 2026-01-30 - New Features Brainstorming

**Session Summary:**
- Brainstormed two new feature tracks to extend Pulse's early warning capabilities
- Focus: "First 30 minutes of contextualized awareness" — prediction + first draft of history
- Created detailed design doc at `docs/plans/2026-01-30-new-features-design.md`

**Key Decisions:**

| Decision | Choice |
|----------|--------|
| Primary goal | Prediction/early warning with journalistic "first draft of history" angle |
| Signal source | External indicators (not just existing 475 sources) |
| Data sources | Google Trends + Wikipedia Pageviews (both free APIs) |

**Track 1: Signals Page**

External attention tracking — detect when the world starts paying attention before curated sources report.

| Aspect | Design |
|--------|--------|
| Location | Dedicated "Signals" page (separate from Live Wire) |
| Display | Chart-first with data table toggle |
| Time range | 24h (default) / 7d / 30d, selectable |
| Comparison | Rolling: "Now vs. same time yesterday/last week" |
| Region filter | Independent from Live Wire |
| Topics | Hybrid: curated watchlist + auto-detected "Emerging" |

**Initial Watchlist (10 topics):**
Taiwan Strait, Iran Nuclear, Ukraine War, US-China, Israel-Gaza, North Korea, Russia NATO, Venezuela, Sudan, Red Sea

**Track 2: US Government Wire**

Official government action tracking — awareness dashboard looking both directions (past + future).

| Aspect | Design |
|--------|--------|
| Core value | Awareness dashboard (passive monitoring) |
| Time orientation | Past actions + future calendar |
| Scope options | Executive Branch OR Legislative Branch (TBD) |

**Executive Branch option:** President's schedule, executive orders, proclamations (whitehouse.gov, Federal Register)

**Legislative Branch option:** Bills signed, hearings, floor votes (congress.gov API)

**Open Questions:**
- Which branch to build first for Track 2?
- How to display calendar vs. recent actions?

**Technical Notes:**
- Google Trends API: Free, needs filtering for celebrity/sports noise
- Wikipedia Pageviews API: Free, less noisy, good "deep dive" signal
- Combined signals stronger than either alone
- Journalism angle differentiates from pure data dashboards

---

## 2026-01-30 - Regional Feed Enrichment & Platform Multi-Select

**Session Summary:**
- Investigated sparse regional feeds (Middle East showing only 7 posts from 5 sources)
- Found client-side filter was stricter than server-side, dropping relevant global posts
- Implemented content-based keyword detection to enrich regional feeds with global source coverage
- Added "detected region" tag for global posts (e.g., "GLOBAL → MIDEAST" when Reuters posts about Iran)
- Redesigned platform filter from single-select dropdown to multi-select with checkboxes and brand colors

**Key Decisions:**
- Truth-preserving approach: global sources keep "GLOBAL" tag, detected region shown as secondary tag
- `classifyRegion()` from sourceUtils.ts reused for on-render detection (no new infrastructure)
- Multi-select platform filter allows "show Bluesky + Telegram but not YouTube" use case
- useMemo for detected region calculation (only runs when items/region change)

**Notable Changes:**

*src/components/NewsCard.tsx*
- Added `detectRegionFromContent()` helper using `regionKeywords` from sourceUtils
- Added `detectedRegion` useMemo calculating region for items where `region === 'all'`
- Region badge now shows dual tags: "GLOBAL → MIDEAST" with subtle chevron arrow
- Styling: gradient background `from-slate-100 to-slate-50` for detected tag

*src/components/NewsFeed.tsx*
- Added `contentMatchesRegion()` helper function for smart filtering
- Changed filter logic: includes `region === selectedTab` OR (`region === 'all'` AND content matches keywords)
- Changed `platformFilter` state from single value to `enabledPlatforms: Set<PlatformId>`
- New dropdown UI with checkboxes, platform icons, brand colors, All/None toggles
- Mini platform icons shown in button when filter is active
- Imported `PlatformIcon`, `platformColors`, `platformBadgeStyles` from PlatformIcon.tsx

*src/lib/sourceUtils.ts* (existing, no changes)
- `regionKeywords` object already had comprehensive keyword lists for all regions
- ~30 keywords per region including countries, cities, leaders, organizations

**Technical Notes:**
- Big O analysis: O(n × c × m) average case where n=items, c=avg keyword checks before match (~3-5), m=text length
- Short-circuit evaluation with `.some()` means most items don't check all 30 keywords
- useMemo caches result until items/selectedTab change - doesn't recalculate on every render
- Platform badge styles: `bg-sky-500/10 text-sky-600` for Bluesky, `bg-orange-500/10 text-orange-600` for RSS, etc.

**Edge Cases Considered:**
- Non-English content (won't match English keywords - acceptable)
- False positives (Jordan country vs person) - rare in news context
- Empty content falls back to title - always has text to search
- HTML entities already decoded by rss.ts before reaching client

**User Education:**
- Explained useMemo vs edge cache (per-component memoization vs shared across users)
- useMemo is "render-level caching" - remembers output for same inputs across re-renders
- Valid useEffect use case for timer subscriptions (not an Effect anti-pattern)

---

## 2026-01-30 - Database & Cache Architecture Assessment

**Session Summary:**
- Conducted comprehensive database and data retention assessment at user's request
- User clarified KISS mandate: no persistent news history, no Redis/KV, no cron pre-warming
- Identified and fixed inconsistency between news cache and summary cache patterns
- User bumped AI summary post selection from 25 to 50 posts (manual edit to sources-clean.ts)

**Key Decisions:**
- Current ephemeral in-memory cache is appropriate for KISS approach
- No database needed for transient news data (5-15 min TTL is fine)
- Summary cache aligned to use same `globalThis` pattern as news cache
- Sources hardcoded in TypeScript = correct choice (version controlled, no runtime complexity)

**Notable Changes:**

*src/lib/aiSummary.ts*
- Migrated `summaryCache` and `lastRequestTime` from module-level variables to `globalThis.summaryCache`
- Added `SummaryCache` interface wrapping both Maps
- Added `getCache()` helper function matching `newsCache.ts` pattern
- All cache access now goes through `getCache()` for consistency
- User also changed `maxPosts` default from 25 to 50 and added multi-source importance hint to prompt

**Architecture Documented:**

| Layer | Technology | TTL | Pattern |
|-------|-----------|-----|---------|
| News cache | In-memory Map | 5-15 min | `globalThis.newsCache` |
| Summary cache | In-memory Map | 10 min | `globalThis.summaryCache` (now aligned) |
| Rate limits | In-memory Map | ~5 min cleanup | Module variable |
| Sources | TypeScript arrays | Forever | Compiled into build |
| User prefs | localStorage | Forever | Client-side only |

**Technical Notes:**
- `globalThis` pattern survives Next.js hot reloads in dev; module variables don't
- Both caches now reset together on deploy/cold start (consistent behavior)
- Multi-instance cache divergence on Vercel is acceptable for a news dashboard - caches naturally converge within TTL window
- Thundering herd prevention via `inFlightFetches` Map in route.ts handles concurrent requests

**KISS Principles Confirmed:**
- No Redis/Vercel KV needed at current scale
- No database for ephemeral news posts
- No cron jobs for cache warming
- Sources in code = audit trail via git

---

## 2026-01-30 - Feed Activity System Fix & Region Selector Redesign

**Session Summary:**
- Code review found LATAM and Asia incorrectly removed from both map AND activity scoring
- Fixed: put them back on map but exclude from activity scoring (always show NORMAL)
- Added loading.tsx files for instant navigation feedback (React 19/Next.js 16 patterns)
- Redesigned region selector from dropdown to pill tabs with useTransition for smooth switching
- Changed initial view strategy: always start global, remember user preference, focus map camera on hottest region
- Increased AI briefing post selection from 25 to 50 with multi-source importance signal

**Key Decisions:**
- `SCORING_EXCLUDED_REGIONS` pattern: regions on map but always NORMAL activity (insufficient source coverage)
- useTransition for region switching: defers expensive filter operation for instant UI feedback
- localStorage persistence for selected region: returning users see their last preference
- initialMapFocus prop: camera zooms to hottest region without filtering feed (subtle guidance)
- AI briefing now prioritizes events with multiple sources covering same story

**Notable Changes:**

*src/lib/activityDetection.ts*
- Added `SCORING_EXCLUDED_REGIONS: WatchpointId[] = ['latam', 'asia']`
- Regions in list always assigned `level = 'normal'` regardless of multiplier

*src/components/WorldMap.tsx*
- Re-added LATAM marker: `{ coordinates: [-46.63, -23.55], label: 'Latin America', city: 'São Paulo', zoom: 1.8 }`
- Re-added Asia marker: `{ coordinates: [139.69, 35.69], label: 'Asia-Pacific', city: 'Tokyo', zoom: 1.6 }`
- Added `initialFocus` prop for camera positioning without filter change

*src/app/page.tsx*
- Simplified: always start with `initialRegion = 'all'`
- Added `initialMapFocus` calculation: finds hottest region (elevated or critical) among scored regions
- `SCORED_REGIONS = ['us', 'middle-east', 'europe-russia']` excludes LATAM/Asia

*src/app/HomeClient.tsx*
- Added localStorage persistence for selected region
- `setSelectedWatchpoint` wrapper saves to localStorage on every change
- Reads saved preference on mount (useEffect with empty deps)
- Passes `initialMapFocus` to WorldMap

*src/components/NewsFeed.tsx*
- Replaced dropdown with segmented control pill tabs
- Primary tabs: All, US, Middle East, Europe
- "More" dropdown for LATAM and Asia
- Added `useTransition` hook for smooth region switching
- `isPending` state shows subtle opacity during transition
- `startTransition` wraps `onSelectWatchpoint` call

*src/lib/aiSummary.ts*
- Increased `maxPosts` from 25 to 50 in `selectAndStructurePosts()`
- Added prompt rule: "Multiple sources reporting the same event = high importance signal (prioritize these)"
- Cost impact minimal: ~$0.006 per briefing with Haiku 3.5

*src/app/loading.tsx* (NEW)
- Root loading state with pulsing "Loading Pulse..." spinner
- Provides instant feedback during navigation

*src/app/admin/loading.tsx* (NEW)
- Admin section loading state

*src/app/global-error.tsx* (NEW)
- Catches errors in root layout (rare edge case)

**Technical Notes:**
- useTransition creates two-phase update: immediate (isPending=true, old content) then deferred (actual filter)
- User sees instant feedback (pill highlights immediately) while expensive filtering happens in background
- localStorage key: `news-selected-region` - simple string value
- LATAM/Asia still process in activity detection but their final level gets overwritten to 'normal'
- React 19's `use` hook not needed here - classic useTransition pattern sufficient

**UX Improvement:**
Before: Click region → 200ms freeze → UI updates (felt laggy)
After: Click region → instant pill highlight → content fades in 200ms later (feels responsive)

---
