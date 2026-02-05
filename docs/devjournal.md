# newsAlert - Development Journal

> **Purpose**: Log of significant prompts, decisions, and progress throughout development.

---

## Session 1 - January 2025

### Entry 1: Project Initialization
**User Asked**: Create a CLAUDE.md file for the project.

**Provided**: Created initial CLAUDE.md with project structure template.

---

### Entry 2: Core Concept & Planning
**User Asked**: Detailed vision for newsAlert - a real-time OSINT dashboard with:
- Globe/map visualization with volume/severity dots
- Constant watchpoints (Iran, Ukraine, Taiwan, Venezuela)
- Emerging breaking news detection
- Tiered notification levels
- Multi-source strategy (X, Bluesky, Telegram, Reddit, RSS)
- AI-assisted threat scoring
- Requested "ultrathink" analysis, comparable tools, questions, and creation of planning.md + todo.md

**Provided**:
- Comprehensive CLAUDE.md with project context
- planning.md with:
  - Comparable tools analysis (Liveuamap, ACLED, GDELT, Janes)
  - Gap analysis
  - Twitter/X API cost reality check ($5k+/month)
  - Technical architecture options (Simple vs Real-time)
  - Threat scoring algorithm design
  - MVP specification
  - Risk register
  - 12 questions to answer
- Empty todo.md awaiting plan approval

---

### Entry 3: Brainstorming & Sources Research
**User Asked**: Create brainstorming.md with ambitious moat ideas, then sources.md with curated sources for main flashpoints. Use websearch liberally. Include link, why selected, posting frequency, confidence level (1-100).

**Provided**:
- brainstorming.md with 23 moat ideas including:
  - "Verified First" system
  - Prediction market integration
  - Information asymmetry detection
  - Time Machine view
  - Counter-narrative detection
  - AI-powered features
  - Priority matrix
- sources.md with 100+ vetted sources across:
  - Iran/Middle East
  - Ukraine-Russia
  - China-Taiwan
  - Venezuela
  - Global/cross-cutting
  - Each with confidence scores, posting frequency, platform

---

### Entry 4: Bluesky Deep Dive
**User Asked**: Do another research run focused on Bluesky sources.

**Provided**:
- Expanded Bluesky section with 30+ accounts
- 10 starter packs for OSINT community
- Native RSS support documentation (profile.bsky.social/rss)

---

### Entry 5: Personal X Following Analysis
**User Asked**: Shared their X account (@opensecwatcher) for source analysis.

**Provided**:
- Used Chrome browser to navigate to X following list
- Extracted key accounts from their curated follows:
  - Venezuela journalists
  - Energy/oil analysts (Amena Bakr, Tracy Shuchart, TankerTrackers)
  - Ukraine/Russia experts (Rob Lee, Michael Kofman)
  - Pentagon reporters (Natasha Bertrand, Dan Lamothe)
- Incorporated into sources.md

---

### Entry 6: Information Cascade Insight
**User Asked**: Clarified this is primarily personal. Key use case: "Is the US about to attack Iran?" Described the information cascade they've observed (Ground → OSINT → Reporters → Official).

**Provided**:
- Reorganized Iran section in sources.md by cascade tiers:
  - 🔴 TIER 1: Official Alerts (IDF, Pentagon, State Dept)
  - 🟠 TIER 2: Key Reporters (Natasha Bertrand, Barak Ravid)
  - 🟡 TIER 3: OSINT Accounts (OSINTdefender, Aurora Intel)
  - 🟢 TIER 4: Iran Specialists (Farzin Nadimi, Jason Brodsky)
  - 🔵 TIER 5: Opposition & Ground (Iran International, NCRI)
- Updated CLAUDE.md with cascade model documentation

---

### Entry 7: Project-Wide Review
**User Asked**: Do a recursive project-wide review to ensure all .md files reflect current thinking.

**Provided**:
- Updated planning.md:
  - Questions marked as answered
  - MVP spec revised with cascade-based design
  - Research completed section added
  - Status updated to "PLANNING COMPLETE"
- Updated CLAUDE.md:
  - Project structure includes all files
  - Notes for Claude updated with current state
- Updated brainstorming.md:
  - Added Core Design Insight section
  - MVP Moat Features Selected
- Updated todo.md:
  - Research phase marked complete
  - Phased backlog created

---

### Entry 8: User Stories & Design Requirements
**User Asked**: Provided 8 detailed user stories from journalist perspective:
1. One-look discovery for emerging breaking news
2. Drill down into stories with real-time updates
3. Confidence level assessment
4. Feel ahead of normal news consumers
5. Expect noise/rumors, want help with confidence
6. Unusual/unexpected detection (not every earthquake)
7. Share via text message
8. UI/UX delight - mobile-first, tabs, NOT AI-generated looking

Also shared:
- Lives in Bloomington, IN
- Portfolio: trevorthewebdeveloper.com
- Heroicons only requirement
- Mobile-first design requirement

**Provided**:
- Visited trevorthewebdeveloper.com via Chrome
- Analyzed design aesthetic from portfolio + ReflectYr + Food Xpiry
- Updated CLAUDE.md with:
  - User stories section (all 8 documented)
  - Design requirements (mobile-first, dark mode, Heroicons, colors)
  - Personal context (location, background)
- Updated planning.md with:
  - Tech stack confirmed
  - User story alignment table in MVP spec
  - Mobile-first added to requirements
- Updated todo.md with:
  - Tech stack confirmed section
  - Implementation phases aligned to user stories
  - Design checklist

**Tech Stack Confirmed**:
- Next.js + React + TypeScript
- Tailwind CSS
- Heroicons ONLY
- PostgreSQL (Neon)
- Anthropic Claude API
- Vercel deployment

---

### Entry 9: Dev Journal Creation
**User Asked**: Create devjournal.md and add rule to CLAUDE.md to update it after significant prompts.

**Provided**:
- This devjournal.md file
- Rule added to CLAUDE.md

---

### Entry 10: Pre-Build Q&A
**User Asked**: "Before we start building, what questions do you have for me?"

**Questions Asked**:
1. Map vs Feed - which is primary?
2. Which specific sources first?
3. Local dev or deploy immediately?
4. Database needed for MVP?
5. Confidence scores - how should they work?
6. "Share via text" - what does this mean?
7. Git repo?
8. Bluesky account?
9. Design mockups first?

**User Answered**:
1. **Feed-first** with simple watchpoint graphic/filter showing activity indicators
2. **All constants**, Middle East/Iran priority
3. **Local dev**, use Chrome extension or Playwright for testing
4. **No DB** - just fetch and display
5. **Static from sources.md**, develop ranking system later
6. **KISS** - whatever is easy (copy to clipboard or native SMS)
7. **Yes, full git authority** including commits
8. **Yes**: trevthewebdev.bsky.social
9. **Straight to code**, iterate

---

### Entry 11: Documentation Reorganization
**User Asked**: After updating docs, should we put them in a folder? Does CLAUDE.md have appropriate pointers?

**Provided**:
- Created `/docs` folder
- Moved planning.md, brainstorming.md, sources.md, todo.md, devjournal.md to `/docs`
- Rewrote CLAUDE.md with:
  - Updated project structure
  - Quick links to all docs
  - MVP decisions table
  - KISS principle
  - Git authority note
  - Bluesky account info
  - Streamlined design requirements
  - Watchpoints table
- Initialized git repository with first commit

---

### Entry 12: Environment Setup
**User Asked**: Create .env.example and .env.local for Claude API key.

**Provided**:
- `.env.example` - Template with all expected env vars (committed)
- `.env.local` - Actual secrets file (gitignored)
- Placeholders for Anthropic API, Bluesky credentials, future APIs
- User added their Anthropic API key

---

### Entry 13: Phase 1 MVP Build
**User Asked**: "word" (signal to start building)

**Provided**:
- Initialized Next.js 16 with TypeScript + Tailwind CSS
- Installed Heroicons and Anthropic SDK
- Created dark theme with blue-gray palette
- Built core components:
  - `WatchpointSelector` - Region filter tabs with activity indicators
  - `NewsFeed` - Filtered, sorted news list with refresh
  - `NewsCard` - Individual news items with tier badges, verification status, confidence bars
- Created type definitions for Watchpoints, Sources, NewsItems
- Added mock data simulating Iran/Ukraine scenarios
- Tested mobile (375px) and desktop views
- All working at http://localhost:3002

**Git Commits**:
- `ba43cb2` - Add environment variable template
- `69bbb75` - Phase 1 MVP: Feed-first UI with mock data

---

### Entry 14: MCP Server Integration
**User Asked**: Investigate Anthropic tools/plugins, including Ralph Loop for autonomous iteration. Install MCP servers for RSS, Bluesky, and web fetching.

**Provided**:
- Researched available MCP servers via web search
- Installed 3 MCP servers:
  - `@missionsquad/mcp-rss` - RSS feed aggregation ✓
  - `fetcher-mcp` - Web page fetching ✓
  - `@iflow-mcp/semioz_bluesky-mcp` - Bluesky API integration ✓
- Created Bluesky App Password for API access
- Updated `.env.local` with Bluesky credentials
- All servers connected and ready

**MCP Configuration** (in `~/.claude.json`):
```json
{
  "rss": { "command": "npx", "args": ["-y", "@missionsquad/mcp-rss"] },
  "fetcher": { "command": "npx", "args": ["-y", "fetcher-mcp"] },
  "bluesky": {
    "command": "npx",
    "args": ["-y", "@iflow-mcp/semioz_bluesky-mcp"],
    "env": { "BLUESKY_IDENTIFIER": "...", "BLUESKY_APP_PASSWORD": "..." }
  }
}
```

**Troubleshooting**:
- Initial `@semioz/bluesky-mcp` package failed to connect
- Switched to `@iflow-mcp/semioz_bluesky-mcp` which worked

---

### Entry 15: Phase 2 - Real Data Integration
**User Asked**: Continue from context restoration - complete MCP setup and integrate real data.

**Provided**:
- Created `src/lib/sources.ts` with curated RSS and Bluesky sources
  - BBC World, Middle East, Europe, Asia feeds
  - Al Jazeera RSS
  - Bluesky accounts: Bellingcat, ISW, OSINTtechnical, NOELREPORTS, AP News
  - Confidence scores from sources.md
  - Region keywords for auto-classification
  - Breaking news detection keywords
- Created `src/lib/rss.ts` - RSS parser
  - XML parsing with CDATA support
  - HTML entity decoding
  - Parallel feed fetching
  - Error handling per feed
- Created `src/app/api/news/route.ts` - News API endpoint
  - Aggregates multiple RSS feeds
  - Calculates activity levels per region
  - Returns structured NewsItem data
- Updated `src/app/page.tsx` for real data
  - Client-side data fetching with useEffect
  - Auto-refresh every 2 minutes
  - Dynamic activity level updates
  - Loading states

**Results**:
- App now displays REAL news from BBC and Al Jazeera
- Breaking news detection working (Iran protests flagged)
- Region classification working (Middle East items detected)
- Activity levels calculated from actual news volume
- Iran showing "ELEVATED" based on current events

**Technical Notes**:
- Reuters RSS feed deprecated (removed)
- Bluesky RSS endpoints: `bsky.app/profile/USERNAME/rss`
- BBC feeds reliable and fast

---

## Session 2 - January 2026

### Entry 16: Comprehensive RSS Source Expansion
**User Asked**: Review existing RSS feeds, remove off-topic sources, and compile a comprehensive list of new OSINT/geopolitical RSS sources that fit the use case.

**Provided**:
- **Removed 3 off-topic sources**: Dark Reading (cybersec only), Marginal Revolution (economics blog), Bleeping Computer (tech news)
- **Launched 8 parallel research agents** to compile comprehensive source lists:
  - Government/Official RSS feeds
  - Think tank RSS feeds
  - Substack geopolitical analysts
  - Regional news sources
  - Wire services & OSINT
  - Investigative journalism
  - Defense & energy
  - Main comprehensive research

**Research Files Created**:
- `FINAL_RSS_SOURCES.md` - Master consolidated list with TypeScript code
- `GOVERNMENT_SOURCES.md` - 12 official government feeds
- `THINKTANK_SOURCES.md` - 14 think tank feeds
- `SUBSTACK_SOURCES.md` - 19 expert analyst Substacks
- `REGIONAL_SOURCES.md` - 11 verified regional feeds
- `INVESTIGATIVE_SOURCES.md` - 29 investigative journalism feeds
- `DEFENSE_ENERGY_SOURCES.md` - 18 defense/energy feeds
- `WIRE_OSINT_SOURCES.md` - 12 wire service/OSINT feeds

**Sources Added to `sources-clean.ts`**:

| Category | Count | Examples |
|----------|-------|----------|
| Government/Official | 12 | UN News, UK FCDO, EU Commission, IAEA, Pentagon, CISA |
| OSINT/Human Rights | 7 | Bellingcat, HRW, CPJ, Citizen Lab, BIRN, CORRECTIV |
| Think Tanks | 14 | ECFR, ASPI, Lowy, SWP Berlin, SIPRI, AEI, RAND |
| Regional News | 11 | DW, Meduza, Yonhap, CNA, The Diplomat, SCMP |
| Expert Substacks | 11 | Freedman, Tooze, ChinaTalk, Counteroffensive |
| Defense/Energy | 6 | Task & Purpose, EIA, World Nuclear News |
| Wire Services | 3 | TASS, ANSA, UPI |
| Security Analysis | 5 | Cipher Brief, Responsible Statecraft, Small Wars |

**Results**:
- **+69 new verified RSS sources** added
- **Total RSS sources: 437**
- Build verified successful
- All feeds tested and validated for working RSS endpoints

**Technical Notes**:
- Many think tanks block automated requests (403 errors) - documented alternatives
- Substack RSS format: `https://[name].substack.com/feed`
- GOV.UK uses Atom format; most others use RSS 2.0
- Some Carnegie/Brookings feeds return HTML not RSS - use Bluesky instead

---

### Entry 17: Source Expansion Strategy & Telegram Research
**User Asked**: Study current sources, source-finding strategies, map options for expansion. Specifically interested in Twitter (decided against), reporters on Bluesky, and Telegram.

**Key Decisions**:
- **Twitter**: Not pursuing (API costs, complexity)
- **Telegram**: Researching - can read public channels free via MTProto (Telethon library)
- **Bluesky Reporters**: Identified as gap - only 26 reporters vs 119 OSINT analysts

**Provided**:
1. **Telegram API Research**:
   - Bot API requires admin access to channels (not useful)
   - MTProto API (via Telethon) can read ANY public channel for free
   - Just need api_id/api_hash from my.telegram.org
   - Created test script: `scripts/telegram_test.py`

2. **Documentation Consolidation**:
   - Created `docs/README.md` - index of all docs with workflow
   - Created `docs/BLOCKLIST.md` - rejected sources tracker
   - Updated `src/lib/blocklist.ts` with 4 blocked sources
   - Identified 8 intermediate *_SOURCES.md files as archivable

3. **High-Value Telegram Channels** (from existing research):
   - DeepState UA - Ukraine frontline maps
   - Iran International - Opposition news
   - Amwaj Media - Gulf/Iran policy

**Technical Notes**:
- Telethon: `pip install telethon`
- First run requires phone auth (creates session file)
- Can fetch any public channel without being admin

**Sources**:
- [Telethon GitHub](https://github.com/LonamiWebs/Telethon)
- [Telegram API](https://my.telegram.org)

---

## Status
**Current Phase**: Source expansion - Telegram exploration
**Total Sources**: 437 RSS + 150+ Bluesky accounts + 0 Telegram (testing)

**Recent Changes**:
- Telegram API researched and test script created
- Documentation consolidated with README index
- Blocklist doc created for tracking rejected sources
- Twitter ruled out (not pursuing)

**Next Steps**:
- User to get Telegram api_id/api_hash and test script
- Audit Bluesky for missing high-value reporters
- Consider Telegram integration if test successful

**Running**: `npm run dev` on port 3000

---

### Entry 18: Telegram Source Research & Mobile Menu UI
**User Asked**:
1. Improve hamburger menu UI (profile/sign-in on right side, look professional)
2. Comprehensive Telegram channel research while user explores the app

**Provided**:

**Mobile Menu Improvements:**
- Slide-out panel from right with backdrop overlay
- Professional sectioned layout (Navigation, Preferences, Account)
- AuthButton now has `variant="mobile"` for inline display
- User info card with avatar, Profile Settings, Admin, Sign Out
- "Sign in with Google" button with Google icon for signed-out state

**Telegram Research - 40 Channels Compiled:**

| Region | T1 | T2 | Total |
|--------|----|----|-------|
| Europe-Russia | 8 | 6 | 14 |
| Middle East | 6 | 4 | 10 |
| US/Domestic | 2 | 4 | 6 |
| Global | 4 | 3 | 7 |
| Asia | 0 | 3 | 3 |

**Top T1 Channels Identified:**
- DeepState UA/EN (788K subs, gold standard maps)
- IDF Official (300K, real-time strikes)
- Abu Ali Express EN (420K, Arabic translations)
- War Translated (100K, in-house translations)
- Rybar (1.5M, Russian perspective, ISW-cited)
- Iran International EN (opposition news)
- Tzofar Red Alerts (seconds-fast rocket alerts)

**Documentation Created:**
- `docs/TELEGRAM_SOURCES.md` - Full channel inventory with handles, subscribers, confidence scores, content types, integration priority

**Technical Notes:**
- Phase 1: 10 core channels (DeepState, IDF, Abu Ali, Iran Intl, Reuters, Bloomberg)
- Phase 2: Russian perspective + aggregators (Rybar, Intel Slava, Astra)
- Phase 3: T2 depth sources
- Blocklist includes opinion channels (Tucker, OAN, Newsmax)

---

## Status
**Current Phase**: Telegram research complete, awaiting user testing
**Total Sources**: 437 RSS + 150+ Bluesky + 40 Telegram (ready to integrate)

**Recent Changes**:
- Mobile menu redesigned (slide-out panel)
- AuthButton mobile variant added
- Telegram sources researched and documented
- 40 channels validated with handles, subscriber counts, posting frequency

**Next Steps**:
- User testing Telegram app
- User to get api_id/api_hash from my.telegram.org
- Run test script with Phase 1 channels
- Decide on integration approach

**Running**: `npm run dev` on port 3000

---

### Entry: Source Review & Cleanup (January 23, 2026)
**Task**: Review all sources, identify misfit sources, remove failing Bluesky handles

**Analysis**:
- Reviewed ~280 sources across categories
- Identified 2 sources that don't fit OSINT mission:
  - Jamelle Bouie (political columnist - removed)
  - Science Magazine (academic focus - removed)
- Identified ~25 failing Bluesky sources (major news orgs with unverified domain handles)

**Removed (invalid Bluesky handles)**:
- NBC News (@nbcnews.com)
- CNN (@cnn.com)
- The Intercept (@theintercept.com)
- NPR News (@npr.org)
- Wall Street Journal (@wsj.com)
- The Guardian (@theguardian.com)
- New York Times (@nytimes.com)
- Washington Post (@washingtonpost.com)
- The Atlantic (@theatlantic.com)

**Kept**: Paul Krugman (per user request - economic commentary useful for geopolitical context)

**Result**: -132 lines removed, 7 "REMOVED" comments added for documentation

---

*Last updated: January 23, 2026*
