/**
 * Historical Activity Log Analysis
 * =================================
 * Analyzes post_activity_logs to understand what "normal" looks like empirically.
 *
 * Reports:
 * 1. Per-region averages by time slot (avg, stddev, min, max, median)
 * 2. Day-of-week patterns (weekday vs weekend)
 * 3. Trend over time (week-over-week growth)
 * 4. Empirical threshold recommendations
 * 5. Platform breakdown from logs
 *
 * Usage: npx tsx scripts/_analyze-history.ts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { query } from '../src/lib/db';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LogRow {
  id: number;
  bucket_timestamp: string;
  region: string;
  post_count: number;
  source_count: number;
  region_breakdown: Record<string, number> | null;
  platform_breakdown: Record<string, number> | null;
  fetch_duration_ms: number | null;
  recorded_at: string;
}

interface SlotStats {
  region: string;
  slot: number;
  slotLabel: string;
  avg: number;
  stddev: number;
  min: number;
  max: number;
  median: number;
  count: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - avg) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function slotLabel(slot: number): string {
  const labels: Record<number, string> = {
    0: '00-06 UTC',
    1: '06-12 UTC',
    2: '12-18 UTC',
    3: '18-24 UTC',
  };
  return labels[slot] || `slot-${slot}`;
}

function dayOfWeek(dateStr: string): number {
  return new Date(dateStr).getUTCDay(); // 0=Sun, 6=Sat
}

function isWeekend(dateStr: string): boolean {
  const day = dayOfWeek(dateStr);
  return day === 0 || day === 6;
}

function weekNumber(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const daysSinceStart = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((daysSinceStart + startOfYear.getUTCDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function pad(s: string | number, len: number): string {
  return String(s).padStart(len);
}

function rpad(s: string | number, len: number): string {
  return String(s).padEnd(len);
}

// ─── Main Analysis ─────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(80));
  console.log('  HISTORICAL POST ACTIVITY ANALYSIS');
  console.log('='.repeat(80));

  // Fetch all data
  const rows = await query<LogRow>(
    `SELECT * FROM post_activity_logs ORDER BY bucket_timestamp ASC, region`
  );

  if (rows.length === 0) {
    console.log('\nNo data found in post_activity_logs. Exiting.');
    process.exit(0);
  }

  const minDate = rows[0].bucket_timestamp;
  const maxDate = rows[rows.length - 1].bucket_timestamp;
  const regions = [...new Set(rows.map(r => r.region))].sort();

  console.log(`\nData range: ${new Date(minDate).toISOString().slice(0, 10)} → ${new Date(maxDate).toISOString().slice(0, 10)}`);
  console.log(`Total rows: ${rows.length}`);
  console.log(`Regions: ${regions.join(', ')}`);
  console.log(`Rows per region: ~${Math.round(rows.length / regions.length)}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PER-REGION AVERAGES BY TIME SLOT
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  1. PER-REGION AVERAGES BY TIME SLOT (6h buckets)');
  console.log('='.repeat(80));

  // Group data: region → slot → counts[]
  const regionSlotData: Record<string, Record<number, number[]>> = {};
  for (const row of rows) {
    const bucket = new Date(row.bucket_timestamp);
    const slot = Math.floor(bucket.getUTCHours() / 6);
    if (!regionSlotData[row.region]) regionSlotData[row.region] = {};
    if (!regionSlotData[row.region][slot]) regionSlotData[row.region][slot] = [];
    regionSlotData[row.region][slot].push(row.post_count);
  }

  const allSlotStats: SlotStats[] = [];

  for (const region of regions) {
    console.log(`\n  Region: ${region}`);
    console.log(`  ${'Slot'.padEnd(14)} ${'Avg'.padStart(8)} ${'StdDev'.padStart(8)} ${'Min'.padStart(6)} ${'Max'.padStart(6)} ${'Median'.padStart(8)} ${'N'.padStart(5)}`);
    console.log('  ' + '-'.repeat(57));

    for (let s = 0; s < 4; s++) {
      const counts = regionSlotData[region]?.[s] || [];
      const stats: SlotStats = {
        region,
        slot: s,
        slotLabel: slotLabel(s),
        avg: Math.round(avg(counts) * 10) / 10,
        stddev: Math.round(stddev(counts) * 10) / 10,
        min: counts.length > 0 ? Math.min(...counts) : 0,
        max: counts.length > 0 ? Math.max(...counts) : 0,
        median: Math.round(median(counts) * 10) / 10,
        count: counts.length,
      };
      allSlotStats.push(stats);
      console.log(`  ${rpad(stats.slotLabel, 14)} ${pad(stats.avg, 8)} ${pad(stats.stddev, 8)} ${pad(stats.min, 6)} ${pad(stats.max, 6)} ${pad(stats.median, 8)} ${pad(stats.count, 5)}`);
    }

    // Overall region avg
    const allCounts = [0, 1, 2, 3].flatMap(s => regionSlotData[region]?.[s] || []);
    console.log('  ' + '-'.repeat(57));
    console.log(`  ${'ALL SLOTS'.padEnd(14)} ${pad(Math.round(avg(allCounts) * 10) / 10, 8)} ${pad(Math.round(stddev(allCounts) * 10) / 10, 8)} ${pad(allCounts.length > 0 ? Math.min(...allCounts) : 0, 6)} ${pad(allCounts.length > 0 ? Math.max(...allCounts) : 0, 6)} ${pad(Math.round(median(allCounts) * 10) / 10, 8)} ${pad(allCounts.length, 5)}`);
  }

  // Ratio analysis: does time-of-day matter?
  console.log('\n  TIME-OF-DAY RATIO ANALYSIS (slot avg / overall region avg):');
  console.log(`  ${'Region'.padEnd(16)} ${'00-06'.padStart(8)} ${'06-12'.padStart(8)} ${'12-18'.padStart(8)} ${'18-24'.padStart(8)}  | ${'Current'.padStart(8)}`);
  console.log('  ' + '-'.repeat(72));

  const CURRENT_MULTIPLIERS = [0.4, 0.8, 1.5, 1.3];

  for (const region of regions) {
    const allCounts = [0, 1, 2, 3].flatMap(s => regionSlotData[region]?.[s] || []);
    const overallAvg = avg(allCounts);
    const ratios: number[] = [];
    let line = `  ${rpad(region, 16)}`;
    for (let s = 0; s < 4; s++) {
      const counts = regionSlotData[region]?.[s] || [];
      const slotAvg = avg(counts);
      const ratio = overallAvg > 0 ? Math.round((slotAvg / overallAvg) * 100) / 100 : 0;
      ratios.push(ratio);
      line += ` ${pad(ratio.toFixed(2), 8)}`;
    }
    line += `  | ${CURRENT_MULTIPLIERS.map(m => m.toFixed(1)).join('/')}`;
    console.log(line);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. DAY-OF-WEEK PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  2. DAY-OF-WEEK PATTERNS');
  console.log('='.repeat(80));

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const region of regions) {
    const regionRows = rows.filter(r => r.region === region);
    const weekdayCounts = regionRows.filter(r => !isWeekend(r.bucket_timestamp)).map(r => r.post_count);
    const weekendCounts = regionRows.filter(r => isWeekend(r.bucket_timestamp)).map(r => r.post_count);

    // Per-day averages
    const dayAvgs: number[] = [];
    for (let d = 0; d < 7; d++) {
      const dayCounts = regionRows
        .filter(r => dayOfWeek(r.bucket_timestamp) === d)
        .map(r => r.post_count);
      dayAvgs.push(Math.round(avg(dayCounts) * 10) / 10);
    }

    const weekdayAvg = Math.round(avg(weekdayCounts) * 10) / 10;
    const weekendAvg = Math.round(avg(weekendCounts) * 10) / 10;
    const ratio = weekdayAvg > 0 ? Math.round((weekendAvg / weekdayAvg) * 100) / 100 : 0;

    console.log(`\n  ${region}:`);
    console.log(`    Weekday avg: ${weekdayAvg} (N=${weekdayCounts.length})  Weekend avg: ${weekendAvg} (N=${weekendCounts.length})  Ratio: ${ratio}x`);
    console.log(`    Per day: ${dayNames.map((d, i) => `${d}=${dayAvgs[i]}`).join('  ')}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TREND OVER TIME
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  3. WEEK-OVER-WEEK TRENDS');
  console.log('='.repeat(80));

  // Group by week for "all" region (or sum across regions)
  const weeklyTotals: Record<string, Record<string, number[]>> = {}; // week → region → counts
  for (const row of rows) {
    const week = weekNumber(row.bucket_timestamp);
    if (!weeklyTotals[week]) weeklyTotals[week] = {};
    if (!weeklyTotals[week][row.region]) weeklyTotals[week][row.region] = [];
    weeklyTotals[week][row.region].push(row.post_count);
  }

  const weeks = Object.keys(weeklyTotals).sort();
  console.log(`\n  ${'Week'.padEnd(10)} ${regions.map(r => pad(r.slice(0, 10), 12)).join('')}`);
  console.log('  ' + '-'.repeat(10 + regions.length * 12));

  for (const week of weeks) {
    let line = `  ${rpad(week, 10)}`;
    for (const region of regions) {
      const counts = weeklyTotals[week][region] || [];
      const weekAvg = Math.round(avg(counts) * 10) / 10;
      line += pad(weekAvg || '-', 12);
    }
    console.log(line);
  }

  // Week-over-week change for key regions
  console.log('\n  Week-over-week change (%) for scored regions:');
  for (const region of regions.filter(r => !['latam', 'asia', 'africa', 'seismic'].includes(r))) {
    let line = `  ${rpad(region, 16)} `;
    for (let i = 1; i < weeks.length; i++) {
      const prevCounts = weeklyTotals[weeks[i - 1]][region] || [];
      const currCounts = weeklyTotals[weeks[i]][region] || [];
      const prevAvg = avg(prevCounts);
      const currAvg = avg(currCounts);
      if (prevAvg > 0) {
        const change = Math.round(((currAvg - prevAvg) / prevAvg) * 100);
        line += `${change > 0 ? '+' : ''}${change}% `;
      } else {
        line += '  N/A ';
      }
    }
    console.log(line);
  }

  // Daily totals across all regions
  const dailyTotals: Record<string, number> = {};
  for (const row of rows) {
    if (row.region === 'all') {
      const day = new Date(row.bucket_timestamp).toISOString().slice(0, 10);
      dailyTotals[day] = (dailyTotals[day] || 0) + row.post_count;
    }
  }

  const days = Object.keys(dailyTotals).sort();
  if (days.length > 0) {
    console.log('\n  Daily totals (region=all, summed across 4 slots):');
    for (const day of days) {
      const bar = '#'.repeat(Math.min(Math.round(dailyTotals[day] / 10), 60));
      console.log(`  ${day}  ${pad(dailyTotals[day], 5)}  ${bar}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EMPIRICAL THRESHOLD RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  4. EMPIRICAL THRESHOLD RECOMMENDATIONS');
  console.log('='.repeat(80));

  console.log('\n  If we use DB-derived baselines (per region, per slot):');
  console.log(`  ${'Region'.padEnd(16)} ${'Slot'.padEnd(14)} ${'Avg'.padStart(6)} ${'SD'.padStart(6)} ${'ELEVATED'.padStart(12)} ${'CRITICAL'.padStart(12)} ${'Cur.Base'.padStart(10)}`);
  console.log('  ' + '-'.repeat(68));

  // Load current baselines for comparison
  // We'll compute them inline from CLAUDE.md knowledge:
  // activityDetection calculates REGION_BASELINES_6H at module load

  for (const region of regions.filter(r => !['seismic'].includes(r))) {
    for (let s = 0; s < 4; s++) {
      const counts = regionSlotData[region]?.[s] || [];
      if (counts.length === 0) continue;

      const a = Math.round(avg(counts) * 10) / 10;
      const sd = Math.round(stddev(counts) * 10) / 10;
      const elevated = Math.round((a + 2 * sd) * 10) / 10;
      const critical = Math.round((a + 3 * sd) * 10) / 10;

      console.log(
        `  ${rpad(region, 16)} ${rpad(slotLabel(s), 14)} ${pad(a, 6)} ${pad(sd, 6)} ${pad(`>${elevated}`, 12)} ${pad(`>${critical}`, 12)}`
      );
    }
  }

  // Compare overall approach: fixed multiplier vs DB-derived
  console.log('\n  COMPARISON: Fixed multiplier (current) vs DB-derived thresholds');
  console.log(`  ${'Region'.padEnd(16)} ${'DB Avg'.padStart(8)} ${'DB +2SD'.padStart(8)} ${'DB +3SD'.padStart(8)} | ${'Note'.padEnd(30)}`);
  console.log('  ' + '-'.repeat(72));

  for (const region of regions.filter(r => !['seismic'].includes(r))) {
    const allCounts = [0, 1, 2, 3].flatMap(s => regionSlotData[region]?.[s] || []);
    if (allCounts.length === 0) continue;

    const a = Math.round(avg(allCounts) * 10) / 10;
    const sd = Math.round(stddev(allCounts) * 10) / 10;
    const plus2sd = Math.round((a + 2 * sd) * 10) / 10;
    const plus3sd = Math.round((a + 3 * sd) * 10) / 10;

    const cv = a > 0 ? Math.round((sd / a) * 100) : 0;
    const note = cv > 50 ? 'HIGH VARIANCE — noisy' : cv > 30 ? 'Moderate variance' : 'Stable';

    console.log(
      `  ${rpad(region, 16)} ${pad(a, 8)} ${pad(plus2sd, 8)} ${pad(plus3sd, 8)} | CV=${cv}% ${note}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. PLATFORM BREAKDOWN
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  5. PLATFORM BREAKDOWN FROM LOGS');
  console.log('='.repeat(80));

  // Aggregate platform_breakdown across all rows
  const platformTotals: Record<string, Record<string, number>> = {}; // region → platform → total
  let rowsWithPlatformData = 0;
  let rowsWithoutPlatformData = 0;

  for (const row of rows) {
    if (row.platform_breakdown && Object.keys(row.platform_breakdown).length > 0) {
      rowsWithPlatformData++;
      if (!platformTotals[row.region]) platformTotals[row.region] = {};
      for (const [platform, count] of Object.entries(row.platform_breakdown)) {
        platformTotals[row.region][platform] = (platformTotals[row.region][platform] || 0) + (count as number);
      }
    } else {
      rowsWithoutPlatformData++;
    }
  }

  console.log(`\n  Rows with platform data: ${rowsWithPlatformData} / ${rows.length} (${Math.round(rowsWithPlatformData / rows.length * 100)}%)`);

  if (rowsWithPlatformData > 0) {
    // Collect all platforms
    const allPlatforms = new Set<string>();
    for (const region of Object.keys(platformTotals)) {
      for (const platform of Object.keys(platformTotals[region])) {
        allPlatforms.add(platform);
      }
    }
    const platforms = [...allPlatforms].sort();

    console.log(`\n  ${'Region'.padEnd(16)} ${platforms.map(p => pad(p.slice(0, 10), 12)).join('')} ${'Total'.padStart(10)}`);
    console.log('  ' + '-'.repeat(16 + platforms.length * 12 + 10));

    for (const region of regions) {
      if (!platformTotals[region]) continue;
      const total = Object.values(platformTotals[region]).reduce((s, v) => s + v, 0);
      let line = `  ${rpad(region, 16)}`;
      for (const platform of platforms) {
        const count = platformTotals[region][platform] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        line += pad(`${count} (${pct}%)`, 12);
      }
      line += pad(total, 10);
      console.log(line);
    }

    // Average per bucket
    const bucketCount = Math.max(1, rowsWithPlatformData / regions.length);
    console.log(`\n  Average per 6h bucket (approx ${Math.round(bucketCount)} buckets per region):`);
    for (const region of regions) {
      if (!platformTotals[region]) continue;
      const regionBuckets = rows.filter(r => r.region === region && r.platform_breakdown && Object.keys(r.platform_breakdown).length > 0).length;
      let line = `  ${rpad(region, 16)}`;
      for (const platform of platforms) {
        const count = platformTotals[region][platform] || 0;
        const avgPerBucket = regionBuckets > 0 ? Math.round((count / regionBuckets) * 10) / 10 : 0;
        line += pad(avgPerBucket, 12);
      }
      console.log(line);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. RAW SLOT MULTIPLIER COMPARISON (current code vs reality)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  6. EMPIRICAL SLOT MULTIPLIERS vs CURRENT CODE');
  console.log('='.repeat(80));
  console.log('\n  Current code multipliers: 0.4 / 0.8 / 1.5 / 1.3 (sum=4.0)');
  console.log('  Empirical multipliers (slot avg / overall avg, normalized to sum=4.0):');

  console.log(`\n  ${'Region'.padEnd(16)} ${'00-06'.padStart(8)} ${'06-12'.padStart(8)} ${'12-18'.padStart(8)} ${'18-24'.padStart(8)} ${'Sum'.padStart(6)} ${'Match?'.padStart(8)}`);
  console.log('  ' + '-'.repeat(60));

  for (const region of regions) {
    const allCounts = [0, 1, 2, 3].flatMap(s => regionSlotData[region]?.[s] || []);
    const overallAvg = avg(allCounts);
    if (overallAvg === 0) continue;

    const rawRatios = [0, 1, 2, 3].map(s => {
      const counts = regionSlotData[region]?.[s] || [];
      return avg(counts) / overallAvg;
    });

    // Normalize to sum=4.0
    const rawSum = rawRatios.reduce((s, v) => s + v, 0);
    const normalized = rawRatios.map(r => Math.round((r / rawSum * 4) * 100) / 100);
    const nSum = normalized.reduce((s, v) => s + v, 0);

    // Check if close to current
    const diffs = normalized.map((n, i) => Math.abs(n - CURRENT_MULTIPLIERS[i]));
    const maxDiff = Math.max(...diffs);
    const match = maxDiff < 0.2 ? 'CLOSE' : maxDiff < 0.5 ? 'DRIFT' : 'MISMATCH';

    console.log(`  ${rpad(region, 16)} ${normalized.map(n => pad(n.toFixed(2), 8)).join('')} ${pad(nSum.toFixed(2), 6)} ${pad(match, 8)}`);
  }

  console.log(`\n  ${'CODE'.padEnd(16)} ${CURRENT_MULTIPLIERS.map(m => pad(m.toFixed(2), 8)).join('')} ${pad('4.00', 6)}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. COEFFICIENT OF VARIATION BY REGION (data quality indicator)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  7. DATA QUALITY — COEFFICIENT OF VARIATION BY REGION');
  console.log('='.repeat(80));
  console.log('  (Lower CV = more stable/predictable baseline)');

  console.log(`\n  ${'Region'.padEnd(16)} ${'Avg'.padStart(8)} ${'SD'.padStart(8)} ${'CV%'.padStart(6)} ${'Stability'.padStart(12)} ${'N'.padStart(5)}`);
  console.log('  ' + '-'.repeat(57));

  for (const region of regions) {
    const allCounts = [0, 1, 2, 3].flatMap(s => regionSlotData[region]?.[s] || []);
    if (allCounts.length === 0) continue;

    const a = Math.round(avg(allCounts) * 10) / 10;
    const sd2 = Math.round(stddev(allCounts) * 10) / 10;
    const cv = a > 0 ? Math.round((sd2 / a) * 100) : 0;
    const stability = cv > 50 ? 'NOISY' : cv > 30 ? 'MODERATE' : 'STABLE';

    console.log(`  ${rpad(region, 16)} ${pad(a, 8)} ${pad(sd2, 8)} ${pad(cv, 6)} ${pad(stability, 12)} ${pad(allCounts.length, 5)}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('  ANALYSIS COMPLETE');
  console.log('='.repeat(80));

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
