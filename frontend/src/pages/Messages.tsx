import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { MessageSquare } from 'lucide-react';

export default function Messages() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => api.get('/messages').then((res) => res.data),
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Communicate with teachers and parents</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : messages && messages.length > 0 ? (
        <div className="card">
          <div className="space-y-4">
            {messages.map((message: any) => (
              <div key={message.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{message.subject || 'No Subject'}</p>
                    <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      message.isRead
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {message.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-500 text-center py-12">No messages found</p>
        </div>
      )}
    </div>
  );
}

