'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolid } from '@heroicons/react/24/solid';
import { NewsItem } from '@/types';
import { getActivityIndicator } from '@/lib/activityDetection';
import { getSeverityIndicator, getEventTypeLabel } from '@/lib/keywordDetection';
import { PlatformIcon, platformColors } from './PlatformIcon';

interface NewsCardProps {
  item: NewsItem;
}

// Source type colors
const tierColors: Record<string, string> = {
  official: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  osint: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  reporter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ground: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NewsCard({ item }: NewsCardProps) {
  const platformColor = platformColors[item.source.platform] || platformColors.rss;
  const tierStyle = tierColors[item.source.tier] || tierColors.osint;
  const isVerified = item.verificationStatus === 'confirmed';

  // Check if content likely has media (images, video links)
  const hasMedia = /\.(jpg|jpeg|png|gif|webp|mp4|webm)|youtube\.com|youtu\.be|twitter\.com\/.*\/(photo|video)/i.test(item.url || item.content);

  // Activity detection
  const activityIndicator = item.sourceActivity ? getActivityIndicator(item.sourceActivity) : null;

  // Event severity
  const eventSignal = item.eventSignal;
  const showSeverity = eventSignal && eventSignal.severity !== 'routine';
  const severityIndicator = showSeverity ? getSeverityIndicator(eventSignal.severity) : null;
  const eventTypeLabel = eventSignal ? getEventTypeLabel(eventSignal.type) : null;

  const handleOpenSource = () => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Determine card accent based on severity
  const getCardAccent = () => {
    if (eventSignal?.severity === 'critical') return 'border-l-4 border-l-red-500 bg-red-500/[0.03]';
    if (eventSignal?.severity === 'high') return 'border-l-4 border-l-orange-500 bg-orange-500/[0.02]';
    if (eventSignal?.severity === 'moderate') return 'border-l-4 border-l-yellow-500/50';
    return '';
  };

  return (
    <article
      className={`
        relative px-4 py-4 border-b border-gray-800/50
        hover:bg-white/[0.02] transition-all duration-200 cursor-pointer
        ${getCardAccent()}
      `}
      onClick={handleOpenSource}
    >
      {/* Severity Banner for Critical/High */}
      {showSeverity && severityIndicator && (eventSignal?.severity === 'critical' || eventSignal?.severity === 'high') && (
        <div className={`flex items-center gap-2 mb-3 ${severityIndicator.color}`}>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${severityIndicator.bgColor}`}>
            {severityIndicator.icon} {severityIndicator.label}
          </span>
          {eventTypeLabel && eventSignal?.type !== 'unknown' && (
            <span className="text-xs text-gray-500">{eventTypeLabel}</span>
          )}
          {eventSignal?.isDeveloping && (
            <span className="text-xs text-yellow-500/80 italic">• Developing</span>
          )}
          {eventSignal?.isConfirmed && (
            <span className="text-xs text-emerald-400 font-medium">• Confirmed</span>
          )}
        </div>
      )}

      {/* Main Content */}
      <p className="text-[15px] text-gray-100 leading-relaxed mb-3">
        {item.title}
      </p>

      {/* Source Footer */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          {/* Top row: Platform + Source + Badge + Time */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={platformColor}>
                <PlatformIcon platform={item.source.platform} className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-gray-300">{item.source.name}</span>
              {isVerified && (
                <CheckBadgeSolid className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${tierStyle}`}>
              {item.source.tier.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(item.timestamp)}
            </span>
          </div>

          {/* Activity indicator under handle */}
          {activityIndicator && (
            <div className={`flex items-center gap-1 text-xs ${activityIndicator.color}`}>
              <span>{activityIndicator.icon}</span>
              <span className="font-medium">{activityIndicator.multiplier}× more active than usual</span>
            </div>
          )}
        </div>

        {/* Right side: Media indicator, link */}
        <div className="flex items-center gap-2">
          {hasMedia && (
            <span className="text-xs text-purple-400" title="Contains media">
              🖼
            </span>
          )}
          <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Moderate severity - subtle inline indicator */}
      {showSeverity && eventSignal?.severity === 'moderate' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-yellow-500/70">
          <span>📢</span>
          <span>{eventTypeLabel || 'Notable'}</span>
          {eventSignal?.isDeveloping && <span className="italic">• Developing</span>}
        </div>
      )}
    </article>
  );
}
