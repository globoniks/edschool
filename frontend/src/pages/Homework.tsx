import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import FileUpload from '../components/FileUpload';
import { FormField, Input, Select, Textarea } from '../components/FormField';
import EmptyState from '../components/EmptyState';

export default function Homework() {
  const { user } = useAuthStore();
  const { canCreateHomework } = usePermissions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const canViewSubmissions = user?.role === 'TEACHER' || ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'HOD'].includes(user?.role || '');

  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    title: '',
    description: '',
    dueDate: '',
    attachments: [] as string[],
  });

  const { data: homeworks, isLoading } = useQuery({
    queryKey: ['homeworks'],
    queryFn: () => api.get('/homework').then((res) => res.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/academic/subjects').then((res) => res.data),
  });

  const { data: homeworkDetails } = useQuery({
    queryKey: ['homework-submissions', selectedHomework],
    queryFn: () => api.get(`/homework/${selectedHomework}/submissions`).then((res) => res.data),
    enabled: !!selectedHomework && canViewSubmissions,
  });

  const createHomeworkMutation = useMutation({
    mutationFn: (data: any) => api.post('/homework', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homeworks'] });
      setIsCreateModalOpen(false);
      setFormData({
        classId: '',
        subjectId: '',
        title: '',
        description: '',
        dueDate: '',
        attachments: [],
      });
      showSuccess('Homework created successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to create homework');
    },
  });

  const handleFileUpload = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.files.map((f: any) => f.url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createHomeworkMutation.mutate({
      ...formData,
      subjectId: formData.subjectId || undefined,
      attachments: formData.attachments,
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Homework & Assignments</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {canCreateHomework()
              ? 'Manage homework and student submissions'
              : 'View homework assigned to you'}
          </p>
        </div>
        {canCreateHomework() && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Homework
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      ) : (
        <div className="card">
          {homeworks && homeworks.length > 0 ? (
            <div className="space-y-4">
              {homeworks.map((homework: any) => (
                <div key={homework.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{homework.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {homework.class?.name} {homework.class?.section ? `- ${homework.class.section}` : ''}
                        {homework.subject && ` • ${homework.subject.name}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(homework.dueDate).toLocaleDateString()}
                      </p>
                      {homework.description && (
                        <p className="text-sm text-gray-700 mt-2">{homework.description}</p>
                      )}
                      {canViewSubmissions && (
                        <p className="text-xs text-gray-500 mt-2">
                          Submissions: {homework._count?.submissions || 0}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`badge ${
                          homework.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {homework.status}
                      </span>
                      {canViewSubmissions && (
                        <button
                          onClick={() => setSelectedHomework(homework.id)}
                          className="btn btn-secondary text-sm"
                        >
                          View Submissions
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-16 h-16 text-gray-400" />}
              title="No homework assignments"
              description="No homework has been assigned yet"
            />
          )}
        </div>
      )}

      {/* Create Homework Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Homework</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <FormField label="Title" required>
                <Input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Algebra Practice"
                />
              </FormField>

              <FormField label="Class" required>
                <Select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                >
                  <option value="">Select Class</option>
                  {classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.section ? `- ${cls.section}` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Subject">
                <Select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                >
                  <option value="">Select Subject (Optional)</option>
                  {subjects?.map((subject: any) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Due Date" required>
                <Input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter homework description..."
                />
              </FormField>

              <FormField label="Attachments" hint="Upload files related to this homework">
                <FileUpload
                  multiple
                  onUpload={handleFileUpload}
                  onRemove={(url) => {
                    setFormData({
                      ...formData,
                      attachments: formData.attachments.filter((a) => a !== url),
                    });
                  }}
                  existingFiles={formData.attachments}
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createHomeworkMutation.isPending}
                  className="btn btn-primary"
                >
                  {createHomeworkMutation.isPending ? 'Creating...' : 'Create Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {selectedHomework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Homework Submissions</h2>
              <button
                onClick={() => setSelectedHomework(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {homeworkDetails && homeworkDetails.length > 0 ? (
                <div className="space-y-4">
                  {homeworkDetails.map((submission: any) => (
                    <div
                      key={submission.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">
                            {submission.student?.firstName} {submission.student?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {submission.submittedAt
                              ? `Submitted: ${new Date(submission.submittedAt).toLocaleDateString()}`
                              : 'Not submitted'}
                          </p>
                        </div>
                        <span
                          className={`badge ${
                            submission.status === 'SUBMITTED'
                              ? 'bg-blue-100 text-blue-800'
                              : submission.status === 'EVALUATED'
                              ? 'bg-green-100 text-green-800'
                              : submission.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {submission.status}
                        </span>
                      </div>
                      {submission.submission && (
                        <p className="text-sm text-gray-700 mb-2">{submission.submission}</p>
                      )}
                      {submission.marks !== null && (
                        <p className="text-sm font-medium">
                          Marks: {submission.marks} {submission.remarks && `- ${submission.remarks}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No submissions yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

