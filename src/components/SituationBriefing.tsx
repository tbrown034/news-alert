'use client';

import { useState } from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { WatchpointId } from '@/types';
import { regionDisplayNames } from '@/lib/regionDetection';

interface KeyDevelopment {
  headline: string;
  detail: string;
  sources: string[];
  severity: 'critical' | 'high' | 'moderate' | 'routine';
}

interface BriefingData {
  region: WatchpointId;
  timeWindowHours: number;
  generatedAt: string;
  summary: string;
  keyDevelopments: KeyDevelopment[];
  sourcesAnalyzed: number;
  topSources: string[];
  fromCache?: boolean;
}

interface SituationBriefingProps {
  region: WatchpointId;
  onClose: () => void;
}

const severityStyles = {
  critical: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    icon: '🚨',
  },
  high: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    icon: '⚠️',
  },
  moderate: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    icon: '📢',
  },
  routine: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    icon: '📰',
  },
};

export function SituationBriefing({ region, onClose }: SituationBriefingProps) {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(4);

  const fetchBriefing = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        region,
        hours: hours.toString(),
        ...(forceRefresh && { refresh: 'true' }),
      });

      const response = await fetch(`/api/summary?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate summary');
      }

      const data = await response.json();
      setBriefing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-700 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                Situation Briefing
              </h2>
              <p className="text-sm text-gray-400">
                {regionDisplayNames[region]} • Last {hours} hours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!briefing && !loading && !error && (
            <div className="text-center py-8">
              <SparklesIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Generate AI Summary
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Get an AI-powered briefing of recent developments in{' '}
                {regionDisplayNames[region]}.
              </p>

              {/* Time selector */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <select
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>Last 1 hour</option>
                  <option value={2}>Last 2 hours</option>
                  <option value={4}>Last 4 hours</option>
                  <option value={8}>Last 8 hours</option>
                  <option value={24}>Last 24 hours</option>
                </select>
              </div>

              <button
                onClick={() => fetchBriefing()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Generate Briefing
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Analyzing {regionDisplayNames[region]} posts...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-400 mb-2">
                Error Generating Summary
              </h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => fetchBriefing()}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {briefing && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                  <InformationCircleIcon className="w-4 h-4" />
                  Executive Summary
                </h3>
                <p className="text-gray-200 leading-relaxed">{briefing.summary}</p>
              </div>

              {/* Key Developments */}
              {briefing.keyDevelopments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    Key Developments
                  </h3>
                  <div className="space-y-3">
                    {briefing.keyDevelopments.map((dev, i) => {
                      const style = severityStyles[dev.severity];
                      return (
                        <div
                          key={i}
                          className={`${style.bg} border ${style.border} rounded-lg p-4`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{style.icon}</span>
                            <div className="flex-1">
                              <h4 className={`font-medium ${style.text}`}>
                                {dev.headline}
                              </h4>
                              <p className="text-gray-300 text-sm mt-1">
                                {dev.detail}
                              </p>
                              {dev.sources.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Sources: {dev.sources.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Meta info */}
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-700 flex items-center justify-between">
                <div>
                  Analyzed {briefing.sourcesAnalyzed} posts from{' '}
                  {briefing.topSources.slice(0, 3).join(', ')}
                  {briefing.topSources.length > 3 && ` +${briefing.topSources.length - 3} more`}
                </div>
                <div className="flex items-center gap-2">
                  {briefing.fromCache && (
                    <span className="text-yellow-500">(cached)</span>
                  )}
                  <span>Generated {formatTime(briefing.generatedAt)}</span>
                </div>
              </div>

              {/* Refresh button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => fetchBriefing(true)}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Refresh Summary
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
