import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News — Pulse',
  description: 'Live mainstream news from global wire services and news agencies.',
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
