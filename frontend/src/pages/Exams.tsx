import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { FileText, Plus, X, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Exams() {
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const isAdminOrTeacher = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    startDate: '',
    endDate: '',
    passingMarks: 33,
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/exams').then((res) => res.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  const { data: examDetails } = useQuery({
    queryKey: ['exam-marks', selectedExam],
    queryFn: () => api.get(`/exams/marks?examId=${selectedExam}`).then((res) => res.data),
    enabled: !!selectedExam,
  });

  const createExamMutation = useMutation({
    mutationFn: (data: any) => api.post('/exams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        classId: '',
        startDate: '',
        endDate: '',
        passingMarks: 33,
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create exam');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExamMutation.mutate(formData);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Exams & Marks</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage exams and student marks</p>
        </div>
        {isAdminOrTeacher && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Exam
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="card">
          {exams && exams.length > 0 ? (
            <div className="space-y-4">
              {exams.map((exam: any) => (
                <div key={exam.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{exam.name}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(exam.startDate).toLocaleDateString()} -{' '}
                        {new Date(exam.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Passing Marks: {exam.passingMarks}% • Marks Entered: {exam._count?.marks || 0}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedExam(exam.id)}
                      className="btn btn-secondary"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No exams found</p>
          )}
        </div>
      )}

      {/* Create Exam Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Exam</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mid-term Exam 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  className="input"
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                >
                  <option value="">All Classes</option>
                  {classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.section ? `- ${cls.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Marks (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={formData.passingMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, passingMarks: parseFloat(e.target.value) || 33 })
                  }
                />
              </div>

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
                  disabled={createExamMutation.isPending}
                  className="btn btn-primary"
                >
                  {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam Details Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Exam Marks</h2>
              <button
                onClick={() => setSelectedExam(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {examDetails && examDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Marks</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examDetails.map((mark: any) => (
                        <tr key={mark.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            {mark.student?.firstName} {mark.student?.lastName}
                          </td>
                          <td className="py-3 px-4">{mark.subject?.name}</td>
                          <td className="py-3 px-4">
                            {mark.marksObtained} / {mark.maxMarks}
                          </td>
                          <td className="py-3 px-4">
                            <span className="badge bg-blue-100 text-blue-800">{mark.grade || 'N/A'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No marks entered for this exam</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

