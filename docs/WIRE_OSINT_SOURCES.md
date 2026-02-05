# Wire Services & OSINT RSS Feeds

Research conducted: January 2026

This document catalogs RSS feeds for major wire services, OSINT sources, and specialized security/defense publishers. Feeds are categorized by verification status.

---

## Wire Services

### Verified Working Feeds

| Source | Feed URL | Notes |
|--------|----------|-------|
| **TASS (Russia)** | `https://tass.com/rss/v2.xml` | Russian state media, English. 100+ articles daily. Good for monitoring Russian perspective. |
| **ANSA (Italy)** | `https://www.ansa.it/english/news/english_nr_rss.xml` | Italian news agency English service. ~50 articles daily. |
| **UPI** | `https://rss.upi.com/news/news.rss` | United Press International. 25 articles, updates every 10 minutes. |
| **France 24** | `https://www.france24.com/en/rss` | French perspective, broadcasts in English. Good AFP-sourced content. |
| **Deutsche Welle** | `https://rss.dw.com/rdf/rss-en-all` | German public broadcaster. Multi-topic coverage. |

### DW Topic-Specific Feeds

| Topic | Feed URL |
|-------|----------|
| Europe | `https://rss.dw.com/rdf/rss-en-eu` |
| Sports | `https://rss.dw.com/rdf/rss-en-sports` |
| Culture | `https://rss.dw.com/rdf/rss-en-cul` |
| Environment | `https://rss.dw.com/xml/rss_en_enviro` |
| Science | `https://rss.dw.com/xml/rss_en_science` |

### Feeds Requiring Third-Party Tools

| Source | Status | Workaround |
|--------|--------|------------|
| **Associated Press** | No official free RSS | Use RSSHub: `https://rsshub.app/apnews/topics/ap-top-news` (may be rate-limited). Alternative topics: `/apnews/topics/world-news`, `/apnews/topics/us-news`, `/apnews/topics/politics` |
| **Reuters** | Discontinued official feeds | Use Google News workaround: `https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com&ceid=US:en&hl=en-US&gl=US` |
| **AFP** | No free public RSS | Business model relies on paid syndication. Use France 24 for AFP-sourced content. |

### Regional Wire Services (Verification Needed)

| Source | Reported Feed URL | Status |
|--------|-------------------|--------|
| **Yonhap (Korea)** | `https://en.yna.co.kr/RSS/news.xml` | Could not verify (403 errors). Try direct access. |
| **Kyodo (Japan)** | `https://english.kyodonews.net/rss/all.xml` | Could not verify. Note: Rebranded to "Japan Wire" in July 2025. |
| **Xinhua (China)** | `http://www.xinhuanet.com/english/rss_eng.htm` | RSS index page. Could not verify individual feeds (403). |
| **EFE (Spain)** | Unknown | No free English RSS found. Spanish feeds at efe.com may exist. |
| **DPA (Germany)** | None found | News distributed via presseportal.de |
| **PAP (Poland)** | Unknown | The First News (English) shut down Feb 2024. Check pap.pl/en |

---

## OSINT & Conflict Tracking

### Verified Working Feeds

| Source | Feed URL | Notes |
|--------|----------|-------|
| **Bellingcat** | `https://bellingcat.com/feed/` | Investigative journalism, OSINT methodology. ~5 articles visible. |
| **Small Arms Survey** | `https://www.smallarmssurvey.org/rss.xml` | Arms trafficking, conflict research. 10 recent items. |
| **James Martin CNS** | `https://nonproliferation.org/feed/` | Nonproliferation studies. Academic focus. |

### No Public RSS Available

| Source | Status | Alternative |
|--------|--------|-------------|
| **ACLED** | API only (paid) | Data export tool at acleddata.com. Weekly updates via email. |
| **Liveuamap** | No public RSS | Paid API at liveuamap.com/promo/api. Telegram: t.me/liveuamap |
| **ISW** | Site migrated | Redirects from iswresearch.org to understandingwar.org. Check for /feed/ endpoint. |
| **IISS** | Not found | Premium content. Check iiss.org directly. |
| **Janes** | Not found | Enterprise/paid service. No free tier. |
| **Conflict Armament Research** | Not found | Mailing list at eepurl.com/dt5pUX. Publications at conflictarm.com/publications/ |

---

## Arms Control & Nuclear

### Verified Working Feeds

| Source | Feed URL | Notes |
|--------|----------|-------|
| **SIPRI** | `https://www.sipri.org/rss/combined.xml` | Stockholm peace research. 10 items. |
| **Arms Control Association** | `https://www.armscontrol.org/rss.xml` | Media citations feed. Tracks ACA expert appearances. |
| **Bulletin of Atomic Scientists** | `https://www.tandfonline.com/feed/rss/rbul20` | Journal ToC feed via Taylor & Francis. Academic articles. |

### Verification Needed / Not Found

| Source | Status | Notes |
|--------|--------|-------|
| **Nuclear Threat Initiative (NTI)** | Not found (403 errors) | Check nti.org directly |
| **Federation of American Scientists** | `https://fas.org/feed/` | Feed exists but only had placeholder content at time of check |

---

## Maritime & Aviation Security

### Verified Working Feeds

| Source | Feed URL | Notes |
|--------|----------|-------|
| **Maritime Executive** | `https://www.maritime-executive.com/articles.rss` | Excellent. 50 articles. Shipping, ports, geopolitics. |

### No Public RSS / Paywalled

| Source | Status | Notes |
|--------|--------|-------|
| **Lloyd's List** | Subscriber only | RSS feeds page requires authentication |
| **FlightGlobal** | Not found | Use third-party generators (Feeder, Feedspot) |
| **Defense Aviation Post** | Not researched | |
| **IHS Markit Defense** | Enterprise only | Merged with S&P Global |

---

## Supplementary Sources (Bonus Finds)

These sources were discovered during research and may be useful additions:

| Source | Feed URL | Category |
|--------|----------|----------|
| **CGTN (China)** | `https://www.cgtn.com/subscribe/rss.html` (RSS index) | Chinese state media |
| **People's Daily (China)** | `http://en.people.cn/98373/98471/index.html` (RSS index) | Chinese state media |
| **China Daily** | `https://usa.chinadaily.com.cn/rss.html` (RSS index) | Chinese state media |
| **EASA (EU Aviation)** | `https://www.easa.europa.eu/en/rss` | Aviation safety |
| **Boeing News** | `https://boeing.mediaroom.com/rss-feeds` | Aviation industry |

---

## Integration Recommendations

### High Priority (Add to Sentinel)

1. **TASS** - Essential for Russian perspective monitoring
2. **Bellingcat** - Premier OSINT source
3. **Maritime Executive** - Excellent maritime security coverage
4. **SIPRI** - Authoritative arms research
5. **Small Arms Survey** - Conflict/weapons tracking
6. **ANSA English** - Good European wire coverage
7. **UPI** - Reliable US wire service

### Medium Priority

1. **Deutsche Welle** - German/European perspective
2. **France 24** - French perspective, AFP content
3. **Arms Control Association** - Nuclear/arms policy
4. **Bulletin of Atomic Scientists** - Nuclear expertise
5. **James Martin CNS** - Nonproliferation research

### Requires Workarounds

1. **AP News** - Use RSSHub or Google News proxy
2. **Reuters** - Use Google News proxy
3. **Liveuamap** - Monitor Telegram channel or use API

---

## Feed Testing Commands

Test feeds with curl:

```bash
# Test RSS feed validity
curl -s "https://tass.com/rss/v2.xml" | head -50

# Check feed freshness (look for recent dates)
curl -s "https://bellingcat.com/feed/" | grep -o '<pubDate>[^<]*</pubDate>' | head -5
```

---

## Notes

- Many wire services (AP, Reuters, AFP) have moved away from free RSS to protect their subscription business models
- State media outlets (TASS, Xinhua, CGTN) typically maintain free RSS feeds
- Academic/research institutions often provide RSS via journal platforms (Taylor & Francis, SAGE)
- For sources without RSS, consider: Telegram channels, email newsletters, or third-party RSS generators
- Rate limiting may apply to third-party RSS proxies (RSSHub, Google News)

Last updated: January 2026
