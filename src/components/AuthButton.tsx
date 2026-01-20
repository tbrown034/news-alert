'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn, signOut, useSession } from '@/lib/auth-client';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function AuthButton() {
  const { data: session, isPending } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (isPending) {
    return (
      <div className="w-20 h-9 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
    );
  }

  if (session?.user) {
    const initials = session.user.name
      ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : session.user.email?.slice(0, 2).toUpperCase() || '??';

    const isAdmin = session.user.email?.endsWith('@gmail.com'); // Simple admin check - adjust as needed

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

  return (
    <button
      onClick={() => signIn.social({ provider: 'google' })}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
    >
      Sign In
    </button>
  );
}
