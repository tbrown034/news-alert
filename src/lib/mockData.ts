import { Watchpoint } from '@/types';

// All regions shown on map. LATAM and Asia are excluded from activity scoring
// due to low source coverage (11 and 39 sources respectively) - they always show NORMAL.
export const watchpoints: Watchpoint[] = [
  {
    id: 'us',
    name: 'United States',
    shortName: 'US',
    priority: 1,
    activityLevel: 'normal',
    color: '#8b5cf6',
  },
  {
    id: 'latam',
    name: 'Latin America',
    shortName: 'LATAM',
    priority: 4,
    activityLevel: 'normal',
    color: '#10b981',
  },
  {
    id: 'middle-east',
    name: 'Middle East',
    shortName: 'M. East',
    priority: 2,
    activityLevel: 'elevated',
    color: '#ef4444',
  },
  {
    id: 'europe-russia',
    name: 'Europe & Russia',
    shortName: 'Europe',
    priority: 3,
    activityLevel: 'elevated',
    color: '#f59e0b',
  },
  {
    id: 'asia',
    name: 'Asia-Pacific',
    shortName: 'Asia',
    priority: 5,
    activityLevel: 'normal',
    color: '#6366f1',
  },
  {
    id: 'africa',
    name: 'Africa',
    shortName: 'Africa',
    priority: 6,
    activityLevel: 'normal',
    color: '#f97316',
  },
];
