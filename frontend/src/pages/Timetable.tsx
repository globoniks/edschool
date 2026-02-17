import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ToastProvider';
import { FormField, Input, Select } from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Timetable() {
  const { user } = useAuthStore();
  const { canManageTimetable } = usePermissions();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const isParent = user?.role === 'PARENT';
  const [classId, setClassId] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [deleteSlotConfirm, setDeleteSlotConfirm] = useState<{ id: string; label: string } | null>(null);
  const [slotForm, setSlotForm] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    academicYear: new Date().getFullYear().toString(),
  });

  // For parents, fetch their children's data
  const { data: parentDashboard } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parents/dashboard').then((res) => res.data),
    enabled: isParent,
  });

  // For non-parents, fetch all classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
    enabled: !isParent,
  });

  // Auto-select first child's class for parents
  useEffect(() => {
    if (isParent && parentDashboard?.children && parentDashboard.children.length > 0 && !selectedChildId) {
      const firstChild = parentDashboard.children[0];
      if (firstChild.class?.id) {
        setClassId(firstChild.class.id);
        setSelectedChildId(firstChild.studentId);
      }
    }
  }, [isParent, parentDashboard, selectedChildId]);

  // Update classId when child selection changes
  useEffect(() => {
    if (isParent && selectedChildId && parentDashboard?.children) {
      const selectedChild = parentDashboard.children.find((c: any) => c.studentId === selectedChildId);
      if (selectedChild?.class?.id) {
        setClassId(selectedChild.class.id);
      }
    }
  }, [selectedChildId, isParent, parentDashboard]);

  const { data: timetableData, isLoading } = useQuery({
    queryKey: ['timetable', classId],
    queryFn: () => api.get(`/timetables?classId=${classId}`).then((res) => res.data),
    enabled: !!classId,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/academic/subjects').then((res) => res.data),
    enabled: slotModalOpen,
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => api.get('/teachers?limit=500').then((res) => res.data),
    enabled: slotModalOpen,
  });

  const createSlotMutation = useMutation({
    mutationFn: (data: any) => api.post('/timetables', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', classId] });
      setSlotModalOpen(false);
      resetSlotForm();
      showSuccess('Timetable slot added');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to add slot');
    },
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.patch(`/timetables/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', classId] });
      setSlotModalOpen(false);
      setEditingSlotId(null);
      resetSlotForm();
      showSuccess('Slot updated');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to update slot');
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/timetables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', classId] });
      setDeleteSlotConfirm(null);
      showSuccess('Slot removed');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to remove slot');
    },
  });

  const resetSlotForm = () => {
    setSlotForm({
      classId: classId || '',
      subjectId: '',
      teacherId: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      academicYear: new Date().getFullYear().toString(),
    });
  };

  const openAddSlot = () => {
    setEditingSlotId(null);
    setSlotForm({
      classId: classId || '',
      subjectId: '',
      teacherId: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      academicYear: new Date().getFullYear().toString(),
    });
    setSlotModalOpen(true);
  };

  const openEditSlot = (slot: any) => {
    setEditingSlotId(slot.id);
    setSlotForm({
      classId: slot.classId,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId || '',
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime?.slice(0, 5) || '09:00',
      endTime: slot.endTime?.slice(0, 5) || '10:00',
      room: slot.room || '',
      academicYear: slot.academicYear || new Date().getFullYear().toString(),
    });
    setSlotModalOpen(true);
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNumbers = [0, 1, 2, 3, 4, 5, 6];

  // Group timetable by day
  const timetableByDay: Record<number, any[]> = {};
  if (timetableData) {
    timetableData.forEach((item: any) => {
      if (!timetableByDay[item.dayOfWeek]) {
        timetableByDay[item.dayOfWeek] = [];
      }
      timetableByDay[item.dayOfWeek].push(item);
    });
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Timetable</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">View and manage class timetables</p>
        </div>
        {canManageTimetable() && !isParent && classId && (
          <button onClick={openAddSlot} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Slot
          </button>
        )}
      </div>

      <div className="card mb-6">
        {isParent ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
            {parentDashboard?.children && parentDashboard.children.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {parentDashboard.children.map((child: any) => (
                  <button
                    key={child.studentId}
                    onClick={() => setSelectedChildId(child.studentId)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedChildId === child.studentId
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {child.firstName} {child.lastName}
                    {child.class && ` - ${child.class.name}${child.class.section ? ` ${child.class.section}` : ''}`}
                  </button>
                ))}
              </div>
            ) : parentDashboard?.children && parentDashboard.children.length === 1 ? (
              <div className="text-sm text-gray-700">
                {parentDashboard.children[0].firstName} {parentDashboard.children[0].lastName}
                {parentDashboard.children[0].class && ` - ${parentDashboard.children[0].class.name}${parentDashboard.children[0].class.section ? ` ${parentDashboard.children[0].class.section}` : ''}`}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No children found</p>
            )}
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input">
              <option value="">Select Class</option>
              {classes?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `- ${cls.section}` : ''}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : classId && timetableData ? (
        <div className="card">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 bg-gray-50 z-10 px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">
                      Time
                    </th>
                    {days.map((day) => (
                      <th key={day} className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">
                        {day.substring(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 8 }, (_, i) => {
                    const hour = 8 + i;
                    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                    return (
                      <tr key={timeStr} className="hover:bg-gray-50">
                        <td className="sticky left-0 bg-white z-10 px-2 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 border-r">
                          {timeStr}
                        </td>
                        {dayNumbers.map((dayNum) => {
                          const dayItems = timetableByDay[dayNum] || [];
                          const item = dayItems.find(
                            (t: any) =>
                              t.startTime <= timeStr && t.endTime > timeStr
                          );
                          return (
                            <td key={dayNum} className="px-2 sm:px-4 py-3">
                              {item ? (
                                <div className="bg-primary-50 border border-primary-200 rounded p-1.5 sm:p-2">
                                  <p className="font-medium text-xs sm:text-sm">{item.subject?.name}</p>
                                  <p className="text-xs text-gray-600 hidden sm:block">{item.teacher?.firstName} {item.teacher?.lastName}</p>
                                  {item.room && (
                                    <p className="text-xs text-gray-500 hidden sm:block">Room: {item.room}</p>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-300 text-xs sm:text-base">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : classId ? (
        <div className="card">
          <p className="text-gray-500 text-center py-12">No timetable found for this class</p>
          {canManageTimetable() && !isParent && (
            <div className="text-center">
              <button onClick={openAddSlot} className="btn btn-primary">Add first slot</button>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-500 text-center py-12">Select a class to view timetable</p>
        </div>
      )}

      {canManageTimetable() && !isParent && classId && timetableData && (timetableData as any[]).length > 0 && (
        <div className="card mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Manage slots</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2">Day</th>
                  <th className="text-left py-2 px-2">Time</th>
                  <th className="text-left py-2 px-2">Subject</th>
                  <th className="text-left py-2 px-2">Teacher</th>
                  <th className="text-left py-2 px-2">Room</th>
                  <th className="text-left py-2 px-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(timetableData as any[]).map((slot: any) => (
                  <tr key={slot.id} className="border-b border-gray-100">
                    <td className="py-2 px-2">{days[slot.dayOfWeek]}</td>
                    <td className="py-2 px-2">{slot.startTime} - {slot.endTime}</td>
                    <td className="py-2 px-2">{slot.subject?.name}</td>
                    <td className="py-2 px-2">{slot.teacher ? `${slot.teacher.firstName} ${slot.teacher.lastName}` : '-'}</td>
                    <td className="py-2 px-2">{slot.room || '-'}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => openEditSlot(slot)} className="text-primary-600 hover:text-primary-700 mr-2">
                        <Pencil className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => setDeleteSlotConfirm({ id: slot.id, label: `${slot.subject?.name} ${slot.startTime}` })} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {slotModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{editingSlotId ? 'Edit Slot' : 'Add Slot'}</h2>
              <button onClick={() => { setSlotModalOpen(false); setEditingSlotId(null); }} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const payload = {
                  classId: slotForm.classId,
                  subjectId: slotForm.subjectId,
                  teacherId: slotForm.teacherId || undefined,
                  dayOfWeek: slotForm.dayOfWeek,
                  startTime: slotForm.startTime,
                  endTime: slotForm.endTime,
                  room: slotForm.room || undefined,
                  academicYear: slotForm.academicYear,
                };
                if (editingSlotId) {
                  updateSlotMutation.mutate({ id: editingSlotId, ...payload });
                } else {
                  createSlotMutation.mutate(payload);
                }
              }}
              className="p-6 space-y-4"
            >
              <FormField label="Class" required>
                <Select
                  required
                  value={slotForm.classId}
                  onChange={(e) => setSlotForm({ ...slotForm, classId: e.target.value })}
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
                  value={slotForm.subjectId}
                  onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value })}
                >
                  <option value="">Select subject</option>
                  {subjects?.map((subj: any) => (
                    <option key={subj.id} value={subj.id}>{subj.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Teacher (optional)">
                <Select
                  value={slotForm.teacherId}
                  onChange={(e) => setSlotForm({ ...slotForm, teacherId: e.target.value })}
                >
                  <option value="">None</option>
                  {(teachersData as any)?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Day" required>
                <Select
                  value={slotForm.dayOfWeek}
                  onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: parseInt(e.target.value) })}
                >
                  {days.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start time" required>
                  <Input
                    type="time"
                    required
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                  />
                </FormField>
                <FormField label="End time" required>
                  <Input
                    type="time"
                    required
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                  />
                </FormField>
              </div>
              <FormField label="Room">
                <Input
                  value={slotForm.room}
                  onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                  placeholder="e.g. R101"
                />
              </FormField>
              <FormField label="Academic year">
                <Input
                  value={slotForm.academicYear}
                  onChange={(e) => setSlotForm({ ...slotForm, academicYear: e.target.value })}
                  placeholder="e.g. 2024-25"
                />
              </FormField>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setSlotModalOpen(false); setEditingSlotId(null); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={createSlotMutation.isPending || updateSlotMutation.isPending} className="btn btn-primary flex items-center gap-2">
                  {(createSlotMutation.isPending || updateSlotMutation.isPending) && <LoadingSpinner size="sm" />}
                  {editingSlotId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteSlotConfirm && (
        <ConfirmDialog
          isOpen={!!deleteSlotConfirm}
          onClose={() => setDeleteSlotConfirm(null)}
          onConfirm={() => deleteSlotMutation.mutate(deleteSlotConfirm.id)}
          title="Remove slot"
          message={`Remove this slot (${deleteSlotConfirm.label})?`}
          confirmText="Remove"
          variant="danger"
          isLoading={deleteSlotMutation.isPending}
        />
      )}
    </div>
  );
}

