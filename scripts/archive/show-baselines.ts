import { tier1Sources, tier2Sources, tier3Sources } from '../src/lib/sources-clean';

const allSources = [...tier1Sources, ...tier2Sources, ...tier3Sources];
const CONSERVATIVE_DEFAULT = 3;

function isMeasuredValue(n: number): boolean {
  return n !== Math.floor(n);
}

const regionTotals: Record<string, number> = {
  'us': 0,
  'latam': 0,
  'middle-east': 0,
  'europe-russia': 0,
  'asia': 0,
  'all': 0,
};

let measuredCount = 0;
let guessedCount = 0;

for (const source of allSources) {
  const rawValue = source.postsPerDay || 0;
  const postsPerDay = isMeasuredValue(rawValue) ? rawValue : CONSERVATIVE_DEFAULT;
  const region = source.region;

  if (isMeasuredValue(rawValue)) {
    measuredCount++;
  } else {
    guessedCount++;
  }

  if (region in regionTotals) {
    regionTotals[region] += postsPerDay;
  }
  regionTotals['all'] += postsPerDay;
}

console.log('\n=== CALIBRATED BASELINES (trusting measured, conservative for guessed) ===\n');
console.log(`Sources: ${measuredCount} measured (decimals) + ${guessedCount} guessed (rounds @ ${CONSERVATIVE_DEFAULT}/day)`);
console.log('\nPosts per DAY by region:');
for (const [region, total] of Object.entries(regionTotals)) {
  console.log(`  ${region.padEnd(15)}: ${Math.round(total).toString().padStart(5)} posts/day`);
}
console.log('\nPosts per 6 HOURS (÷4) — BASELINE:');
for (const [region, total] of Object.entries(regionTotals)) {
  console.log(`  ${region.padEnd(15)}: ${Math.round(total/4).toString().padStart(5)} posts/6h`);
}
console.log('\nTotal sources:', allSources.length);
