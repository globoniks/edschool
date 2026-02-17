import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import Skeleton, { SkeletonCard, SkeletonTable, SkeletonList, SkeletonGrid, SkeletonDashboard } from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import { clsx } from 'clsx';

export interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'card' | 'table' | 'list' | 'grid' | 'dashboard';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  items?: number;
  cols?: number;
  className?: string;
}

export default function LoadingState({
  variant = 'spinner',
  size = 'md',
  message,
  items = 5,
  cols = 3,
  className,
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-12', className)}>
        <LoadingSpinner size={size} />
        {message && (
          <p className="mt-4 text-sm text-gray-600">{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={clsx('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {Array.from({ length: items }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return <SkeletonTable rows={items} cols={cols} className={className} />;
  }

  if (variant === 'list') {
    return <SkeletonList items={items} className={className} />;
  }

  if (variant === 'grid') {
    return <SkeletonGrid items={items} cols={cols} className={className} />;
  }

  if (variant === 'dashboard') {
    return <SkeletonDashboard />;
  }

  // Default skeleton
  return (
    <div className={clsx('space-y-4', className)}>
      <Skeleton variant="text" lines={3} />
      <Skeleton variant="rectangular" height={200} />
    </div>
  );
}

/**
 * Higher-order component for wrapping components with loading/error/empty states
 */
export function withQueryStates<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    loadingVariant?: LoadingStateProps['variant'];
    emptyMessage?: string;
    errorVariant?: 'default' | 'network' | 'server';
  }
) {
  return function QueryStateWrapper(props: T & {
    isLoading?: boolean;
    isError?: boolean;
    error?: Error | null;
    isEmpty?: boolean;
    data?: any;
  }) {
    const { isLoading, isError, error, isEmpty, data, ...componentProps } = props;

    if (isLoading) {
      return <LoadingState variant={options?.loadingVariant || 'spinner'} />;
    }

    if (isError) {
      return (
        <ErrorState
          error={error || undefined}
          variant={options?.errorVariant}
          onRetry={() => window.location.reload()}
        />
      );
    }

    if (isEmpty || (Array.isArray(data) && data.length === 0)) {
      return <EmptyState title={options?.emptyMessage || 'No data available'} />;
    }

    return <Component {...(componentProps as T)} />;
  };
}

