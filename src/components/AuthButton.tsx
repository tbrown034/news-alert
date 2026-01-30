'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn, signOut, useSession } from '@/lib/auth-client';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface AuthButtonProps {
  variant?: 'default' | 'mobile';
  onNavigate?: () => void;
}

export function AuthButton({ variant = 'default', onNavigate }: AuthButtonProps) {
  const { data: session, isPending } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Track hydration to prevent mismatch (server renders skeleton, client renders button)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleNavigate = () => {
    setMenuOpen(false);
    onNavigate?.();
  };

  // Show skeleton during SSR, hydration, or while auth state is loading
  if (!mounted || isPending) {
    if (variant === 'mobile') {
      return (
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
          </div>
        </div>
      );
    }
    return (
      <div className="w-20 h-9 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
    );
  }

  if (session?.user) {
    const initials = session.user.name
      ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : session.user.email?.slice(0, 2).toUpperCase() || '??';

    const isAdmin = session.user.email?.endsWith('@gmail.com');

    // Mobile variant - inline expanded view
    if (variant === 'mobile') {
      return (
        <div className="space-y-1">
          {/* User Info Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mx-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-600 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session.user.email}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <Link
            href="/profile"
            onClick={handleNavigate}
            className="flex items-center gap-3 mx-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <UserCircleIcon className="w-5 h-5 text-slate-400" />
            Profile Settings
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={handleNavigate}
              className="flex items-center gap-3 mx-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5 text-slate-400" />
              Admin Dashboard
            </Link>
          )}

          <button
            onClick={() => {
              handleNavigate();
              signOut();
            }}
            className="flex items-center gap-3 w-full mx-2 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            style={{ width: 'calc(100% - 16px)' }}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      );
    }

    // Default variant - dropdown
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
          <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
            {/* User Info */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session.user.email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <UserCircleIcon className="w-4 h-4" />
                Profile
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>

            {/* Sign Out */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Signed out state
  if (variant === 'mobile') {
    return (
      <button
        onClick={() => {
          onNavigate?.();
          signIn.social({ provider: 'google' });
        }}
        className="flex items-center justify-center gap-2 mx-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl transition-all shadow-sm hover:shadow-md"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn.social({ provider: 'google' })}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
    >
      Sign In
    </button>
  );
}
