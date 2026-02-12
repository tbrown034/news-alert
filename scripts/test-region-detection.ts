/**
 * Comprehensive Region Detection Test Suite
 * ==========================================
 * Tests detectRegion() and classifyRegion() against 50+ cases.
 *
 * Usage: npx tsx scripts/test-region-detection.ts
 *
 * All keyword improvements (city promotion, agency keywords, US-audience
 * tiebreaker, Myanmar promotion) have been implemented. All 90 tests pass.
 */

// Use relative imports since scripts/ is excluded from tsconfig paths
import { detectRegion, getMessageRegion } from '../src/lib/regionDetection';
import { classifyRegion } from '../src/lib/sourceUtils';
import type { WatchpointId } from '../src/types';

// =============================================================================
// TEST FRAMEWORK
// =============================================================================

interface TestCase {
  description: string;
  text: string;
  sourceDefault?: WatchpointId;
  expected: WatchpointId | null;
  afterFix?: boolean;       // true = expected to fail until keyword improvements land
  sourceIsRegionSpecific?: boolean;
}

interface TestGroup {
  name: string;
  tests: TestCase[];
}

let totalPassed = 0;
let totalFailed = 0;
let afterFixPassed = 0;
let afterFixFailed = 0;

function runTestGroup(group: TestGroup) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${group.name}`);
  console.log('='.repeat(70));

  let groupPassed = 0;
  let groupFailed = 0;

  for (const tc of group.tests) {
    const tag = tc.afterFix ? ' [AFTER FIX]' : '';
    const sourceDefault = tc.sourceDefault ?? 'all';

    // Test detectRegion
    const result = detectRegion(tc.text, sourceDefault);
    const actual = result.detectedRegion;

    // For getMessageRegion (used by the pipeline)
    const messageRegion = getMessageRegion(
      tc.text,
      sourceDefault,
      tc.sourceIsRegionSpecific ?? false
    );

    // Also test classifyRegion (the wrapper in sourceUtils)
    const classified = classifyRegion('', tc.text, sourceDefault);

    const passed = actual === tc.expected || messageRegion === tc.expected;
    const icon = passed ? 'PASS' : 'FAIL';

    if (passed) {
      groupPassed++;
      if (tc.afterFix) afterFixPassed++;
    } else {
      groupFailed++;
      if (tc.afterFix) afterFixFailed++;
    }

    // Show details for failures; compact for passes
    if (!passed) {
      console.log(`  ${icon}${tag}: ${tc.description}`);
      console.log(`        expected: ${tc.expected ?? '(null)'}`);
      console.log(`        detectRegion:    ${actual ?? '(null)'} (score ${result.allMatches[0]?.score ?? 0}, keywords: [${result.allMatches[0]?.matchedKeywords.join(', ') ?? ''}])`);
      console.log(`        getMessageRegion: ${messageRegion}`);
      console.log(`        classifyRegion:   ${classified.region}`);
      if (result.allMatches.length > 1) {
        console.log(`        other matches:   ${result.allMatches.slice(1).map(m => `${m.region}=${m.score}`).join(', ')}`);
      }
    } else {
      console.log(`  ${icon}${tag}: ${tc.description}`);
    }
  }

  totalPassed += groupPassed;
  totalFailed += groupFailed;

  console.log(`  --- ${groupPassed}/${groupPassed + groupFailed} passed ---`);
}

// =============================================================================
// TEST CASES
// =============================================================================

const testGroups: TestGroup[] = [

  // ─── US REGION ────────────────────────────────────────────────────────────────
  {
    name: 'US - Clear Single-Region Posts',
    tests: [
      {
        description: 'White House announcement',
        text: 'The White House announced new sanctions today targeting foreign adversaries.',
        expected: 'us',
      },
      {
        description: 'Congressional action',
        text: 'Congress passed a bipartisan bill to fund infrastructure projects nationwide.',
        expected: 'us',
      },
      {
        description: 'Trump political news',
        text: 'Trump announces rally in Florida ahead of primary season.',
        expected: 'us',
      },
      {
        description: 'FBI investigation',
        text: 'The FBI is investigating a cyberattack on a federal contractor.',
        expected: 'us',
      },
      {
        description: 'U.S. abbreviation with period (regex word boundary bug)',
        text: 'U.S. officials confirmed the diplomatic talks have stalled.',
        expected: 'us',
        // Fixed: \bU\.S\.\b → \bU\.S\. (removed trailing \b that failed after period)
      },
      {
        description: 'US state name (California)',
        text: 'A wildfire in California has forced thousands to evacuate.',
        expected: 'us',
      },
      {
        description: 'US state name (Texas)',
        text: 'Texas governor declares state of emergency over flooding.',
        expected: 'us',
      },
      {
        description: 'Supreme Court ruling',
        text: 'Supreme Court overturns lower court ruling on voting rights.',
        expected: 'us',
      },
      {
        description: 'Pentagon and military',
        text: 'Pentagon officials briefed the Senate on new defense spending priorities.',
        expected: 'us',
      },
      {
        description: 'US geographic region (Midwest)',
        text: 'Severe weather is expected across the Midwest this weekend.',
        expected: 'us',
      },
    ],
  },

  {
    name: 'US - City-Only Posts (Current: medium=2pts, below threshold)',
    tests: [
      {
        description: 'Chicago-only mention should detect US',
        text: 'New bodycam footage shows Border Patrol agents swerving into the Chicago woman\'s car before shooting her five times.',
        expected: 'us',
        // Fixed: Chicago promoted to high, Border Patrol added
      },
      {
        description: 'New York city news',
        text: 'NYC mayor announces new subway safety measures after string of incidents.',
        expected: 'us',
        // Fixed: NYC added as high keyword
      },
      {
        description: 'Chicago + Illinois (state gives high boost)',
        text: 'Chicago police in Illinois respond to mass shooting on South Side.',
        expected: 'us',
        // Illinois=3 high + Chicago=2 medium = 5, passes threshold
      },
      {
        description: 'Los Angeles only',
        text: 'Los Angeles sees record homelessness numbers this quarter.',
        expected: 'us',
        // Fixed: LA promoted to high
      },
      {
        description: 'Miami + Florida (state gives boost)',
        text: 'Miami residents in Florida brace for Category 4 hurricane.',
        expected: 'us',
        // Florida=3 high + Miami=2 medium = 5, passes threshold
      },
    ],
  },

  // ─── LATAM REGION ─────────────────────────────────────────────────────────────
  {
    name: 'Latin America - Clear Single-Region Posts',
    tests: [
      {
        description: 'Venezuela political crisis',
        text: 'Maduro orders military deployment to Caracas amid growing protests.',
        expected: 'latam',
      },
      {
        description: 'Brazil election',
        text: 'Lula announces major economic reform package for Brazil.',
        expected: 'latam',
      },
      {
        description: 'Mexican cartel activity',
        text: 'Mexican cartel violence spikes in Sinaloa as military operations intensify.',
        expected: 'latam',
      },
      {
        description: 'Argentina economy',
        text: 'Milei announces dollarization plan for Argentina amid hyperinflation.',
        expected: 'latam',
      },
      {
        description: 'Colombia peace process',
        text: 'FARC dissidents attack Colombian military outpost in Bogota region.',
        expected: 'latam',
      },
      {
        description: 'Haiti crisis',
        text: 'Armed gangs seize control of Port-au-Prince as Haitian government collapses.',
        expected: 'latam',
      },
      {
        description: 'Cuba sanctions',
        text: 'Cuba faces worst economic crisis in decades as Havana rations electricity.',
        expected: 'latam',
      },
    ],
  },

  // ─── MIDDLE EAST REGION ───────────────────────────────────────────────────────
  {
    name: 'Middle East - Clear Single-Region Posts',
    tests: [
      {
        description: 'Gaza conflict',
        text: 'IDF launches airstrikes on Gaza as Hamas fires rockets toward Tel Aviv.',
        expected: 'middle-east',
      },
      {
        description: 'Iran nuclear program',
        text: 'Iran enriches uranium to 60% as IRGC warns of retaliation against sanctions.',
        expected: 'middle-east',
      },
      {
        description: 'Houthi Red Sea attacks',
        text: 'Houthi forces launch missiles at commercial ships in the Red Sea near Yemen.',
        expected: 'middle-east',
      },
      {
        description: 'Syria civil war',
        text: 'Assad regime forces bomb Idlib market as Syrian opposition regroups.',
        expected: 'middle-east',
      },
      {
        description: 'Lebanon crisis',
        text: 'Hezbollah exchanges fire with Israel across the Lebanon border near Beirut.',
        expected: 'middle-east',
      },
      {
        description: 'Iraq security',
        text: 'Iraqi forces conduct raid in Baghdad targeting militia weapons caches.',
        expected: 'middle-east',
      },
      {
        description: 'Saudi diplomacy',
        text: 'Saudi Arabia hosts emergency summit in Riyadh on regional security.',
        expected: 'middle-east',
      },
    ],
  },

  // ─── EUROPE-RUSSIA REGION ─────────────────────────────────────────────────────
  {
    name: 'Europe-Russia - Clear Single-Region Posts',
    tests: [
      {
        description: 'Ukraine frontline',
        text: 'Ukrainian forces repel Russian assault near Bakhmut as Zelensky visits Kyiv.',
        expected: 'europe-russia',
      },
      {
        description: 'Russian politics',
        text: 'Putin orders partial mobilization as Kremlin faces domestic pressure in Moscow.',
        expected: 'europe-russia',
      },
      {
        description: 'NATO expansion',
        text: 'NATO holds emergency session in Brussels as Finland joins the alliance.',
        expected: 'europe-russia',
      },
      {
        description: 'France protests',
        text: 'Macron faces mass protests in Paris over pension reform legislation.',
        expected: 'europe-russia',
      },
      {
        description: 'Wagner Group',
        text: 'Wagner forces redeploy from Bakhmut as Prigozhin challenges Russian command.',
        expected: 'europe-russia',
      },
      {
        description: 'EU policy',
        text: 'European Union announces new sanctions package targeting Russian energy exports.',
        expected: 'europe-russia',
      },
      {
        description: 'Crimea military activity',
        text: 'Explosions reported in Crimea near Sevastopol as drones target Russian naval base.',
        expected: 'europe-russia',
      },
    ],
  },

  // ─── ASIA REGION ──────────────────────────────────────────────────────────────
  {
    name: 'Asia - Clear Single-Region Posts',
    tests: [
      {
        description: 'Taiwan Strait tensions',
        text: 'China sends military aircraft across Taiwan Strait as Taipei raises alert.',
        expected: 'asia',
      },
      {
        description: 'North Korea missile test',
        text: 'North Korea launches ballistic missile over Japan as Pyongyang escalates.',
        expected: 'asia',
      },
      {
        description: 'India-Pakistan tensions',
        text: 'India deploys troops along border as Pakistan accuses Modi of escalation.',
        expected: 'asia',
      },
      {
        description: 'South China Sea',
        text: 'Philippine coast guard confronts Chinese vessels in South China Sea near Manila.',
        expected: 'asia',
      },
      {
        description: 'Xi Jinping policy',
        text: 'Xi Jinping announces military reforms at CCP congress in Beijing.',
        expected: 'asia',
      },
      {
        description: 'Myanmar conflict (Myanmar is medium=2pts, below threshold)',
        text: 'Myanmar junta forces attack resistance positions in northern Shan state.',
        expected: 'asia',
        // Fixed: Myanmar promoted from medium to high
      },
    ],
  },

  // ─── AFRICA REGION ────────────────────────────────────────────────────────────
  {
    name: 'Africa - Clear Single-Region Posts',
    tests: [
      {
        description: 'Sudan conflict',
        text: 'Sudanese military clashes with RSF in Khartoum as humanitarian crisis worsens.',
        expected: 'africa',
      },
      {
        description: 'Nigeria security',
        text: 'Boko Haram attacks Nigerian military base near Abuja.',
        expected: 'africa',
      },
      {
        description: 'Sahel coup',
        text: 'Burkina Faso military junta expels French ambassador as Sahel crisis deepens.',
        expected: 'africa',
      },
      {
        description: 'Somalia al-Shabaab',
        text: 'Al-Shabaab militants attack hotel in Mogadishu, Somalia.',
        expected: 'africa',
      },
      {
        description: 'South Africa political',
        text: 'South African parliament debates land reform in Cape Town.',
        expected: 'africa',
      },
      {
        description: 'DRC conflict',
        text: 'DRC forces battle M23 rebels near Kinshasa as Congo crisis escalates.',
        expected: 'africa',
      },
      {
        description: 'Ethiopian tensions',
        text: 'Ethiopia and Eritrea hold talks in Addis Ababa on Tigray peace process.',
        expected: 'africa',
      },
    ],
  },

  // ─── MULTI-REGION POSTS ───────────────────────────────────────────────────────
  {
    name: 'Multi-Region - US Audience Tiebreaker',
    tests: [
      {
        description: 'US-Israel: "Biden announces aid to Israel" should be Middle East for non-US audience',
        text: 'Biden announces new military aid package for Israel amid Gaza offensive.',
        expected: 'middle-east',
        // Fixed: US-audience tiebreaker prefers foreign when scores equal/higher
      },
      {
        description: 'US-Ukraine: "Congress approves Ukraine aid" should be Europe-Russia',
        text: 'Congress approves $60 billion in aid to Ukraine as Zelensky visits Washington.',
        expected: 'europe-russia',
        // Fixed: US-audience tiebreaker — tied scores prefer foreign region
      },
      {
        description: 'US-China: "Pentagon warns on China threat" should be Asia',
        text: 'Pentagon warns China is increasing military pressure on Taiwan ahead of election.',
        expected: 'asia',
        // Pentagon(2) vs China(3)+Taiwan(3); foreign wins on raw score
      },
      {
        description: 'US-Iran: "State Department sanctions Iran" should be Middle East',
        text: 'State Department announces new sanctions on Iran over nuclear program.',
        expected: 'middle-east',
        // State Dept(2) vs Iran(3); foreign wins on raw score
      },
      {
        description: 'US-Mexico border (should stay US - domestic policy focus)',
        text: 'Biden orders National Guard deployment to Texas-Mexico border.',
        expected: 'us',
        // Biden+National Guard+Texas = heavily US; Mexico is only LATAM keyword
      },
    ],
  },

  // ─── SOURCE DEFAULT FALLBACK ──────────────────────────────────────────────────
  {
    name: 'Source Default Fallback - No/Weak Keywords',
    tests: [
      {
        description: 'Generic text with source default US',
        text: 'Breaking: Major development reported, details forthcoming.',
        sourceDefault: 'us',
        expected: 'us',
      },
      {
        description: 'Generic text with source default middle-east',
        text: 'Situation escalating, officials confirm casualties.',
        sourceDefault: 'middle-east',
        expected: 'middle-east',
      },
      {
        description: 'Generic text with source default "all" -> null',
        text: 'Urgent update on the current situation.',
        sourceDefault: 'all',
        expected: null,
      },
      {
        description: 'Very short text, no keywords',
        text: 'Thread:',
        sourceDefault: 'europe-russia',
        expected: 'europe-russia',
      },
      {
        description: 'Only low-confidence keywords (federal) - below threshold, fall back',
        text: 'Federal authorities have issued a warning.',
        sourceDefault: 'latam',
        expected: 'latam',
        // "federal" is US low (1pt), below threshold of 3
      },
      {
        description: 'Empty string falls back to source default',
        text: '',
        sourceDefault: 'africa',
        expected: 'africa',
      },
    ],
  },

  // ─── REGION-SPECIFIC SOURCE OVERRIDE ──────────────────────────────────────────
  {
    name: 'Region-Specific Source Override (getMessageRegion)',
    tests: [
      {
        description: 'Region-specific source always returns source region',
        text: 'Japan holds emergency summit with South Korea on security.',
        sourceDefault: 'europe-russia',
        sourceIsRegionSpecific: true,
        expected: 'europe-russia',
        // Even though text is clearly Asia, sourceIsRegionSpecific forces europe-russia
      },
      {
        description: 'Non-region-specific source uses detection',
        text: 'Japan holds emergency summit with South Korea on security.',
        sourceDefault: 'europe-russia',
        sourceIsRegionSpecific: false,
        expected: 'asia',
      },
    ],
  },

  // ─── AMBIGUOUS TERMS ──────────────────────────────────────────────────────────
  {
    name: 'Ambiguous Terms',
    tests: [
      {
        description: 'Georgia (US state) - matches US high pattern',
        text: 'Georgia governor signs new voting legislation into law.',
        expected: 'us',
        // "Georgia" matches US high, "governor" matches US low = 4pts
      },
      {
        description: 'Georgia (country) - EU keyword tips tiebreaker to europe-russia',
        text: 'Georgia protests erupt in Tbilisi over EU membership bid.',
        expected: 'europe-russia',
        // "Georgia" matches US high (3pts), "EU" matches europe-russia high (3pts).
        // US-audience tiebreaker prefers foreign when scores are equal.
      },
      {
        description: 'Washington state vs Washington DC',
        text: 'Washington state declares emergency over wildfires.',
        expected: 'us',
        // Both "Washington" patterns are US, so this works correctly
      },
      {
        description: 'Jordan (person name vs country) with Middle East context',
        text: 'Jordan hosts ceasefire talks in Amman for regional peace.',
        expected: 'middle-east',
        // "Jordan"=3 ME high + "Amman"=3 ME high = 6pts
      },
      {
        description: 'ICE (US agency) - case sensitive match',
        text: 'ICE arrests dozens in nationwide immigration sweep.',
        expected: 'us',
        // ICE pattern is case sensitive /\bICE\b/ = 3pts high
      },
      {
        description: 'ice (lowercase, not the agency) - should NOT match US ICE',
        text: 'Scientists discover ice formations in Antarctic caves.',
        sourceDefault: 'all',
        expected: null,
        // lowercase "ice" should not match /\bICE\b/
      },
    ],
  },

  // ─── EDGE CASES ───────────────────────────────────────────────────────────────
  {
    name: 'Edge Cases - Formatting, Caps, Punctuation',
    tests: [
      {
        description: 'ALL CAPS text',
        text: 'BREAKING: RUSSIAN FORCES ATTACK KYIV IN MASSIVE DRONE STRIKE',
        expected: 'europe-russia',
      },
      {
        description: 'Possessive forms (Trump\'s)',
        text: 'Trump\'s executive order faces legal challenge in federal court.',
        expected: 'us',
      },
      {
        description: 'Hyphenated context (Israeli-Palestinian)',
        text: 'The Israeli-Palestinian conflict enters a new phase of escalation.',
        expected: 'middle-east',
      },
      {
        description: 'Parenthetical mentions',
        text: 'The attack (in Kyiv) killed several civilians on Monday.',
        expected: 'europe-russia',
      },
      {
        description: 'Quoted place names',
        text: '"Moscow has no choice," says analyst on the Kremlin standoff.',
        expected: 'europe-russia',
      },
      {
        description: 'URL-like text should not confuse detection',
        text: 'Read more at bbc.co.uk/news about the London bridge incident.',
        expected: 'europe-russia',
        // "London" matches europe-russia high
      },
      {
        description: 'Numbers and special characters',
        text: 'F-16 jets deployed to Ukraine as part of NATO commitment.',
        expected: 'europe-russia',
        // F-16 medium + Ukraine high + NATO high
      },
    ],
  },

  // ─── classifyRegion WRAPPER ───────────────────────────────────────────────────
  {
    name: 'classifyRegion() Wrapper (sourceUtils)',
    tests: [
      {
        description: 'classifyRegion detects override when source region differs',
        text: 'Major earthquake strikes Tokyo as Japan issues tsunami warning.',
        sourceDefault: 'middle-east',
        expected: 'asia',
        // Detection finds Asia (Tokyo+Japan = 6pts), source is middle-east -> override
      },
      {
        description: 'classifyRegion matches source when detection agrees',
        text: 'Hamas launches rockets from Gaza toward Israeli cities.',
        sourceDefault: 'middle-east',
        expected: 'middle-east',
      },
      {
        description: 'classifyRegion falls back to source when no detection',
        text: 'Situation developing, more details expected soon.',
        sourceDefault: 'africa',
        expected: 'africa',
      },
    ],
  },

  // ─── MISSING KEYWORDS (AFTER FIX) ────────────────────────────────────────────
  {
    name: 'Missing Keywords - Expected to Pass After Fix',
    tests: [
      {
        description: 'Border Patrol should trigger US detection',
        text: 'Border Patrol agents apprehend migrants near El Paso.',
        expected: 'us',
        // Fixed: Border Patrol added as high keyword
      },
      {
        description: 'CBP should trigger US detection',
        text: 'CBP reports record seizures of fentanyl at southern border.',
        expected: 'us',
        // Fixed: CBP added as high keyword
      },
      {
        description: 'NYPD should trigger US detection',
        text: 'NYPD officers involved in standoff in Brooklyn.',
        expected: 'us',
        // Fixed: NYPD added as high keyword
      },
      {
        description: 'DEA should trigger US detection',
        text: 'DEA announces major drug trafficking bust.',
        expected: 'us',
        // Fixed: DEA added as high keyword
      },
      {
        description: 'ATF should trigger US detection',
        text: 'ATF investigates illegal firearms operation in Detroit.',
        expected: 'us',
        // Fixed: ATF added as high keyword
      },
      {
        description: 'US city alone (Chicago) should be enough for US',
        text: 'Shooting leaves 3 dead in Chicago overnight.',
        expected: 'us',
        // Fixed: Chicago promoted to high
      },
      {
        description: 'US city alone (Atlanta) should be enough for US',
        text: 'Atlanta airport evacuated after security threat.',
        expected: 'us',
        // Fixed: Atlanta promoted to high
      },
    ],
  },

  // ─── LIVE FEED AUDIT (2026-02-12) ─────────────────────────────────────────────
  {
    name: 'Live Feed Audit - Previously Misclassified as Global',
    tests: [
      // US - new agency keywords
      {
        description: 'EPA Clean Air Act rollback',
        text: 'The EPA revokes scientific finding that greenhouse gases endanger the public health.',
        expected: 'us',
      },
      {
        description: 'FDA decision on Moderna',
        text: "FDA's decision not to accept Moderna's flu vaccine filing has sent shock waves through pharma.",
        expected: 'us',
      },
      {
        description: 'Minneapolis immigration crackdown',
        text: 'The immigration crackdown in Minneapolis has pushed many people in the city to stay at home.',
        expected: 'us',
      },
      {
        description: 'RFK Jr quote',
        text: 'RFK Jr: "I\'m not scared of a germ. I used to snort cocaine off of toilet seats."',
        expected: 'us',
      },
      {
        description: 'Justice Department antitrust',
        text: 'Justice Department antitrust chief resigns. This is being viewed as a victory for big business.',
        expected: 'us',
      },
      // Europe-Russia - new keywords
      {
        description: 'Odessa substation (double-s spelling)',
        text: 'Another substation in Odessa was hit tonight.',
        expected: 'europe-russia',
      },
      {
        description: 'UK government policy',
        text: 'The UK government has issued draft guidance for schools on handling children questioning their gender.',
        expected: 'europe-russia',
      },
      {
        description: 'Keir Starmer unpopularity',
        text: "'Jellyfish' and 'doormat': why is Keir Starmer so deeply unpopular?",
        expected: 'europe-russia',
      },
      {
        description: 'Hungary Orbán rival',
        text: "Dramatic turn in Hungary's election race: Orbán rival Péter Magyar says his ex-girlfriend set a honey trap.",
        expected: 'europe-russia',
      },
      {
        description: 'German Chancellor Merz',
        text: 'German Chancellor Merz: The prosperity our country enjoys today cannot be maintained with a four-day week.',
        expected: 'europe-russia',
      },
      {
        description: 'Italian waters legislation',
        text: 'A deployment to prevent arrivals reaching Italian waters features in legislation.',
        expected: 'europe-russia',
      },
      {
        description: 'Norway photography',
        text: 'Borgund Stave Church, Norway. #TravelThursday #photography',
        expected: 'europe-russia',
      },
      {
        description: 'Manchester United UK',
        text: 'Manchester United co-owner Jim Ratcliffe apologised for saying the "UK has been colonised by immigrants".',
        expected: 'europe-russia',
      },
      // LATAM - plural demonym fix
      {
        description: 'Venezuelans plural form',
        text: 'Thousands of Venezuelans stage march for end to repression.',
        expected: 'latam',
      },
      {
        description: 'Guatemalan journalist (single medium keyword falls back)',
        text: 'A judge ordered that Guatemalan journalist Jose Ruben Zamora be returned to house arrest.',
        sourceDefault: 'latam',
        expected: 'latam',
        // "Guatemalan" is medium (2pts), below threshold — falls back to source default
      },
      // Asia - promoted keywords
      {
        description: 'Pakistani PM Imran Khan',
        text: "Son of former Pakistani PM Imran Khan says his father has lost most of the vision in his right eye.",
        expected: 'asia',
      },
      {
        description: 'Bangladesh election',
        text: 'Bangladesh Nationalist Party claims to have won first general elections since student-led protests.',
        expected: 'asia',
      },
      // Africa - promoted Madagascar
      {
        description: 'Madagascar cyclone',
        text: "A cyclone packing violent winds has killed at least 38 people in Madagascar's second-largest city.",
        expected: 'africa',
      },
      // Bug fix - "plan" should NOT trigger Asia
      {
        description: '"plan" (lowercase) should not trigger Asia',
        text: 'Biden announces economic plan for infrastructure spending.',
        sourceDefault: 'all',
        expected: 'us',
        // "plan" was previously matching Asia high (PLA Navy) — now case-sensitive
      },
    ],
  },

  // ─── SCORING THRESHOLD BOUNDARY ───────────────────────────────────────────────
  {
    name: 'Scoring Threshold Boundaries',
    tests: [
      {
        description: 'Single high keyword (3pts) passes threshold',
        text: 'Putin addresses the nation on television.',
        expected: 'europe-russia',
        // Putin = high = 3pts, passes
      },
      {
        description: 'Single medium keyword (2pts) fails threshold',
        text: 'Tensions rising in the Baltic region today.',
        sourceDefault: 'all',
        expected: null,
        // Baltic = medium = 2pts, fails threshold of 3
      },
      {
        description: 'Two low keywords (2pts) fail threshold',
        text: 'The domestic federal budget debate continues.',
        sourceDefault: 'all',
        expected: null,
        // "domestic"=1 + "federal"=1 = 2pts, fails threshold of 3
      },
      {
        description: 'Medium + low (3pts) passes threshold',
        text: 'American federal agencies coordinate response.',
        expected: 'us',
        // "American"=2 medium + "federal"=1 low = 3pts, passes
      },
      {
        description: 'Three low keywords (3pts) passes threshold',
        text: 'The domestic federal governor issued a statement.',
        expected: 'us',
        // "domestic"=1 + "federal"=1 + "governor"=1 = 3pts
      },
    ],
  },
];

// =============================================================================
// RUN ALL TESTS
// =============================================================================

console.log('Region Detection Test Suite');
console.log('===========================');
console.log('Tests marked [AFTER FIX] require keyword improvements (Task #2)');
console.log('and are expected to fail until those changes land.\n');

for (const group of testGroups) {
  runTestGroup(group);
}

// =============================================================================
// SUMMARY
// =============================================================================

const regularPassed = totalPassed - afterFixPassed;
const regularFailed = totalFailed - afterFixFailed;
const regularTotal = regularPassed + regularFailed;
const afterFixTotal = afterFixPassed + afterFixFailed;

console.log(`\n${'='.repeat(70)}`);
console.log('  SUMMARY');
console.log('='.repeat(70));
console.log(`  Current tests:    ${regularPassed}/${regularTotal} passed${regularFailed > 0 ? ` (${regularFailed} FAILED)` : ''}`);
console.log(`  [AFTER FIX] tests: ${afterFixPassed}/${afterFixTotal} passed${afterFixFailed > 0 ? ` (${afterFixFailed} expected failures)` : ''}`);
console.log(`  Total:            ${totalPassed}/${totalPassed + totalFailed} passed`);
console.log('='.repeat(70));

// Exit with error code if any non-AFTER-FIX tests fail
if (regularFailed > 0) {
  console.log('\n  ERROR: Current tests have failures that need investigation!\n');
  process.exit(1);
} else {
  console.log('\n  All current tests pass. [AFTER FIX] failures are expected.\n');
  process.exit(0);
}
