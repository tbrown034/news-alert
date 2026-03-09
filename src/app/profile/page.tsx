'use client';

import { useSession } from '@/lib/auth-client';
import { UserCircleIcon, EnvelopeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const initials = session.user.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : session.user.email?.slice(0, 2).toUpperCase() || '??';

  const joinDate = session.user.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-background text-[var(--foreground)]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border-card)] overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-8">
            <div className="flex items-center gap-4">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-20 h-20 rounded-full border-4 border-white/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {session.user.name || 'User'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 py-6 space-y-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Account Details
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-background-secondary rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-foreground-muted uppercase tracking-wider">Name</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {session.user.name || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-background-secondary rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <EnvelopeIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-foreground-muted uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {session.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-background-secondary rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-foreground-muted uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {joinDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
