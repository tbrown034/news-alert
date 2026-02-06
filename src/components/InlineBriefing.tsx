'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { WatchpointId } from '@/types';
import { regionDisplayNames } from '@/lib/regionDetection';
import { SparklesIcon, BoltIcon, RocketLaunchIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSession } from '@/lib/auth-client';

// Client-side cache - persists across region switches, keyed by region+tier
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const briefingCache = new Map<string, { data: BriefingData; cachedAt: number }>();

type ModelTier = 'quick' | 'advanced' | 'pro';

function getCacheKey(region: WatchpointId, tier: ModelTier): string {
  return `${region}:${tier}`;
}

function getCachedBriefing(region: WatchpointId, tier: ModelTier): BriefingData | null {
  const key = getCacheKey(region, tier);
  const cached = briefingCache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.cachedAt;
  if (age > CACHE_TTL_MS) {
    briefingCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedBriefing(region: WatchpointId, tier: ModelTier, data: BriefingData): void {
  briefingCache.set(getCacheKey(region, tier), { data, cachedAt: Date.now() });
}

interface KeyDevelopment {
  headline: string;
  detail: string;
  sources: string[];
  severity: 'critical' | 'high' | 'moderate' | 'routine';
  confidence?: 'high' | 'medium' | 'low';
}

interface BriefingData {
  region: WatchpointId;
  timeWindowHours: number;
  generatedAt: string;
  summary: string;
  tensionScore?: number;
  keyDevelopments?: KeyDevelopment[];
  watchIndicators?: string[];
  sourcesAnalyzed: number;
  topSources: string[];
  fromCache?: boolean;
  pending?: boolean;
  limited?: boolean;
  tier?: ModelTier;
  usage?: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    costUsd: number;
  };
}

interface InlineBriefingProps {
  region: WatchpointId;
}

// Countries/locations to highlight in briefing text
const HIGHLIGHT_LOCATIONS = [
  'Ukraine', 'Russia', 'Crimea', 'Donbas', 'Kyiv', 'Moscow', 'Kharkiv', 'Odesa',
  'Israel', 'Gaza', 'West Bank', 'Lebanon', 'Beirut', 'Hezbollah', 'Hamas', 'Jerusalem', 'Tel Aviv',
  'Iran', 'Tehran', 'Syria', 'Damascus', 'Yemen', 'Houthi',
  'China', 'Taiwan', 'Beijing', 'Taipei', 'North Korea', 'Pyongyang', 'South Korea', 'Seoul',
  'Philippines', 'South China Sea', 'Japan', 'Tokyo',
  'United States', 'U.S.', 'US', 'ICE', 'Washington', 'Mexico', 'Venezuela', 'Cuba',
  'NATO', 'EU', 'European Union', 'Germany', 'France', 'UK', 'Britain', 'Poland', 'Belarus', 'Moldova',
  'Sudan', 'Ethiopia', 'Myanmar', 'Afghanistan', 'Pakistan', 'India', 'Kashmir',
];

const SOURCE_SUFFIXES = ['Post', 'Times', 'Monitor', 'Tribune', 'Herald', 'Journal', 'News', 'Today', 'Daily'];

// News outlets that contain location names - should NOT be highlighted
// These are checked as patterns against the surrounding text
const NEWS_OUTLET_PATTERNS = [
  'France 24', 'France24',
  'Jerusalem Post',
  'South China Morning Post',
  'Washington Post',
  'China Daily',
  'Russia Today', 'RT',
  'India Today',
  'Japan Times',
  'Korea Herald', 'Korea Times',
  'Taiwan News',
  'Israel Hayom',
  'Moscow Times',
  'Kyiv Independent', 'Kyiv Post',
  'Tehran Times',
  'Damascus Now',
  'Beirut Today',
  'Gaza Now',
];

function highlightLocations(text: string): React.ReactNode {
  if (!text) return text;

  const pattern = new RegExp(
    `\\b(${HIGHLIGHT_LOCATIONS.map(loc => loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isLocation = HIGHLIGHT_LOCATIONS.some(
      loc => loc.toLowerCase() === part.toLowerCase()
    );
    if (isLocation) {
      // Check if this location is part of a known news outlet name
      const nextPart = parts[i + 1] || '';
      const prevPart = parts[i - 1] || '';

      // Build context: what comes before and after this location
      const contextAfter = part + nextPart.slice(0, 30); // e.g., "France 24" or "Jerusalem Post"
      const contextBefore = prevPart.slice(-20) + part; // For patterns like "South China"

      // Check against known news outlet patterns
      const isPartOfOutlet = NEWS_OUTLET_PATTERNS.some(outlet => {
        const outletLower = outlet.toLowerCase();
        return contextAfter.toLowerCase().startsWith(outletLower) ||
               contextBefore.toLowerCase().endsWith(outletLower) ||
               contextAfter.toLowerCase().includes(outletLower);
      });

      if (isPartOfOutlet) {
        return part; // Don't bold - it's part of a news outlet name
      }

      // Also check the old suffix-based approach as a fallback
      if (nextPart) {
        const nextWord = nextPart.trim().split(/\s+/)[0];
        if (SOURCE_SUFFIXES.some(suffix => suffix.toLowerCase() === nextWord.toLowerCase())) {
          return part;
        }
      }

      return (
        <span key={i} className="font-semibold text-gray-900 dark:text-white dark:underline dark:decoration-white/20 dark:underline-offset-2">
          {part}
        </span>
      );
    }
    return part;
  });
}

// Tier display info with actual model names for transparency
// Links to Anthropic so users can learn about Claude models
const ANTHROPIC_URL = 'https://www.anthropic.com/claude';

const TIER_INFO: Record<ModelTier, {
  label: string;
  model: string;
  modelShort: string;
  icon: React.ElementType;
  color: string;
  description: string;
}> = {
  quick: {
    label: 'Quick',
    model: 'Claude Haiku',
    modelShort: 'Haiku',
    icon: BoltIcon,
    color: 'text-emerald-500',
    description: 'Fast AI summary',
  },
  advanced: {
    label: 'Advanced',
    model: 'Claude Sonnet',
    modelShort: 'Sonnet',
    icon: SparklesIcon,
    color: 'text-blue-500',
    description: 'Deeper AI analysis',
  },
  pro: {
    label: 'Pro',
    model: 'Claude Opus',
    modelShort: 'Opus',
    icon: RocketLaunchIcon,
    color: 'text-purple-500',
    description: 'Expert AI analysis',
  },
};

// Admin emails
const ADMIN_EMAILS = ['tbrown034@gmail.com', 'trevorbrown.web@gmail.com'];

// Loading phase messages
const LOADING_PHASES = [
  { minSec: 0, message: 'Scanning sources...' },
  { minSec: 3, message: 'Reading recent posts...' },
  { minSec: 6, message: 'Analyzing developments...' },
  { minSec: 10, message: 'Synthesizing brief...' },
  { minSec: 15, message: 'Finalizing summary...' },
];

function getLoadingMessage(elapsedSec: number, tier: ModelTier): string {
  // Pro tier takes longer
  const phases = tier === 'pro' ? LOADING_PHASES.map(p => ({ ...p, minSec: p.minSec * 1.5 })) : LOADING_PHASES;

  for (let i = phases.length - 1; i >= 0; i--) {
    if (elapsedSec >= phases[i].minSec) {
      return phases[i].message;
    }
  }
  return phases[0].message;
}

export function InlineBriefing({ region }: InlineBriefingProps) {
  const { data: session } = useSession();
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<ModelTier>('quick');
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoLoadedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase());

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    if (modelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [modelDropdownOpen]);

  // Load collapsed preference from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('ai-summary-collapsed');
    if (savedCollapsed === 'true') setIsCollapsed(true);
  }, []);

  // Save collapsed preference
  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem('ai-summary-collapsed', String(newValue));
  };

  const fetchBriefing = useCallback(async (tier: ModelTier = 'quick', skipCache = false) => {
    // Check client-side cache first
    if (!skipCache) {
      const cached = getCachedBriefing(region, tier);
      if (cached) {
        console.log(`[InlineBriefing] Using cached ${tier} briefing for ${region}`);
        setBriefing({ ...cached, fromCache: true });
        setCurrentTier(tier);
        return;
      }
    }

    // Abort any previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setCurrentTier(tier);
    setLoadingElapsed(0);
    const startTime = performance.now();

    // Start elapsed time counter
    loadingIntervalRef.current = setInterval(() => {
      setLoadingElapsed(Math.floor((performance.now() - startTime) / 1000));
    }, 1000);

    try {
      const response = await fetch(`/api/summary?region=${region}&hours=6&tier=${tier}`, {
        signal: controllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[InlineBriefing] ${tier} briefing loaded in ${data.usage?.latencyMs || '?'}ms`);
      setBriefing(data);
      setCurrentTier(tier);

      // Cache the result
      if (!data.pending && !data.limited) {
        setCachedBriefing(region, tier, data);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.warn(`[InlineBriefing] Fetch error:`, err);
      setError(err instanceof Error ? err.message : 'Error loading briefing');
    } finally {
      setLoading(false);
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }
  }, [region]);

  // Auto-load on mount and region change
  useEffect(() => {
    // Reset state
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }

    setBriefing(null);
    setError(null);
    setLoading(false);
    setCurrentTier('quick');
    setLoadingElapsed(0);
    autoLoadedRef.current = false;

    // Auto-load quick summary after a short delay (let news load first)
    const timer = setTimeout(() => {
      if (!autoLoadedRef.current) {
        autoLoadedRef.current = true;
        fetchBriefing('quick');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [region, fetchBriefing]);

  // Loading state - shows which AI model is being used
  if (loading) {
    const TierIcon = TIER_INFO[currentTier].icon;
    return (
      <div className="bg-[var(--background-secondary)] border-b border-[var(--border-light)]">
        <div className="px-4 py-3 flex items-center gap-3">
          <TierIcon className={`w-4 h-4 ${TIER_INFO[currentTier].color} animate-pulse`} />
          <div className="flex-1">
            <span className="text-label text-[var(--foreground-muted)]">
              {getLoadingMessage(loadingElapsed, currentTier)}
            </span>
            {loadingElapsed > 0 && (
              <span className="text-caption text-[var(--foreground-light)] ml-2 tabular-nums">
                {loadingElapsed}s
              </span>
            )}
          </div>
          <a
            href={ANTHROPIC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-caption text-[var(--foreground-light)] hover:text-[var(--foreground-muted)]"
          >
            {TIER_INFO[currentTier].model}
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[var(--color-elevated-muted)] border-b border-[var(--color-elevated)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-label text-[var(--color-elevated)]">{error}</span>
          <button
            onClick={() => fetchBriefing('quick', true)}
            className="text-caption text-[var(--color-elevated)] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No briefing yet - show loading placeholder
  if (!briefing) {
    return (
      <div className="bg-[var(--background-secondary)] border-b border-[var(--border-light)]">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[var(--foreground-light)] border-t-transparent rounded-full animate-spin" />
          <span className="text-label text-[var(--foreground-muted)]">Preparing summary...</span>
        </div>
      </div>
    );
  }

  // Display briefing with upgrade options
  const TierIcon = TIER_INFO[briefing.tier || 'quick'].icon;

  // Collapsed view - minimal clickable bar
  if (isCollapsed) {
    return (
      <div className="border-b border-[var(--border-light)] bg-[var(--background-secondary)] mb-4">
        <div className="px-4 py-2 flex items-center justify-between">
          {/* Main clickable area - whole left side expands */}
          <button
            onClick={toggleCollapsed}
            className="flex-1 flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors group"
          >
            <span className="text-xs font-medium uppercase tracking-wide">AI-Powered News Briefing</span>
            <span className="text-xs text-[var(--foreground-light)] opacity-60 group-hover:opacity-100 ml-1">
              — Tap to show
            </span>
          </button>
          {/* Expand toggle */}
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
            title="Show AI summary"
          >
            <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--foreground-light)]" />
          </button>
        </div>
      </div>
    );
  }

  const tierInfo = TIER_INFO[briefing.tier || 'quick'];

  return (
    <div className="border-b border-[var(--border-light)] bg-[var(--background-secondary)] mb-4">
      {/* Header row with controls */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-[var(--border-light)]">
        <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">AI-Powered News Briefing</span>
        {/* Hide AI button - clear option for users who don't want AI */}
        <button
          onClick={toggleCollapsed}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--foreground-light)] hover:text-[var(--foreground-muted)] hover:bg-[var(--background)] transition-colors"
          title="Hide AI summary"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
          <span>Hide</span>
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          {highlightLocations(briefing.summary)}
        </p>

        {briefing.keyDevelopments && briefing.keyDevelopments.length > 0 && (
          <ul className="space-y-1.5">
            {briefing.keyDevelopments.map((dev, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground-muted)]">
                <span className="text-[var(--foreground-light)] mt-0.5">•</span>
                <span className="leading-snug">{highlightLocations(dev.headline)}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Footer with model info */}
        <div className="pt-2 border-t border-[var(--border-light)]">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--foreground-light)]">
            <span>Generated with</span>
            {/* Model selector dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                disabled={loading}
                className="flex items-center gap-0.5 font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition-colors disabled:opacity-50"
              >
                {tierInfo.model}
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {modelDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      fetchBriefing('quick', true);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[var(--background-secondary)] transition-colors ${
                      briefing.tier === 'quick' ? 'bg-[var(--background-secondary)]' : ''
                    }`}
                  >
                    <div className="font-medium text-[var(--foreground)]">Claude Haiku</div>
                    <div className="text-[10px] text-[var(--foreground-light)]">Faster · economical</div>
                  </button>
                  <button
                    onClick={() => {
                      fetchBriefing('advanced', true);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[var(--background-secondary)] transition-colors border-t border-[var(--border-light)] ${
                      briefing.tier === 'advanced' ? 'bg-[var(--background-secondary)]' : ''
                    }`}
                  >
                    <div className="font-medium text-[var(--foreground)]">Claude Sonnet</div>
                    <div className="text-[10px] text-[var(--foreground-light)]">Balanced · recommended</div>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        fetchBriefing('pro', true);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-[var(--background-secondary)] transition-colors border-t border-[var(--border-light)] ${
                        briefing.tier === 'pro' ? 'bg-[var(--background-secondary)]' : ''
                      }`}
                    >
                      <div className="font-medium text-[var(--foreground)]">Claude Opus</div>
                      <div className="text-[10px] text-[var(--foreground-light)]">Smarter · deeper analysis</div>
                    </button>
                  )}
                </div>
              )}
            </div>
            <span>·</span>
            <span>{briefing.sourcesAnalyzed} sources</span>
            {briefing.usage?.latencyMs && (
              <>
                <span>·</span>
                <span>{(briefing.usage.latencyMs / 1000).toFixed(1)}s</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
