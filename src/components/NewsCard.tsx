'use client';

import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import { NewsItem, SourceTier, VerificationStatus } from '@/types';

interface NewsCardProps {
  item: NewsItem;
  onShare?: (item: NewsItem) => void;
}

const tierConfig: Record<SourceTier, { label: string; color: string; bgColor: string }> = {
  official: {
    label: 'Official',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  reporter: {
    label: 'Reporter',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  osint: {
    label: 'OSINT',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  ground: {
    label: 'Ground',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
};

const verificationConfig: Record<
  VerificationStatus,
  { label: string; icon: typeof CheckBadgeIcon; color: string }
> = {
  unverified: {
    label: 'Unverified',
    icon: ExclamationTriangleIcon,
    color: 'text-gray-500',
  },
  'multiple-sources': {
    label: 'Multiple Sources',
    icon: ClockIcon,
    color: 'text-yellow-500',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckBadgeIcon,
    color: 'text-green-500',
  },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NewsCard({ item, onShare }: NewsCardProps) {
  const tier = tierConfig[item.source.tier];
  const verification = verificationConfig[item.verificationStatus];
  const VerificationIcon = verification.icon;

  const handleShare = () => {
    if (onShare) {
      onShare(item);
    } else {
      // KISS: Copy to clipboard
      const text = `${item.title}\n\nSource: ${item.source.name}\n${item.url || ''}`;
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <article className="bg-[#232734] rounded-xl p-4 hover:bg-[#2a2f3f] transition-colors duration-200">
      {/* Header: Breaking badge + Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {item.isBreaking && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
              <BoltIcon className="w-3 h-3" />
              BREAKING
            </span>
          )}
          <span className={`flex items-center gap-1 px-2 py-0.5 ${tier.bgColor} ${tier.color} rounded-full text-xs font-medium`}>
            {tier.label}
          </span>
        </div>
        <span className="text-sm text-gray-500">{formatTimeAgo(item.timestamp)}</span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-100 mb-2 leading-tight">
        {item.title}
      </h3>

      {/* Content preview */}
      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.content}</p>

      {/* Footer: Source + Verification + Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
        <div className="flex items-center gap-3">
          {/* Source */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1a1d29] flex items-center justify-center text-xs font-bold text-gray-400">
              {item.source.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-400">{item.source.name}</span>
          </div>

          {/* Verification status */}
          <div className={`flex items-center gap-1 ${verification.color}`}>
            <VerificationIcon className="w-4 h-4" />
            <span className="text-xs">{verification.label}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 hover:bg-[#1a1d29] rounded-lg transition-colors"
            title="Share"
          >
            <ShareIcon className="w-4 h-4 text-gray-500 hover:text-gray-300" />
          </button>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-[#1a1d29] rounded-lg transition-colors"
              title="Open source"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-500 hover:text-gray-300" />
            </a>
          )}
        </div>
      </div>

      {/* Confidence indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1 bg-[#1a1d29] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
            style={{ width: `${item.source.confidence}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{item.source.confidence}% confidence</span>
      </div>
    </article>
  );
}
