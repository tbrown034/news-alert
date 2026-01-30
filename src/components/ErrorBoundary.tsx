'use client';

import { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Name of the section for error messages */
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary for catching render errors in child components.
 * Prevents the entire app from crashing when a component fails.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error(`[ErrorBoundary${this.props.section ? ` - ${this.props.section}` : ''}]`, error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl m-4">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-1">
            {this.props.section ? `${this.props.section} failed to load` : 'Something went wrong'}
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Skeleton component for loading states
 */
export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="p-4 border-b border-slate-200 dark:border-slate-800 animate-pulse"
        >
          {/* Header row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
              <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
          {/* Content */}
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Map skeleton for loading states
 */
export function MapSkeleton() {
  return (
    <div className="w-full h-[140px] sm:h-[180px] bg-slate-200 dark:bg-slate-800 rounded-t-2xl animate-pulse flex items-center justify-center">
      <div className="text-slate-400 dark:text-slate-600 text-sm">Loading map...</div>
    </div>
  );
}

/**
 * Briefing card skeleton
 */
export function BriefingSkeleton() {
  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-11/12" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
      </div>
    </div>
  );
}
