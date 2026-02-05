# Source Guidelines

Strategy, metrics, and evaluation criteria for Sentinel's OSINT sources.

## Audience

**US-centric users** tracking global geopolitical situational awareness. Critical alerts should reflect events that matter to this audience - not just high local volume in foreign regions.

---

## Activity Level Thresholds

How we determine regional alert status (Critical/Elevated/Normal).

### Current Formula

```
multiplier = posts_last_hour / baseline
```

| Level | Threshold | Meaning |
|-------|-----------|---------|
| Critical | >= 4x baseline | Major crisis - everyone covering it (Israel/Iran, NK tests, large protests) |
| Elevated | >= 2x baseline | Notable activity worth watching |
| Normal | < 2x baseline | Typical news day |

### Regional Baselines (posts/hour)

| Region | Baseline | Rationale |
|--------|----------|-----------|
| US | 10 | High domestic coverage |
| Latin America | 6 | Moderate coverage, spikes for Venezuela/Mexico |
| Middle East | 15 | Always active, Israel/Gaza baseline high |
| Europe-Russia | 18 | Ukraine war keeps volume elevated |
| Asia | 10 | Large region, variable activity |

### History

- **2025-01-19**: Raised baselines and thresholds significantly. Previous values (baselines 2-10, critical at 2.5x) were too sensitive - routine days triggered Critical.

---

## Source Evaluation Criteria

Three dimensions for rating sources:

### 1. Quality (Credibility)
- Is it a legitimate news org, verified reporter, or known OSINT account?
- Track record of accuracy?
- Potential bias (understood and acceptable)?

### 2. Regional Coverage
- Do we have a gap in this region?
- Is this source filling a need or duplicating others?
- Is it region-specific or a worldwide aggregator?

### 3. Signal-to-Noise Ratio
- Posts/day volume
- % of posts that are breaking/significant vs routine churn
- Would benefit from keyword filtering?

### Rating Scale (1-5)

| Rating | Meaning |
|--------|---------|
| 5 | High value - exactly what we need |
| 4 | Good source, minor issues |
| 3 | Decent, some relevance or fills a gap |
| 2 | Low value, mostly noise |
| 1 | Remove - not useful |

### A/B Test Format

When evaluating sources, include context:
```
Source: [Name]
Posts/day: [N]
Region: [region]
Current confidence: [N]

[5 sample headlines with topics]

Rate considering: quality, coverage need, signal-to-noise
```

---

## Source Configuration

### Source Types

| Type | Description | Examples |
|------|-------------|----------|
| `official` | Government, military, institutional | State Dept, IDF, embassies |
| `osint` | Open source intelligence accounts | OSINTdefender, Aurora Intel |
| `reporter` | Verified journalists | NYT reporters, war correspondents |
| `news-org` | News organizations | Reuters, BBC, Al Jazeera |
| `ground` | On-the-ground sources | Local reporters in conflict zones |

### Fetch Tiers

| Tier | Frequency | Use Case |
|------|-----------|----------|
| T1 | Every fetch cycle | High-value, breaking news sources |
| T2 | Less frequent | Good sources, lower priority |
| T3 | Occasional | Background/supplementary |

### Confidence Score

0-100 scale affecting ranking priority:
- 90+: Tier 1 news orgs, official sources
- 70-89: Quality reporters, regional outlets
- 50-69: Useful but verify, niche sources
- <50: Low confidence, consider removal

### Region Assignment

| Value | Meaning |
|-------|---------|
| `'all'` | Worldwide aggregator - uses content detection |
| `'us'`, `'latam'`, etc. | Region-specific - all posts tagged to this region |

**Important**: Only use specific regions for sources that ONLY cover that region. Worldwide outlets (AP, Reuters, BBC) should be `'all'` to enable content-based detection.

---

## Feed Tiers: Main vs All

Two-tier feed system to balance completeness with signal quality.

### All Feed
Everything from credible sources. Comprehensive but noisy.

### Main Feed
Curated high-impact stories only. Must meet qualification threshold.

### Main Feed Qualification Formula

```
mainFeedScore = baseValue + keywordModifier + regionModifier

Qualifies for Main Feed if:
- baseValue >= 4 (always qualifies), OR
- mainFeedScore >= 5 (conditionally qualifies)
```

### Base Value (per source)

Assigned during source evaluation:

| Base Value | Meaning | Example Sources |
|------------|---------|-----------------|
| 5 | Always Main Feed | Reuters, AP, top OSINT accounts |
| 4 | Usually Main Feed | Major regional outlets, verified war correspondents |
| 3 | Sometimes Main Feed | Quality regionals, needs boost from modifiers |
| 2 | Rarely Main Feed | Credible but local/niche (Japan Times, Bangkok Post) |
| 1 | Almost never Main Feed | Low priority, kept for completeness |

### Keyword Modifier (+1 to +3)

Applied when headline contains high-impact terms:

| Modifier | Keywords |
|----------|----------|
| +3 | breaking, attack, invasion, war, missile, nuclear, coup |
| +2 | strike, explosion, protest, emergency, casualties, troops |
| +1 | military, sanctions, tensions, ceasefire, diplomatic |

### Region Activity Modifier (+1 to +2)

Applied when article's region has elevated activity:

| Region Status | Modifier |
|---------------|----------|
| Critical | +2 |
| Elevated | +1 |
| Normal | +0 |

### Example: Japan Times

**Scenario 1: Routine article, normal day**
- Base: 2 (credible but local)
- Headline: "Tokyo Governor announces new transit plan"
- Keywords: none (+0)
- Asia status: Normal (+0)
- **Score: 2** → All Feed only

**Scenario 2: Significant article, normal day**
- Base: 2
- Headline: "North Korea fires missile toward Sea of Japan"
- Keywords: "missile" (+3)
- Asia status: Normal (+0)
- **Score: 5** → Main Feed

**Scenario 3: Routine article, active region**
- Base: 2
- Headline: "Japan defense ministry monitoring situation"
- Keywords: "military" (+1)
- Asia status: Critical (+2)
- **Score: 5** → Main Feed (corroborated by regional activity)

### Benefits

1. Keep credible-but-noisy sources without polluting Main Feed
2. Surface regional sources when their region matters
3. Use activity from other sources as corroborating signal
4. Maintain comprehensive All Feed for deep dives

---

## Blocklist

Sources evaluated and rejected. See `src/lib/blocklist.ts`.

| Source | Reason | Date |
|--------|--------|------|
| Kathmandu Post | Low value, worldwide aggregator miscategorized as Asia, pollutes feeds | 2025-01-19 |

---

## Evaluation History

### 2025-01-19 A/B Testing Session

**Bangkok Post** (Asia, 20 posts/day)
- Human: 3-4, Claude: 2
- Notes: Legitimate regional source, but mostly local Thai news. Value depends on Asia coverage gap. Low relevance for US-centric audience unless Thailand has major event.

**Jerusalem Post** (Middle East)
- Human: 3, Claude: 4
- Notes: High quality for ME coverage, direct US policy relevance. But high volume of routine content - would benefit from breaking/urgent filter.

**NYT World** (all, 40 posts/day)
- Human: 3, Claude: 4-5
- Notes: Quality global coverage, US-relevant framing. Volume concern - 40 posts/day means lots of routine mixed with breaking. Hard to rate without frequency context.

**Key Learnings**:
1. Can't rate sources without knowing posts/day frequency
2. Signal-to-noise ratio matters as much as raw quality
3. Value is relative to coverage gaps
4. High-volume quality sources need filtering to be useful

---

## Future Improvements

### High Priority
- [ ] **Implement Main Feed scoring** - Add baseValue to source config, implement keyword/region modifiers
- [ ] **Add baseValue field to sources** - Audit and assign 1-5 base values to all sources

### Medium Priority
- [ ] Audit sources for correct region tagging (worldwide vs specific)
- [ ] Content-based severity weighting (not just volume) for Critical status
- [ ] Source coverage gap analysis by region

### Low Priority / Nice to Have
- [ ] Automated signal-to-noise scoring based on headline analysis
- [ ] ML-based keyword extraction for impact scoring
- [ ] A/B testing framework for threshold tuning
