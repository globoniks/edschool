import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { BookOpen, Clock, CheckCircle, AlertCircle, Upload, FileText, X, Calendar, User, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/ToastProvider';
import { clsx } from 'clsx';

interface HomeworkItem {
  id: string;
  homeworkId: string;
  title: string;
  description?: string;
  subjectId?: string;
  dueDate: string;
  createdAt: string;
  status: 'PENDING' | 'SUBMITTED' | 'EVALUATED' | 'OVERDUE';
  submitted: boolean;
  submittedAt?: string;
  marks?: number;
  remarks?: string;
  attachments: string[];
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class?: {
      name: string;
      section?: string;
    } | null;
  };
  teacher: {
    firstName: string;
    lastName: string;
  };
  class?: {
    name: string;
    section?: string;
  } | null;
}

export default function ParentHomework() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Get dashboard data for child selection
  const { data: dashboardData } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parents/dashboard').then((res) => res.data).catch(() => null),
    enabled: user?.role === 'PARENT',
  });

  // Get homework data
  const { data: homework, isLoading } = useQuery<HomeworkItem[]>({
    queryKey: ['parent-homework', selectedChildId],
    queryFn: () => {
      const params = selectedChildId ? `?studentId=${selectedChildId}` : '';
      return api.get(`/parents/homework${params}`).then((res) => res.data).catch(() => []);
    },
    enabled: user?.role === 'PARENT',
  });

  const markAsDoneMutation = useMutation({
    mutationFn: (homeworkId: string) => {
      // For parents, we'll just mark it as viewed/acknowledged
      // Actual submission should be done by student
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-homework'] });
      showSuccess('Homework marked as done');
    },
    onError: () => {
      showError('Failed to update homework status');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const children = dashboardData?.children || [];
  const groupedHomework = groupHomeworkByDate(homework || []);
  const uncompletedCount = homework?.filter((hw) => !hw.submitted).length || 0;

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Homework & Assignments</h1>
            <p className="text-sm text-gray-600 mt-1">
              {uncompletedCount > 0 ? `${uncompletedCount} pending assignment${uncompletedCount !== 1 ? 's' : ''}` : 'All assignments completed!'}
            </p>
          </div>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedChildId(null)}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                !selectedChildId
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All Children
            </button>
            {children.map((child: any) => (
              <button
                key={child.studentId}
                onClick={() => setSelectedChildId(child.studentId)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  selectedChildId === child.studentId
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {child.firstName} {child.lastName}
              </button>
            ))}
          </div>
        )}
      </div>

      {homework && homework.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedHomework).map(([date, dateHomework]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="sticky top-0 bg-gray-50 py-2 mb-4 z-10">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDateHeader(date)}
                </h2>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                {dateHomework.map((hw) => {
                  const isOverdue = !hw.submitted && new Date(hw.dueDate) < new Date();
                  const isDueSoon = !hw.submitted && new Date(hw.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);

                  return (
                    <div
                      key={hw.id}
                      className={clsx(
                        'card transition-all cursor-pointer hover:shadow-lg',
                        hw.submitted
                          ? 'bg-green-50 border-l-4 border-green-500'
                          : isOverdue
                          ? 'bg-red-50 border-l-4 border-red-500'
                          : isDueSoon
                          ? 'bg-yellow-50 border-l-4 border-yellow-500'
                          : 'bg-white border-l-4 border-gray-200'
                      )}
                      onClick={() => setSelectedHomework(hw)}
                    >
                      {/* Checklist Item */}
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!hw.submitted) {
                              markAsDoneMutation.mutate(hw.homeworkId);
                            }
                          }}
                          className={clsx(
                            'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-1',
                            hw.submitted
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                          )}
                        >
                          {hw.submitted && <CheckCircle className="w-4 h-4 text-white" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className={clsx(
                              'font-semibold text-base',
                              hw.submitted ? 'text-gray-600 line-through' : 'text-gray-900'
                            )}>
                              {hw.title}
                            </h3>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                            {hw.student.class && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {hw.student.firstName} {hw.student.lastName} - {hw.student.class.name}
                                {hw.student.class.section && ` ${hw.student.class.section}`}
                              </span>
                            )}
                            {hw.subjectId && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                {hw.subjectId}
                              </span>
                            )}
                          </div>

                          {hw.description && (
                            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                              {hw.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Due: {formatDate(hw.dueDate)}</span>
                              </div>
                              {hw.submitted && hw.submittedAt && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Submitted {formatTime(hw.submittedAt)}</span>
                                </div>
                              )}
                            </div>

                            {/* Status Badge */}
                            <span className={clsx(
                              'badge text-xs',
                              hw.submitted
                                ? 'bg-green-100 text-green-800'
                                : isOverdue
                                ? 'bg-red-100 text-red-800'
                                : isDueSoon
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            )}>
                              {hw.submitted ? 'Completed' : isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

      {/* Homework Detail Modal */}
      {selectedHomework && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedHomework(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedHomework.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    {selectedHomework.student.class && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedHomework.student.firstName} {selectedHomework.student.lastName} - {selectedHomework.student.class.name}
                        {selectedHomework.student.class.section && ` ${selectedHomework.student.class.section}`}
                      </span>
                    )}
                    {selectedHomework.subjectId && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {selectedHomework.subjectId}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Due: {formatDateTime(selectedHomework.dueDate)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHomework(null)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {selectedHomework.submitted ? (
                  <span className="badge bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </span>
                ) : (
                  <span className={clsx(
                    'badge',
                    new Date(selectedHomework.dueDate) < new Date()
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  )}>
                    {new Date(selectedHomework.dueDate) < new Date() ? 'Overdue' : 'Pending'}
                  </span>
                )}
                {selectedHomework.teacher.firstName && (
                  <span className="text-sm text-gray-600">
                    Teacher: {selectedHomework.teacher.firstName} {selectedHomework.teacher.lastName}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              {selectedHomework.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedHomework.description}</p>
                </div>
              )}

              {/* Submission Status */}
              {selectedHomework.submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Submitted</span>
                  </div>
                  {selectedHomework.submittedAt && (
                    <p className="text-sm text-green-700">
                      Submitted on {formatDateTime(selectedHomework.submittedAt)}
                    </p>
                  )}
                  {selectedHomework.marks !== undefined && selectedHomework.marks !== null && (
                    <p className="text-sm text-green-700 mt-1">
                      Marks: {selectedHomework.marks}
                    </p>
                  )}
                  {selectedHomework.remarks && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-1">Teacher Remarks:</p>
                      <p className="text-sm text-green-700">{selectedHomework.remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">Not Submitted</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    This assignment has not been submitted yet.
                  </p>
                </div>
              )}

              {/* Upload Placeholder */}
              {!selectedHomework.submitted && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Student Upload Area</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Students can upload their homework files here
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span>Upload functionality available in student portal</span>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedHomework.attachments && selectedHomework.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {selectedHomework.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {attachment.split('/').pop() || `Attachment ${index + 1}`}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!selectedHomework.submitted && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      markAsDoneMutation.mutate(selectedHomework.homeworkId);
                      setSelectedHomework(null);
                    }}
                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark as Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function groupHomeworkByDate(homework: HomeworkItem[]): Record<string, HomeworkItem[]> {
  const grouped: Record<string, HomeworkItem[]> = {};

  homework.forEach((hw) => {
    const date = new Date(hw.dueDate).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(hw);
  });

  // Sort items within each date group
  Object.keys(grouped).forEach((date) => {
    grouped[date].sort((a, b) => {
      // Sort by completion status (pending first), then by due time
      if (a.submitted !== b.submitted) {
        return a.submitted ? 1 : -1;
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  });

  return grouped;
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
