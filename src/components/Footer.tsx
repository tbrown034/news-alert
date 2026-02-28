'use client';

import Link from 'next/link';
import { signIn } from '@/lib/auth-client';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left: branding */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-5 h-5">
                <text x="5" y="22" className="fill-white text-[18px] font-serif font-bold">P</text>
                <path d="M18 16 Q22 10 26 16 Q30 22 26 16" stroke="#22d3ee" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">News Pulse</p>
              <p className="text-xs text-[var(--foreground-muted)]">News before it&apos;s news</p>
            </div>
          </div>

          {/* Center: nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { href: '/', label: 'Home' },
              { href: '/news', label: 'News Wire' },
              { href: '/conditions', label: 'Conditions' },
              { href: '/sources', label: 'Sources' },
              { href: '/about', label: 'About' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => signIn.social({ provider: 'google', callbackURL: '/admin' })}
              className="text-xs text-[var(--foreground-light)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign in
            </button>
          </nav>

          {/* Right: credit */}
          <div className="text-right">
            <p className="text-xs text-[var(--foreground-muted)]">
              Built by{' '}
              <a
                href="https://trevorthewebdeveloper.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--foreground)] hover:underline transition-colors"
              >
                Trevor Brown
              </a>
            </p>
            <p className="text-xs text-[var(--foreground-light)] mt-0.5">
              &copy; {new Date().getFullYear()} News Pulse
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
