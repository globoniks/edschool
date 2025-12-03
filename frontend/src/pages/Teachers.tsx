import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, Search, X, Trash2 } from 'lucide-react';

export default function Teachers() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

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
    queryKey: ['teachers', search],
    queryFn: () => api.get(`/teachers?search=${search}`).then((res) => res.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/academic/subjects').then((res) => res.data),
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
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create teacher');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeacherMutation.mutate(formData);
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Teacher
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Qualification
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.teachers?.map((teacher: any) => (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {teacher.employeeId}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {teacher.firstName} {teacher.lastName}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {teacher.qualification || 'N/A'}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {teacher.experience || 0} years
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button className="text-primary-600 hover:text-primary-700">View</button>
                            <button className="text-gray-600 hover:text-gray-700">Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
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

