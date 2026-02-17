import { ReactNode } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import LoadingState, { LoadingStateProps } from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import { parseError, getErrorVariant } from '../utils/errorHandler';

interface QueryWrapperProps<TData = any> {
  query: UseQueryResult<TData>;
  children: (data: TData) => ReactNode;
  loadingVariant?: LoadingStateProps['variant'];
  loadingMessage?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  showEmpty?: (data: TData) => boolean;
  className?: string;
}

/**
 * Universal wrapper for React Query results
 * Handles loading, error, and empty states automatically
 */
export default function QueryWrapper<TData = any>({
  query,
  children,
  loadingVariant = 'spinner',
  loadingMessage,
  emptyMessage = 'No data available',
  emptyDescription,
  emptyAction,
  errorTitle,
  errorDescription,
  showEmpty = (data: TData) => {
    if (Array.isArray(data)) return data.length === 0;
    return !data;
  },
  className,
}: QueryWrapperProps<TData>) {

  // Loading state
  if (query.isLoading || query.isFetching) {
    return (
      <LoadingState
        variant={loadingVariant}
        message={loadingMessage}
        className={className}
      />
    );
  }

  // Error state
  if (query.isError) {
    const error = parseError(query.error);
    return (
      <ErrorState
        error={query.error as any}
        variant={getErrorVariant(query.error)}
        title={errorTitle || error.message}
        description={errorDescription}
        onRetry={() => query.refetch()}
        className={className}
      />
    );
  }

  // Empty state
  if (query.isSuccess && query.data && showEmpty(query.data)) {
    return (
      <EmptyState
        title={emptyMessage}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  // Success state - render children with data
  if (query.isSuccess && query.data) {
    return <>{children(query.data)}</>;
  }

  // Fallback
  return null;
}

