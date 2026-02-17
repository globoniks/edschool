import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X, Download, Edit3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import { FormField, Input, Select } from '../components/FormField';
import EmptyState from '../components/EmptyState';

export default function Exams() {
  const { user } = useAuthStore();
  const { canCreateExams, canEnterExamMarks } = usePermissions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [enterMarksOpen, setEnterMarksOpen] = useState(false);
  const [marksClassId, setMarksClassId] = useState('');
  const [marksSubjectId, setMarksSubjectId] = useState('');
  const [marksRows, setMarksRows] = useState<Record<string, { maxMarks: number; marksObtained: number; grade: string }>>({});
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

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

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/academic/subjects').then((res) => res.data),
  });

  const selectedExamObj = useMemo(() => {
    if (!selectedExam || !exams || !Array.isArray(exams)) return null;
    return (exams as any[]).find((e: any) => e.id === selectedExam) || null;
  }, [selectedExam, exams]);

  const marksClassIdResolved = selectedExamObj?.classId || marksClassId;
  const { data: marksStudents } = useQuery({
    queryKey: ['students-for-marks', marksClassIdResolved],
    queryFn: () => api.get(`/students?classId=${marksClassIdResolved}&limit=1000&status=active`).then((res) => res.data),
    enabled: !!marksClassIdResolved && enterMarksOpen,
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
      showSuccess('Exam created successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to create exam');
    },
  });

  const saveMarksMutation = useMutation({
    mutationFn: async ({
      examId,
      rows,
      subjectId,
    }: {
      examId: string;
      subjectId: string;
      rows: { studentId: string; maxMarks: number; marksObtained: number; grade?: string }[];
    }) => {
      await Promise.all(
        rows
          .filter((r) => r.maxMarks > 0 || r.marksObtained > 0)
          .map((r) =>
            api.post('/exams/marks', {
              examId,
              studentId: r.studentId,
              subjectId,
              maxMarks: r.maxMarks,
              marksObtained: r.marksObtained,
              grade: r.grade || undefined,
            })
          )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-marks', selectedExam] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setMarksRows({});
      showSuccess('Marks saved successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to save marks');
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
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {canCreateExams() ? 'Manage exams and student marks' : 'View exam results for your children'}
          </p>
        </div>
        {canCreateExams() && (
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
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const response = await api.get(`/export/exams?examId=${exam.id}&format=csv`, {
                              responseType: 'blob',
                            });
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `exam_${exam.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            showSuccess('Exam results exported successfully');
                          } catch (error: any) {
                            showError(error.response?.data?.message || 'Failed to export exam results');
                          }
                        }}
                        className="btn btn-secondary text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </button>
                      <button
                        onClick={() => setSelectedExam(exam.id)}
                        className="btn btn-secondary"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No exams found"
              description="No exams have been created yet"
            />
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
              <FormField label="Exam Name" required>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mid-term Exam 2024"
                />
              </FormField>

              <FormField label="Class">
                <Select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                >
                  <option value="">All Classes</option>
                  {classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.section ? `- ${cls.section}` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date" required>
                  <Input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </FormField>
                <FormField label="End Date" required>
                  <Input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Passing Marks (%)" hint="Minimum percentage required to pass">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, passingMarks: parseFloat(e.target.value) || 33 })
                  }
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
              <div className="flex items-center gap-2">
                {canEnterExamMarks() && !enterMarksOpen && (
                  <button
                    onClick={() => {
                      setEnterMarksOpen(true);
                      if (!selectedExamObj?.classId) setMarksClassId(marksClassId || (classes?.[0]?.id ?? ''));
                    }}
                    className="btn btn-primary text-sm flex items-center gap-1"
                  >
                    <Edit3 className="w-4 h-4" />
                    Enter / Edit marks
                  </button>
                )}
                {canEnterExamMarks() && enterMarksOpen && (
                  <button
                    onClick={() => {
                      setEnterMarksOpen(false);
                      setMarksSubjectId('');
                      setMarksRows({});
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    Back to view
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedExam(null);
                    setEnterMarksOpen(false);
                    setMarksClassId('');
                    setMarksSubjectId('');
                    setMarksRows({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {enterMarksOpen && canEnterExamMarks() ? (
                <div className="space-y-6">
                  {!selectedExamObj?.classId && (
                    <FormField label="Class (for this exam)">
                      <Select
                        value={marksClassId}
                        onChange={(e) => setMarksClassId(e.target.value)}
                      >
                        <option value="">Select class</option>
                        {classes?.map((cls: any) => (
                          <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
                        ))}
                      </Select>
                    </FormField>
                  )}
                  <FormField label="Subject">
                    <Select
                      value={marksSubjectId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        setMarksSubjectId(sid);
                        const students = (marksStudents as any)?.students ?? [];
                        const existing = (examDetails as any[]) ?? [];
                        const next: Record<string, { maxMarks: number; marksObtained: number; grade: string }> = {};
                        students.forEach((s: any) => {
                          const mark = existing.find((m: any) => m.studentId === s.id && m.subjectId === sid);
                          next[s.id] = mark
                            ? { maxMarks: mark.maxMarks, marksObtained: mark.marksObtained, grade: mark.grade || '' }
                            : { maxMarks: 100, marksObtained: 0, grade: '' };
                        });
                        setMarksRows(next);
                      }}
                    >
                      <option value="">Select subject</option>
                      {subjects?.map((subj: any) => (
                        <option key={subj.id} value={subj.id}>{subj.name}</option>
                      ))}
                    </Select>
                  </FormField>
                  {marksSubjectId && marksStudents?.students?.length > 0 ? (
                    <>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-28">Max Marks</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-28">Obtained</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-24">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(marksStudents as any).students.map((s: any) => (
                              <tr key={s.id} className="border-b border-gray-100">
                                <td className="py-2 px-4">{s.firstName} {s.lastName}</td>
                                <td className="py-2 px-4">
                                  <Input
                                    type="number"
                                    min={0}
                                    className="w-full"
                                    value={marksRows[s.id]?.maxMarks ?? 100}
                                    onChange={(e) =>
                                      setMarksRows((prev) => ({
                                        ...prev,
                                        [s.id]: { ...(prev[s.id] ?? { maxMarks: 100, marksObtained: 0, grade: '' }), maxMarks: parseInt(e.target.value) || 0 },
                                      }))
                                    }
                                  />
                                </td>
                                <td className="py-2 px-4">
                                  <Input
                                    type="number"
                                    min={0}
                                    className="w-full"
                                    value={marksRows[s.id]?.marksObtained ?? 0}
                                    onChange={(e) =>
                                      setMarksRows((prev) => ({
                                        ...prev,
                                        [s.id]: { ...(prev[s.id] ?? { maxMarks: 100, marksObtained: 0, grade: '' }), marksObtained: parseInt(e.target.value) || 0 },
                                      }))
                                    }
                                  />
                                </td>
                                <td className="py-2 px-4">
                                  <Input
                                    type="text"
                                    className="w-full"
                                    placeholder="A/B/C"
                                    value={marksRows[s.id]?.grade ?? ''}
                                    onChange={(e) =>
                                      setMarksRows((prev) => ({
                                        ...prev,
                                        [s.id]: { ...(prev[s.id] ?? { maxMarks: 100, marksObtained: 0, grade: '' }), grade: e.target.value },
                                      }))
                                    }
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const students = (marksStudents as any).students ?? [];
                            saveMarksMutation.mutate({
                              examId: selectedExam,
                              subjectId: marksSubjectId,
                              rows: students.map((s: any) => ({
                                studentId: s.id,
                                maxMarks: marksRows[s.id]?.maxMarks ?? 100,
                                marksObtained: marksRows[s.id]?.marksObtained ?? 0,
                                grade: marksRows[s.id]?.grade || undefined,
                              })),
                            });
                          }}
                          disabled={saveMarksMutation.isPending}
                          className="btn btn-primary flex items-center gap-2"
                        >
                          {saveMarksMutation.isPending && <LoadingSpinner size="sm" />}
                          {saveMarksMutation.isPending ? 'Saving...' : 'Save marks'}
                        </button>
                      </div>
                    </>
                  ) : marksSubjectId && (!marksStudents?.students?.length) ? (
                    <p className="text-gray-500">No students in this class.</p>
                  ) : null}
                </div>
              ) : examDetails && (examDetails as any[]).length > 0 ? (
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
                      {(examDetails as any[]).map((mark: any) => (
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
                <p className="text-gray-500 text-center py-12">
                  {enterMarksOpen ? 'Select a class and subject to enter marks.' : 'No marks entered for this exam'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

