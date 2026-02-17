import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Bell, Check, CheckCheck, AlertCircle, Info, AlertTriangle, Clock } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/ToastProvider';
import { clsx } from 'clsx';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  createdAt: string;
  read: boolean;
}

const typeConfig = {
  info: {
    icon: Info,
    color: 'bg-blue-100 text-blue-600',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-600',
    borderColor: 'border-yellow-200',
    dotColor: 'bg-yellow-500',
  },
  urgent: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-600',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
  },
};

export default function ParentAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const queryClient = useQueryClient();
  const { showSuccess } = useToast();

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then((res) => res.data).catch(() => []),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/alerts/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      showSuccess('Alert marked as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.patch('/alerts/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      showSuccess('All alerts marked as read');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const unreadCount = alerts?.filter((a) => !a.read).length || 0;
  const groupedAlerts = groupAlertsByDate(alerts || []);

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {alerts && alerts.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedAlerts).map(([date, dateAlerts]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="sticky top-0 bg-gray-50 py-2 mb-4 z-10">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDateHeader(date)}
                </h2>
              </div>

              {/* Timeline */}
              <div className="relative pl-8">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Alerts */}
                <div className="space-y-4">
                  {dateAlerts.map((alert, index) => {
                    const config = typeConfig[alert.type];
                    const Icon = config.icon;
                    const isLast = index === dateAlerts.length - 1;

                    return (
                      <div
                        key={alert.id}
                        className={clsx(
                          'relative cursor-pointer transition-all',
                          !alert.read && 'hover:scale-[1.02]'
                        )}
                        onClick={() => setSelectedAlert(alert)}
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-8 top-2">
                          <div className={clsx('w-3 h-3 rounded-full border-2 border-white', config.dotColor)} />
                          {!isLast && (
                            <div className="absolute left-1/2 top-3 w-0.5 h-full bg-gray-200 transform -translate-x-1/2" />
                          )}
                        </div>

                        {/* Alert Card */}
                        <div
                          className={clsx(
                            'card transition-all',
                            !alert.read
                              ? `border-l-4 ${config.borderColor} bg-white shadow-md`
                              : 'bg-gray-50 border-l-4 border-gray-200 opacity-75',
                            'hover:shadow-lg'
                          )}
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={clsx('p-2 rounded-lg flex-shrink-0', config.color)}>
                              <Icon className="w-5 h-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className={clsx('font-semibold text-sm', !alert.read && 'text-gray-900', alert.read && 'text-gray-600')}>
                                  {alert.title}
                                </h3>
                                {!alert.read && (
                                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-600" />
                                )}
                              </div>
                              <p className={clsx('text-sm mb-2 line-clamp-2', alert.read ? 'text-gray-500' : 'text-gray-700')}>
                                {alert.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {formatTime(alert.createdAt)}
                                </span>
                                {!alert.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsReadMutation.mutate(alert.id);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                                  >
                                    <Check className="w-3 h-3" />
                                    Mark as read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="w-16 h-16 text-gray-400" />}
          title="No alerts"
          description="You're all caught up! New alerts will appear here."
        />
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={clsx('p-3 rounded-lg', typeConfig[selectedAlert.type].color)}>
                {(() => {
                  const Icon = typeConfig[selectedAlert.type].icon;
                  return <Icon className="w-6 h-6" />;
                })()}
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedAlert.title}</h2>
            <p className="text-gray-700 mb-4">{selectedAlert.message}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                {formatDateTime(selectedAlert.createdAt)}
              </span>
              {!selectedAlert.read && (
                <button
                  onClick={() => {
                    markAsReadMutation.mutate(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="btn btn-primary text-sm"
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function groupAlertsByDate(alerts: Alert[]): Record<string, Alert[]> {
  const grouped: Record<string, Alert[]> = {};

  alerts.forEach((alert) => {
    const date = new Date(alert.createdAt).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(alert);
  });

  return grouped;
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

