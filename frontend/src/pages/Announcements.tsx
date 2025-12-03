import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Bell, Plus, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Announcements() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: ['ALL'] as string[],
    isImportant: false,
    expiresAt: '',
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then((res) => res.data),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (data: any) => api.post('/announcements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsModalOpen(false);
      setFormData({
        title: '',
        content: '',
        targetAudience: ['ALL'],
        isImportant: false,
        expiresAt: '',
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create announcement');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncementMutation.mutate({
      ...formData,
      expiresAt: formData.expiresAt || undefined,
    });
  };

  const toggleAudience = (audience: string) => {
    if (audience === 'ALL') {
      setFormData({ ...formData, targetAudience: ['ALL'] });
    } else {
      const newAudience = formData.targetAudience.includes('ALL')
        ? [audience]
        : formData.targetAudience.includes(audience)
        ? formData.targetAudience.filter((a) => a !== audience)
        : [...formData.targetAudience.filter((a) => a !== 'ALL'), audience];
      setFormData({ ...formData, targetAudience: newAudience.length > 0 ? newAudience : ['ALL'] });
    }
  };

  const isAdminOrTeacher = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">School-wide announcements and updates</p>
        </div>
        {isAdminOrTeacher && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Announcement
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement: any) => (
            <div
              key={announcement.id}
              className={`card ${announcement.isImportant ? 'border-2 border-primary-500' : ''}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Bell className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{announcement.title}</h3>
                    {announcement.isImportant && (
                      <span className="badge bg-red-100 text-red-800">Important</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{announcement.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm text-gray-500">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {announcement.targetAudience.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-500 text-center py-12">No announcements found</p>
        </div>
      )}

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Announcement</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  required
                  className="input"
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter announcement content"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience *
                </label>
                <div className="space-y-2">
                  {['ALL', 'PARENTS', 'TEACHERS', 'STUDENTS'].map((audience) => (
                    <label key={audience} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.targetAudience.includes(audience)}
                        onChange={() => toggleAudience(audience)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{audience}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isImportant"
                  className="mr-2"
                  checked={formData.isImportant}
                  onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                />
                <label htmlFor="isImportant" className="text-sm text-gray-700">
                  Mark as Important
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAnnouncementMutation.isPending}
                  className="btn btn-primary"
                >
                  {createAnnouncementMutation.isPending ? 'Creating...' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

