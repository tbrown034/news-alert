import { tier1Sources, tier2Sources, tier3Sources } from '../src/lib/sources-clean';

const allSources = [...tier1Sources, ...tier2Sources, ...tier3Sources];

// Find outliers (high posters)
const sorted = [...allSources].sort((a, b) => b.postsPerDay - a.postsPerDay);

console.log('\n=== TOP 20 HIGHEST postsPerDay (potential outliers) ===\n');
for (const source of sorted.slice(0, 20)) {
  console.log(`  ${source.postsPerDay.toString().padStart(5)} posts/day | ${source.name.padEnd(35)} | ${source.region}`);
}

// Analyze value patterns (round vs decimal = guessed vs measured)
const roundNumbers = allSources.filter(s => s.postsPerDay === Math.floor(s.postsPerDay));
const decimalNumbers = allSources.filter(s => s.postsPerDay !== Math.floor(s.postsPerDay));

console.log('\n=== VALUE PATTERN ANALYSIS ===\n');
console.log(`  Round numbers (likely guessed): ${roundNumbers.length} sources`);
console.log(`  Decimal numbers (likely measured): ${decimalNumbers.length} sources`);

// Sum contributions
const roundSum = roundNumbers.reduce((sum, s) => sum + s.postsPerDay, 0);
const decimalSum = decimalNumbers.reduce((sum, s) => sum + s.postsPerDay, 0);

console.log(`\n  Round numbers contribute: ${Math.round(roundSum)} posts/day (${Math.round(roundSum/4)} per 6h)`);
console.log(`  Decimal numbers contribute: ${Math.round(decimalSum)} posts/day (${Math.round(decimalSum/4)} per 6h)`);

// Check for specific "nice" numbers that suggest guessing
const niceNumbers = [100, 50, 40, 30, 25, 20, 15, 10, 8, 5, 3, 2, 1];
console.log('\n=== DISTRIBUTION OF "NICE" NUMBERS (likely guessed) ===\n');
for (const n of niceNumbers) {
  const count = allSources.filter(s => s.postsPerDay === n).length;
  if (count > 0) {
    console.log(`  ${n.toString().padStart(3)} posts/day: ${count} sources (= ${count * n} posts/day total)`);
  }
}

// By tier
console.log('\n=== BY TIER ===\n');
const t1Sum = tier1Sources.reduce((sum, s) => sum + s.postsPerDay, 0);
const t2Sum = tier2Sources.reduce((sum, s) => sum + s.postsPerDay, 0);
const t3Sum = tier3Sources.reduce((sum, s) => sum + s.postsPerDay, 0);

console.log(`  T1 (${tier1Sources.length} sources): ${Math.round(t1Sum)} posts/day → ${Math.round(t1Sum/4)} per 6h`);
console.log(`  T2 (${tier2Sources.length} sources): ${Math.round(t2Sum)} posts/day → ${Math.round(t2Sum/4)} per 6h`);
console.log(`  T3 (${tier3Sources.length} sources): ${Math.round(t3Sum)} posts/day → ${Math.round(t3Sum/4)} per 6h`);

// 100 posts/day sources - these are HUGE outliers
console.log('\n=== SOURCES CLAIMING 100 posts/day (likely inflated) ===\n');
for (const source of allSources.filter(s => s.postsPerDay >= 100)) {
  console.log(`  ${source.name} (${source.platform}) - ${source.region}`);
}

console.log('\n=== TOTAL ===');
const total = allSources.reduce((sum, s) => sum + s.postsPerDay, 0);
console.log(`  ${allSources.length} sources → ${Math.round(total)} posts/day → ${Math.round(total/4)} per 6h`);
console.log(`  If seeing ~844 posts/6h, effective rate is ${844*4} posts/day`);
console.log(`  Gap: ${Math.round(total)} expected vs ${844*4} actual = ${Math.round(total / (844*4) * 100)}% inflated`);
