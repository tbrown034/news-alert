'use client';

import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { FireIcon } from '@heroicons/react/24/solid';
import { Watchpoint, WatchpointId } from '@/types';

interface WatchpointSelectorProps {
  watchpoints: Watchpoint[];
  selected: WatchpointId;
  onSelect: (id: WatchpointId) => void;
}

const activityColors = {
  low: 'bg-green-500',
  normal: 'bg-blue-500',
  elevated: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const activityPulse = {
  low: '',
  normal: '',
  elevated: 'animate-pulse',
  high: 'animate-pulse',
  critical: 'animate-pulse',
};

export function WatchpointSelector({
  watchpoints,
  selected,
  onSelect,
}: WatchpointSelectorProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 p-1 min-w-max">
        {/* All regions button */}
        <button
          onClick={() => onSelect('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
            selected === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-[#232734] text-gray-300 hover:bg-[#2a2f3f]'
          }`}
        >
          <GlobeAltIcon className="w-5 h-5" />
          <span className="font-medium">All</span>
        </button>

        {/* Individual watchpoints */}
        {watchpoints.map((wp) => (
          <button
            key={wp.id}
            onClick={() => onSelect(wp.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              selected === wp.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-[#232734] text-gray-300 hover:bg-[#2a2f3f]'
            }`}
          >
            {/* Activity indicator */}
            <span className="relative flex h-3 w-3">
              <span
                className={`${activityPulse[wp.activityLevel]} absolute inline-flex h-full w-full rounded-full ${activityColors[wp.activityLevel]} opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${activityColors[wp.activityLevel]}`}
              />
            </span>
            <span className="font-medium whitespace-nowrap">{wp.shortName}</span>
            {wp.activityLevel === 'critical' && (
              <FireIcon className="w-4 h-4 text-red-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
