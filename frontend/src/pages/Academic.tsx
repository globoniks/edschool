import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ToastProvider';
import { FormField, Input, Select } from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Academic() {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'curriculum'>('classes');
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { canManageAcademicSetup } = usePermissions();

  const [classForm, setClassForm] = useState({
    name: '',
    section: '',
    academicYear: new Date().getFullYear().toString(),
    capacity: 40,
  });
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [assignForm, setAssignForm] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
  });
  const [classTeacherModal, setClassTeacherModal] = useState<{ id: string; name: string; classTeacherId: string; responsibilities: string[] } | null>(null);
  const [classSetupClassId, setClassSetupClassId] = useState<string | null>(null);
  const [curriculumClassId, setCurriculumClassId] = useState('');
  const [curriculumEditor, setCurriculumEditor] = useState<{ curriculumId: string; name: string; chapters: any[] } | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const RESPONSIBILITY_OPTIONS = ['attendance_primary', 'parent_communication', 'discipline', 'reports'];

  const { data: classFull } = useQuery({
    queryKey: ['classFull', classSetupClassId],
    queryFn: () => api.get(`/academic/classes/${classSetupClassId}/full`).then((res) => res.data),
    enabled: !!classSetupClassId,
  });

  const { data: curriculaByClass } = useQuery({
    queryKey: ['curriculaByClass', curriculumClassId],
    queryFn: () => api.get(`/curriculum/class/${curriculumClassId}`).then((res) => res.data),
    enabled: !!curriculumClassId,
  });

  const { data: classForCurriculum } = useQuery({
    queryKey: ['classFull', curriculumClassId],
    queryFn: () => api.get(`/academic/classes/${curriculumClassId}/full`).then((res) => res.data),
    enabled: !!curriculumClassId && activeTab === 'curriculum',
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/academic/subjects').then((res) => res.data),
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers?limit=500').then((res) => res.data),
    enabled: assignOpen || !!classTeacherModal,
  });

  const createClassMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setAddClassOpen(false);
      setClassForm({ name: '', section: '', academicYear: new Date().getFullYear().toString(), capacity: 40 });
      showSuccess('Class created successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to create class');
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic/subjects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setAddSubjectOpen(false);
      setSubjectForm({ name: '', code: '', description: '' });
      showSuccess('Subject created successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to create subject');
    },
  });

  const assignClassSubjectMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic/class-subjects', { ...data, teacherId: data.teacherId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classFull', classSetupClassId] });
      setAssignOpen(false);
      setAssignForm({ classId: '', subjectId: '', teacherId: '' });
      showSuccess('Subject assigned to class');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to assign subject');
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, classTeacherId, responsibilities }: { id: string; classTeacherId: string | null; responsibilities: string[] }) =>
      api.patch(`/academic/classes/${id}`, { classTeacherId, responsibilities }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setClassTeacherModal(null);
      showSuccess('Class teacher updated');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to update class teacher');
    },
  });

  const removeClassSubjectMutation = useMutation({
    mutationFn: ({ classId, subjectId }: { classId: string; subjectId: string }) =>
      api.delete('/academic/class-subjects', { data: { classId, subjectId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classFull', classSetupClassId] });
      showSuccess('Subject removed from class');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to remove subject');
    },
  });

  const createCurriculumMutation = useMutation({
    mutationFn: (data: { classId: string; subjectId: string; academicYear: string; name?: string }) =>
      api.post('/curriculum', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['curriculaByClass', curriculumClassId] });
      setCurriculumEditor({ curriculumId: res.data.id, name: res.data.name || '', chapters: res.data.chapters || [] });
      showSuccess('Curriculum created');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to create curriculum');
    },
  });

  const createChapterMutation = useMutation({
    mutationFn: (data: { curriculumId: string; title: string; order?: number }) =>
      api.post('/curriculum/chapters', data),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['curriculaByClass', curriculumClassId] });
      setCurriculumEditor((e) => e ? { ...e, chapters: [...e.chapters, res.data] } : null);
      setNewChapterTitle('');
      showSuccess('Chapter added');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to add chapter');
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/curriculum/chapters/${id}`),
    onSuccess: (_, chapterId) => {
      queryClient.invalidateQueries({ queryKey: ['curriculaByClass', curriculumClassId] });
      setCurriculumEditor((e) => e ? { ...e, chapters: e.chapters.filter((c: any) => c.id !== chapterId) } : null);
      showSuccess('Chapter removed');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to remove chapter');
    },
  });

  const reorderChaptersMutation = useMutation({
    mutationFn: (payload: { curriculumId: string; chapterIds: string[] }) =>
      api.post('/curriculum/chapters/reorder', payload),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['curriculaByClass', curriculumClassId] });
      setCurriculumEditor((e) => e ? { ...e, chapters: data.data || data } : null);
      showSuccess('Order updated');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to reorder');
    },
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Academic Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage classes, subjects, and academic settings</p>
        </div>
        {canManageAcademicSetup() && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAddClassOpen(true)} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Class
            </button>
            <button onClick={() => setAddSubjectOpen(true)} className="btn btn-secondary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
            <button onClick={() => setAssignOpen(true)} className="btn btn-secondary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Assign Subject to Class
            </button>
          </div>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex space-x-2 sm:space-x-4 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 sm:px-4 py-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'classes'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600'
            }`}
          >
            Classes
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 sm:px-4 py-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600'
            }`}
          >
            Subjects
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-3 sm:px-4 py-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'curriculum'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600'
            }`}
          >
            Curriculum
          </button>
        </div>
      </div>

      {activeTab === 'classes' && (
        <div className="card">
          <div className="space-y-3">
            {classes?.map((class_: any) => (
              <div key={class_.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{class_.name} {class_.section && `- ${class_.section}`}</h3>
                    <p className="text-sm text-gray-600">{class_.academicYear} · {class_._count?.students ?? 0} students</p>
                    {class_.classTeacher && (
                      <p className="text-sm text-gray-700 mt-1">Class teacher: {class_.classTeacher.firstName} {class_.classTeacher.lastName}</p>
                    )}
                  </div>
                  {canManageAcademicSetup() && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setClassSetupClassId(class_.id)}
                        className="btn btn-secondary text-sm"
                      >
                        Subjects & teachers
                      </button>
                      <button
                        type="button"
                        onClick={() => setClassTeacherModal({
                          id: class_.id,
                          name: `${class_.name}${class_.section ? ` ${class_.section}` : ''}`,
                          classTeacherId: class_.classTeacherId || '',
                          responsibilities: Array.isArray(class_.responsibilities) ? class_.responsibilities : [],
                        })}
                        className="btn btn-secondary text-sm"
                      >
                        {class_.classTeacherId ? 'Edit class teacher' : 'Set class teacher'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="card">
          <div className="space-y-3">
            {subjects?.map((subject: any) => (
              <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{subject.name}</h3>
                    {subject.code && <p className="text-sm text-gray-600">Code: {subject.code}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'curriculum' && canManageAcademicSetup() && (
        <div className="card">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={curriculumClassId}
              onChange={(e) => setCurriculumClassId(e.target.value)}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select class</option>
              {classes?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}{cls.section ? ` ${cls.section}` : ''} ({cls.academicYear})</option>
              ))}
            </select>
          </div>
          {curriculumClassId && (
            <div className="space-y-3">
              {classForCurriculum?.subjects?.length > 0 ? (
                classForCurriculum.subjects.map((cs: any) => {
                  const curriculum = (curriculaByClass || []).find((c: any) => c.subjectId === cs.subjectId);
                  return (
                    <div key={cs.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <span className="font-medium">{cs.subject?.name}</span>
                      <span className="text-sm text-gray-500">{curriculum?.chapters?.length ?? 0} chapters</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (curriculum) {
                            setCurriculumEditor({ curriculumId: curriculum.id, name: curriculum.name || `${classForCurriculum.name} ${cs.subject?.name}`, chapters: curriculum.chapters || [] });
                          } else {
                            createCurriculumMutation.mutate({
                              classId: curriculumClassId,
                              subjectId: cs.subjectId,
                              academicYear: classForCurriculum.academicYear,
                              name: `${classForCurriculum.name} ${cs.subject?.name}`,
                            });
                          }
                        }}
                        disabled={createCurriculumMutation.isPending}
                        className="btn btn-secondary text-sm"
                      >
                        {curriculum ? 'Edit curriculum' : 'Add curriculum'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm">Select a class with subjects assigned (use &quot;Subjects & teachers&quot; on a class first).</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Class Modal */}
      {addClassOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Class</h2>
              <button onClick={() => setAddClassOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createClassMutation.mutate({
                  name: classForm.name,
                  section: classForm.section || undefined,
                  academicYear: classForm.academicYear,
                  capacity: classForm.capacity,
                });
              }}
              className="p-6 space-y-4"
            >
              <FormField label="Name" required>
                <Input
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="e.g. Class 10"
                />
              </FormField>
              <FormField label="Section">
                <Input
                  value={classForm.section}
                  onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                  placeholder="e.g. A"
                />
              </FormField>
              <FormField label="Academic Year" required>
                <Input
                  required
                  value={classForm.academicYear}
                  onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                  placeholder="e.g. 2024-25"
                />
              </FormField>
              <FormField label="Capacity">
                <Input
                  type="number"
                  min={1}
                  value={classForm.capacity}
                  onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value) || 40 })}
                />
              </FormField>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAddClassOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createClassMutation.isPending} className="btn btn-primary flex items-center gap-2">
                  {createClassMutation.isPending && <LoadingSpinner size="sm" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {addSubjectOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Subject</h2>
              <button onClick={() => setAddSubjectOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSubjectMutation.mutate({
                  name: subjectForm.name,
                  code: subjectForm.code || undefined,
                  description: subjectForm.description || undefined,
                });
              }}
              className="p-6 space-y-4"
            >
              <FormField label="Name" required>
                <Input
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Mathematics"
                />
              </FormField>
              <FormField label="Code">
                <Input
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  placeholder="e.g. MATH101"
                />
              </FormField>
              <FormField label="Description">
                <Input
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  placeholder="Optional"
                />
              </FormField>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAddSubjectOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createSubjectMutation.isPending} className="btn btn-primary flex items-center gap-2">
                  {createSubjectMutation.isPending && <LoadingSpinner size="sm" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Subject to Class Modal */}
      {assignOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Assign Subject to Class</h2>
              <button onClick={() => setAssignOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                assignClassSubjectMutation.mutate(assignForm);
              }}
              className="p-6 space-y-4"
            >
              <FormField label="Class" required>
                <Select
                  required
                  value={assignForm.classId}
                  onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                >
                  <option value="">Select class</option>
                  {classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Subject" required>
                <Select
                  required
                  value={assignForm.subjectId}
                  onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                >
                  <option value="">Select subject</option>
                  {subjects?.map((subj: any) => (
                    <option key={subj.id} value={subj.id}>{subj.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Teacher (optional)">
                <Select
                  value={assignForm.teacherId}
                  onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                >
                  <option value="">None</option>
                  {(teachers as any)?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </Select>
              </FormField>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAssignOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={assignClassSubjectMutation.isPending} className="btn btn-primary flex items-center gap-2">
                  {assignClassSubjectMutation.isPending && <LoadingSpinner size="sm" />}
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class setup modal (subjects & teachers for one class) */}
      {classSetupClassId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Class setup – {classFull?.name} {classFull?.section ? ` ${classFull.section}` : ''}
              </h2>
              <button onClick={() => setClassSetupClassId(null)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {classFull ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">{classFull._count?.students ?? 0} students</p>
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Subjects & teachers</h3>
                    <button
                      type="button"
                      onClick={() => { setAssignForm((f) => ({ ...f, classId: classSetupClassId })); setAssignOpen(true); }}
                      className="btn btn-primary text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add subject
                    </button>
                  </div>
                  {classFull.subjects?.length > 0 ? (
                    <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {classFull.subjects.map((cs: any) => (
                        <li key={cs.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                          <span className="font-medium">{cs.subject?.name}</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={cs.teacherId || ''}
                              onChange={(e) => {
                                const teacherId = e.target.value || undefined;
                                assignClassSubjectMutation.mutate({
                                  classId: classSetupClassId!,
                                  subjectId: cs.subjectId,
                                  teacherId,
                                });
                              }}
                              disabled={assignClassSubjectMutation.isPending}
                              className="border border-gray-300 rounded px-2 py-1 text-sm min-w-[140px]"
                            >
                              <option value="">No teacher</option>
                              {(teachers as any)?.teachers?.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeClassSubjectMutation.mutate({ classId: classSetupClassId, subjectId: cs.subjectId })}
                              disabled={removeClassSubjectMutation.isPending}
                              className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No subjects assigned. Click &quot;Add subject&quot; to assign.</p>
                  )}
                </>
              ) : (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Class teacher modal */}
      {classTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Class teacher – {classTeacherModal.name}</h2>
              <button onClick={() => setClassTeacherModal(null)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <FormField label="Class teacher">
                <Select
                  value={classTeacherModal.classTeacherId}
                  onChange={(e) => setClassTeacherModal({ ...classTeacherModal, classTeacherId: e.target.value })}
                >
                  <option value="">None</option>
                  {(teachers as any)?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Responsibilities">
                <div className="space-y-2">
                  {RESPONSIBILITY_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={classTeacherModal.responsibilities.includes(opt)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...classTeacherModal.responsibilities, opt]
                            : classTeacherModal.responsibilities.filter((r) => r !== opt);
                          setClassTeacherModal({ ...classTeacherModal, responsibilities: next });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm capitalize">{opt.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </FormField>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setClassTeacherModal(null)} className="btn btn-secondary">Cancel</button>
                <button
                  type="button"
                  onClick={() => updateClassMutation.mutate({
                    id: classTeacherModal.id,
                    classTeacherId: classTeacherModal.classTeacherId || null,
                    responsibilities: classTeacherModal.responsibilities,
                  })}
                  disabled={updateClassMutation.isPending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {updateClassMutation.isPending && <LoadingSpinner size="sm" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum editor modal */}
      {curriculumEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Curriculum – {curriculumEditor.name}</h2>
              <button onClick={() => { setCurriculumEditor(null); setNewChapterTitle(''); }} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Chapter title"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newChapterTitle.trim()) return;
                    createChapterMutation.mutate({ curriculumId: curriculumEditor.curriculumId, title: newChapterTitle.trim(), order: curriculumEditor.chapters.length });
                  }}
                  disabled={createChapterMutation.isPending}
                  className="btn btn-primary"
                >
                  Add chapter
                </button>
              </div>
              <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {curriculumEditor.chapters.map((ch: any, idx: number) => (
                  <li key={ch.id} className="flex items-center justify-between px-4 py-3 gap-2">
                    <span className="font-medium flex-1">{idx + 1}. {ch.title}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Move up"
                        onClick={() => {
                          if (idx === 0) return;
                          const newChapters = [...curriculumEditor.chapters];
                          const a = newChapters[idx];
                          newChapters[idx] = newChapters[idx - 1];
                          newChapters[idx - 1] = a;
                          reorderChaptersMutation.mutate({
                            curriculumId: curriculumEditor.curriculumId,
                            chapterIds: newChapters.map((c: any) => c.id),
                          });
                        }}
                        disabled={idx === 0 || reorderChaptersMutation.isPending}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Move down"
                        onClick={() => {
                          if (idx >= curriculumEditor.chapters.length - 1) return;
                          const newChapters = [...curriculumEditor.chapters];
                          const a = newChapters[idx];
                          newChapters[idx] = newChapters[idx + 1];
                          newChapters[idx + 1] = a;
                          reorderChaptersMutation.mutate({
                            curriculumId: curriculumEditor.curriculumId,
                            chapterIds: newChapters.map((c: any) => c.id),
                          });
                        }}
                        disabled={idx >= curriculumEditor.chapters.length - 1 || reorderChaptersMutation.isPending}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteChapterMutation.mutate(ch.id)}
                        disabled={deleteChapterMutation.isPending}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {curriculumEditor.chapters.length === 0 && (
                <p className="text-gray-500 text-sm py-4">No chapters yet. Add one above.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

