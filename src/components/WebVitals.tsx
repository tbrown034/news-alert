'use client';

import { useReportWebVitals } from 'next/web-vitals';

const queue: Array<{
  name: string;
  value: number;
  delta: number;
  rating: string;
  id: string;
  navigationType: string;
}> = [];

function flushQueue() {
  if (queue.length === 0) return;
  const body = JSON.stringify(queue);
  const url = '/api/vitals';
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
  queue.length = 0;
}

// Flush when user navigates away or switches tabs
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushQueue();
  });
}

// Stable reference — defined outside component to prevent duplicate reporting
function reportMetric(metric: { name: string; value: number; delta: number; rating: string; id: string; navigationType: string }) {
  queue.push({
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Also flush after a short delay for metrics that arrive early (TTFB, FCP)
  setTimeout(flushQueue, 5000);
}

export function WebVitals() {
  useReportWebVitals(reportMetric);
  return null;
}
