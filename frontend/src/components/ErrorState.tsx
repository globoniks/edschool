import { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, WifiOff, Server, Shield, FileQuestion } from 'lucide-react';
import { Button } from './design-system';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

export interface ErrorStateProps {
  error?: Error | string | null;
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'network' | 'server' | 'not-found' | 'unauthorized' | 'forbidden';
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

const errorConfigs = {
  default: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    color: 'text-error-500',
  },
  network: {
    icon: WifiOff,
    title: 'Connection Problem',
    description: 'Unable to connect to the server. Please check your internet connection.',
    color: 'text-error-500',
  },
  server: {
    icon: Server,
    title: 'Server Error',
    description: 'The server encountered an error. Please try again later.',
    color: 'text-error-500',
  },
  'not-found': {
    icon: FileQuestion,
    title: 'Not Found',
    description: 'The requested resource could not be found.',
    color: 'text-warning-500',
  },
  unauthorized: {
    icon: Shield,
    title: 'Unauthorized',
    description: 'You need to be logged in to access this content.',
    color: 'text-warning-500',
  },
  forbidden: {
    icon: Shield,
    title: 'Access Denied',
    description: 'You don\'t have permission to access this resource.',
    color: 'text-error-500',
  },
};

export default function ErrorState({
  error,
  title,
  description,
  action,
  variant = 'default',
  onRetry,
  onGoHome,
  className,
}: ErrorStateProps) {
  const navigate = useNavigate();
  const config = errorConfigs[variant];
  const Icon = config.icon;

  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className={clsx('mb-4', config.color)}>
        <Icon className="w-16 h-16" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title || config.title}
      </h3>
      <p className="text-sm text-gray-600 max-w-md mb-6">
        {description || errorMessage || config.description}
      </p>
      {action || (
        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <Button
              variant="primary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button
              variant="outline-secondary"
              icon={<Home className="w-4 h-4" />}
              onClick={() => {
                if (onGoHome) {
                  onGoHome();
                } else {
                  navigate('/app/dashboard');
                }
              }}
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      )}
      {process.env.NODE_ENV === 'development' && error && typeof error === 'object' && error.stack && (
        <details className="mt-6 text-left w-full max-w-2xl">
          <summary className="cursor-pointer text-sm text-gray-500 mb-2">
            Error Details (Development Only)
          </summary>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48 border border-gray-200">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

// Hook for handling query errors
export function useErrorHandler() {
  const navigate = useNavigate();

  const getErrorVariant = (error: any): ErrorStateProps['variant'] => {
    if (!error) return 'default';
    
    if (error.response) {
      const status = error.response.status;
      if (status === 401) return 'unauthorized';
      if (status === 403) return 'forbidden';
      if (status === 404) return 'not-found';
      if (status >= 500) return 'server';
    }
    
    if (error.request && !error.response) return 'network';
    
    return 'default';
  };

  const renderError = (error: any, onRetry?: () => void) => {
    return (
      <ErrorState
        error={error}
        variant={getErrorVariant(error)}
        onRetry={onRetry}
        onGoHome={() => navigate('/app/dashboard')}
      />
    );
  };

  return { getErrorVariant, renderError };
}

