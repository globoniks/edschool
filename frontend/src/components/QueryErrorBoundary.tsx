import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import ErrorState from './ErrorState';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

/**
 * Error boundary specifically for React Query errors
 */
export default function QueryErrorBoundary({ 
  children, 
  fallback,
  onReset 
}: QueryErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <ErrorState
            variant="default"
            onRetry={onReset}
          />
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}

