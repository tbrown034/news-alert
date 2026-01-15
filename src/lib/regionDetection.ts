/**
 * REGION DETECTION
 * =================
 * Detects which geopolitical region a message pertains to based on keywords.
 *
 * Approach:
 * 1. Parse message for region-specific keywords (places, people, organizations)
 * 2. Score each region based on keyword matches
 * 3. Return highest-scoring region, or fallback to source's default
 */

import { WatchpointId } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface RegionMatch {
  region: WatchpointId;
  score: number;
  matchedKeywords: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface RegionDetectionResult {
  detectedRegion: WatchpointId | null;
  allMatches: RegionMatch[];
  usedFallback: boolean;
}

// =============================================================================
// REGION KEYWORD PATTERNS
// =============================================================================

interface RegionPatterns {
  // High confidence - very specific to this region
  high: RegExp[];
  // Medium confidence - usually this region but could appear in other contexts
  medium: RegExp[];
  // Low confidence - general terms that suggest this region
  low: RegExp[];
}

const regionPatterns: Record<Exclude<WatchpointId, 'all'>, RegionPatterns> = {
  'middle-east': {
    high: [
      // Israel/Palestine
      /\bisrael(?:i)?\b/i,
      /\bgaza\b/i,
      /\brafah\b/i,
      /\bwest\s+bank\b/i,
      /\btel\s+aviv\b/i,
      /\bjerusalem\b/i,
      /\bhamas\b/i,
      /\bidf\b/i,
      /\biron\s+dome\b/i,
      /\bnetanyahu\b/i,
      /\bhezbollah\b/i,
      /\bnasrallah\b/i,
      // Lebanon
      /\blebanon\b/i,
      /\bbeirut\b/i,
      // Iran
      /\biran(?:ian)?\b/i,
      /\btehran\b/i,
      /\birgc\b/i,
      /\bkhamenei\b/i,
      // Yemen/Houthis
      /\byemen(?:i)?\b/i,
      /\bhouthi/i,
      /\bsanaa\b/i,
      /\baden\b/i,
      // Syria
      /\bsyria(?:n)?\b/i,
      /\bdamascus\b/i,
      /\bassad\b/i,
      /\baleppo\b/i,
      /\bidlib\b/i,
      // Iraq
      /\biraq(?:i)?\b/i,
      /\bbaghdad\b/i,
      /\berbil\b/i,
      // Saudi/Gulf
      /\bsaudi\b/i,
      /\briyadh\b/i,
      /\bred\s+sea\b/i,
      // Jordan
      /\bjordan(?:ian)?\b/i,
      /\bamman\b/i,
    ],
    medium: [
      /\bmiddle\s+east\b/i,
      /\bpalestinian/i,
      /\bkhan\s+yunis\b/i,
      /\bnablus\b/i,
      /\bramallah\b/i,
      /\bgolan\b/i,
      /\bsinai\b/i,
      /\bsuez\b/i,
      /\bqassam\b/i,
      /\bqatari?\b/i,
      /\bdoha\b/i,
      /\bemirati?\b/i,
      /\bdubai\b/i,
      /\babu\s+dhabi\b/i,
      /\bkuwait/i,
      /\bbahrain/i,
      /\boman(?:i)?\b/i,
    ],
    low: [
      /\bshia\b/i,
      /\bsunni\b/i,
      /\bmuslim\s+brotherhood\b/i,
      /\bisis\b/i,
      /\bisil\b/i,
      /\bdaesh\b/i,
      /\bjihadist/i,
    ],
  },

  'ukraine-russia': {
    high: [
      // Ukraine
      /\bukrain(?:e|ian)\b/i,
      /\bkyiv\b/i,
      /\bkharkiv\b/i,
      /\bodesa\b/i,
      /\bzelensky\b/i,
      /\bzelenskyy\b/i,
      /\bazov\b/i,
      // Russia
      /\brussia(?:n)?\b/i,
      /\bmoscow\b/i,
      /\bputin\b/i,
      /\bkreml[ie]n\b/i,
      /\blavrov\b/i,
      /\bshoigu\b/i,
      /\bgerasimov\b/i,
      /\bwagner\b/i,
      /\bprigozhin\b/i,
      // Regions/Cities
      /\bdonbas\b/i,
      /\bdonetsk\b/i,
      /\bluhansk\b/i,
      /\bcrimea(?:n)?\b/i,
      /\bsevastopol\b/i,
      /\bzaporizhzhia\b/i,
      /\bkherson\b/i,
      /\bmariupol\b/i,
      /\bbakhmut\b/i,
      /\bavdiivka\b/i,
      /\bkupyansk\b/i,
      /\bsumy\b/i,
      /\blviv\b/i,
      /\bdnipro\b/i,
      /\bmykolaiv\b/i,
      /\bchernihiv\b/i,
      // Belarus (often in UA/RU context)
      /\bbelarus(?:ian)?\b/i,
      /\blukashenko\b/i,
      /\bminsk\b/i,
    ],
    medium: [
      /\bblack\s+sea\b/i,
      /\bazov\s+sea\b/i,
      /\bkerch\b/i,
      /\bshahed\b/i,
      /\bgeran\b/i,
      /\bkinzhal\b/i,
      /\biskander\b/i,
      /\bkalibr\b/i,
      /\bs-300\b/i,
      /\bs-400\b/i,
      /\bpatrio?t\b/i,  // Often in Ukraine context
      /\bhimars\b/i,
      /\bleopard\b/i,  // Tanks
      /\babrams\b/i,
      /\bf-16\b/i,
      /\bmig\b/i,
      /\bsu-\d+\b/i,
      /\brostov\b/i,
      /\bbelgorod\b/i,
      /\bkursk\b/i,
      /\bbryansk\b/i,
    ],
    low: [
      /\beastern\s+front\b/i,
      /\bsouthern\s+front\b/i,
      /\bcounter.?offensive\b/i,
      /\bmobilization\b/i,
      /\bpartial\s+mobilization\b/i,
    ],
  },

  'china-taiwan': {
    high: [
      // Taiwan
      /\btaiwan(?:ese)?\b/i,
      /\btaipei\b/i,
      /\btsai\s+ing.?wen\b/i,
      /\btaiwan\s+strait\b/i,
      // China
      /\bchina\b/i,
      /\bchinese\b/i,
      /\bbeijing\b/i,
      /\bxi\s+jinping\b/i,
      /\bpla\b/i,  // People's Liberation Army
      /\bplan\b/i, // PLA Navy
      /\bplaaf\b/i, // PLA Air Force
      /\bccp\b/i,
      /\bcommunist\s+party\b/i,
      // Regions
      /\bhong\s+kong\b/i,
      /\bxinjiang\b/i,
      /\buighur/i,
      /\btibet(?:an)?\b/i,
      /\bshanghai\b/i,
      /\bshenzhen\b/i,
      /\bguangdong\b/i,
      /\bfujian\b/i,
    ],
    medium: [
      /\bsouth\s+china\s+sea\b/i,
      /\beast\s+china\s+sea\b/i,
      /\bspratlys?\b/i,
      /\bparacel/i,
      /\bsenkaku\b/i,
      /\bdiaoyu\b/i,
      /\bfirst\s+island\s+chain\b/i,
      /\bquad\b/i,  // Often in China context
      /\baukus\b/i,
      /\bpacific\s+fleet\b/i,
      /\b7th\s+fleet\b/i,
      /\bindopacific\b/i,
      /\bphilippine/i,  // Often in SCS context
      /\bmanila\b/i,
    ],
    low: [
      /\bsemiconductor/i,
      /\btsmc\b/i,
      /\brare\s+earth/i,
      /\bsanctions\b.*\bchina\b/i,
    ],
  },

  'venezuela': {
    high: [
      /\bvenezuela(?:n)?\b/i,
      /\bcaracas\b/i,
      /\bmaduro\b/i,
      /\bguaid[oóò]/i,  // Word boundary at end doesn't work with accents
      /\bjuan\s+guaid/i,
      /\bchavez\b/i,
      /\bchavista/i,
      /\bpdvsa\b/i,  // State oil company
      /\bmaracaibo\b/i,
      /\bvalencia\b/i,
      /\bbarquisimeto\b/i,
    ],
    medium: [
      /\bessequibo\b/i,  // Disputed region with Guyana
      /\bguyana\b/i,     // Often in Venezuela context now
      /\bcolombia(?:n)?\b.*\bborder\b/i,
      /\bbrazil(?:ian)?\b.*\bborder\b/i,
      /\borinoco\b/i,
      /\bopposition\b.*\bvenezuela\b/i,
    ],
    low: [
      /\blatin\s+america\b/i,
      /\bsouth\s+america\b/i,
      /\bcaribbean\b/i,
    ],
  },

  'us-domestic': {
    high: [
      // Government/Politics
      /\bwhite\s+house\b/i,
      /\bcongress(?:ional)?\b/i,
      /\bsenate\b/i,
      /\bhouse\s+of\s+rep/i,
      /\bsupreme\s+court\b/i,
      /\bfbi\b/i,
      /\bcia\b/i,
      /\bdoj\b/i,
      /\bdhs\b/i,
      /\bhomeland\s+security\b/i,
      /\bsecret\s+service\b/i,
      /\bnational\s+guard\b/i,
      // People
      /\bbiden\b/i,
      /\btrump\b/i,
      /\bharris\b/i,
      /\bpelosi\b/i,
      /\bschumer\b/i,
      /\bmcconnell\b/i,
      /\bmccarthy\b/i,
      // Specific US events
      /\bcapitol\b/i,
      /\bjanuary\s+6\b/i,
      /\bj6\b/i,
      /\b2024\s+election\b/i,
      /\bmaga\b/i,
    ],
    medium: [
      /\bwashington\s*,?\s*d\.?c\.?\b/i,
      /\bpentagon\b/i,  // Could be foreign policy too
      /\bstate\s+department\b/i,  // Could be foreign policy too
      /\bamerican\b/i,
      /\bu\.?s\.?\s+(military|forces|troops)\b/i,
      /\brepublican/i,
      /\bdemocrat/i,
      /\bgop\b/i,
      // US Cities (domestic context)
      /\bnew\s+york\b/i,
      /\blos\s+angeles\b/i,
      /\bchicago\b/i,
      /\bhouston\b/i,
      /\bphoenix\b/i,
      /\bphiladelphia\b/i,
      /\bsan\s+antonio\b/i,
      /\bsan\s+diego\b/i,
      /\bdallas\b/i,
      /\bsan\s+francisco\b/i,
      /\baustin\b/i,
      /\bseattle\b/i,
      /\bdenver\b/i,
      /\batlanta\b/i,
      /\bmiami\b/i,
      /\bboston\b/i,
    ],
    low: [
      /\bdomestic\b/i,
      /\bfederal\b/i,
      /\bstate\s+level\b/i,
      /\bgovernor\b/i,
    ],
  },
  // Seismic is a separate data type, not a geopolitical region
  // No keyword detection needed - uses USGS API directly
  'seismic': {
    high: [],
    medium: [],
    low: [],
  },
};

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Calculate region score from text
 */
function scoreRegion(text: string, region: Exclude<WatchpointId, 'all'>): RegionMatch {
  const patterns = regionPatterns[region];
  const matchedKeywords: string[] = [];
  let score = 0;

  // High confidence matches (3 points each)
  for (const pattern of patterns.high) {
    const match = text.match(pattern);
    if (match) {
      matchedKeywords.push(match[0]);
      score += 3;
    }
  }

  // Medium confidence matches (2 points each)
  for (const pattern of patterns.medium) {
    const match = text.match(pattern);
    if (match) {
      matchedKeywords.push(match[0]);
      score += 2;
    }
  }

  // Low confidence matches (1 point each)
  for (const pattern of patterns.low) {
    const match = text.match(pattern);
    if (match) {
      matchedKeywords.push(match[0]);
      score += 1;
    }
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (score >= 6 || matchedKeywords.some(k => patterns.high.some(p => p.test(k)))) {
    confidence = 'high';
  } else if (score >= 3) {
    confidence = 'medium';
  }

  return {
    region,
    score,
    matchedKeywords: [...new Set(matchedKeywords)], // Dedupe
    confidence,
  };
}

/**
 * Detect region from message text
 */
export function detectRegion(
  text: string,
  sourceDefaultRegion: WatchpointId = 'all'
): RegionDetectionResult {
  const regions: Exclude<WatchpointId, 'all'>[] = [
    'middle-east',
    'ukraine-russia',
    'china-taiwan',
    'venezuela',
    'us-domestic',
  ];

  // Score all regions
  const allMatches = regions
    .map(region => scoreRegion(text, region))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score);

  // Determine detected region
  let detectedRegion: WatchpointId | null = null;
  let usedFallback = false;

  if (allMatches.length > 0) {
    const topMatch = allMatches[0];

    // Only use detection if it's reasonably confident
    // Require at least score of 3 or a high-confidence keyword
    if (topMatch.score >= 3 || topMatch.confidence === 'high') {
      detectedRegion = topMatch.region;
    }
  }

  // If no confident detection, use source's default
  if (!detectedRegion) {
    if (sourceDefaultRegion !== 'all') {
      detectedRegion = sourceDefaultRegion;
      usedFallback = true;
    } else {
      // If source default is 'all' and no detection, return null
      detectedRegion = null;
    }
  }

  return {
    detectedRegion,
    allMatches,
    usedFallback,
  };
}

/**
 * Get the final region for a message
 * Combines detection with source defaults
 */
export function getMessageRegion(
  text: string,
  sourceDefaultRegion: WatchpointId,
  sourceIsRegionSpecific: boolean = false
): WatchpointId {
  // If source is region-specific (like Euromaidan Press), always use source region
  if (sourceIsRegionSpecific && sourceDefaultRegion !== 'all') {
    return sourceDefaultRegion;
  }

  // Otherwise, try to detect from message
  const result = detectRegion(text, sourceDefaultRegion);

  // Return detected region, or source default, or 'all'
  return result.detectedRegion || sourceDefaultRegion || 'all';
}

// =============================================================================
// UI HELPERS
// =============================================================================

export const regionDisplayNames: Record<WatchpointId, string> = {
  'middle-east': 'Middle East',
  'ukraine-russia': 'Ukraine',
  'china-taiwan': 'Taiwan',
  'venezuela': 'Venezuela',
  'us-domestic': 'US',
  'seismic': 'Seismic Activity',
  'all': 'All Regions',
};

export const regionEmojis: Record<WatchpointId, string> = {
  'middle-east': '🇮🇱',
  'ukraine-russia': '🇺🇦',
  'china-taiwan': '🇹🇼',
  'venezuela': '🇻🇪',
  'us-domestic': '🇺🇸',
  'seismic': '🌍',
  'all': '🌍',
};
