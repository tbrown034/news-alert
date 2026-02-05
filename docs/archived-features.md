# Archived Features

Features that were built but not fully integrated into production. These are preserved for future use.

---

## 1. Advanced Region Detection (`src/lib/regionDetection.ts`)

### What Was Built
A weighted scoring system with three confidence tiers:

```typescript
// High confidence (3 points) - Very specific to region
'ukraine', 'zelensky', 'kremlin', 'kyiv'

// Medium confidence (2 points) - Usually this region
'moscow', 'nato', 'eastern front'

// Low confidence (1 point) - Suggests but not definitive
'sanctions', 'artillery', 'drone strike'
```

**Scoring algorithm:**
- Accumulates points from matched patterns
- Requires score >= 3 OR high-confidence match
- Returns region with highest score

### What's Actually Used
Simple first-match keyword system in `src/lib/sourceUtils.ts`:
```typescript
// First matching region wins, no scoring
if (text.includes('ukraine')) return 'europe-russia';
if (text.includes('iran')) return 'middle-east';
```

### Why Advanced Version Not Used
- Simple version is fast and "good enough" for 90% of cases
- Scoring adds complexity without clear benefit
- Fallback to source's default region handles edge cases

### Future Integration Ideas
1. **Ambiguous content handling** - When multiple regions score high
2. **Cross-regional events** - US-China, NATO-Russia coverage
3. **Confidence display** - "Likely Middle East (high confidence)"

---

## 2. Per-Source Anomaly Detection

### What Was Built (Interfaces Only)
Types defined in `src/types/index.ts`:

```typescript
interface SourceActivityProfile {
  sourceId: string;
  baselinePostsPerDay: number;  // Historical average
  recentPosts: number;          // Posts in tracking window
  recentWindowHours: number;
  anomalyRatio: number;         // recent_rate / baseline_rate
  isAnomalous: boolean;         // true if significantly above baseline
}
```

### What's Actually Implemented
Regional activity only (posts/hour per region vs baseline).

No per-source tracking exists - the interface is there but never populated.

### Future Implementation
```typescript
// Potential algorithm:
1. Track each source's posts in last 4 hours
2. Compare to source.postsPerDay / 6 (expected per 4 hours)
3. If ratio > 3.0, mark as anomalous
4. Flag in UI: "Source X is posting 5x more than normal"
```

### Use Cases
- Breaking event detection - Multiple sources spiking
- Source reliability - Consistent vs. erratic posting
- Bot detection - Unnatural posting patterns

---

## 3. Keywords for Priority/Filtering

### What Exists
Three keyword sets defined:
1. `regionKeywords` - Used for region classification
2. `breakingKeywords` - Defined but `isBreakingNews()` rarely called
3. Alert keywords in `alertStatus.ts` - Used for "first"/"confirmed" status

### What's NOT Implemented
- **Priority weighting** - Breaking keywords don't affect sort order
- **Feed filtering** - No "breaking only" toggle
- **Notifications** - No push on breaking+keyword match

### Future Ideas
```typescript
// Weighted priority score
const priority =
  (contentType === 'breaking' ? 100 : 0) +
  (verification === 'confirmed' ? 50 : 0) +
  (sourceType === 'official' ? 30 : 0) +
  (alertKeywords.some(k => text.includes(k)) ? 20 : 0);

// Sort feed by priority instead of just timestamp
items.sort((a, b) => b.priority - a.priority);
```

---

## Summary: What's Simple vs. What's Ready

| Feature | Current (Simple) | Advanced (Built, Unused) |
|---------|------------------|--------------------------|
| Region detection | First-match keywords | Weighted scoring |
| Activity | Regional only | Per-source planned |
| Priority | Timestamp only | Multi-factor ready |

---

## Recommended Next Steps

If you want to activate these features:

1. **Add UI toggles** - "Breaking first", keyword filters
2. **A/B test** - Compare simple vs. advanced accuracy
3. **Performance test** - Measure latency impact at scale

---

*Last updated: 2026-02-04*
