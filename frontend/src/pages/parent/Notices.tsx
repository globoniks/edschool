import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Bell, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function ParentNotices() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then((res) => res.data).catch(() => []),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Count all announcements as unread for now (since read status is not tracked per user)
  const unreadCount = announcements?.length || 0;

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notices & Announcements</h1>
        <p className="text-sm text-gray-600 mt-1">
          {unreadCount > 0 ? `${unreadCount} unread notice${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
        </p>
      </div>

      {announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement: any) => (
            <div
              key={announcement.id}
              className={`card ${announcement.isImportant ? 'border-2 border-primary-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {announcement.isImportant ? (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <Bell className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{announcement.title}</h3>
                    {announcement.isImportant && (
                      <span className="badge bg-red-100 text-red-800">Important</span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{announcement.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="w-16 h-16 text-gray-400" />}
          title="No announcements"
          description="Check back later for updates"
        />
      )}
    </div>
  );
}

