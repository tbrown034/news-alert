'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Something went wrong</h2>
          <p className="text-sm text-slate-400 mb-6">
            {error.digest && <span className="font-mono">Error: {error.digest}</span>}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
