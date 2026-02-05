# Source Blocklist

Accounts and sources we've evaluated and **rejected**. Don't re-add these.

---

## How to Use This Doc

When you evaluate a source and decide NOT to add it:
1. Add it here with the reason
2. This prevents us from re-evaluating the same sources in loops

---

## Blocked Sources

### RSS Feeds

| Source | ID | Reason | Date |
|--------|-----|--------|------|
| Kathmandu Post | `kathmandu-post-rss` | Low value/credibility, worldwide aggregator miscategorized as Asia-specific, pollutes feeds | 2025-01-19 |
| Dark Reading | `dark-reading-rss` | Cybersecurity only, no geopolitical relevance | 2026-01-20 |
| Marginal Revolution | `marginal-revolution-rss` | Economics blog, off-topic | 2026-01-20 |
| Bleeping Computer | `bleeping-computer-rss` | Tech news only, no geopolitical relevance | 2026-01-20 |

### Bluesky Accounts

| Account | Handle | Reason | Date |
|---------|--------|--------|------|
| *None yet* | | | |

### Telegram Channels

| Channel | Handle | Reason | Date |
|---------|--------|--------|------|
| Intel Slava Z | `@inloSlava` | Pro-Russian propaganda, 50% confidence, use for speed only | 2026-01-20 |

---

## Evaluation Criteria (Quick Reference)

**Reject if:**
- Confidence < 60 (unreliable)
- Off-topic (pure tech, economics, local news)
- Worldwide aggregator miscategorized as regional
- Inactive (no posts in 30+ days)
- Duplicate of existing source
- Heavy bias without analytical value

**Keep in All Feed but not Main Feed if:**
- Confidence 60-75
- High volume, low signal-to-noise
- Regional but not US-relevant

---

## See Also

- `src/lib/blocklist.ts` - Code implementation
- `docs/SOURCE_GUIDELINES.md` - Evaluation criteria
