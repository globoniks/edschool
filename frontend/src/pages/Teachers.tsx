import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X, Download, Trash2 } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState, { EmptySearchState } from '../components/EmptyState';
import DataTable, { Column } from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ImageUpload from '../components/ImageUpload';
import ConfirmDialog from '../components/ConfirmDialog';
import { FormField, Input, Select } from '../components/FormField';

export default function Teachers() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<any[]>([]);
  const [viewTeacherId, setViewTeacherId] = useState<string | null>(null);
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    qualification: '',
    experience: 0,
    assignments: [] as { classId: string; subjectId: string }[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', search, filters, currentPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.qualification) params.append('qualification', filters.qualification as string);
      if (filters.status) params.append('status', filters.status as string);
      params.append('page', currentPage.toString());
      params.append('limit', '20');
      return api.get(`/teachers?${params.toString()}`).then((res) => res.data);
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/academic/subjects').then((res) => res.data),
  });

  const teacherDetailId = viewTeacherId || editTeacherId;
  const { data: teacherDetail } = useQuery({
    queryKey: ['teacher', teacherDetailId],
    queryFn: () => api.get(`/teachers/${teacherDetailId}`).then((res) => res.data),
    enabled: !!teacherDetailId,
  });

  const createTeacherMutation = useMutation({
    mutationFn: (data: any) => api.post('/teachers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeId: '',
        qualification: '',
        experience: 0,
        assignments: [],
      });
      setSelectedPhoto(null);
      showSuccess('Teacher created successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to create teacher');
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.patch(`/teachers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', editTeacherId] });
      setEditTeacherId(null);
      resetForm();
      showSuccess('Teacher updated successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to update teacher');
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/teachers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setDeleteConfirm(null);
      showSuccess('Teacher deactivated successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to delete teacher');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/teachers/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setBulkDeleteConfirm(false);
      setSelectedTeachers([]);
      showSuccess('Teacher(s) deactivated successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to delete teachers');
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      employeeId: '',
      qualification: '',
      experience: 0,
      assignments: [],
    });
    setSelectedPhoto(null);
  };

  useEffect(() => {
    if (editTeacherId && teacherDetail && teacherDetail.id === editTeacherId) {
      setFormData({
        firstName: teacherDetail.firstName || '',
        lastName: teacherDetail.lastName || '',
        email: teacherDetail.email || '',
        phone: teacherDetail.phone || '',
        employeeId: teacherDetail.employeeId || '',
        qualification: teacherDetail.qualification || '',
        experience: teacherDetail.experience ?? 0,
        assignments: (teacherDetail.assignments as any[])?.map((a: any) => ({
          classId: a.classId || a.class?.id || '',
          subjectId: a.subjectId || a.subject?.id || '',
        })) || [],
      });
      if (teacherDetail.photo) setSelectedPhoto(teacherDetail.photo);
    }
  }, [editTeacherId, teacherDetail]);

  const handlePhotoUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  };

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'employeeId',
      label: 'Employee ID',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (teacher) => (
        <div className="flex items-center gap-3">
          {teacher.photo && (
            <img
              src={teacher.photo}
              alt={`${teacher.firstName} ${teacher.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <span className="font-medium">
            {teacher.firstName} {teacher.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'qualification',
      label: 'Qualification',
      sortable: true,
    },
    {
      key: 'experience',
      label: 'Experience',
      sortable: true,
      render: (teacher) => `${teacher.experience || 0} years`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (teacher) => (
        <span className={`badge ${teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {teacher.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (teacher) => (
        <div className="flex gap-2">
          <button
            onClick={() => setViewTeacherId(teacher.id)}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            View
          </button>
          <button
            onClick={() => setEditTeacherId(teacher.id)}
            className="text-gray-600 hover:text-gray-700 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm({ id: teacher.id, name: `${teacher.firstName} ${teacher.lastName}` })}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ], []);

  const filterOptions = useMemo(() => [
    {
      label: 'Qualification',
      key: 'qualification',
      type: 'select' as const,
      options: [
        { label: 'B.Ed', value: 'B.Ed' },
        { label: 'M.Ed', value: 'M.Ed' },
        { label: 'M.Sc', value: 'M.Sc' },
        { label: 'B.Sc', value: 'B.Sc' },
        { label: 'Ph.D', value: 'Ph.D' },
      ],
    },
    {
      label: 'Status',
      key: 'status',
      type: 'select' as const,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ], []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeacherMutation.mutate({
      ...formData,
      photo: selectedPhoto || undefined,
    });
  };

  const addAssignment = () => {
    setFormData({
      ...formData,
      assignments: [...formData.assignments, { classId: '', subjectId: '' }],
    });
  };

  const removeAssignment = (index: number) => {
    const newAssignments = [...formData.assignments];
    newAssignments.splice(index, 1);
    setFormData({ ...formData, assignments: newAssignments });
  };

  const updateAssignment = (index: number, field: 'classId' | 'subjectId', value: string) => {
    const newAssignments = [...formData.assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setFormData({ ...formData, assignments: newAssignments });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage all teachers and staff</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={async () => {
              try {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (filters.qualification) params.append('qualification', filters.qualification as string);
                if (filters.status) params.append('status', filters.status as string);
                params.append('format', 'csv');
                const response = await api.get(`/export/teachers?${params.toString()}`, {
                  responseType: 'blob',
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `teachers_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                showSuccess('Teachers exported successfully');
              } catch (error: any) {
                showError(error.response?.data?.message || 'Failed to export teachers');
              }
            }}
            className="btn btn-secondary flex items-center justify-center w-full sm:w-auto"
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            placeholder="Search teachers by name or employee ID..."
            onSearch={(query) => {
              setSearch(query);
              setCurrentPage(1);
            }}
            initialValue={search}
          />
        </div>
        <FilterPanel
          filters={filterOptions}
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1);
          }}
        />
      </div>

      {selectedTeachers.length > 0 && (
        <div className="card mb-6 bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900">
              {selectedTeachers.length} teacher(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const params = new URLSearchParams();
                    selectedTeachers.forEach((t) => params.append('teacherId', t.id));
                    params.append('format', 'csv');
                    const response = await api.get(`/export/teachers?${params.toString()}`, {
                      responseType: 'blob',
                    });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `teachers_selected_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    showSuccess('Selected teachers exported successfully');
                  } catch (error: any) {
                    showError(error.response?.data?.message || 'Failed to export selected teachers');
                  }
                }}
                className="btn btn-secondary text-sm"
              >
                Export Selected
              </button>
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="btn btn-danger text-sm"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedTeachers([])}
                className="btn btn-secondary text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : !data?.teachers || data.teachers.length === 0 ? (
        <div className="card">
          <EmptySearchState searchTerm={search} />
        </div>
      ) : (
        <>
          <DataTable
            data={data.teachers.map((t: any) => ({
              ...t,
              name: `${t.firstName} ${t.lastName}`,
            }))}
            columns={columns}
            keyExtractor={(teacher) => teacher.id}
            emptyMessage="No teachers found"
            loading={isLoading}
            selectable={true}
            onSelectionChange={setSelectedTeachers}
          />
          {data.pagination && (
            <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.pages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              totalItems={data.pagination.total}
              itemsPerPage={data.pagination.limit}
            />
          )}
        </>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteTeacherMutation.mutate(deleteConfirm.id)}
          title="Delete Teacher"
          message={`Are you sure you want to deactivate ${deleteConfirm.name}?`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteTeacherMutation.isPending}
        />
      )}

      {bulkDeleteConfirm && (
        <ConfirmDialog
          isOpen={bulkDeleteConfirm}
          onClose={() => setBulkDeleteConfirm(false)}
          onConfirm={() => bulkDeleteMutation.mutate(selectedTeachers.map((t) => t.id))}
          title="Delete Selected Teachers"
          message={`Are you sure you want to deactivate ${selectedTeachers.length} teacher(s)? This action cannot be undone.`}
          confirmText="Delete All"
          variant="danger"
          isLoading={bulkDeleteMutation.isPending}
        />
      )}

      {/* View Teacher Modal */}
      {viewTeacherId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Teacher Details</h2>
              <button onClick={() => setViewTeacherId(null)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {teacherDetail && teacherDetail.id === viewTeacherId ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {teacherDetail.photo && (
                      <img src={teacherDetail.photo} alt="" className="w-20 h-20 rounded-full object-cover" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{teacherDetail.firstName} {teacherDetail.lastName}</h3>
                      <p className="text-sm text-gray-600">Employee ID: {teacherDetail.employeeId}</p>
                      <span className={`badge mt-1 ${teacherDetail.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {teacherDetail.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><span className="text-gray-600">Email:</span> {teacherDetail.email || '—'}</p>
                    <p><span className="text-gray-600">Phone:</span> {teacherDetail.phone || '—'}</p>
                    <p><span className="text-gray-600">Qualification:</span> {teacherDetail.qualification || '—'}</p>
                    <p><span className="text-gray-600">Experience:</span> {teacherDetail.experience ?? 0} years</p>
                  </div>
                  {teacherDetail.assignments?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Class & Subject Assignments</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {(teacherDetail.assignments as any[]).map((a: any, i: number) => (
                          <li key={i}>{a.class?.name || a.classId} – {a.subject?.name || a.subjectId}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-2 pt-4 border-t">
                    <button onClick={() => { setViewTeacherId(null); setEditTeacherId(viewTeacherId); }} className="btn btn-primary">
                      Edit Teacher
                    </button>
                    <button onClick={() => setViewTeacherId(null)} className="btn btn-secondary">Close</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editTeacherId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Teacher</h2>
              <button onClick={() => { setEditTeacherId(null); resetForm(); }} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            {teacherDetail && teacherDetail.id === editTeacherId ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateTeacherMutation.mutate({
                    id: editTeacherId,
                    ...formData,
                    photo: selectedPhoto || undefined,
                  });
                }}
                className="p-6 space-y-6"
              >
                <FormField label="Teacher Photo">
                  <ImageUpload onUpload={handlePhotoUpload} onRemove={() => setSelectedPhoto(null)} existingImage={selectedPhoto || undefined} maxSize={2 * 1024 * 1024} />
                </FormField>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="First Name" required>
                    <Input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  </FormField>
                  <FormField label="Last Name" required>
                    <Input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  </FormField>
                  <FormField label="Employee ID" required>
                    <Input type="text" required value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} />
                  </FormField>
                  <FormField label="Email">
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </FormField>
                  <FormField label="Phone">
                    <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </FormField>
                  <FormField label="Qualification">
                    <Input type="text" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} />
                  </FormField>
                  <FormField label="Experience (Years)">
                    <Input type="number" min={0} value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })} />
                  </FormField>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Class & Subject Assignments</h3>
                    <button type="button" onClick={addAssignment} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Assignment
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.assignments.map((assignment, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="flex-1">
                          <select
                            className="input"
                            value={assignment.classId}
                            onChange={(e) => updateAssignment(index, 'classId', e.target.value)}
                          >
                            <option value="">Select Class</option>
                            {classes?.map((cls: any) => (
                              <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <select
                            className="input"
                            value={assignment.subjectId}
                            onChange={(e) => updateAssignment(index, 'subjectId', e.target.value)}
                          >
                            <option value="">Select Subject</option>
                            {subjects?.map((subject: any) => (
                              <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                          </select>
                        </div>
                        <button type="button" onClick={() => removeAssignment(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {formData.assignments.length === 0 && <p className="text-sm text-gray-500 italic">No assignments.</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setEditTeacherId(null); resetForm(); }} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={updateTeacherMutation.isPending} className="btn btn-primary flex items-center gap-2">
                    {updateTeacherMutation.isPending && <LoadingSpinner size="sm" />}
                    {updateTeacherMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
            )}
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Teacher</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <FormField label="Teacher Photo" hint="Upload a profile photo">
                <ImageUpload
                  onUpload={handlePhotoUpload}
                  onRemove={() => setSelectedPhoto(null)}
                  existingImage={selectedPhoto || undefined}
                  maxSize={2 * 1024 * 1024}
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="First Name" required>
                  <Input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </FormField>
                <FormField label="Last Name" required>
                  <Input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </FormField>
                <FormField label="Employee ID" required>
                  <Input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  />
                </FormField>
                <FormField label="Email">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </FormField>
                <FormField label="Phone">
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </FormField>
                <FormField label="Qualification">
                  <Input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </FormField>
                <FormField label="Experience (Years)">
                  <Input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })
                    }
                  />
                </FormField>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Class & Subject Assignments</h3>
                  <button
                    type="button"
                    onClick={addAssignment}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Assignment
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.assignments.map((assignment, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex-1">
                        <select
                          required
                          className="input"
                          value={assignment.classId}
                          onChange={(e) => updateAssignment(index, 'classId', e.target.value)}
                        >
                          <option value="">Select Class</option>
                          {classes?.map((cls: any) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} {cls.section ? `- ${cls.section}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          required
                          className="input"
                          value={assignment.subjectId}
                          onChange={(e) => updateAssignment(index, 'subjectId', e.target.value)}
                        >
                          <option value="">Select Subject</option>
                          {subjects?.map((subject: any) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAssignment(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {formData.assignments.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No assignments added yet.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeacherMutation.isPending}
                  className="btn btn-primary"
                >
                  {createTeacherMutation.isPending ? 'Creating...' : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

