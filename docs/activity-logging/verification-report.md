# Activity Logging Verification Report

**Date**: 2026-01-30
**Status**: CRITICAL ISSUES FOUND - DO NOT DEPLOY YET

## Executive Summary

The verification team found **one critical issue** that would cause data loss in production:

| Issue | Severity | Impact |
|-------|----------|--------|
| Fire-and-forget doesn't persist on Vercel | **CRITICAL** | All activity logs silently lost |
| Race conditions in JSONB upsert | MEDIUM | Occasional data corruption |
| Two separate DB Pool instances | MEDIUM | Connection exhaustion risk |
| Pool config suboptimal | LOW | Performance impact |

---

## CRITICAL: Fire-and-Forget Logging on Vercel

### The Problem

Our current implementation:
```typescript
// src/lib/activityLogging.ts
export function logActivitySnapshot(...): void {
  // Don't await - fire and forget
  logActivityAsync(...).catch(err => {
    console.error('[ActivityLogging] Failed to log snapshot:', err.message);
  });
}
```

**On Vercel, serverless functions terminate immediately after sending the response.** The unawaited `logActivityAsync()` gets killed mid-execution. The database write never completes.

### Why This Happens

1. Route sends response → function marked as "done"
2. Vercel terminates function instance to save compute
3. Async logging operation gets killed
4. DB write never reaches Neon

### Evidence

- This is documented Vercel behavior for serverless functions
- Any unawaited promise after `NextResponse.json()` is at risk
- Our `.catch()` handler never even fires because the whole process dies

### Solutions

**Option A: Await the logging (simple, adds ~50ms latency)**
```typescript
// Make logging await-able and call it before responding
await logActivitySnapshot(region, items, sourceCount);
return NextResponse.json(...);
```

**Option B: Vercel Cron job (better, decoupled)**
- Create `/api/cron/log-activity` endpoint
- Run every 6 hours via Vercel Cron
- Fetch current activity and log it
- Zero impact on user-facing latency

**Option C: Background with waitUntil (if available)**
```typescript
// Vercel Edge Functions support this, Node runtime may not
export const runtime = 'edge';
// Use waitUntil to ensure completion
```

---

## MEDIUM: Race Conditions in JSONB Upsert

### The Problem

When multiple concurrent requests hit the same 6-hour bucket:

```sql
DO UPDATE SET
  post_count = GREATEST(post_activity_logs.post_count, EXCLUDED.post_count),
  region_breakdown = EXCLUDED.region_breakdown,  -- OVERWRITES, doesn't merge
  platform_breakdown = EXCLUDED.platform_breakdown  -- OVERWRITES, doesn't merge
```

The `post_count` uses `GREATEST()` correctly, but the JSONB fields are completely overwritten. Whichever request wins last erases the other's breakdown data.

### Impact

- Occasional data corruption in region/platform breakdowns
- Post counts remain accurate (GREATEST works)
- Only affects concurrent requests in same 6-hour window

### Solution

Either:
1. Don't store breakdowns (simplest - we can calculate them from the raw data)
2. Use JSONB merge operators: `region_breakdown = post_activity_logs.region_breakdown || EXCLUDED.region_breakdown`
3. Add application-level locking (mutex per bucket)

---

## MEDIUM: Two Separate DB Pool Instances

### The Problem

We're creating TWO separate `Pool` instances:

```typescript
// src/lib/db.ts - Editorial/Activity logging
pool = new Pool({ max: 5 });

// src/lib/auth.ts - Better Auth
database: new Pool({ max: 10 });  // Default
```

Total potential connections: 15 per Vercel instance.

### Impact

- Under traffic, could exhaust Neon connection limits
- Multiple cold starts = multiple instances = connection multiplication
- Neon free tier limit: ~25 connections

### Solution

Consolidate to single shared Pool instance, or reduce both pool sizes.

---

## LOW: Pool Configuration

### Current Config

```typescript
pool = new Pool({
  max: 5,
  idleTimeoutMillis: 30000,  // Too long for serverless
  connectionTimeoutMillis: 10000,
});
```

### Recommendations

```typescript
pool = new Pool({
  max: 3,  // Lower for serverless
  idleTimeoutMillis: 15000,  // Shorter for free tier
  connectionTimeoutMillis: 10000,  // OK
});
```

---

## Recommended Action Plan

### Immediate (Before deploying logging)

1. **CRITICAL**: Change from fire-and-forget to awaited logging OR implement Vercel Cron approach
2. **MEDIUM**: Simplify schema - remove JSONB breakdowns to avoid race conditions

### Short-term

3. Consolidate Pool instances or verify both use same pooler endpoint
4. Adjust pool configuration for serverless

### Verification Before Deploy

- [ ] Test logging actually persists (check Neon dashboard)
- [ ] Load test with concurrent requests
- [ ] Monitor connection pool usage

---

## Decision Needed

**Which approach for fixing fire-and-forget?**

| Option | Latency Impact | Complexity | Reliability |
|--------|---------------|------------|-------------|
| A: Await logging | +50ms per request | Low | High |
| B: Vercel Cron | None | Medium | High |
| C: Edge waitUntil | None | Medium | Medium |

**Recommendation**: Option B (Vercel Cron) is cleanest for production. Option A is fastest to implement for MVP testing.
