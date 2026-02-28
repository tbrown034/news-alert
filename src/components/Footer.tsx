import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/50 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left: branding */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-serif">P</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">News Pulse</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">News before it's news</p>
            </div>
          </div>

          {/* Center: nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { href: '/', label: 'Home' },
              { href: '/news', label: 'News Wire' },
              { href: '/conditions', label: 'Conditions' },
              { href: '/about', label: 'About' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: credit */}
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Built by{' '}
              <a
                href="https://trevorthewebdeveloper.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Trevor Brown
              </a>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
              &copy; {new Date().getFullYear()} News Pulse
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
