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

interface RegionMatch {
  region: WatchpointId;
  score: number;
  matchedKeywords: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface RegionDetectionResult {
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
  'us': {
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
      /\bdepartment\s+of\s+justice\b/i,
      /\bdhs\b/i,
      /\bhomeland\s+security\b/i,
      /\bICE\b/,
      /\bsecret\s+service\b/i,
      /\bnational\s+guard\b/i,
      // People (with possessives and variations)
      /\bbiden(?:'s)?\b/i,
      /\btrump(?:'s|ian|ism)?\b/i,
      /\bharris(?:'s)?\b/i,
      /\bpelosi(?:'s)?\b/i,
      /\bschumer(?:'s)?\b/i,
      /\bmcconnell(?:'s)?\b/i,
      /\bmccarthy(?:'s)?\b/i,
      /\bvance(?:'s)?\b/i,
      /\bdesantis(?:'s)?\b/i,
      /\baoc\b/i,
      /\bocasio.cortez\b/i,
      /\brfk\b/i,
      /\bkennedy\s+jr\b/i,
      // Specific US events
      /\bcapitol\b/i,
      /\bjanuary\s+6\b/i,
      /\bj6\b/i,
      /\b2024\s+election\b/i,
      /\bmaga\b/i,
      // Notable cases
      /\bjeffrey\s+epstein\b/i,
      /\bepstein\b/i,
      // US States (with possessive forms) - high confidence since definitive
      /\balabama(?:'s)?\b/i,
      /\balaska(?:'s)?\b/i,
      /\barizona(?:'s)?\b/i,
      /\barkansas(?:'s)?\b/i,
      /\bcalifornia(?:'s)?\b/i,
      /\bcolorado(?:'s)?\b/i,
      /\bconnecticut(?:'s)?\b/i,
      /\bdelaware(?:'s)?\b/i,
      /\bflorida(?:'s)?\b/i,
      /\bgeorgia(?:'s)?\b/i, // Note: ambiguous US state / country — tiebreaker prefers foreign
      /\bhawaii(?:'s)?\b/i,
      /\bidaho(?:'s)?\b/i,
      /\billinois(?:'s)?\b/i,
      /\bindiana(?:'s)?\b/i,
      /\biowa(?:'s)?\b/i,
      /\bkansas(?:'s)?\b/i,
      /\bkentucky(?:'s)?\b/i,
      /\blouisiana(?:'s)?\b/i,
      /\bmaine(?:'s)?\b/i,
      /\bmaryland(?:'s)?\b/i,
      /\bmassachusetts(?:'s)?\b/i,
      /\bmichigan(?:'s)?\b/i,
      /\bminnesota(?:'s)?\b/i,
      /\bmississippi(?:'s)?\b/i,
      /\bmissouri(?:'s)?\b/i,
      /\bmontana(?:'s)?\b/i,
      /\bnebraska(?:'s)?\b/i,
      /\bnevada(?:'s)?\b/i,
      /\bnew\s+hampshire(?:'s)?\b/i,
      /\bnew\s+jersey(?:'s)?\b/i,
      /\bnew\s+mexico(?:'s)?\b/i,
      /\bnorth\s+carolina(?:'s)?\b/i,
      /\bnorth\s+dakota(?:'s)?\b/i,
      /\bohio(?:'s)?\b/i,
      /\boklahoma(?:'s)?\b/i,
      /\boregon(?:'s)?\b/i,
      /\bpennsylvania(?:'s)?\b/i,
      /\brhode\s+island(?:'s)?\b/i,
      /\bsouth\s+carolina(?:'s)?\b/i,
      /\bsouth\s+dakota(?:'s)?\b/i,
      /\btennessee(?:'s)?\b/i,
      /\btexas(?:'s)?\b/i,
      /\butah(?:'s)?\b/i,
      /\bvermont(?:'s)?\b/i,
      /\bvirginia(?:'s)?\b/i,
      /\bwashington(?:'s)?\b/i,
      /\bwest\s+virginia(?:'s)?\b/i,
      /\bwisconsin(?:'s)?\b/i,
      /\bwyoming(?:'s)?\b/i,
      // US federal agencies
      /\bepa\b/i,
      /\bfda\b/i,
      /\bjustice\s+department\b/i,
      // US law enforcement / border agencies
      /\bborder\s+patrol\b/i,
      /\bcbp\b/i,
      /\bnypd\b/i,
      /\bnyc\b/i,
      /\bDEA\b/,
      /\bATF\b/,
      // US abbreviations - high confidence since definitive
      /\bU\.S\./,
      /(?:^|[\s"'])US(?:[\s"',.;:!?]|$)/,
      // US cities - unambiguous for a US-audience platform
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
      /\bminneapolis\b/i,
      /\bdetroit\b/i,
      /\bportland\b/i,
      /\blas\s+vegas\b/i,
      /\bpittsburgh\b/i,
      /\bbaltimore\b/i,
      // US geographic regions
      /\beast\s+coast\b/i,
      /\bwest\s+coast\b/i,
      /\bmidwest\b/i,
      /\bsouthwest\b/i,
      /\bnortheast\b/i,
      /\bsoutheast\b/i,
      /\bpacific\s+northwest\b/i,
    ],
    medium: [
      /\bwashington\s*,?\s*d\.?c\.?\b/i,
      /\bpentagon\b/i,
      /\bstate\s+department\b/i,
      /\bamerican\b/i,
      /\bu\.?s\.?\s+(military|forces|troops)\b/i,
      /\brepublican/i,
      /\bdemocrat/i,
      /\bgop\b/i,
    ],
    low: [
      /\bdomestic\b/i,
      /\bfederal\b/i,
      /\bstate\s+level\b/i,
      /\bgovernor\b/i,
    ],
  },

  'latam': {
    high: [
      // Venezuela
      /\bvenezuela(?:ns?)?\b/i,
      /\bcaracas\b/i,
      /\bmaduro\b/i,
      /\bguaid[oóò]/i,
      /\bjuan\s+guaid/i,
      /\bchavez\b/i,
      /\bchavista/i,
      /\bpdvsa\b/i,
      /\bmaracaibo\b/i,
      // Brazil
      /\bbrazil(?:ian)?\b/i,
      /\bbrasilia\b/i,
      /\blula\b/i,
      /\bbolsonaro\b/i,
      /\bsao\s+paulo\b/i,
      /\brio\s+de\s+janeiro\b/i,
      // Argentina
      /\bargentina\b/i,
      /\bbuenos\s+aires\b/i,
      /\bmilei\b/i,
      // Mexico
      /\bmexic(?:o|an)\b/i,
      /\bmexico\s+city\b/i,
      /\bamlo\b/i,
      /\bsheinbaum\b/i,
      /\bcartel\b/i,
      // Colombia
      /\bcolombia(?:n)?\b/i,
      /\bbogota\b/i,
      /\bpetro\b/i,
      /\bfarc\b/i,
      /\bmedellin\b/i,
      // Chile
      /\bchile(?:an)?\b/i,
      /\bsantiago\b/i,
      /\bboric\b/i,
      // Peru
      /\bperu(?:vian)?\b/i,
      /\blima\b/i,
      // Cuba
      /\bcuba(?:n)?\b/i,
      /\bhavana\b/i,
      /\bcastro\b/i,
      // Caribbean
      /\bhaiti(?:an)?\b/i,
      /\bport.au.prince\b/i,
      /\bjamaica(?:n)?\b/i,
      /\bpuerto\s+rico\b/i,
      /\bdominican\s+republic\b/i,
      /\bsanto\s+domingo\b/i,
    ],
    medium: [
      /\bessequibo\b/i,
      /\bguyana\b/i,
      /\borinoco\b/i,
      /\becuador\b/i,
      /\bquito\b/i,
      /\bbolivia(?:n)?\b/i,
      /\bla\s+paz\b/i,
      /\bparaguay\b/i,
      /\buruguay\b/i,
      /\bpanama\b/i,
      /\bcosta\s+rica\b/i,
      /\bnicaragua\b/i,
      /\bortega\b/i,
      /\bhonduras\b/i,
      /\bel\s+salvador\b/i,
      /\bbukele\b/i,
      /\bguatemala(?:n)?\b/i,
      /\bbahamas\b/i,
      /\btrinidad\b/i,
      /\bbarbados\b/i,
    ],
    low: [
      /\blatin\s+america\b/i,
      /\bsouth\s+america\b/i,
      /\bcaribbean\b/i,
      /\bcentral\s+america\b/i,
      /\blatam\b/i,
      /\bmercosur\b/i,
    ],
  },

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

  'europe-russia': {
    high: [
      // Ukraine
      /\bukrain(?:e|ian)\b/i,
      /\bkyiv\b/i,
      /\bkharkiv\b/i,
      /\bodes+a\b/i,
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
      // Ukraine Regions/Cities
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
      // Belarus
      /\bbelarus(?:ian)?\b/i,
      /\blukashenko\b/i,
      /\bminsk\b/i,
      // European countries
      /\bgerman(?:y)?\b/i,
      /\bberlin\b/i,
      /\bfrance\b/i,
      /\bfrench\b/i,
      /\bparis\b/i,
      /\bmacron\b/i,
      /\bbritain\b/i,
      /\bbritish\b/i,
      /\blondon\b/i,
      /\bstarmer\b/i,
      /\bpoland\b/i,
      /\bwarsaw\b/i,
      /\bnato\b/i,
      /\beuropean\s+union\b/i,
      /\beu\b/i,
      /\bbrussels\b/i,
      // UK
      /\bU\.?K\.?\b/,
      // Hungary
      /\bhungary\b/i,
      /\bhungarian\b/i,
      /\borb[aá]n\b/i,
      /\bbudapest\b/i,
      // Italy
      /\bital(?:y|ian)\b/i,
      /\brome\b/i,
      /\bmilan\b/i,
      // Norway
      /\bnorway\b/i,
      /\bnorwegian\b/i,
      /\boslo\b/i,
      // Georgia (country) - Caucasus
      /\btbilisi\b/i,
      /\bsouth\s+ossetia\b/i,
      /\babkhazia\b/i,
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
      /\bpatrio?t\b/i,
      /\bhimars\b/i,
      /\bleopard\b/i,
      /\babrams\b/i,
      /\bf-16\b/i,
      /\bmig\b/i,
      /\bsu-\d+\b/i,
      /\brostov\b/i,
      /\bbelgorod\b/i,
      /\bkursk\b/i,
      /\bbryansk\b/i,
      // Other European
      /\bspain\b/i,
      /\bspanish\b/i,
      /\bmadrid\b/i,
      /\bnetherlands\b/i,
      /\bamsterdam\b/i,
      /\bbaltic/i,
      /\bscandinavia/i,
      /\bnordic\b/i,
    ],
    low: [
      /\beastern\s+front\b/i,
      /\bsouthern\s+front\b/i,
      /\bcounter.?offensive\b/i,
      /\bmobilization\b/i,
      /\bpartial\s+mobilization\b/i,
      /\beurope\b/i,
    ],
  },

  'asia': {
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
      /\bPLA\b/,
      /\bPLAN\b/,
      /\bPLAAF\b/,
      /\bccp\b/i,
      /\bcommunist\s+party\b/i,
      // China Regions
      /\bhong\s+kong\b/i,
      /\bxinjiang\b/i,
      /\buighur/i,
      /\btibet(?:an)?\b/i,
      /\bshanghai\b/i,
      /\bshenzhen\b/i,
      /\bguangdong\b/i,
      /\bfujian\b/i,
      // Japan
      /\bjapan(?:ese)?\b/i,
      /\btokyo\b/i,
      // Korea
      /\bnorth\s+korea\b/i,
      /\bsouth\s+korea\b/i,
      /\bpyongyang\b/i,
      /\bseoul\b/i,
      /\bkim\s+jong\b/i,
      // Southeast Asia
      /\bvietnam\b/i,
      /\bhanoi\b/i,
      /\bthailand\b/i,
      /\bbangkok\b/i,
      /\bindonesia\b/i,
      /\bjakarta\b/i,
      /\bsingapore\b/i,
      /\bmalaysia\b/i,
      /\bphilippine/i,
      /\bmanila\b/i,
      // Myanmar
      /\bmyanmar\b/i,
      /\bburma\b/i,
      /\brangoon\b/i,
      /\byangon\b/i,
      /\bnaypyidaw\b/i,
      // South Asia
      /\bindia(?:n)?\b/i,
      /\bnew\s+delhi\b/i,
      /\bmodi\b/i,
      /\bpakistan(?:i)?\b/i,
      /\bislamabad\b/i,
      /\bbangladesh(?:i)?\b/i,
      /\bdhaka\b/i,
      /\bafghanistan\b/i,
      /\bkabul\b/i,
    ],
    medium: [
      /\bsouth\s+china\s+sea\b/i,
      /\beast\s+china\s+sea\b/i,
      /\bspratlys?\b/i,
      /\bparacel/i,
      /\bsenkaku\b/i,
      /\bdiaoyu\b/i,
      /\bfirst\s+island\s+chain\b/i,
      /\bquad\b/i,
      /\baukus\b/i,
      /\bpacific\s+fleet\b/i,
      /\b7th\s+fleet\b/i,
      /\bindopacific\b/i,
      /\basean\b/i,
      /\bcambodia\b/i,
      /\blaos\b/i,
      /\bsri\s+lanka\b/i,
      /\bnepal\b/i,
    ],
    low: [
      /\bsemiconductor/i,
      /\btsmc\b/i,
      /\brare\s+earth/i,
      /\bsanctions\b.*\bchina\b/i,
      /\basia\b/i,
      /\bpacific\b/i,
    ],
  },

  'africa': {
    high: [
      // Major countries
      /\bnigeria(?:n)?\b/i,
      /\bkenya(?:n)?\b/i,
      /\bethiopia(?:n)?\b/i,
      /\bsudan(?:ese)?\b/i,
      /\bsouth\s+sudan\b/i,
      /\bsomalia(?:n)?\b/i,
      /\bcongo(?:lese)?\b/i,
      /\bdrc\b/i,
      /\bsouth\s+africa(?:n)?\b/i,
      /\bcameroon(?:ian)?\b/i,
      /\bghana(?:ian)?\b/i,
      /\btanzania(?:n)?\b/i,
      /\buganda(?:n)?\b/i,
      /\brwanda(?:n)?\b/i,
      /\bmozambique\b/i,
      /\bmali(?:an)?\b/i,
      /\bniger\b/i,
      /\bburkina\s+faso\b/i,
      /\bchad(?:ian)?\b/i,
      /\bsenegal(?:ese)?\b/i,
      /\beritrea(?:n)?\b/i,
      /\blibya(?:n)?\b/i,
      /\btunisia(?:n)?\b/i,
      /\balgeria(?:n)?\b/i,
      /\bmorocco\b/i,
      /\bmoroccan\b/i,
      /\bzimabawe\b/i,
      /\bzimbabwe(?:an)?\b/i,
      /\bangola(?:n)?\b/i,
      // Major cities
      /\blagos\b/i,
      /\bnairobi\b/i,
      /\baddis\s+ababa\b/i,
      /\bkhartoum\b/i,
      /\bpretoria\b/i,
      /\bcape\s+town\b/i,
      /\bjohannesburg\b/i,
      /\bdar\s+es\s+salaam\b/i,
      /\bkinshasa\b/i,
      /\bmogadishu\b/i,
      /\babuja\b/i,
      /\baccra\b/i,
      /\bkampala\b/i,
      /\bkigali\b/i,
      /\btripoli\b/i,
      /\bluanda\b/i,
      /\bdakar\b/i,
      // Key organizations and groups
      /\bafrican\s+union\b/i,
      /\becowas\b/i,
      /\bboko\s+haram\b/i,
      /\bal.?shabaab\b/i,
      /\bmadagascar\b/i,
    ],
    medium: [
      /\bsahel\b/i,
      /\bsub.saharan\b/i,
      /\bhorn\s+of\s+africa\b/i,
      /\bmaghreb\b/i,
      /\bwest\s+africa\b/i,
      /\beast\s+africa\b/i,
      /\bsouthern\s+africa\b/i,
      /\bcentral\s+africa\b/i,
      /\bnorth\s+africa\b/i,
      /\bbenin\b/i,
      /\btogo\b/i,
      /\bgabon\b/i,
      /\bguinea\b/i,
      /\bsierra\s+leone\b/i,
      /\bliberia(?:n)?\b/i,
      /\bivory\s+coast\b/i,
      /\bcote\s+d.ivoire\b/i,
      /\bmalawi\b/i,
      /\bzambia(?:n)?\b/i,
      /\bbotswana\b/i,
      /\bnamibia(?:n)?\b/i,
      /\bswaziland\b/i,
      /\beswatini\b/i,
      /\blesotho\b/i,
      /\bdjibouti\b/i,
      /\bmauritania\b/i,
      /\bcentral\s+african\s+republic\b/i,
      /\bequatorial\s+guinea\b/i,
      /\bcabo\s+verde\b/i,
    ],
    low: [
      /\bafrica\b/i,
      /\bafrican\b/i,
      /\bA\.?U\.?\b/,
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
  const regions: Exclude<WatchpointId, 'all' | 'seismic'>[] = [
    'us',
    'latam',
    'middle-east',
    'europe-russia',
    'asia',
    'africa',
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
      // US-audience tiebreaker: when a post mentions both US and foreign
      // entities, the foreign angle is typically the news for a US audience.
      // e.g. "Congress approves Ukraine aid" → the news is about Ukraine.
      // Only prefer foreign when its score is at least as high as US score.
      // When US score is strictly higher, it's domestic-focused (keep US).
      if (topMatch.region === 'us' && allMatches.length > 1) {
        const bestForeign = allMatches.find(
          m => m.region !== 'us' && (m.score >= 3 || m.confidence === 'high')
        );
        if (bestForeign && bestForeign.score >= topMatch.score) {
          detectedRegion = bestForeign.region;
        } else {
          detectedRegion = topMatch.region;
        }
      } else {
        detectedRegion = topMatch.region;
      }
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
  'us': 'US',
  'latam': 'Latin America',
  'middle-east': 'Middle East',
  'europe-russia': 'Europe-Russia',
  'asia': 'Asia',
  'africa': 'Africa',
  'seismic': 'Seismic Activity',
  'all': 'All Regions',
};
