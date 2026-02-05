# Defense, Energy & Critical Infrastructure RSS Sources

Research completed: January 20, 2026

## Current Coverage in Codebase

The following sources are **already integrated** via Bluesky:
- Breaking Defense (@breakingdefense.com)
- Defense News (@defensenews.bsky.social)
- Military Times (@militarytimes.bsky.social)
- War on the Rocks (@warontherocks.bsky.social)

---

## Defense & Military Publications

### VERIFIED WORKING RSS FEEDS

| Source | RSS Feed URL | Status | Notes |
|--------|-------------|--------|-------|
| Defense One | `https://www.defenseone.com/rss/all/` | WORKING | All content feed |
| Breaking Defense | `https://breakingdefense.com/feed/` | WORKING | Main feed |
| Defense News | `https://www.defensenews.com/arc/outboundfeeds/rss/` | WORKING | Arc-based feed |
| Military Times | `https://www.militarytimes.com/arc/outboundfeeds/rss/` | WORKING | Arc-based feed |
| War on the Rocks | `https://warontherocks.com/feed/` | WORKING | Strategy/analysis |
| The War Zone | `https://www.twz.com/feed` | WORKING | Redirected from thedrive.com |
| Task & Purpose | `https://taskandpurpose.com/feed/` | WORKING | Military lifestyle/news |
| Army Times | `https://www.armytimes.com/arc/outboundfeeds/rss/` | WORKING | Arc-based feed |
| Navy Times | `https://www.navytimes.com/arc/outboundfeeds/rss/` | WORKING | Arc-based feed |
| Air Force Times | `https://www.airforcetimes.com/arc/outboundfeeds/rss/` | WORKING | Arc-based feed |
| C4ISRNet | `https://www.c4isrnet.com/arc/outboundfeeds/rss/` | WORKING | Defense tech focus |
| Shephard Media | `https://www.shephardmedia.com/news/feed/` | WORKING | Defense industry |

### NOT AVAILABLE / BLOCKED

| Source | Status | Notes |
|--------|--------|-------|
| Stars and Stripes | NO FEED FOUND | Tested multiple URLs, all 404 |
| National Defense Magazine | BLOCKED | Incapsula security blocking |
| The Defense Post | CONNECTION ISSUES | Socket hang up |
| Janes | NO PUBLIC FEED | Paid/restricted content |

---

## Space & Satellites

### VERIFIED WORKING RSS FEEDS

| Source | RSS Feed URL | Status | Notes |
|--------|-------------|--------|-------|
| SpaceNews | `https://spacenews.com/feed/` | WORKING | Space industry news |
| Space.com | `https://www.space.com/feeds.xml` | WORKING | General space news |
| SpacePolicyOnline | `https://spacepolicyonline.com/feed/` | WORKING | Policy-focused |

### NOT AVAILABLE / UNABLE TO TEST

| Source | Status | Notes |
|--------|--------|-------|
| Ars Technica Space | BLOCKED | Unable to fetch |
| Secure World Foundation | NO FEED FOUND | 404 on tested URLs |

---

## Energy Security

### VERIFIED WORKING RSS FEEDS

| Source | RSS Feed URL | Status | Notes |
|--------|-------------|--------|-------|
| EIA Today in Energy | `https://www.eia.gov/rss/todayinenergy.xml` | WORKING | US energy data/analysis |
| Rigzone | `https://www.rigzone.com/news/rss/rigzone_latest.aspx` | WORKING | Oil & gas industry |
| World Nuclear News | `https://world-nuclear-news.org/rss` | WORKING | Nuclear industry |

### NOT AVAILABLE / BLOCKED

| Source | Status | Notes |
|--------|--------|-------|
| Energy Intelligence | NO PUBLIC FEED | Subscription required |
| S&P Global Commodities/Platts | BLOCKED | 403 Forbidden |
| OPEC News | BLOCKED | 403 Forbidden |
| IEA News | NO FEED FOUND | 404 on tested URLs |
| Oil & Gas Journal | BLOCKED | Incapsula security |
| Uranium Insider | NOT TESTED | Likely subscription |

---

## Critical Infrastructure & ICS Security

### VERIFIED WORKING RSS FEEDS

| Source | RSS Feed URL | Status | Notes |
|--------|-------------|--------|-------|
| CISA Advisories | `https://www.cisa.gov/cybersecurity-advisories/all.xml` | WORKING | ICS/SCADA advisories |

### NOT AVAILABLE / OUTDATED

| Source | Status | Notes |
|--------|--------|-------|
| CISA News | OUTDATED | Feed exists but last update 2019 |
| Industrial Cyber | BLOCKED | 403 Forbidden |
| Dragos Blog | NO FEED FOUND | 404 on tested URLs |
| Claroty Blog | NO FEED FOUND | 404 on tested URLs |

---

## Recommended Additions to sources.ts

### High Priority (OSINT tier)

```typescript
// Defense One - not currently in codebase
{
  id: 'defense-one',
  name: 'Defense One',
  platform: 'rss',
  sourceType: 'osint',
  confidence: 90,
  region: 'us',
  feedUrl: 'https://www.defenseone.com/rss/all/',
  url: 'https://www.defenseone.com',
  baselinePostsPerDay: 15,
}

// The War Zone
{
  id: 'the-war-zone',
  name: 'The War Zone',
  platform: 'rss',
  sourceType: 'osint',
  confidence: 88,
  region: 'all',
  feedUrl: 'https://www.twz.com/feed',
  url: 'https://www.twz.com',
  baselinePostsPerDay: 10,
}

// SpaceNews
{
  id: 'spacenews',
  name: 'SpaceNews',
  platform: 'rss',
  sourceType: 'osint',
  confidence: 88,
  region: 'all',
  feedUrl: 'https://spacenews.com/feed/',
  url: 'https://spacenews.com',
  baselinePostsPerDay: 8,
}

// CISA Advisories
{
  id: 'cisa-advisories',
  name: 'CISA Advisories',
  platform: 'rss',
  sourceType: 'official',
  confidence: 95,
  region: 'us',
  feedUrl: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
  url: 'https://www.cisa.gov/cybersecurity-advisories',
  baselinePostsPerDay: 3,
}
```

### Medium Priority (Reporter tier)

```typescript
// Task & Purpose
{
  id: 'task-and-purpose',
  name: 'Task & Purpose',
  platform: 'rss',
  sourceType: 'reporter',
  confidence: 85,
  region: 'us',
  feedUrl: 'https://taskandpurpose.com/feed/',
  url: 'https://taskandpurpose.com',
  baselinePostsPerDay: 12,
}

// C4ISRNet
{
  id: 'c4isrnet',
  name: 'C4ISRNet',
  platform: 'rss',
  sourceType: 'reporter',
  confidence: 88,
  region: 'all',
  feedUrl: 'https://www.c4isrnet.com/arc/outboundfeeds/rss/',
  url: 'https://www.c4isrnet.com',
  baselinePostsPerDay: 8,
}

// EIA Today in Energy
{
  id: 'eia-energy',
  name: 'EIA Today in Energy',
  platform: 'rss',
  sourceType: 'official',
  confidence: 95,
  region: 'us',
  feedUrl: 'https://www.eia.gov/rss/todayinenergy.xml',
  url: 'https://www.eia.gov/todayinenergy/',
  baselinePostsPerDay: 1,
}

// Rigzone
{
  id: 'rigzone',
  name: 'Rigzone',
  platform: 'rss',
  sourceType: 'reporter',
  confidence: 85,
  region: 'all',
  feedUrl: 'https://www.rigzone.com/news/rss/rigzone_latest.aspx',
  url: 'https://www.rigzone.com',
  baselinePostsPerDay: 10,
}

// World Nuclear News
{
  id: 'world-nuclear-news',
  name: 'World Nuclear News',
  platform: 'rss',
  sourceType: 'reporter',
  confidence: 88,
  region: 'all',
  feedUrl: 'https://world-nuclear-news.org/rss',
  url: 'https://world-nuclear-news.org',
  baselinePostsPerDay: 3,
}

// Space Policy Online
{
  id: 'space-policy-online',
  name: 'Space Policy Online',
  platform: 'rss',
  sourceType: 'osint',
  confidence: 88,
  region: 'all',
  feedUrl: 'https://spacepolicyonline.com/feed/',
  url: 'https://spacepolicyonline.com',
  baselinePostsPerDay: 2,
}

// Shephard Media
{
  id: 'shephard-media',
  name: 'Shephard Media',
  platform: 'rss',
  sourceType: 'reporter',
  confidence: 85,
  region: 'all',
  feedUrl: 'https://www.shephardmedia.com/news/feed/',
  url: 'https://www.shephardmedia.com',
  baselinePostsPerDay: 5,
}

// Space.com
{
  id: 'space-com',
  name: 'Space.com',
  platform: 'rss',
  sourceType: 'reporter',
  confidence: 82,
  region: 'all',
  feedUrl: 'https://www.space.com/feeds.xml',
  url: 'https://www.space.com',
  baselinePostsPerDay: 15,
}
```

---

## Summary

**Total Verified Working Feeds: 18**
- Defense/Military: 12
- Space/Satellites: 3
- Energy Security: 3
- Critical Infrastructure: 1 (CISA Advisories)

**Already in Codebase: 4** (via Bluesky)
- Breaking Defense, Defense News, Military Times, War on the Rocks

**New Recommended Additions: 14**
- High Priority: Defense One, The War Zone, SpaceNews, CISA Advisories
- Medium Priority: Task & Purpose, C4ISRNet, EIA Today in Energy, Rigzone, World Nuclear News, Space Policy Online, Shephard Media, Space.com

**Unavailable/Blocked: 12**
- Stars and Stripes, National Defense Magazine, The Defense Post, Janes, Ars Technica Space, Secure World Foundation, Energy Intelligence, S&P Global/Platts, OPEC, IEA, Oil & Gas Journal, Industrial Cyber, Dragos, Claroty
