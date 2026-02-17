import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ToastProvider';
import { FormField, Input, Select } from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Academic() {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');
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
    enabled: assignOpen,
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
      setAssignOpen(false);
      setAssignForm({ classId: '', subjectId: '', teacherId: '' });
      showSuccess('Subject assigned to class');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to assign subject');
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
        </div>
      </div>

      {activeTab === 'classes' && (
        <div className="card">
          <div className="space-y-3">
            {classes?.map((class_: any) => (
              <div key={class_.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{class_.name} {class_.section && `- ${class_.section}`}</h3>
                    <p className="text-sm text-gray-600">{class_.academicYear}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {class_._count?.students || 0} students
                  </p>
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
    </div>
  );
}

