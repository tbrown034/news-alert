'use client';

import { useReportWebVitals } from 'next/web-vitals';

const queue: Array<{
  name: string;
  value: number;
  delta: number;
  rating: string;
  id: string;
  navigationType: string;
  pagePath: string;
}> = [];

function flushQueue() {
  if (queue.length === 0) return;
  const body = JSON.stringify(queue);
  const url = '/api/vitals';
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
  queue.length = 0;
}

// Flush when user navigates away or switches tabs
// Guard ensures only one listener is registered even with HMR re-evaluation
function onVisibilityChange() {
  if (document.visibilityState === 'hidden') flushQueue();
}

if (typeof document !== 'undefined' && !(globalThis as any).__webVitalsListenerRegistered) {
  document.addEventListener('visibilitychange', onVisibilityChange);
  (globalThis as any).__webVitalsListenerRegistered = true;
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
    pagePath: window.location.pathname,
  });

  // Also flush after a short delay for metrics that arrive early (TTFB, FCP)
  setTimeout(flushQueue, 5000);
}

export function WebVitals() {
  useReportWebVitals(reportMetric);
  return null;
}
