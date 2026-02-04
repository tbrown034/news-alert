import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Threat Assessments',
  description: 'Consolidated threat data including seismic activity, weather alerts, wildfires, travel advisories, and internet outages.',
};

export default function ThreatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
