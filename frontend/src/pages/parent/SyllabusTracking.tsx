import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { School, BookOpen } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function ParentSyllabusTracking() {
  const { user } = useAuthStore();

  const { data: syllabusData, isLoading } = useQuery({
    queryKey: ['syllabus-tracking'],
    queryFn: () => api.get('/syllabus/tracking').then((res) => res.data).catch(() => null),
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
        <h1 className="text-2xl font-bold text-gray-900">Syllabus Tracking</h1>
        <p className="text-sm text-gray-600 mt-1">Track syllabus completion progress by subject</p>
      </div>

      {syllabusData ? (
        <div className="space-y-4">
          {syllabusData.subjects?.map((subject: any) => (
            <div key={subject.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-lg">{subject.name}</h3>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {subject.completionPercentage || 0}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${subject.completionPercentage || 0}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {subject.completedChapters || 0} of {subject.totalChapters || 0} chapters completed
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<School className="w-16 h-16 text-gray-400" />}
          title="Syllabus tracking not available"
          description="Syllabus completion data will appear here once available"
        />
      )}
    </div>
  );
}

