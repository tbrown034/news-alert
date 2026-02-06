import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'World Conditions',
  description: 'Regional conditions overview — seismic activity, weather alerts, wildfires, travel advisories, and internet outages by region.',
};

export default function ConditionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
