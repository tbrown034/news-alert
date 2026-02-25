/**
 * Audit all Iran War Watch sources added 2026-02-25
 * Tests each Bluesky handle for: existence, activity, last post date, actual PPD
 */

const NEW_SOURCES = [
  // Military / Defense
  { id: 'thrustwr-defense', name: 'Zach (Force Tracker)', handle: 'thrustwr.bsky.social', claimedPPD: 5 },
  { id: 'mark-pyruz', name: 'Mark Pyruz', handle: 'markpyruz.bsky.social', claimedPPD: 8 },
  { id: 'joseph-trevithick', name: 'Joseph Trevithick (War Zone)', handle: 'franticgoat.bsky.social', claimedPPD: 8 },
  { id: 'sune-engel-rasmussen', name: 'Sune Engel Rasmussen (WSJ)', handle: 'suneengel.bsky.social', claimedPPD: 3 },
  { id: 'franz-stefan-gady', name: 'Franz-Stefan Gady', handle: 'hoanssolo.bsky.social', claimedPPD: 4 },
  { id: 'reconron', name: 'reconron (RC-135 Vet)', handle: 'thereccelizard.bsky.social', claimedPPD: 6 },
  { id: 'caroline-rose', name: 'Caroline Rose (New Lines)', handle: 'carolinerose8.bsky.social', claimedPPD: 3 },
  { id: 'chris-panella', name: 'Chris Panella (BI)', handle: 'chrispanella.bsky.social', claimedPPD: 4 },
  { id: 'thord-iversen', name: 'Thord Are Iversen (Naval)', handle: 'thelookout.bsky.social', claimedPPD: 5 },
  { id: 'russia-maritime-watch', name: 'Russia Maritime Watch', handle: 'rfnosblog.bsky.social', claimedPPD: 1.4 },
  { id: 'tomi-mccluskey', name: 'Tomi McCluskey (Bellingcat)', handle: 'tomi-mcc.bsky.social', claimedPPD: 3 },
  { id: 'the-military-analyst', name: 'The Analyst', handle: 'militaryanalyst.bsky.social', claimedPPD: 6 },
  { id: 'david-rohde', name: 'David Rohde (MSNBC)', handle: 'davidrohde.bsky.social', claimedPPD: 3 },
  { id: 'christopher-cavas', name: 'Christopher Cavas (Naval)', handle: 'cavasships.bsky.social', claimedPPD: 2 },

  // Nuclear / Nonproliferation
  { id: 'ankit-panda', name: 'Ankit Panda (Carnegie)', handle: 'nktpnd.bsky.social', claimedPPD: 3.5 },
  { id: 'caitlin-talmadge', name: 'Caitlin Talmadge (MIT)', handle: 'proftalmadge.bsky.social', claimedPPD: 3 },
  { id: 'jon-wolfsthal', name: 'Jon Wolfsthal (ex-NSC)', handle: 'jonatomic.bsky.social', claimedPPD: 6 },
  { id: 'bulletin-atomic-scientists', name: 'Bulletin of Atomic Scientists', handle: 'thebulletin.org', claimedPPD: 2 },
  { id: 'nicole-grajewski', name: 'Nicole Grajewski (Carnegie)', handle: 'nicolegrajewski.bsky.social', claimedPPD: 1 },
  { id: 'hanna-notte', name: 'Hanna Notte (CNS/CSIS)', handle: 'hannanotte.bsky.social', claimedPPD: 1.5 },
  { id: 'stephen-schwartz', name: 'Stephen Schwartz', handle: 'atomicanalyst.bsky.social', claimedPPD: 7.5 },
  { id: 'john-carl-baker', name: 'John Carl Baker', handle: 'johncarlbaker.bsky.social', claimedPPD: 10 },
  { id: 'fas-org', name: 'Fed of American Scientists', handle: 'scientistsorg.bsky.social', claimedPPD: 2 },
  { id: 'nti-org', name: 'Nuclear Threat Initiative', handle: 'nti.org', claimedPPD: 1.5 },
  { id: 'pavel-podvig', name: 'Pavel Podvig', handle: 'russianforces.org', claimedPPD: 1 },
  { id: 'oliver-meier', name: 'Oliver Meier (ELN)', handle: 'olivermeier.bsky.social', claimedPPD: 1.5 },
  { id: 'carnegie-npp', name: 'Carnegie Nuclear Policy', handle: 'carnegienpp.bsky.social', claimedPPD: 0.5 },
  { id: 'gregory-koblentz', name: 'Gregory Koblentz (WMD)', handle: 'gregkoblentz.bsky.social', claimedPPD: 1.5 },

  // Maritime / Shipping
  { id: 'seanews-maritime', name: 'SeaNews', handle: 'seanews.bsky.social', claimedPPD: 7.2 },
  { id: 'fleetleaks', name: 'FleetLeaks', handle: 'fleetleaks.bsky.social', claimedPPD: 3.3 },
  { id: 'rory-johnston', name: 'Rory Johnston (Oil)', handle: 'roryjohnston.bsky.social', claimedPPD: 5 },
  { id: 'ben-winkley', name: 'Ben Winkley (Argus)', handle: 'benwinkley.bsky.social', claimedPPD: 2.5 },
  { id: 'tanker-watch-ie', name: 'Tanker Watch IE', handle: 'galwaybaywatch.bsky.social', claimedPPD: 7.5 },
  { id: 'maritime-bell', name: 'Maritime Bell', handle: 'maritimebell.com', claimedPPD: 4.3 },

  // Iran Policy / War Powers
  { id: 'crisis-group', name: 'Crisis Group', handle: 'crisisgroup.org', claimedPPD: 5 },
  { id: 'edward-wong', name: 'Edward Wong (NYT)', handle: 'ewong.bsky.social', claimedPPD: 3 },
  { id: 'akbar-shahid-ahmed', name: 'Akbar Shahid Ahmed (HuffPost)', handle: 'akbarshahidahmed.huffpost.com', claimedPPD: 5 },
  { id: 'dalia-dassa-kaye', name: 'Dalia Dassa Kaye (ex-RAND)', handle: 'dassakaye.bsky.social', claimedPPD: 3 },
  { id: 'brian-finucane', name: 'Brian Finucane (ICG)', handle: 'bcfinucane.bsky.social', claimedPPD: 3 },
  { id: 'daniel-larison', name: 'Daniel Larison', handle: 'daniellarison.bsky.social', claimedPPD: 8 },
  { id: 'kori-schake', name: 'Kori Schake (AEI)', handle: 'kschake.bsky.social', claimedPPD: 5 },
  { id: 'michael-hanna-icg', name: 'Michael Hanna (ICG)', handle: 'mwhanna.crisisgroup.org', claimedPPD: 4 },
  { id: 'katherine-ebright', name: 'Katherine Yon Ebright', handle: 'ebrightyon.bsky.social', claimedPPD: 2 },
  { id: 'dawn-mena', name: 'DAWN', handle: 'dawnmenaorg.bsky.social', claimedPPD: 3 },
  { id: 'heather-brandon-smith', name: 'Heather Brandon-Smith (FCNL)', handle: 'hbrandon-smith.bsky.social', claimedPPD: 2 },
  { id: 'center-intl-policy', name: 'Center for Intl Policy', handle: 'cipolicy.bsky.social', claimedPPD: 2 },
  { id: 'just-security', name: 'Just Security', handle: 'justsecurity.org', claimedPPD: 5 },
  { id: 'rebecca-ingber', name: 'Rebecca Ingber', handle: 'becingber.bsky.social', claimedPPD: 2 },

  // Regional / Diaspora
  { id: 'mira-al-hussein', name: 'Mira Al Hussein (Gulf)', handle: 'miraalhussein.bsky.social', claimedPPD: 5 },
  { id: 'aron-lund', name: 'Aron Lund (FOI Sweden)', handle: 'aronlund.bsky.social', claimedPPD: 1 },
  { id: 'mutlu-civiroglu', name: 'Mutlu Civiroglu (Kurdish)', handle: 'mutludc.bsky.social', claimedPPD: 2.5 },
  { id: 'me-tracker', name: 'Middle-East Tracker', handle: 'me.skyfleet.blue', claimedPPD: 30 },
  { id: 'reza-akbari', name: 'Reza H. Akbari', handle: 'rezahakbari.bsky.social', claimedPPD: 2 },
];

interface AuditResult {
  id: string;
  name: string;
  handle: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  reason: string;
  lastPostDate: string;
  daysAgo: number;
  postCount: number;
  measuredPPD: number;
  claimedPPD: number;
  ppdAccuracy: string;
}

async function auditSource(src: typeof NEW_SOURCES[0]): Promise<AuditResult> {
  const result: AuditResult = {
    id: src.id,
    name: src.name,
    handle: src.handle,
    status: 'PASS',
    reason: '',
    lastPostDate: '',
    daysAgo: -1,
    postCount: 0,
    measuredPPD: 0,
    claimedPPD: src.claimedPPD,
    ppdAccuracy: '',
  };

  try {
    // Fetch recent posts (max 30 to measure PPD)
    const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${src.handle}&limit=30&filter=posts_no_replies`;
    const res = await fetch(url);

    if (!res.ok) {
      result.status = 'FAIL';
      result.reason = `HTTP ${res.status} - profile not found or blocked`;
      return result;
    }

    const data = await res.json();
    const posts = data.feed || [];
    result.postCount = posts.length;

    if (posts.length === 0) {
      result.status = 'FAIL';
      result.reason = 'Zero posts returned';
      return result;
    }

    // Get latest post date
    const latestCreated = posts[0]?.post?.record?.createdAt;
    if (latestCreated) {
      const latestDate = new Date(latestCreated);
      result.lastPostDate = latestDate.toISOString().split('T')[0];
      result.daysAgo = Math.round((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Calculate actual PPD from the span of posts returned
    if (posts.length >= 2) {
      const newest = new Date(posts[0]?.post?.record?.createdAt);
      const oldest = new Date(posts[posts.length - 1]?.post?.record?.createdAt);
      const spanDays = Math.max(1, (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
      result.measuredPPD = Math.round((posts.length / spanDays) * 10) / 10;
    }

    // PPD accuracy
    if (result.measuredPPD > 0 && src.claimedPPD > 0) {
      const ratio = result.measuredPPD / src.claimedPPD;
      if (ratio < 0.25) result.ppdAccuracy = `OVER-CLAIMED (${src.claimedPPD} claimed, ${result.measuredPPD} actual)`;
      else if (ratio < 0.5) result.ppdAccuracy = `HIGH (claimed ${src.claimedPPD}, actual ${result.measuredPPD})`;
      else if (ratio > 3) result.ppdAccuracy = `UNDER-CLAIMED (${src.claimedPPD} claimed, ${result.measuredPPD} actual)`;
      else result.ppdAccuracy = 'OK';
    }

    // Determine status
    if (result.daysAgo > 30) {
      result.status = 'FAIL';
      result.reason = `Dormant ${result.daysAgo} days`;
    } else if (result.daysAgo > 14) {
      result.status = 'WARN';
      result.reason = `Stale ${result.daysAgo} days`;
    } else if (result.measuredPPD < 0.1 && result.postCount < 3) {
      result.status = 'WARN';
      result.reason = 'Very low activity';
    } else {
      result.reason = 'Active';
    }

  } catch (e: any) {
    result.status = 'FAIL';
    result.reason = `Error: ${e.message}`;
  }

  return result;
}

async function main() {
  console.log(`\n🔍 AUDITING ${NEW_SOURCES.length} IRAN WAR WATCH SOURCES\n`);
  console.log('Testing each handle against live Bluesky API...\n');

  const results: AuditResult[] = [];

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < NEW_SOURCES.length; i += 5) {
    const batch = NEW_SOURCES.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(auditSource));
    results.push(...batchResults);

    // Progress
    for (const r of batchResults) {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌';
      const ppd = r.measuredPPD > 0 ? `${r.measuredPPD} ppd` : 'n/a';
      const lastPost = r.lastPostDate ? `last: ${r.lastPostDate}` : '';
      console.log(`  ${icon} ${r.name.padEnd(40)} ${r.status.padEnd(5)} ${ppd.padEnd(10)} ${lastPost.padEnd(16)} ${r.reason}`);
    }

    // Small delay between batches
    if (i + 5 < NEW_SOURCES.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Summary
  const pass = results.filter(r => r.status === 'PASS');
  const warn = results.filter(r => r.status === 'WARN');
  const fail = results.filter(r => r.status === 'FAIL');

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 AUDIT SUMMARY`);
  console.log(`   Total:  ${results.length}`);
  console.log(`   ✅ PASS: ${pass.length}`);
  console.log(`   ⚠️ WARN: ${warn.length}`);
  console.log(`   ❌ FAIL: ${fail.length}`);

  if (fail.length > 0) {
    console.log(`\n❌ FAILURES (should remove from sources-clean.ts):`);
    for (const r of fail) {
      console.log(`   ${r.id} (${r.handle}) — ${r.reason}`);
    }
  }

  if (warn.length > 0) {
    console.log(`\n⚠️ WARNINGS (monitor closely):`);
    for (const r of warn) {
      console.log(`   ${r.id} (${r.handle}) — ${r.reason}`);
    }
  }

  // PPD accuracy report
  const overclaimed = results.filter(r => r.ppdAccuracy.startsWith('OVER') || r.ppdAccuracy.startsWith('HIGH'));
  if (overclaimed.length > 0) {
    console.log(`\n📉 PPD OVER-CLAIMED (postsPerDay too high):`);
    for (const r of overclaimed) {
      console.log(`   ${r.id}: ${r.ppdAccuracy}`);
    }
  }

  console.log('\n');
}

main().catch(console.error);
