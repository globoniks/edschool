import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useErrorHandler } from '../components/ErrorState';

/**
 * Enhanced useQuery hook with automatic error handling
 */
export function useQueryWithError<TData = unknown, TError = Error>(
  queryOptions: Parameters<typeof useQuery<TData, TError>>[0]
): UseQueryResult<TData, TError> & {
  renderError: () => React.ReactNode | null;
  renderLoading: () => React.ReactNode | null;
  renderEmpty: (emptyMessage?: string) => React.ReactNode | null;
} {
  const query = useQuery<TData, TError>(queryOptions);
  const { renderError } = useErrorHandler();

  return {
    ...query,
    renderError: () => {
      if (query.isError) {
        return renderError(query.error as any, () => query.refetch());
      }
      return null;
    },
    renderLoading: () => {
      if (query.isLoading) {
        // Return skeleton based on query key or context
        return null; // Let components handle their own loading states
      }
      return null;
    },
    renderEmpty: (emptyMessage?: string) => {
      if (query.isSuccess && (!query.data || (Array.isArray(query.data) && query.data.length === 0))) {
        // Components should handle empty states with EmptyState component
        return null;
      }
      return null;
    },
  };
}

