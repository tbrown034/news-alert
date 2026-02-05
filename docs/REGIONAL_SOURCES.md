# Regional News Sources - RSS Feed Research

Research conducted: 2026-01-20

## Summary

This document contains verified RSS feeds for regional news sources covering geopolitical events. Sources are organized by region with status indicators.

**Legend:**
- VERIFIED: Feed tested and working
- ALREADY EXISTS: Source already in sources.ts
- BLOCKED: Feed protected by Cloudflare/bot protection
- NOT FOUND: No working RSS feed discovered
- NO RSS: Source does not appear to offer RSS

---

## Asia-Pacific

| Source | Status | RSS Feed URL | Notes |
|--------|--------|--------------|-------|
| South China Morning Post | ALREADY EXISTS | `https://www.scmp.com/rss/91/feed` | News feed working |
| Yonhap News (Korea) | VERIFIED | `https://en.yna.co.kr/RSS/news.xml` | All news feed |
| Kyodo News (Japan) | NOT FOUND | - | RSS endpoints return 404 |
| Channel News Asia | VERIFIED | `https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml` | Latest news |
| Channel News Asia (Asia) | VERIFIED | `https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311` | Asia category |
| The Hindu | BLOCKED | - | Returns 403 (bot protection) |
| Dawn (Pakistan) | VERIFIED | `https://www.dawn.com/feeds/home` | Home feed working |
| Nikkei Asia | ALREADY EXISTS | `https://asia.nikkei.com/rss/feed/nar` | Working |

**Recommended additions to sources.ts:**
- Yonhap News: `https://en.yna.co.kr/RSS/news.xml`
- Channel News Asia: `https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml`
- Dawn (Pakistan): `https://www.dawn.com/feeds/home`

---

## Middle East

| Source | Status | RSS Feed URL | Notes |
|--------|--------|--------------|-------|
| Al Arabiya English | BLOCKED | - | Returns 403 |
| TRT World | NOT FOUND | - | No working RSS found |
| Al-Monitor | VERIFIED | `https://www.al-monitor.com/rss` | Working well |
| The National (UAE) | NOT FOUND | - | RSS endpoints return 404 |
| Arab News | BLOCKED | - | Returns 403 |
| Iran International | ALREADY EXISTS | N/A | Uses Bluesky, RSS returns 404 |
| Times of Israel | VERIFIED | `https://www.timesofisrael.com/feed/` | Bonus - working |
| Jerusalem Post | VERIFIED | `https://www.jpost.com/Rss/RssFeedsHeadlines.aspx` | Bonus - working |

**Recommended additions to sources.ts:**
- Al-Monitor: `https://www.al-monitor.com/rss`
- Times of Israel: `https://www.timesofisrael.com/feed/`
- Jerusalem Post: `https://www.jpost.com/Rss/RssFeedsHeadlines.aspx`

---

## Africa

| Source | Status | RSS Feed URL | Notes |
|--------|--------|--------------|-------|
| The Africa Report | ALREADY EXISTS | - | May need verification |
| Daily Maverick (South Africa) | VERIFIED | `https://www.dailymaverick.co.za/dmrss/` | Working |
| The East African | BLOCKED | - | Returns 403 |
| Punch Nigeria | BLOCKED | - | Cloudflare protected |
| The Citizen (Tanzania) | NO RSS | - | /feed/ returns HTML, no RSS |

**Recommended additions to sources.ts:**
- Daily Maverick: `https://www.dailymaverick.co.za/dmrss/`

---

## Latin America

| Source | Status | RSS Feed URL | Notes |
|--------|--------|--------------|-------|
| Mercopress | BLOCKED | - | Returns 403 |
| Latin America Reports | NOT FOUND | - | Could not locate |
| El Pais English | VERIFIED | `https://feeds.elpais.com/mrss-s/pages/ep/site/english.elpais.com/portada` | Working |
| Infobae English | NOT FOUND | - | RSS endpoints return 404 |

**Recommended additions to sources.ts:**
- El Pais English: `https://feeds.elpais.com/mrss-s/pages/ep/site/english.elpais.com/portada`

---

## Eastern Europe/Eurasia

| Source | Status | RSS Feed URL | Notes |
|--------|--------|--------------|-------|
| TASS English | BLOCKED | - | Returns 403 (Russian state media) |
| Meduza (independent Russian) | VERIFIED | `https://meduza.io/rss/en/all` | Excellent independent source |
| Ukrinform | VERIFIED | `https://www.ukrinform.net/rss/block-lastnews` | Ukrainian news agency |
| BNE IntelliNews | BLOCKED | - | Returns 403 |
| Balkan Insight | VERIFIED | `https://balkaninsight.com/feed/` | BIRN journalism |

**Recommended additions to sources.ts:**
- Meduza: `https://meduza.io/rss/en/all`
- Ukrinform: `https://www.ukrinform.net/rss/block-lastnews`
- Balkan Insight: `https://balkaninsight.com/feed/`

---

## Summary of Recommended New Sources

### High Priority (fills coverage gaps)

1. **Yonhap News** (Korea)
   - URL: `https://en.yna.co.kr/RSS/news.xml`
   - Region: Asia-Pacific
   - Type: Wire service

2. **Channel News Asia**
   - URL: `https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml`
   - Region: Asia-Pacific (Singapore-based)
   - Type: Broadcaster

3. **Dawn** (Pakistan)
   - URL: `https://www.dawn.com/feeds/home`
   - Region: South Asia
   - Type: Major newspaper

4. **Al-Monitor**
   - URL: `https://www.al-monitor.com/rss`
   - Region: Middle East
   - Type: Analysis/News

5. **Meduza**
   - URL: `https://meduza.io/rss/en/all`
   - Region: Russia (independent)
   - Type: Independent journalism

6. **Ukrinform**
   - URL: `https://www.ukrinform.net/rss/block-lastnews`
   - Region: Ukraine
   - Type: National news agency

7. **Balkan Insight**
   - URL: `https://balkaninsight.com/feed/`
   - Region: Balkans/Eastern Europe
   - Type: Investigative journalism

### Medium Priority

8. **El Pais English**
   - URL: `https://feeds.elpais.com/mrss-s/pages/ep/site/english.elpais.com/portada`
   - Region: Spain/Latin America
   - Type: Major newspaper

9. **Daily Maverick** (South Africa)
   - URL: `https://www.dailymaverick.co.za/dmrss/`
   - Region: Africa
   - Type: Independent journalism

10. **Times of Israel**
    - URL: `https://www.timesofisrael.com/feed/`
    - Region: Middle East
    - Type: News outlet

11. **Jerusalem Post**
    - URL: `https://www.jpost.com/Rss/RssFeedsHeadlines.aspx`
    - Region: Middle East
    - Type: Major newspaper

---

## Sources That Could Not Be Added

These sources either block automated access or do not offer RSS:

- **Kyodo News**: No working English RSS found
- **The Hindu**: Bot protection (403)
- **Al Arabiya**: Bot protection (403)
- **TRT World**: No RSS found
- **The National UAE**: No working RSS
- **Arab News**: Bot protection (403)
- **The East African**: Bot protection (403)
- **Punch Nigeria**: Cloudflare protected
- **The Citizen Tanzania**: No RSS
- **Mercopress**: Bot protection (403)
- **Infobae English**: No RSS found
- **TASS**: Bot protection (403)
- **BNE IntelliNews**: Bot protection (403)

---

## Notes

1. Many news sites now use Cloudflare or similar bot protection that blocks RSS readers. Consider using Bluesky handles for these sources if available.

2. For sources with multiple RSS categories, the "all news" or "latest news" feed was prioritized for geopolitical coverage.

3. Some feeds may require user-agent headers to work in production. The app's RSS fetcher already handles this for most sources.
