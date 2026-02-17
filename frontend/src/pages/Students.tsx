import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X, Download } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ToastProvider';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState, { EmptySearchState } from '../components/EmptyState';
import { FormField, Input, Select, Textarea } from '../components/FormField';
import DataTable, { Column } from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ImageUpload from '../components/ImageUpload';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Students() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [viewStudentId, setViewStudentId] = useState<string | null>(null);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { canManageStudents } = usePermissions();

  const [formData, setFormData] = useState({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    phone: '',
    email: '',
    address: '',
    classId: '',
    admissionDate: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students', search, filters, currentPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.classId) params.append('classId', filters.classId as string);
      if (filters.gender) params.append('gender', filters.gender as string);
      if (filters.status) params.append('status', filters.status as string);
      params.append('page', currentPage.toString());
      params.append('limit', '20');
      return api.get(`/students?${params.toString()}`).then((res) => res.data);
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  const studentDetailId = viewStudentId || editStudentId;
  const { data: studentDetail } = useQuery({
    queryKey: ['student', studentDetailId],
    queryFn: () => api.get(`/students/${studentDetailId}`).then((res) => res.data),
    enabled: !!studentDetailId,
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.patch(`/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', editStudentId] });
      setEditStudentId(null);
      resetForm();
      showSuccess('Student updated successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to update student');
    },
  });

  const resetForm = () => {
    setFormData({
      admissionNumber: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      phone: '',
      email: '',
      address: '',
      classId: '',
      admissionDate: new Date().toISOString().split('T')[0],
    });
    setSelectedPhoto(null);
  };

  useEffect(() => {
    if (editStudentId && studentDetail && studentDetail.id === editStudentId) {
      setFormData({
        admissionNumber: studentDetail.admissionNumber || '',
        firstName: studentDetail.firstName || '',
        lastName: studentDetail.lastName || '',
        dateOfBirth: studentDetail.dateOfBirth ? new Date(studentDetail.dateOfBirth).toISOString().split('T')[0] : '',
        gender: studentDetail.gender || '',
        bloodGroup: studentDetail.bloodGroup || '',
        phone: studentDetail.phone || '',
        email: studentDetail.email || '',
        address: studentDetail.address || '',
        classId: studentDetail.classId || studentDetail.class?.id || '',
        admissionDate: studentDetail.admissionDate ? new Date(studentDetail.admissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
      setSelectedPhoto(studentDetail.photo || null);
    }
  }, [editStudentId, studentDetail]);

  const createStudentMutation = useMutation({
    mutationFn: (data: any) => api.post('/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsModalOpen(false);
      resetForm();
      showSuccess('Student created successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to create student');
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteConfirm(null);
      showSuccess('Student deactivated successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to delete student');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/students/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setBulkDeleteConfirm(false);
      setSelectedStudents([]);
      showSuccess(`${selectedStudents.length} student(s) deactivated successfully`);
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to delete students');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStudentMutation.mutate({
      ...formData,
      photo: selectedPhoto || undefined,
    });
  };

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
      key: 'admissionNumber',
      label: 'Admission No.',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (student) => (
        <div className="flex items-center gap-3">
          {student.photo && (
            <img
              src={student.photo}
              alt={`${student.firstName} ${student.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <span className="font-medium">
            {student.firstName} {student.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      sortable: true,
      render: (student) => student.class?.name || 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (student) => (
        <span className={`badge ${student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {student.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (student) => (
        canManageStudents() ? (
          <div className="flex gap-2">
            <button
              onClick={() => setViewStudentId(student.id)}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              View
            </button>
            <button
              onClick={() => {
                setEditStudentId(student.id);
              }}
              className="text-gray-600 hover:text-gray-700 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteConfirm({ id: student.id, name: `${student.firstName} ${student.lastName}` })}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-500">Read only</span>
        )
      ),
    },
  ], [canManageStudents]);

  const filterOptions = useMemo(() => [
    {
      label: 'Class',
      key: 'classId',
      type: 'select' as const,
      options: classes?.map((cls: any) => ({
        label: `${cls.name}${cls.section ? ` ${cls.section}` : ''}`,
        value: cls.id,
      })) || [],
    },
    {
      label: 'Gender',
      key: 'gender',
      type: 'select' as const,
      options: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
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
  ], [classes]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {canManageStudents()
              ? 'Manage all students in your school'
              : 'View your student profile and basic details'}
          </p>
        </div>
        {canManageStudents() && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={async () => {
                try {
                  const params = new URLSearchParams();
                  if (search) params.append('search', search);
                  if (filters.classId) params.append('classId', filters.classId as string);
                  if (filters.gender) params.append('gender', filters.gender as string);
                  if (filters.status) params.append('status', filters.status as string);
                  params.append('format', 'csv');
                  const response = await api.get(`/export/students?${params.toString()}`, {
                    responseType: 'blob',
                  });
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `students_${Date.now()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  showSuccess('Students exported successfully');
                } catch (error: any) {
                  showError(error.response?.data?.message || 'Failed to export students');
                }
              }}
              className="btn btn-secondary flex items-center justify-center w-full sm:w-auto"
            >
              <Download className="w-5 h-5 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Student
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            placeholder="Search students by name or admission number..."
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

      {selectedStudents.length > 0 && canManageStudents() && (
        <div className="card mb-6 bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900">
              {selectedStudents.length} student(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const params = new URLSearchParams();
                    selectedStudents.forEach((s) => params.append('studentId', s.id));
                    params.append('format', 'csv');
                    const response = await api.get(`/export/students?${params.toString()}`, {
                      responseType: 'blob',
                    });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `students_selected_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    showSuccess('Selected students exported successfully');
                  } catch (error: any) {
                    showError(error.response?.data?.message || 'Failed to export selected students');
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
                onClick={() => setSelectedStudents([])}
                className="btn btn-secondary text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : !data?.students || data.students.length === 0 ? (
        <div className="card">
          <EmptySearchState searchTerm={search} />
        </div>
      ) : (
        <>
          <DataTable
            data={data.students.map((s: any) => ({
              ...s,
              name: `${s.firstName} ${s.lastName}`,
            }))}
            columns={columns}
            keyExtractor={(student) => student.id}
            emptyMessage="No students found"
            loading={isLoading}
            selectable={canManageStudents()}
            onSelectionChange={setSelectedStudents}
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
          onConfirm={() => deleteStudentMutation.mutate(deleteConfirm.id)}
          title="Delete Student"
          message={`Are you sure you want to deactivate ${deleteConfirm.name}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteStudentMutation.isPending}
        />
      )}

      {bulkDeleteConfirm && (
        <ConfirmDialog
          isOpen={bulkDeleteConfirm}
          onClose={() => setBulkDeleteConfirm(false)}
          onConfirm={() => bulkDeleteMutation.mutate(selectedStudents.map((s) => s.id))}
          title="Delete Selected Students"
          message={`Are you sure you want to deactivate ${selectedStudents.length} student(s)? This action cannot be undone.`}
          confirmText="Delete All"
          variant="danger"
          isLoading={bulkDeleteMutation.isPending}
        />
      )}

      {/* View Student Modal */}
      {viewStudentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Student Details</h2>
              <button onClick={() => setViewStudentId(null)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {studentDetail && studentDetail.id === viewStudentId ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {studentDetail.photo && (
                      <img src={studentDetail.photo} alt="" className="w-20 h-20 rounded-full object-cover" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{studentDetail.firstName} {studentDetail.lastName}</h3>
                      <p className="text-sm text-gray-600">Admission: {studentDetail.admissionNumber}</p>
                      <p className="text-sm text-gray-600">Class: {studentDetail.class?.name || 'N/A'}</p>
                      <span className={`badge mt-1 ${studentDetail.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {studentDetail.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><span className="text-gray-600">DOB:</span> {studentDetail.dateOfBirth ? new Date(studentDetail.dateOfBirth).toLocaleDateString() : '—'}</p>
                    <p><span className="text-gray-600">Gender:</span> {studentDetail.gender || '—'}</p>
                    <p><span className="text-gray-600">Email:</span> {studentDetail.email || '—'}</p>
                    <p><span className="text-gray-600">Phone:</span> {studentDetail.phone || '—'}</p>
                    <p><span className="text-gray-600">Blood Group:</span> {studentDetail.bloodGroup || '—'}</p>
                    <p><span className="text-gray-600">Admission Date:</span> {studentDetail.admissionDate ? new Date(studentDetail.admissionDate).toLocaleDateString() : '—'}</p>
                  </div>
                  {studentDetail.address && <p className="text-sm"><span className="text-gray-600">Address:</span> {studentDetail.address}</p>}
                  {studentDetail.parents?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Parents / Guardians</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {studentDetail.parents.map((p: any) => (
                          <li key={p.parentId}>{p.parent?.firstName} {p.parent?.lastName} {p.parent?.email && `(${p.parent.email})`}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-2 pt-4 border-t">
                    <button onClick={() => { setViewStudentId(null); setEditStudentId(viewStudentId); }} className="btn btn-primary">
                      Edit Student
                    </button>
                    <button onClick={() => setViewStudentId(null)} className="btn btn-secondary">Close</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Student</h2>
              <button onClick={() => { setEditStudentId(null); resetForm(); }} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            {studentDetail && studentDetail.id === editStudentId ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateStudentMutation.mutate({
                    id: editStudentId,
                    ...formData,
                    photo: selectedPhoto || undefined,
                  });
                }}
                className="p-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Admission Number" required>
                    <Input type="text" required value={formData.admissionNumber} onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })} placeholder="e.g., ADM001" />
                  </FormField>
                  <FormField label="Class">
                    <Select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })}>
                      <option value="">Select Class</option>
                      {classes?.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="First Name" required>
                    <Input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  </FormField>
                  <FormField label="Last Name" required>
                    <Input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  </FormField>
                  <FormField label="Date of Birth" required>
                    <Input type="date" required value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                  </FormField>
                  <FormField label="Gender" required>
                    <Select required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                  </FormField>
                  <FormField label="Email">
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </FormField>
                  <FormField label="Phone">
                    <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </FormField>
                  <FormField label="Blood Group">
                    <Select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </Select>
                  </FormField>
                  <FormField label="Admission Date">
                    <Input type="date" value={formData.admissionDate} onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })} />
                  </FormField>
                </div>
                <FormField label="Student Photo">
                  <ImageUpload onUpload={handlePhotoUpload} onRemove={() => setSelectedPhoto(null)} existingImage={selectedPhoto || undefined} maxSize={2 * 1024 * 1024} />
                </FormField>
                <FormField label="Address">
                  <Textarea rows={3} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Enter address" />
                </FormField>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setEditStudentId(null); resetForm(); }} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={updateStudentMutation.isPending} className="btn btn-primary flex items-center gap-2">
                    {updateStudentMutation.isPending && <LoadingSpinner size="sm" />}
                    {updateStudentMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Admission Number" required>
                  <Input
                    type="text"
                    required
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    placeholder="e.g., ADM001"
                  />
                </FormField>
                <FormField label="Class">
                  <Select
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
                <FormField label="Date of Birth" required>
                  <Input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </FormField>
                <FormField label="Gender" required>
                  <Select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
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
                <FormField label="Blood Group">
                  <Select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Select>
                </FormField>
                <FormField label="Admission Date">
                  <Input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  />
                </FormField>
              </div>
              <FormField label="Student Photo" hint="Upload a profile photo for the student">
                <ImageUpload
                  onUpload={handlePhotoUpload}
                  onRemove={() => setSelectedPhoto(null)}
                  existingImage={selectedPhoto || undefined}
                  maxSize={2 * 1024 * 1024}
                />
              </FormField>
              <FormField label="Address">
                <Textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                />
              </FormField>

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
                  disabled={createStudentMutation.isPending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {createStudentMutation.isPending && <LoadingSpinner size="sm" />}
                  {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

