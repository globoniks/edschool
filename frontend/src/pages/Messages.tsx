import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { FormField, Input, Select, Textarea } from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Messages() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    receiverId: '',
    subject: '',
    content: '',
  });
  const [filterType, setFilterType] = useState<'received' | 'sent'>('received');

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', filterType],
    queryFn: () => api.get(`/messages?type=${filterType}`).then((res) => res.data),
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers-for-messages'],
    queryFn: () => api.get('/teachers?limit=500').then((res) => res.data),
    enabled: composeOpen,
  });

  const recipients = (teachersData as any)?.teachers ?? [];
  const recipientOptions = recipients
    .filter((t: any) => t.user?.id)
    .map((t: any) => ({ value: t.user.id, label: `${t.firstName} ${t.lastName} (Teacher)` }));

  const sendMessageMutation = useMutation({
    mutationFn: (data: { receiverId: string; subject?: string; content: string }) =>
      api.post('/messages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setComposeOpen(false);
      setComposeForm({ receiverId: '', subject: '', content: '' });
      showSuccess('Message sent');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to send message');
    },
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Communicate with teachers and parents</p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="btn btn-primary flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          New message
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex gap-2 border-b border-gray-200 pb-3 mb-4">
          <button
            onClick={() => setFilterType('received')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              filterType === 'received' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setFilterType('sent')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              filterType === 'sent' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sent
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card flex justify-center py-12"><LoadingSpinner /></div>
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
          <p className="text-gray-500 text-center py-12">
            {filterType === 'sent' ? 'No sent messages' : 'No messages found'}
          </p>
        </div>
      )}

      {composeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">New message</h2>
              <button onClick={() => setComposeOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessageMutation.mutate({
                  receiverId: composeForm.receiverId,
                  subject: composeForm.subject || undefined,
                  content: composeForm.content,
                });
              }}
              className="p-6 space-y-4"
            >
              <FormField label="To" required>
                <Select
                  required
                  value={composeForm.receiverId}
                  onChange={(e) => setComposeForm({ ...composeForm, receiverId: e.target.value })}
                >
                  <option value="">Select recipient</option>
                  {recipientOptions.map((opt: { value: string; label: string }) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Subject">
                <Input
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Optional subject"
                />
              </FormField>
              <FormField label="Message" required>
                <Textarea
                  required
                  rows={5}
                  value={composeForm.content}
                  onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                  placeholder="Write your message..."
                />
              </FormField>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setComposeOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {sendMessageMutation.isPending && <LoadingSpinner size="sm" />}
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

