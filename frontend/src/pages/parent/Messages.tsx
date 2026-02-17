import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { MessageSquare, Send } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/ToastProvider';
import { useState } from 'react';

export default function ParentMessages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { showInfo } = useToast();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => api.get('/messages').then((res) => res.data).catch(() => []),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-600 mt-1">Communicate with teachers</p>
      </div>

      {messages && messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message: any) => (
            <div
              key={message.id}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedConversation(message.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">
                      {message.teacher?.firstName} {message.teacher?.lastName}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{message.content}</p>
                  {!message.read && (
                    <span className="inline-block mt-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquare className="w-16 h-16 text-gray-400" />}
          title="No messages"
          description="Messages from teachers will appear here"
        />
      )}

      <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 flex flex-col items-end gap-1">
        <span className="text-xs text-gray-500 bg-white/90 px-2 py-1 rounded shadow-sm">Compose coming soon</span>
        <button
          onClick={() => showInfo('Compose message feature coming soon')}
          className="bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-colors"
          aria-label="Compose message"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

