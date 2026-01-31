# New Features Design — 2026-01-30

Two feature tracks brainstormed for Pulse. Both aim at **prediction/early warning** with a "first draft of history" journalistic angle.

---

## Track 1: Signals Page

**Goal:** Detect when the broader world starts paying attention to topics — often before curated sources break the story.

### Data Sources
- **Google Trends** — Search interest spikes by region/topic
- **Wikipedia Pageviews** — Sudden traffic to articles (people google, then wiki for context)

### UX Decisions
| Decision | Choice |
|----------|--------|
| Location | Dedicated "Signals" page (not integrated into Live Wire) |
| Time window | Selectable: 24h / 7d / 30d (default: 24h) |
| Comparison | Rolling: "Now vs. same time yesterday/last week" |
| Region filter | Independent selector (not synced with Live Wire) |
| Display | Chart-first with data table toggle |
| Topics | Hybrid: Curated watchlist + auto-detected "Emerging" section |

### Initial Watchlist (10 topics)
| Topic | Keywords |
|-------|----------|
| Taiwan Strait | Taiwan, Taipei, PLA, cross-strait |
| Iran Nuclear | Iran, IAEA, uranium, enrichment, Natanz |
| Ukraine War | Ukraine, Kyiv, Donbas, Kherson, Crimea |
| US-China | Beijing, sanctions, tariffs, decoupling |
| Israel-Gaza | Gaza, Hamas, IDF, Rafah, ceasefire |
| North Korea | DPRK, Pyongyang, Kim Jong Un, missile test |
| Russia NATO | NATO, Baltic, Article 5, nuclear |
| Venezuela | Maduro, opposition, PDVSA, sanctions |
| Sudan | Khartoum, RSF, SAF, humanitarian |
| Red Sea | Houthi, shipping, Bab el-Mandeb, Yemen |

### Technical Notes
- Google Trends API: Free, real-time-ish, needs filtering to avoid celebrity/sports noise
- Wikipedia Pageviews API: Free, less noisy than Trends
- Combined signals form stronger "attention index" than either alone

---

## Track 2: US Government Wire

**Goal:** Awareness dashboard showing "What did the government DO today?" + "What's coming up?"

### Scope Options (pick one to start)

**Option A: Executive Branch**
- President's daily schedule (public version from whitehouse.gov)
- Executive orders signed
- Presidential proclamations
- White House press briefings
- *Source: whitehouse.gov, Federal Register*

**Option B: Legislative Branch**
- Bills signed into law
- Key committee hearings scheduled
- Floor votes calendar
- *Source: congress.gov API*

### UX Decisions
| Decision | Choice |
|----------|--------|
| Core value | Awareness dashboard (passive monitoring) |
| Time orientation | Both directions: past actions + future calendar |
| Alerts | Not initially (Phase 2) |
| Archive/search | Not initially (Phase 2) |

### Open Questions
- [ ] Executive or Legislative first?
- [ ] How to display calendar vs. recent actions?
- [ ] Integration with Live Wire (link government actions to news coverage)?

---

## Implementation Priority

**Phase 1:** Track 1 (Signals) — New data layer, high differentiation value
**Phase 2:** Track 2 (Government Wire) — Structured data, clear sources

---

## Why These Features?

Pulse's gap in the market: not raw data (Twitter/X), not slow analysis (think tanks) — it's the **first 30 minutes of contextualized awareness**.

These features extend that:
- **Signals** catches attention *before* your curated sources report
- **Government Wire** catches official actions *as they happen*

Both serve the "first draft of history" journalistic value.
