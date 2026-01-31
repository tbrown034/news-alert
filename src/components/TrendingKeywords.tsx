'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon, FireIcon } from '@heroicons/react/24/outline';
import { NewsItem } from '@/types';
import { getTrendingKeywords, TrendingKeyword } from '@/lib/trendingKeywords';
import { regionDisplayNames } from '@/lib/regionDetection';

interface TrendingKeywordsProps {
  items: NewsItem[];
  isLoading?: boolean;
}

export function TrendingKeywords({ items, isLoading }: TrendingKeywordsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute trending keywords from items
  const trendingData = useMemo(() => {
    if (items.length === 0) return null;
    return getTrendingKeywords(items, 15);
  }, [items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const topKeyword = trendingData?.keywords[0];
  const hasKeywords = trendingData && trendingData.keywords.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || !hasKeywords}
        className={`
          flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg
          bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
          hover:border-slate-300 dark:hover:border-slate-600 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <FireIcon className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
          {isLoading ? 'Loading...' : hasKeywords ? 'Trending' : 'No trends'}
        </span>
        {hasKeywords && (
          <ChevronDownIcon
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown popup */}
      {isOpen && trendingData && (
        <div className="absolute top-full left-0 mt-1 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[220px] max-w-[280px]">
          {/* Header */}
          <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <FireIcon className="w-3.5 h-3.5 text-orange-500" />
              Trending Keywords
            </div>
            <div className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">
              From {trendingData.itemsWithMatches} of {trendingData.totalItemsAnalyzed} posts
            </div>
          </div>

          {/* Keywords list */}
          <div className="max-h-[300px] overflow-y-auto">
            {trendingData.keywords.map((kw, index) => (
              <KeywordRow key={kw.keyword} keyword={kw} rank={index + 1} />
            ))}
          </div>

          {/* Footer note */}
          <div className="px-3 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-2xs text-slate-400 dark:text-slate-500 italic">
              Based on keyword matches in post titles and content
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function KeywordRow({ keyword, rank }: { keyword: TrendingKeyword; rank: number }) {
  // Format regions as abbreviated string
  const regionText =
    keyword.regions.length === 1
      ? regionDisplayNames[keyword.regions[0] as keyof typeof regionDisplayNames] || keyword.regions[0]
      : `${keyword.regions.length} regions`;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`
            text-2xs font-medium w-4 text-center
            ${rank <= 3 ? 'text-orange-500' : 'text-slate-400'}
          `}
        >
          {rank}
        </span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {keyword.keyword}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">{keyword.count}</span>
      </div>
    </div>
  );
}
