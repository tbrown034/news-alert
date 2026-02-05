# New RSS Sources for Sentinel OSINT Dashboard

This document contains verified and researched RSS feeds suitable for the Sentinel geopolitical situational awareness dashboard. Sources are organized by category with verification status, region assignments, and source type recommendations.

**Format Reference:**
```typescript
{
  id: 'source-id',
  name: 'Source Name',
  platform: 'rss',
  sourceType: 'official' | 'news-org' | 'analyst' | 'osint' | 'think-tank',
  fetchTier: 'T1' | 'T2' | 'T3',
  confidence: 85-95,
  region: 'all' | 'us' | 'europe-russia' | 'middle-east' | 'asia' | 'latam',
  feedUrl: 'https://...',
  url: 'https://...',
  postsPerDay: number,
}
```

---

## 1. Government/Official Sources

### Verified Working

| Source | RSS URL | Region | Type | Posts/Day | Notes |
|--------|---------|--------|------|-----------|-------|
| **White House News** | `https://www.whitehouse.gov/news/feed/` | us | official | 10-15 | Presidential actions, fact sheets, briefings. Verified working. |
| **UK FCDO** | `https://www.gov.uk/government/organisations/foreign-commonwealth-development-office.atom` | europe-russia | official | 5-10 | Travel advisories, diplomatic news, policy guidance. Atom format, verified. |
| **UN News** | `https://news.un.org/feed/subscribe/en/news/all/rss.xml` | all | official | 20-30 | Global humanitarian, political, environmental coverage. Verified working. |

### Needs Alternative URL or Not Available

| Source | Status | Notes |
|--------|--------|-------|
| Pentagon/DoD | Redirects to war.gov | May need updated URL |
| State Dept | Returns error page | Try: `https://www.state.gov/rss-feeds/` for listing |
| EU External Action | 404 | Check EEAS website directly |
| NATO | 404 | Check nato.int for current feed URLs |

---

## 2. Wire Services & Major News

### Verified Working

| Source | RSS URL | Region | Type | Posts/Day | Notes |
|--------|---------|--------|------|-----------|-------|
| **Washington Times World** | `https://www.washingtontimes.com/rss/headlines/news/world/` | all | news-org | 30-40 | International news coverage. Verified working. |

### Already in sources-clean.ts
- AP News (Bluesky)
- Reuters (Bluesky)
- Al Jazeera RSS
- BBC World RSS
- NYT World RSS
- Guardian World RSS
- France 24 RSS
- Euronews RSS

---

## 3. Think Tanks

### Verified Working

| Source | RSS URL | Region | Type | Posts/Day | Notes |
|--------|---------|--------|------|-----------|-------|
| **Stimson Center** | `https://www.stimson.org/feed/` | all | analyst | 3-5 | Nuclear security, AI threat reduction, regional analysis. Verified. |
| **Atlantic Council** | `https://www.atlanticcouncil.org/feed/` | all | analyst | 15-20 | Geopolitics, security, democracy, digital policy. Verified. |
| **International Crisis Group** | `https://www.crisisgroup.org/rss.xml` | all | analyst | 5-10 | Conflict tracking, crisis analysis, "10 Conflicts to Watch". Verified. |
| **ECFR** | `https://ecfr.eu/feed/` | europe-russia | analyst | 5-8 | European foreign policy, EU-Russia, Arctic geopolitics. Verified. |
| **E-International Relations** | `https://e-ir.info/feed/` | all | analyst | 2-3 | Academic international relations, scholarly analysis. Verified. |

### Already in sources-clean.ts
- CSIS RSS
- Foreign Affairs RSS
- Foreign Policy RSS

### Not Working / Needs Alternative

| Source | Status | Notes |
|--------|--------|-------|
| Brookings | Returns HTML | Try `https://www.brookings.edu/topics/foreign-policy/feed/` |
| RAND | 403 Forbidden | Check rand.org for public feeds |
| Carnegie | Returns HTML | No public RSS found |
| CFR | 404 | Check cfr.org for updated feeds |
| Chatham House | 403 Forbidden | May require subscription |
| IISS | 403 Forbidden | May require subscription |
| Wilson Center | 404 | Check wilsoncenter.org |
| ASPI (Australia) | 403 Forbidden | May require subscription |
| Lowy Institute | 404 | Check lowyinstitute.org |

---

## 4. OSINT / Conflict Tracking

### Verified Working

| Source | RSS URL | Region | Type | Posts/Day | Notes |
|--------|---------|--------|------|-----------|-------|
| **Bellingcat** | `https://www.bellingcat.com/feed/` | all | osint | 2-5 | Open-source investigations, visual evidence verification. Core OSINT source. Verified. |
| **The Soufan Center** | `https://thesoufancenter.org/feed/` | all | osint | 3-5 | Counterterrorism, geopolitical analysis, intelligence briefs. Verified. |
| **Small Wars Journal** | `https://smallwarsjournal.com/feed/` | all | analyst | 5-8 | Irregular warfare, gray-zone conflict, military strategy. Verified. |
| **Political Geography Now** | `https://polgeonow.com/feeds/posts/default` | all | osint | 1-2 | Territorial control maps, border changes, conflict mapping. Atom format. Verified. |

### Already in sources-clean.ts
- Krebs on Security RSS
- ICIJ RSS
- GIJN RSS
- InSight Crime RSS

### Not Working

| Source | Status | Notes |
|--------|--------|-------|
| ACLED | 404 | No public RSS; use their API or dashboard instead |
| ISW (understandingwar.org) | 403 | Check for alternative feed URL |
| Arms Control Association | Returns HTML | No working RSS found |

---

## 5. Regional News

### Verified Working

| Source | RSS URL | Region | Type | Posts/Day | Notes |
|--------|---------|--------|------|-----------|-------|
| **SCMP News** | `https://www.scmp.com/rss/91/feed` | asia | news-org | 50+ | Hong Kong, China, Asia coverage. Multiple topic feeds available. Verified. |
| **SCMP China** | `https://www.scmp.com/rss/4/feed` | asia | news-org | 30+ | China-focused coverage. |
| **SCMP Asia** | `https://www.scmp.com/rss/3/feed` | asia | news-org | 20+ | Asia-Pacific regional news. |
| **SCMP World** | `https://www.scmp.com/rss/5/feed` | all | news-org | 20+ | International coverage. |
| **The Diplomat** | `https://thediplomat.com/feed/` | asia | news-org | 10-15 | Asia-Pacific politics, security, economics. Core Asia source. Verified. |
| **Global Voices** | `https://globalvoices.org/feed/` | all | news-org | 5-10 | Citizen journalism from around the world. Verified. |
| **Middle East Eye** | `https://www.middleeasteye.net/rss` | middle-east | news-org | 20-30 | Middle East politics, Israel-Palestine, Syria. Verified. |
| **Defence Blog** | `https://www.defence-blog.com/feed/` | all | news-org | 10-15 | Global defense news, military equipment, technology. Verified. |

### Already in sources-clean.ts
- Al-Monitor RSS (Middle East)
- Nikkei Asia RSS

### Not Working / Needs Alternative

| Source | Status | Notes |
|--------|--------|-------|
| Yonhap (Korea) | Unable to fetch | Try: `https://en.yna.co.kr/RSS/news.xml` |
| Kyodo (Japan) | Unable to fetch | Try: `https://english.kyodonews.net/rss/all.xml` |
| Al Arabiya | 403 Forbidden | May require different approach |
| TRT World | 404 | Check trtworld.com for feeds |
| The Africa Report | 403 Forbidden | May be geo-restricted |
| DW (Deutsche Welle) | Unable to fetch | Try: `https://rss.dw.com/xml/rss-en-all` |

---

## 6. Security & Defense Analysis

### Verified Working

| Source | RSS URL | Region | Type | Posts/Day | Notes |
|--------|---------|--------|------|-----------|-------|
| **The Cipher Brief** | `https://thecipherbrief.com/feed` | all | analyst | 5-8 | National security, intelligence, military analysis. Expert interviews. Verified. |
| **Responsible Statecraft** | `https://responsiblestatecraft.org/feed/` | all | analyst | 5-8 | Foreign policy, restraint perspective, diplomatic analysis. Verified. |
| **Just Security** | `https://www.justsecurity.org/feed/` | all | analyst | 3-5 | National security law, constitutional governance. Verified. |

### Already in sources-clean.ts
- Defense One RSS
- War on the Rocks RSS
- The War Zone RSS
- Breaking Defense RSS
- Defense News RSS
- Military Times RSS
- C4ISRNet RSS
- SpaceNews RSS
- Naval News RSS

### Not Working

| Source | Status | Notes |
|--------|--------|-------|
| Lawfare | 403 Forbidden | Try alternative URL |
| Janes | 404 | Subscription required |

---

## 7. Substacks with RSS

### Verified Working

| Source | RSS URL | Region | Type | Posts/Day | Notes |
|--------|---------|--------|------|-----------|-------|
| **Timothy Ash** | `https://timothyash.substack.com/feed` | europe-russia | analyst | 3-5 | Emerging markets, Ukraine, Russia-Europe geopolitics. Active analyst. Verified. |
| **GeopoliticsUnplugged** | `https://geopoliticsunplugged.substack.com/feed` | all | analyst | 2-3 | Daily geopolitical briefings, news summaries. Verified. |

### Additional Substacks (Formula: `{name}.substack.com/feed`)

| Source | RSS URL | Region | Type | Notes |
|--------|---------|--------|------|-------|
| Geopolitical Dispatch | `https://www.geopoliticaldispatch.com/feed` | all | analyst | Financial markets + geopolitics |
| The Scowcroft Group | `https://scowcroft.substack.com/feed` | all | analyst | Annual geopolitical risk outlook |

---

## 8. Energy & Commodities (Geopolitical Lens)

### Verified Working

| Source | RSS URL | Region | Type | Posts/Day | Notes |
|--------|---------|--------|------|-----------|-------|
| **OilPrice.com** | `https://oilprice.com/rss/main` | all | news-org | 15-20 | Energy markets, geopolitics of oil/gas, trade. Verified. |

---

## 9. Specialized Geopolitics

### Verified Working

| Source | RSS URL | Region | Type | Posts/Day | Notes |
|--------|---------|--------|------|-----------|-------|
| **Geopolitical Futures** | `https://geopoliticalfutures.com/feed` | all | analyst | 3-5 | George Friedman's forecasting. Daily memos, analysis. Verified. |

---

## Summary: Ready to Add

### High Priority (T1 Candidates)

```typescript
// Government/Official
{ id: 'whitehouse-rss', name: 'White House', platform: 'rss', sourceType: 'official', fetchTier: 'T1', confidence: 95, region: 'us', feedUrl: 'https://www.whitehouse.gov/news/feed/', url: 'https://www.whitehouse.gov/', postsPerDay: 12 },
{ id: 'uk-fcdo-rss', name: 'UK FCDO', platform: 'rss', sourceType: 'official', fetchTier: 'T2', confidence: 92, region: 'europe-russia', feedUrl: 'https://www.gov.uk/government/organisations/foreign-commonwealth-development-office.atom', url: 'https://www.gov.uk/fcdo', postsPerDay: 8 },
{ id: 'un-news-rss', name: 'UN News', platform: 'rss', sourceType: 'official', fetchTier: 'T1', confidence: 95, region: 'all', feedUrl: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', url: 'https://news.un.org/', postsPerDay: 25 },

// OSINT / Conflict Tracking
{ id: 'bellingcat-rss', name: 'Bellingcat', platform: 'rss', sourceType: 'osint', fetchTier: 'T1', confidence: 95, region: 'all', feedUrl: 'https://www.bellingcat.com/feed/', url: 'https://www.bellingcat.com/', postsPerDay: 3 },
{ id: 'soufan-center-rss', name: 'The Soufan Center', platform: 'rss', sourceType: 'osint', fetchTier: 'T1', confidence: 90, region: 'all', feedUrl: 'https://thesoufancenter.org/feed/', url: 'https://thesoufancenter.org/', postsPerDay: 4 },
{ id: 'crisis-group-rss', name: 'International Crisis Group', platform: 'rss', sourceType: 'analyst', fetchTier: 'T1', confidence: 95, region: 'all', feedUrl: 'https://www.crisisgroup.org/rss.xml', url: 'https://www.crisisgroup.org/', postsPerDay: 5 },

// Think Tanks
{ id: 'atlantic-council-rss', name: 'Atlantic Council', platform: 'rss', sourceType: 'analyst', fetchTier: 'T1', confidence: 90, region: 'all', feedUrl: 'https://www.atlanticcouncil.org/feed/', url: 'https://www.atlanticcouncil.org/', postsPerDay: 15 },
{ id: 'stimson-rss', name: 'Stimson Center', platform: 'rss', sourceType: 'analyst', fetchTier: 'T2', confidence: 88, region: 'all', feedUrl: 'https://www.stimson.org/feed/', url: 'https://www.stimson.org/', postsPerDay: 4 },
{ id: 'ecfr-rss', name: 'ECFR', platform: 'rss', sourceType: 'analyst', fetchTier: 'T2', confidence: 88, region: 'europe-russia', feedUrl: 'https://ecfr.eu/feed/', url: 'https://ecfr.eu/', postsPerDay: 5 },

// Regional News
{ id: 'scmp-china-rss', name: 'SCMP China', platform: 'rss', sourceType: 'news-org', fetchTier: 'T1', confidence: 88, region: 'asia', feedUrl: 'https://www.scmp.com/rss/4/feed', url: 'https://www.scmp.com/', postsPerDay: 30 },
{ id: 'diplomat-rss', name: 'The Diplomat', platform: 'rss', sourceType: 'news-org', fetchTier: 'T1', confidence: 90, region: 'asia', feedUrl: 'https://thediplomat.com/feed/', url: 'https://thediplomat.com/', postsPerDay: 12 },
{ id: 'middle-east-eye-rss', name: 'Middle East Eye', platform: 'rss', sourceType: 'news-org', fetchTier: 'T1', confidence: 85, region: 'middle-east', feedUrl: 'https://www.middleeasteye.net/rss', url: 'https://www.middleeasteye.net/', postsPerDay: 25 },

// Security Analysis
{ id: 'cipher-brief-rss', name: 'The Cipher Brief', platform: 'rss', sourceType: 'analyst', fetchTier: 'T1', confidence: 90, region: 'all', feedUrl: 'https://thecipherbrief.com/feed', url: 'https://thecipherbrief.com/', postsPerDay: 6 },
{ id: 'responsible-statecraft-rss', name: 'Responsible Statecraft', platform: 'rss', sourceType: 'analyst', fetchTier: 'T2', confidence: 85, region: 'all', feedUrl: 'https://responsiblestatecraft.org/feed/', url: 'https://responsiblestatecraft.org/', postsPerDay: 5 },
{ id: 'just-security-rss', name: 'Just Security', platform: 'rss', sourceType: 'analyst', fetchTier: 'T2', confidence: 88, region: 'all', feedUrl: 'https://www.justsecurity.org/feed/', url: 'https://www.justsecurity.org/', postsPerDay: 4 },
{ id: 'small-wars-rss', name: 'Small Wars Journal', platform: 'rss', sourceType: 'analyst', fetchTier: 'T2', confidence: 85, region: 'all', feedUrl: 'https://smallwarsjournal.com/feed/', url: 'https://smallwarsjournal.com/', postsPerDay: 6 },
```

### Medium Priority (T2 Candidates)

```typescript
// Geopolitics & Forecasting
{ id: 'geopolitical-futures-rss', name: 'Geopolitical Futures', platform: 'rss', sourceType: 'analyst', fetchTier: 'T2', confidence: 88, region: 'all', feedUrl: 'https://geopoliticalfutures.com/feed', url: 'https://geopoliticalfutures.com/', postsPerDay: 4 },
{ id: 'polgeonow-rss', name: 'Political Geography Now', platform: 'rss', sourceType: 'osint', fetchTier: 'T3', confidence: 85, region: 'all', feedUrl: 'https://polgeonow.com/feeds/posts/default', url: 'https://polgeonow.com/', postsPerDay: 1 },
{ id: 'e-ir-rss', name: 'E-International Relations', platform: 'rss', sourceType: 'analyst', fetchTier: 'T3', confidence: 82, region: 'all', feedUrl: 'https://e-ir.info/feed/', url: 'https://e-ir.info/', postsPerDay: 2 },

// Energy
{ id: 'oilprice-rss', name: 'OilPrice', platform: 'rss', sourceType: 'news-org', fetchTier: 'T2', confidence: 82, region: 'all', feedUrl: 'https://oilprice.com/rss/main', url: 'https://oilprice.com/', postsPerDay: 18 },

// Defense
{ id: 'defence-blog-rss', name: 'Defence Blog', platform: 'rss', sourceType: 'news-org', fetchTier: 'T2', confidence: 80, region: 'all', feedUrl: 'https://www.defence-blog.com/feed/', url: 'https://www.defence-blog.com/', postsPerDay: 12 },

// Global Voices
{ id: 'global-voices-rss', name: 'Global Voices', platform: 'rss', sourceType: 'news-org', fetchTier: 'T2', confidence: 80, region: 'all', feedUrl: 'https://globalvoices.org/feed/', url: 'https://globalvoices.org/', postsPerDay: 8 },

// Substacks
{ id: 'timothy-ash-rss', name: 'Timothy Ash', platform: 'rss', sourceType: 'analyst', fetchTier: 'T2', confidence: 82, region: 'europe-russia', feedUrl: 'https://timothyash.substack.com/feed', url: 'https://timothyash.substack.com/', postsPerDay: 3 },
{ id: 'geopolitics-unplugged-rss', name: 'GeopoliticsUnplugged', platform: 'rss', sourceType: 'analyst', fetchTier: 'T2', confidence: 78, region: 'all', feedUrl: 'https://geopoliticsunplugged.substack.com/feed', url: 'https://geopoliticsunplugged.substack.com/', postsPerDay: 2 },
```

---

## SCMP Full Feed List

For reference, South China Morning Post offers these feeds at `scmp.com/rss/[ID]/feed`:

| ID | Section |
|----|---------|
| 91 | News (All) |
| 2 | Hong Kong |
| 3 | Asia |
| 4 | China |
| 5 | World |
| 318202 | People & Culture |

---

## Notes

1. **Feed Verification**: All "Verified Working" feeds were tested on January 20, 2026
2. **403/404 Errors**: Many think tanks block automated access or have moved their feeds
3. **Atom vs RSS**: Some feeds use Atom format (UK FCDO, PolGeoNow) - the parser should handle both
4. **Rate Limits**: Large news orgs (SCMP, Al Jazeera) may rate limit; consider T1/T2 tiering accordingly
5. **Substack Pattern**: Any Substack can be accessed via `{publication}.substack.com/feed`

---

*Generated: January 20, 2026*
