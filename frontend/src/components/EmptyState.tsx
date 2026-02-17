import { ReactNode } from 'react';
import { 
  Inbox, 
  Search, 
  FileText, 
  Users, 
  Calendar, 
  BookOpen, 
  MessageSquare,
  AlertCircle,
  Database,
  WifiOff,
  RefreshCw,
  Plus,
  Filter
} from 'lucide-react';
import { Button } from './design-system';
import { clsx } from 'clsx';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'search' | 'error' | 'no-data' | 'no-results';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const defaultIcons = {
  default: Inbox,
  search: Search,
  error: AlertCircle,
  'no-data': Database,
  'no-results': Filter,
};

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  variant = 'default',
  size = 'md',
  className 
}: EmptyStateProps) {
  const DefaultIcon = defaultIcons[variant];
  const iconSize = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const padding = size === 'sm' ? 'py-8' : size === 'lg' ? 'py-16' : 'py-12';

  return (
    <div className={clsx('flex flex-col items-center justify-center px-4 text-center', padding, className)}>
      <div className={clsx('mb-4 text-gray-400', variant === 'error' && 'text-error-400')}>
        {icon || <DefaultIcon className={iconSize} />}
      </div>
      <h3 className={clsx(
        'font-semibold text-gray-900 mb-2',
        size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'
      )}>
        {title}
      </h3>
      {description && (
        <p className={clsx(
          'text-gray-500 max-w-sm mb-6',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        )}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

// Context-specific Empty States
export function EmptySearchState({ 
  searchTerm, 
  onClearSearch,
  suggestions 
}: { 
  searchTerm?: string;
  onClearSearch?: () => void;
  suggestions?: string[];
}) {
  const description =
    searchTerm
      ? `We couldn't find anything matching "${searchTerm}". Try different keywords or check your spelling.`
      : "Try adjusting your search or filters to find what you're looking for.";

  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={description}
      action={
        <div className="space-y-3">
          {onClearSearch && (
            <Button variant="outline-secondary" size="sm" onClick={onClearSearch}>
              Clear Search
            </Button>
          )}
          {suggestions && suggestions.length > 0 && (
            <div className="text-sm">
              <p className="text-gray-600 mb-2">Try searching for:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => onClearSearch?.()}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

export function EmptyDataState({ 
  type, 
  onCreate,
  createLabel 
}: { 
  type: 'students' | 'teachers' | 'classes' | 'exams' | 'homework' | 'announcements' | 'fees' | 'messages';
  onCreate?: () => void;
  createLabel?: string;
}) {
  const configs = {
    students: {
      icon: Users,
      title: 'No students yet',
      description: 'Get started by adding your first student to the system.',
      actionLabel: 'Add Student',
    },
    teachers: {
      icon: Users,
      title: 'No teachers yet',
      description: 'Add teachers to manage classes and subjects.',
      actionLabel: 'Add Teacher',
    },
    classes: {
      icon: Calendar,
      title: 'No classes yet',
      description: 'Create your first class to organize students.',
      actionLabel: 'Create Class',
    },
    exams: {
      icon: FileText,
      title: 'No exams scheduled',
      description: 'Create an exam to start tracking student performance.',
      actionLabel: 'Create Exam',
    },
    homework: {
      icon: BookOpen,
      title: 'No homework assigned',
      description: 'Assign homework to help students practice and learn.',
      actionLabel: 'Assign Homework',
    },
    announcements: {
      icon: MessageSquare,
      title: 'No announcements',
      description: 'Share important updates with students and parents.',
      actionLabel: 'Create Announcement',
    },
    fees: {
      icon: FileText,
      title: 'No fee records',
      description: 'Start managing fees by creating fee structures.',
      actionLabel: 'Create Fee Structure',
    },
    messages: {
      icon: MessageSquare,
      title: 'No messages yet',
      description: 'Start a conversation with teachers or parents.',
      actionLabel: 'New Message',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <EmptyState
      icon={<Icon className="w-16 h-16 text-gray-400" />}
      title={config.title}
      description={config.description}
      action={
        onCreate && (
          <Button 
            variant="primary" 
            icon={<Plus className="w-4 h-4" />}
            onClick={onCreate}
          >
            {createLabel || config.actionLabel}
          </Button>
        )
      }
    />
  );
}

export function EmptyFilterState({ 
  onClearFilters,
  filterCount 
}: { 
  onClearFilters?: () => void;
  filterCount?: number;
}) {
  return (
    <EmptyState
      variant="no-results"
      title="No results match your filters"
      description={`${filterCount || 0} filter${(filterCount || 0) !== 1 ? 's' : ''} applied. Try adjusting your filters to see more results.`}
      action={
        onClearFilters && (
          <Button variant="outline-secondary" size="sm" onClick={onClearFilters}>
            Clear All Filters
          </Button>
        )
      }
    />
  );
}

export function EmptyNetworkState({ 
  onRetry 
}: { 
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      variant="error"
      icon={<WifiOff className="w-16 h-16 text-error-400" />}
      title="Connection Problem"
      description="We're having trouble connecting to the server. Please check your internet connection and try again."
      action={
        onRetry && (
          <Button 
            variant="primary" 
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={onRetry}
          >
            Retry Connection
          </Button>
        )
      }
    />
  );
}

export function EmptyPermissionState({ 
  requiredPermission,
  contactInfo 
}: { 
  requiredPermission?: string;
  contactInfo?: string;
}) {
  return (
    <EmptyState
      variant="error"
      icon={<AlertCircle className="w-16 h-16 text-warning-400" />}
      title="Access Restricted"
      description={
        requiredPermission
          ? `You don't have permission to ${requiredPermission}. Please contact your administrator for access.`
          : "You don't have permission to view this content. Please contact your administrator."
      }
      action={
        contactInfo && (
          <div className="text-sm text-gray-600">
            <p>Contact: {contactInfo}</p>
          </div>
        )
      }
    />
  );
}
