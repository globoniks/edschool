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
  const [sendToClassMode, setSendToClassMode] = useState(false);
  const [composeForm, setComposeForm] = useState({
    receiverId: '',
    classId: '',
    subject: '',
    content: '',
  });
  const [filterType, setFilterType] = useState<'received' | 'sent'>('received');

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', filterType],
    queryFn: () => api.get(`/messages?type=${filterType}`).then((res) => res.data),
  });

  const { data: recipients = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ['messages-recipients'],
    queryFn: () => api.get('/messages/recipients').then((res) => res.data),
    enabled: composeOpen,
  });

  const { data: recipientClasses = [], isLoading: classesLoading } = useQuery({
    queryKey: ['messages-recipient-classes'],
    queryFn: () => api.get('/messages/recipient-classes').then((res) => res.data),
    enabled: composeOpen && sendToClassMode,
  });

  const recipientOptions = (recipients as { userId: string; label: string }[]).map((r) => ({
    value: r.userId,
    label: r.label,
  }));

  const sendMessageMutation = useMutation({
    mutationFn: (data: { receiverId: string; subject?: string; content: string }) =>
      api.post('/messages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setComposeOpen(false);
      setComposeForm({ receiverId: '', classId: '', subject: '', content: '' });
      setSendToClassMode(false);
      showSuccess('Message sent');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to send message');
    },
  });

  const sendToClassMutation = useMutation({
    mutationFn: (data: { classId: string; subject?: string; content: string }) =>
      api.post('/messages/send-to-class', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setComposeOpen(false);
      setComposeForm({ receiverId: '', classId: '', subject: '', content: '' });
      setSendToClassMode(false);
      const data = res?.data ?? {};
      showSuccess(data.message || `Message sent to ${data.count ?? 0} parent(s)`);
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to send to class');
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
                if (sendToClassMode) {
                  if (!composeForm.classId) {
                    showError('Select a class');
                    return;
                  }
                  sendToClassMutation.mutate({
                    classId: composeForm.classId,
                    subject: composeForm.subject || undefined,
                    content: composeForm.content,
                  });
                } else {
                  if (!composeForm.receiverId) {
                    showError('Select a recipient');
                    return;
                  }
                  sendMessageMutation.mutate({
                    receiverId: composeForm.receiverId,
                    subject: composeForm.subject || undefined,
                    content: composeForm.content,
                  });
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendToClass"
                  checked={sendToClassMode}
                  onChange={(e) => {
                    setSendToClassMode(e.target.checked);
                    setComposeForm((f) => ({ ...f, receiverId: '', classId: '' }));
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="sendToClass" className="text-sm font-medium text-gray-700">
                  Send to entire class (all parents of students in the class)
                </label>
              </div>

              {sendToClassMode ? (
                <FormField label="Class" required>
                  <Select
                    required
                    value={composeForm.classId}
                    onChange={(e) => setComposeForm({ ...composeForm, classId: e.target.value })}
                  >
                    <option value="">Select class</option>
                    {(recipientClasses as { id: string; name: string; section: string }[]).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `- ${c.section}` : ''}
                      </option>
                    ))}
                  </Select>
                  {recipientClasses.length === 0 && !classesLoading && (
                    <p className="mt-1 text-xs text-gray-500">No classes available for you to message.</p>
                  )}
                </FormField>
              ) : (
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
                  {recipientOptions.length === 0 && !recipientsLoading && (
                    <p className="mt-1 text-xs text-gray-500">No recipients available.</p>
                  )}
                </FormField>
              )}
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
                  disabled={sendMessageMutation.isPending || sendToClassMutation.isPending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {(sendMessageMutation.isPending || sendToClassMutation.isPending) && <LoadingSpinner size="sm" />}
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

