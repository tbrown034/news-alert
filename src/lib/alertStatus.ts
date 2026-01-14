import { NewsItem, AlertStatus, SourceTier } from '@/types';

// =============================================================================
// ALERT STATUS LOGIC
// =============================================================================
// Determines the cascade-aware badge for each news item:
// - FIRST: Early report from OSINT/ground source (< 30 min, relevant keywords)
// - DEVELOPING: Multiple OSINT/ground sources reporting similar story
// - CONFIRMED: Official source or major news org reports (confirmation layer)
// =============================================================================

const FIRST_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// Tiers that can produce "FIRST" reports (the moat)
const FIRST_TIERS: SourceTier[] = ['osint', 'ground'];

// Tiers that produce "CONFIRMED" reports
const CONFIRMATION_TIERS: SourceTier[] = ['official', 'reporter'];

// Keywords that indicate significant news worth alerting
const SIGNIFICANT_KEYWORDS = [
  // Breaking/urgent prefixes
  'breaking', 'urgent', 'alert', 'just in', 'developing',
  // Military/conflict
  'strike', 'attack', 'explosion', 'missile', 'drone', 'airstrike',
  'troops', 'military', 'invasion', 'offensive', 'frontline',
  // Diplomatic/political crisis
  'ceasefire', 'peace', 'hostage', 'assassination', 'coup',
  'martial law', 'emergency', 'sanctions', 'expelled',
  // Critical infrastructure
  'nuclear', 'chemical', 'biological', 'embassy', 'evacuate',
  // Civil unrest
  'protests', 'riot', 'crackdown', 'killed', 'casualties',
];

// Check if content contains significant keywords
function hasSignificantKeywords(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  return SIGNIFICANT_KEYWORDS.some((kw) => text.includes(kw));
}

// Determine alert status for a single item
export function determineAlertStatus(
  item: NewsItem,
  allItems: NewsItem[]
): AlertStatus {
  const now = Date.now();
  const itemAge = now - item.timestamp.getTime();
  const tier = item.source.tier;

  // CONFIRMED: Official/reporter tier sources always show as confirmation
  if (CONFIRMATION_TIERS.includes(tier)) {
    // Check if this confirms an earlier OSINT report
    const hasSignificant = hasSignificantKeywords(item.title, item.content);
    if (hasSignificant) {
      return 'confirmed';
    }
    return null;
  }

  // OSINT/Ground sources
  if (FIRST_TIERS.includes(tier)) {
    const hasSignificant = hasSignificantKeywords(item.title, item.content);

    if (!hasSignificant) {
      return null;
    }

    // FIRST: Within 30 minutes and significant
    if (itemAge < FIRST_WINDOW_MS) {
      // Check if multiple OSINT sources are reporting similar
      const similarOsintItems = findSimilarItems(item, allItems, FIRST_TIERS);

      if (similarOsintItems.length >= 2) {
        return 'developing';
      }

      return 'first';
    }

    // After 30 minutes, check if it became confirmed
    const hasConfirmation = allItems.some(
      (other) =>
        CONFIRMATION_TIERS.includes(other.source.tier) &&
        isSimilar(item.title, other.title) &&
        other.timestamp.getTime() > item.timestamp.getTime()
    );

    if (hasConfirmation) {
      return 'confirmed';
    }

    return null;
  }

  return null;
}

// Find items with similar content from specified tiers
function findSimilarItems(
  item: NewsItem,
  allItems: NewsItem[],
  tiers: SourceTier[]
): NewsItem[] {
  return allItems.filter(
    (other) =>
      other.id !== item.id &&
      tiers.includes(other.source.tier) &&
      isSimilar(item.title, other.title)
  );
}

// Simple similarity check based on shared keywords
function isSimilar(title1: string, title2: string): boolean {
  const words1 = extractKeywords(title1);
  const words2 = extractKeywords(title2);

  const shared = words1.filter((w) => words2.includes(w));
  const similarity = shared.length / Math.max(words1.length, words2.length);

  return similarity >= 0.3; // 30% shared keywords
}

// Extract meaningful keywords from text
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'that', 'this', 'these', 'those', 'it', 'its', 'he', 'she', 'they',
    'we', 'you', 'i', 'me', 'my', 'your', 'his', 'her', 'their', 'our',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
    'says', 'said', 'after', 'about', 'over', 'into', 'during', 'before',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

// Process all items and add alert status + cross-references
export function processAlertStatuses(items: NewsItem[]): NewsItem[] {
  return items.map((item) => {
    const alertStatus = determineAlertStatus(item, items);

    // Find who confirmed this if it's a FIRST report
    let confirmsSource: string | undefined;
    if (alertStatus === 'confirmed' && CONFIRMATION_TIERS.includes(item.source.tier)) {
      const originalOsint = items.find(
        (other) =>
          FIRST_TIERS.includes(other.source.tier) &&
          isSimilar(item.title, other.title) &&
          other.timestamp.getTime() < item.timestamp.getTime()
      );
      if (originalOsint) {
        confirmsSource = originalOsint.source.name;
      }
    }

    return {
      ...item,
      alertStatus,
      confirmsSource,
    };
  });
}

// Sort items by cascade priority (OSINT first - the moat)
export function sortByCascadePriority(items: NewsItem[]): NewsItem[] {
  // Tier priority: OSINT/ground sources ALWAYS come first (the moat)
  const tierPriority: Record<SourceTier, number> = {
    ground: 1,
    osint: 2,
    reporter: 3,
    official: 4,
  };

  // Alert status priority within same tier
  const statusPriority: Record<string, number> = {
    first: 1,
    developing: 2,
    confirmed: 3,
  };

  return [...items].sort((a, b) => {
    // FIRST: Sort by tier priority (OSINT/ground ALWAYS first - this is the moat)
    const aTier = tierPriority[a.source.tier];
    const bTier = tierPriority[b.source.tier];
    if (aTier !== bTier) return aTier - bTier;

    // SECOND: Within same tier, sort by alert status
    const aStatus = a.alertStatus ? statusPriority[a.alertStatus] : 4;
    const bStatus = b.alertStatus ? statusPriority[b.alertStatus] : 4;
    if (aStatus !== bStatus) return aStatus - bStatus;

    // THIRD: By recency
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}
