/**
 * Global Error Handling Utilities
 */

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * Parse error from various sources (API, network, etc.)
 */
export function parseError(error: any): AppError {
  // Already formatted error
  if (error && typeof error === 'object' && error.message && !error.response) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  // Axios/API error
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    return {
      message: data?.message || data?.error || getDefaultErrorMessage(status),
      code: data?.code,
      status,
      details: data?.details || data,
    };
  }

  // Network error
  if (error?.request) {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
    };
  }

  // Generic error
  return {
    message: error?.message || 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Get user-friendly error message based on HTTP status
 */
function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'You need to be logged in to perform this action.',
    403: 'You don\'t have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data.',
    422: 'The provided data is invalid.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service is under maintenance. Please try again later.',
    504: 'Request timeout. Please try again.',
  };

  return messages[status] || 'An error occurred. Please try again.';
}

/**
 * Determine error variant for UI display
 */
export function getErrorVariant(error: any): 'default' | 'network' | 'server' | 'not-found' | 'unauthorized' | 'forbidden' {
  if (!error) return 'default';

  // Network errors
  if (error.request && !error.response) {
    return 'network';
  }

  // HTTP status-based variants
  if (error.response) {
    const status = error.response.status;
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not-found';
    if (status >= 500) return 'server';
  }

  return 'default';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Network errors are retryable
  if (error.request && !error.response) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (error.response?.status >= 500) {
    return true;
  }

  // Timeout errors are retryable
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return true;
  }

  return false;
}

/**
 * Format error for display
 */
export function formatError(error: any): string {
  const parsed = parseError(error);
  return parsed.message;
}

/**
 * Log error (for debugging and monitoring)
 */
export function logError(error: any, context?: string) {
  const parsed = parseError(error);
  
  console.error(`[${context || 'Error'}]`, {
    message: parsed.message,
    code: parsed.code,
    status: parsed.status,
    details: parsed.details,
    original: error,
  });

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorTracking(parsed, context);
  }
}

