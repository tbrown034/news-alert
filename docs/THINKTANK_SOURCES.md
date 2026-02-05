# Think Tank RSS Feed Sources

Research conducted: January 20, 2026

## Summary

This document catalogs verified RSS feeds from major think tanks publishing geopolitical and security analysis. Feeds were tested for validity and content relevance.

---

## Already Integrated in Sentinel

The following think tanks are already included in `src/lib/sources.ts` via Bluesky:

| Think Tank | Handle | Status |
|------------|--------|--------|
| CSIS | @csis.org | Active |
| Brookings Institution | @brookings.edu | Active |
| Carnegie Endowment | @carnegieendowment.org | Active |
| CFR (Council on Foreign Relations) | @cfr.org | Active |
| Wilson Center | @wilsoncenter.org | Active |
| RAND Corporation | @rand.org | Active |
| Chatham House | @chathamhouse.org | Active |
| RUSI | @rusi.bsky.social | Active |
| International Crisis Group | @crisisgroup.org | Active |
| NTI (Nuclear Threat Initiative) | @nti.org | Active |
| Arms Control Wonk | @armscontrolwonk.bsky.social | Active |

---

## US Think Tanks

### Verified Working RSS Feeds

| Think Tank | RSS Feed URL | Content Type | Status |
|------------|--------------|--------------|--------|
| **RAND Corporation** | `https://www.rand.org/pubs/commentary.xml` | Commentary & analysis on policy topics (Iran, Ukraine, AI, trade) | VERIFIED |
| **American Enterprise Institute (AEI)** | `https://www.aei.org/feed/` | Policy analysis (tech, economics, education, society) | VERIFIED |
| **Quincy Institute** | `https://quincyinst.org/feed/` | Foreign policy, responsible statecraft, anti-interventionism | VERIFIED |
| **Defense Priorities** | `https://www.defensepriorities.org/feed` | Defense policy, foreign policy critique, military analysis | VERIFIED |
| **Hudson Institute** | `https://www.hudson.org/rss.xml` | Policy analysis, podcasts (geopolitics, religious freedom) | VERIFIED |
| **Heritage Foundation** | `https://www.heritage.org/rss` | Conservative policy analysis, foreign/domestic policy | VERIFIED |
| **Foreign Affairs (CFR)** | `https://www.foreignaffairs.com/rss.xml` | Premier international affairs journal, in-depth analysis | VERIFIED |
| **Wilson Center - New Security Beat** | `https://www.newsecuritybeat.org/feed/` | Environmental security, climate, gender & health security | VERIFIED |

### Not Verified / No Working RSS Feed Found

| Think Tank | Notes |
|------------|-------|
| **CNAS** | No RSS feed found; subscribe via website or social media |
| **Brookings Institution** | Website returns HTML, not RSS; use Bluesky instead |
| **CFR (main site)** | Multiple blog feeds exist but no central feed; use Foreign Affairs RSS |
| **Carnegie Endowment** | Complex Solr-based feeds return HTML; use Bluesky instead |

---

## European Think Tanks

### Verified Working RSS Feeds

| Think Tank | RSS Feed URL | Content Type | Status |
|------------|--------------|--------------|--------|
| **ECFR (European Council on Foreign Relations)** | `https://ecfr.eu/feed/` | EU foreign policy, Russia-Ukraine, Greenland, trade | VERIFIED |
| **SWP Berlin (German Institute)** | `https://www.swp-berlin.org/en/SWPPublications.xml` | English publications on European security, NATO, migration | VERIFIED |
| **SWP Berlin (All)** | `https://www.swp-berlin.org/en/rss.xml` | All publications (German + English) | VERIFIED |
| **SIPRI (Stockholm)** | `https://www.sipri.org/rss/combined.xml` | Arms control, disarmament, international cooperation | VERIFIED |

### Not Verified / Access Restricted

| Think Tank | Notes |
|------------|-------|
| **Chatham House** | Returns 403 Forbidden; use Bluesky @chathamhouse.org |
| **IISS (International Institute for Strategic Studies)** | Returns 403 Forbidden; no public RSS available |
| **IFRI Paris** | Website returns HTML, not RSS; no working feed found |
| **RUSI** | Feed page blocked (403); use Bluesky @rusi.bsky.social |

---

## Regional Think Tanks

### Verified Working RSS Feeds

| Think Tank | RSS Feed URL | Content Type | Status |
|------------|--------------|--------------|--------|
| **ASPI Strategist (Australia)** | `https://www.aspistrategist.org.au/feed/` | Indo-Pacific security, China-Taiwan, AUKUS, defense | VERIFIED |
| **Lowy Institute Interpreter (Australia)** | `https://www.lowyinstitute.org/the-interpreter/rss.xml` | International policy, Taiwan, Ukraine, regional conflicts | VERIFIED |
| **MP-IDSA (India)** | `https://idsa.in/feed` | Indian defense, strategic affairs (connection issues noted) | PARTIALLY VERIFIED |

### Not Verified / Limited Availability

| Think Tank | Notes |
|------------|-------|
| **S. Rajaratnam School (Singapore)** | `https://www.rsis.edu.sg/feed/` exists but returns empty feed |

---

## Specialized Organizations

### Verified Working RSS Feeds

| Think Tank | RSS Feed URL | Content Type | Status |
|------------|--------------|--------------|--------|
| **Arms Control Association** | `http://feeds.feedburner.com/ArmsControlAssociationUpdates` | Nuclear nonproliferation, disarmament, arms control policy | VERIFIED |
| **International Crisis Group** | `https://www.crisisgroup.org/rss.xml` | Conflict analysis, crisis updates, regional briefings | VERIFIED |

### Not Verified / No Working RSS Feed Found

| Think Tank | Notes |
|------------|-------|
| **NTI (Nuclear Threat Initiative)** | Feed exists but empty; use Bluesky @nti.org |
| **Geneva Centre for Security Policy (GCSP)** | No RSS feed found |

---

## Recommended Additions to Sentinel

### High Priority (Verified, Active RSS Feeds)

```typescript
// US Think Tanks - RSS
{ id: 'aei', name: 'American Enterprise Institute', feedUrl: 'https://www.aei.org/feed/', sourceType: 'osint' },
{ id: 'quincy', name: 'Quincy Institute', feedUrl: 'https://quincyinst.org/feed/', sourceType: 'osint' },
{ id: 'defense-priorities', name: 'Defense Priorities', feedUrl: 'https://www.defensepriorities.org/feed', sourceType: 'osint' },
{ id: 'hudson', name: 'Hudson Institute', feedUrl: 'https://www.hudson.org/rss.xml', sourceType: 'osint' },
{ id: 'heritage', name: 'Heritage Foundation', feedUrl: 'https://www.heritage.org/rss', sourceType: 'osint' },
{ id: 'foreign-affairs', name: 'Foreign Affairs', feedUrl: 'https://www.foreignaffairs.com/rss.xml', sourceType: 'osint' },
{ id: 'rand-commentary', name: 'RAND Commentary', feedUrl: 'https://www.rand.org/pubs/commentary.xml', sourceType: 'osint' },
{ id: 'wilson-nsb', name: 'New Security Beat', feedUrl: 'https://www.newsecuritybeat.org/feed/', sourceType: 'osint' },

// European Think Tanks - RSS
{ id: 'ecfr', name: 'ECFR', feedUrl: 'https://ecfr.eu/feed/', sourceType: 'osint' },
{ id: 'swp-berlin', name: 'SWP Berlin', feedUrl: 'https://www.swp-berlin.org/en/SWPPublications.xml', sourceType: 'osint' },
{ id: 'sipri', name: 'SIPRI', feedUrl: 'https://www.sipri.org/rss/combined.xml', sourceType: 'osint' },

// Regional Think Tanks - RSS
{ id: 'aspi-strategist', name: 'ASPI Strategist', feedUrl: 'https://www.aspistrategist.org.au/feed/', sourceType: 'osint' },
{ id: 'lowy-interpreter', name: 'Lowy Interpreter', feedUrl: 'https://www.lowyinstitute.org/the-interpreter/rss.xml', sourceType: 'osint' },

// Specialized - RSS
{ id: 'arms-control-assoc', name: 'Arms Control Association', feedUrl: 'http://feeds.feedburner.com/ArmsControlAssociationUpdates', sourceType: 'osint' },
{ id: 'crisis-group-rss', name: 'Crisis Group', feedUrl: 'https://www.crisisgroup.org/rss.xml', sourceType: 'osint' },
```

---

## Feed Quality Notes

### Best Feeds (Active, Rich Content)
1. **Foreign Affairs** - Premier journal, frequent updates, authoritative analysis
2. **ECFR** - Active European perspective, current events focus
3. **ASPI Strategist** - Excellent Indo-Pacific coverage
4. **SWP Berlin** - Strong European security analysis
5. **RAND Commentary** - Policy-relevant, diverse topics
6. **Crisis Group** - Critical conflict monitoring

### Moderate Feeds (Less Frequent or Specialized)
- **Quincy Institute** - Anti-interventionist perspective
- **Defense Priorities** - Defense policy focus
- **SIPRI** - Arms control specialization
- **Arms Control Association** - Nuclear policy niche

### Consider Bluesky Over RSS
For some organizations, Bluesky provides more timely updates:
- Brookings, Carnegie, CFR (main), Chatham House, RUSI, IISS, NTI

---

## Testing Notes

- All "VERIFIED" feeds returned valid RSS/Atom XML with recent content (Dec 2025 - Jan 2026)
- Some feeds blocked by Cloudflare or server restrictions (403 errors)
- Carnegie Endowment Solr feeds return CSS/HTML instead of RSS
- RSIS feed exists but returns no content items
- Connection timeouts experienced with some Indian servers (IDSA)
