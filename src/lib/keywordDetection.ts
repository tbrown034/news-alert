import { NewsItem, WatchpointId, EventSeverity, EventType, EventSignal } from '@/types';

// =============================================================================
// SMART KEYWORD DETECTION FOR MAJOR EVENTS
// =============================================================================
// Analyzes news content to determine severity and event type

// Weighted keyword categories
const CRITICAL_KEYWORDS: Record<string, number> = {
  // Nuclear/WMD
  'nuclear': 10,
  'nuclear strike': 15,
  'nuclear launch': 15,
  'mushroom cloud': 12,
  'radiation': 8,
  'wmd': 10,
  'chemical attack': 12,
  'biological weapon': 12,

  // Mass casualty
  'mass casualty': 12,
  'massacre': 10,
  'genocide': 12,
  'ethnic cleansing': 12,
  'atrocity': 8,
  'war crime': 9,
  'mass grave': 10,

  // Large-scale military
  'invasion': 10,
  'ground invasion': 12,
  'declaration of war': 15,
  'mobilization': 8,
  'martial law': 9,
  'state of emergency': 7,
  'tactical nuclear': 15,

  // Leadership
  'assassination': 10,
  'killed': 4,
  'dead': 3,
  'coup': 10,
  'overthrown': 9,
};

const HIGH_KEYWORDS: Record<string, number> = {
  // Military action
  'airstrike': 6,
  'air strike': 6,
  'missile strike': 7,
  'bombardment': 6,
  'shelling': 5,
  'artillery': 4,
  'bombing': 5,
  'drone strike': 6,
  'ballistic missile': 8,
  'cruise missile': 7,
  'hypersonic': 7,
  'icbm': 10,

  // Casualties
  'casualties': 5,
  'wounded': 4,
  'injured': 3,
  'fatalities': 5,
  'death toll': 6,
  'killed': 4,

  // Escalation
  'escalation': 5,
  'retaliation': 5,
  'counterattack': 5,
  'offensive': 5,
  'advance': 3,
  'captured': 4,
  'fallen': 4,
  'overrun': 5,

  // Alerts
  'air raid': 7,
  'sirens': 5,
  'incoming': 5,
  'intercept': 4,
  'shelter': 4,
  'evacuation': 5,
  'evacuate': 5,

  // Terror
  'terrorist': 6,
  'terrorism': 6,
  'explosion': 5,
  'blast': 4,
  'detonation': 6,
  'hostage': 6,
  'hostages': 6,

  // Diplomatic crisis
  'sanctions': 4,
  'expelled': 4,
  'recalled ambassador': 5,
  'severed ties': 6,
  'ultimatum': 6,
  'threatens': 4,
  'warning': 3,
};

const MODERATE_KEYWORDS: Record<string, number> = {
  // Military presence
  'troops': 3,
  'soldiers': 3,
  'military': 2,
  'forces': 2,
  'deployment': 3,
  'reinforcements': 3,
  'buildup': 3,

  // Political
  'protest': 3,
  'demonstration': 2,
  'unrest': 3,
  'riot': 4,
  'clashes': 3,
  'confrontation': 3,

  // Diplomatic
  'talks': 2,
  'negotiations': 2,
  'summit': 2,
  'statement': 1,
  'condemned': 2,
  'denounced': 2,

  // Infrastructure
  'blackout': 4,
  'power outage': 3,
  'cyberattack': 5,
  'hack': 3,
  'breach': 3,
};

// Confirmation/development markers
const CONFIRMATION_MARKERS = [
  'confirmed',
  'verified',
  'official',
  'breaking',
  'just in',
  'update:',
  'confirmed:',
  'official:',
];

const DEVELOPING_MARKERS = [
  'developing',
  'unconfirmed',
  'reports',
  'reportedly',
  'allegedly',
  'sources say',
  'unverified',
  'claims',
  'rumored',
  'possible',
];

// Negation words that reduce score when near keywords
const NEGATION_WORDS = [
  'no',
  'not',
  'none',
  'denied',
  'denies',
  'deny',
  'false',
  'hoax',
  'debunked',
  'fake',
  'satire',
  'parody',
  'untrue',
  'unfounded',
];

// Event type detection patterns
const EVENT_TYPE_PATTERNS: Record<EventType, RegExp[]> = {
  military_action: [
    /strike|bomb|shell|missile|artillery|drone|aircraft|tank|troops|offensive|attack/i,
  ],
  mass_casualty: [
    /casualt|death toll|killed|dead|fatalities|victim/i,
  ],
  diplomatic_crisis: [
    /sanction|diplomat|ambassador|embassy|recalled|expelled|ties/i,
  ],
  natural_disaster: [
    /earthquake|tsunami|hurricane|typhoon|flood|wildfire|volcano|magnitude/i,
  ],
  terror_attack: [
    /terror|bomb|explosion|hostage|isis|al.?qaeda|jihad/i,
  ],
  civil_unrest: [
    /protest|riot|demonstrat|unrest|uprising|revolt|crowd/i,
  ],
  nuclear_event: [
    /nuclear|radiation|reactor|uranium|plutonium|warhead/i,
  ],
  humanitarian: [
    /refugee|humanitarian|aid|famine|starv|displaced/i,
  ],
  infrastructure: [
    /power|grid|blackout|internet|cyber|infrastructure|dam|bridge/i,
  ],
  cyber_attack: [
    /cyber|hack|breach|malware|ransomware|ddos/i,
  ],
  unknown: [/.*/],
};

/**
 * Check if a negation word appears within N words before the keyword position
 * This prevents false negatives like "nuclear weapons confirmed" scoring low
 * because "no" appears elsewhere in the text
 */
function hasNegationNearKeyword(words: string[], keywordWordIndex: number, windowSize: number = 5): boolean {
  const startIndex = Math.max(0, keywordWordIndex - windowSize);
  for (let i = startIndex; i < keywordWordIndex; i++) {
    if (NEGATION_WORDS.includes(words[i])) {
      return true;
    }
  }
  return false;
}

/**
 * Find word index where keyword starts in the text
 */
function findKeywordWordIndex(words: string[], keyword: string): number {
  const keywordWords = keyword.split(' ');
  const firstWord = keywordWords[0];

  for (let i = 0; i < words.length; i++) {
    if (words[i] === firstWord || words[i].includes(firstWord)) {
      // For multi-word keywords, verify subsequent words match
      if (keywordWords.length > 1) {
        let allMatch = true;
        for (let j = 1; j < keywordWords.length && i + j < words.length; j++) {
          if (!words[i + j].includes(keywordWords[j])) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) return i;
      } else {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Analyze text for keyword matches and calculate score
 * Uses proximity-based negation: only reduces score if negation is within 5 words of keyword
 */
function analyzeText(text: string): { score: number; matches: string[] } {
  const lowerText = text.toLowerCase();
  // Split into words, keeping alphanumeric characters
  const words = lowerText.split(/\s+/).map(w => w.replace(/[^a-z0-9-]/g, ''));
  let score = 0;
  const matches: string[] = [];

  // Helper to check and score a keyword
  const checkKeyword = (keyword: string, weight: number) => {
    if (lowerText.includes(keyword)) {
      const keywordIndex = findKeywordWordIndex(words, keyword);
      // Only apply negation multiplier if negation word is near the keyword
      const isNegated = keywordIndex >= 0 && hasNegationNearKeyword(words, keywordIndex);
      const multiplier = isNegated ? 0.3 : 1.0;
      score += weight * multiplier;
      matches.push(keyword);
    }
  };

  // Check critical keywords
  for (const [keyword, weight] of Object.entries(CRITICAL_KEYWORDS)) {
    checkKeyword(keyword, weight);
  }

  // Check high keywords
  for (const [keyword, weight] of Object.entries(HIGH_KEYWORDS)) {
    checkKeyword(keyword, weight);
  }

  // Check moderate keywords
  for (const [keyword, weight] of Object.entries(MODERATE_KEYWORDS)) {
    checkKeyword(keyword, weight);
  }

  return { score, matches: [...new Set(matches)] };
}

/**
 * Detect the type of event based on content
 */
function detectEventType(text: string): EventType {
  const lowerText = text.toLowerCase();

  for (const [type, patterns] of Object.entries(EVENT_TYPE_PATTERNS)) {
    if (type === 'unknown') continue;
    if (patterns.some(pattern => pattern.test(lowerText))) {
      return type as EventType;
    }
  }

  return 'unknown';
}

/**
 * Check if content indicates confirmed vs developing situation
 */
function checkConfirmationStatus(text: string): { isConfirmed: boolean; isDeveloping: boolean } {
  const lowerText = text.toLowerCase();

  const isConfirmed = CONFIRMATION_MARKERS.some(marker =>
    lowerText.includes(marker.toLowerCase())
  );

  const isDeveloping = DEVELOPING_MARKERS.some(marker =>
    lowerText.includes(marker.toLowerCase())
  );

  return { isConfirmed, isDeveloping };
}

/**
 * Convert score to severity level
 */
function scoreToSeverity(score: number): EventSeverity {
  if (score >= 15) return 'critical';
  if (score >= 8) return 'high';
  if (score >= 4) return 'moderate';
  return 'routine';
}

/**
 * Generate a brief summary of what was detected
 */
function generateSummary(
  severity: EventSeverity,
  type: EventType,
  matchedKeywords: string[],
  isConfirmed: boolean,
  isDeveloping: boolean
): string {
  const typeLabels: Record<EventType, string> = {
    military_action: 'Military action',
    mass_casualty: 'Mass casualty event',
    diplomatic_crisis: 'Diplomatic crisis',
    natural_disaster: 'Natural disaster',
    terror_attack: 'Terror attack',
    civil_unrest: 'Civil unrest',
    nuclear_event: 'Nuclear-related event',
    humanitarian: 'Humanitarian situation',
    infrastructure: 'Infrastructure event',
    cyber_attack: 'Cyber attack',
    unknown: 'Developing situation',
  };

  const status = isDeveloping ? 'DEVELOPING' : (isConfirmed ? 'CONFIRMED' : '');
  const typeLabel = typeLabels[type];
  const keywordsPreview = matchedKeywords.slice(0, 3).join(', ');

  return `${status ? `[${status}] ` : ''}${typeLabel} detected (${keywordsPreview})`;
}

/**
 * Main function: Analyze a news item for major event signals
 */
export function analyzeNewsItem(item: NewsItem): EventSignal {
  // Combine title and content for analysis
  const fullText = `${item.title} ${item.content}`;

  // Analyze text
  const { score, matches } = analyzeText(fullText);

  // Boost score for breaking news
  const breakingBoost = item.isBreaking ? 1.5 : 1.0;
  const adjustedScore = score * breakingBoost;

  // Determine severity
  const severity = scoreToSeverity(adjustedScore);

  // Detect event type
  const type = detectEventType(fullText);

  // Check confirmation status
  const { isConfirmed, isDeveloping } = checkConfirmationStatus(fullText);

  // Generate summary
  const summary = generateSummary(severity, type, matches, isConfirmed, isDeveloping);

  return {
    severity,
    type,
    score: Math.round(adjustedScore * 10) / 10,
    matchedKeywords: matches,
    isConfirmed,
    isDeveloping,
    summary,
  };
}

/**
 * Batch analyze multiple news items and return only significant ones
 */
export function findMajorEvents(
  items: NewsItem[],
  minSeverity: EventSeverity = 'moderate'
): Array<NewsItem & { eventSignal: EventSignal }> {
  const severityOrder: Record<EventSeverity, number> = {
    critical: 3,
    high: 2,
    moderate: 1,
    routine: 0,
  };

  const minLevel = severityOrder[minSeverity];

  return items
    .map(item => ({
      ...item,
      eventSignal: analyzeNewsItem(item),
    }))
    .filter(item => severityOrder[item.eventSignal.severity] >= minLevel)
    .sort((a, b) => b.eventSignal.score - a.eventSignal.score);
}

/**
 * Get aggregate signal for a region - are multiple sources reporting major events?
 */
export function getRegionalAlert(
  items: NewsItem[],
  region: WatchpointId
): {
  hasAlert: boolean;
  alertLevel: EventSeverity;
  topEvents: Array<{ title: string; signal: EventSignal }>;
  summary: string;
} {
  // Filter to region
  const regionItems = region === 'all'
    ? items
    : items.filter(item => item.region === region);

  // Analyze all items
  const analyzed = regionItems.map(item => ({
    title: item.title,
    signal: analyzeNewsItem(item),
  }));

  // Count by severity
  const criticalCount = analyzed.filter(a => a.signal.severity === 'critical').length;
  const highCount = analyzed.filter(a => a.signal.severity === 'high').length;
  const moderateCount = analyzed.filter(a => a.signal.severity === 'moderate').length;

  // Determine overall alert level
  let alertLevel: EventSeverity = 'routine';
  if (criticalCount >= 1) {
    alertLevel = 'critical';
  } else if (highCount >= 2 || (highCount >= 1 && moderateCount >= 2)) {
    alertLevel = 'high';
  } else if (moderateCount >= 3 || highCount >= 1) {
    alertLevel = 'moderate';
  }

  const hasAlert = alertLevel !== 'routine';

  // Get top events sorted by score
  const topEvents = analyzed
    .filter(a => a.signal.severity !== 'routine')
    .sort((a, b) => b.signal.score - a.signal.score)
    .slice(0, 5);

  // Generate summary
  let summary = '';
  if (alertLevel === 'critical') {
    summary = `CRITICAL: Major event detected across ${criticalCount + highCount} sources`;
  } else if (alertLevel === 'high') {
    summary = `HIGH ACTIVITY: ${highCount + moderateCount} significant reports`;
  } else if (alertLevel === 'moderate') {
    summary = `Elevated activity: ${moderateCount} notable reports`;
  } else {
    summary = 'Normal activity levels';
  }

  return {
    hasAlert,
    alertLevel,
    topEvents,
    summary,
  };
}

/**
 * UI helper: Get severity indicator for display
 */
export function getSeverityIndicator(severity: EventSeverity): {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
} {
  switch (severity) {
    case 'critical':
      return {
        icon: '🚨',
        color: 'text-red-500',
        bgColor: 'bg-red-500/20',
        label: 'CRITICAL',
      };
    case 'high':
      return {
        icon: '⚠️',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/20',
        label: 'HIGH',
      };
    case 'moderate':
      return {
        icon: '📢',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/20',
        label: 'MODERATE',
      };
    default:
      return {
        icon: '📰',
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        label: 'ROUTINE',
      };
  }
}

/**
 * UI helper: Get event type label
 */
export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    military_action: 'Military',
    mass_casualty: 'Casualty',
    diplomatic_crisis: 'Diplomatic',
    natural_disaster: 'Disaster',
    terror_attack: 'Terror',
    civil_unrest: 'Unrest',
    nuclear_event: 'Nuclear',
    humanitarian: 'Humanitarian',
    infrastructure: 'Infrastructure',
    cyber_attack: 'Cyber',
    unknown: 'Event',
  };
  return labels[type];
}
