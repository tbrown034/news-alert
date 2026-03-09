'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/news', label: 'Wire' },
    { href: '/conditions', label: 'Conditions' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border-light">
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link
            href="/"
            className="keycap-press flex items-center gap-2 sm:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black rounded-xl flex items-center justify-center shadow-md shadow-black/30 border border-slate-700">
              <svg viewBox="0 0 32 32" className="w-6 h-6 sm:w-7 sm:h-7">
                <text
                  x="8"
                  y="22"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="20"
                  fontWeight="700"
                  fill="#ffffff"
                >
                  P
                </text>
                <path
                  d="M4 26 L10 26 L12 23 L14 29 L16 24 L18 26 L28 26"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-lg sm:text-xl font-bold headline text-foreground">
                News Pulse
              </span>
              <p className="text-2xs sm:text-xs font-medium tracking-wide hidden xs:block text-foreground-light">
                News before it&apos;s news
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'text-foreground bg-background-secondary'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground-muted hover:text-foreground hover:bg-background-secondary rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute top-full right-4 mt-2 w-48 bg-background-card rounded-lg shadow-lg border border-border-card z-50 md:hidden overflow-hidden">
              <div className="py-1">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-background-secondary"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-border-light" />
              <button
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-background-secondary"
              >
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                {theme === 'dark' ? (
                  <SunIcon className="w-4 h-4 text-foreground-muted" />
                ) : (
                  <MoonIcon className="w-4 h-4 text-foreground-muted" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
