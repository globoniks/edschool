import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Check, X, Clock, UserCheck, Save, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import { clsx } from 'clsx';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  class?: {
    name: string;
    section?: string;
  };
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  student: Student;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

// Debounce hook for auto-save
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Attendance() {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState('');
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();
  const { canMarkAttendance } = usePermissions();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  // Fetch students for selected class
  const { data: studentsData } = useQuery({
    queryKey: ['students', classId],
    queryFn: () => api.get(`/students?classId=${classId}`).then((res) => res.data),
    enabled: !!classId && canMarkAttendance(),
  });

  // For parents, fetch attendance for all their children (no classId needed)
  // For teachers/admins, fetch by classId
  const isParent = user?.role === 'PARENT';
  const { data: existingAttendance, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', date, classId, isParent],
    queryFn: () => {
      if (isParent) {
        // Parents: fetch attendance for all their children
        return api.get(`/attendance?date=${date}`).then((res) => res.data);
      } else {
        // Teachers/Admins: fetch by class
        return api.get(`/attendance?date=${date}&classId=${classId}`).then((res) => res.data);
      }
    },
    enabled: !!date && (isParent || !!classId),
  });

  // Update attendance statuses when existing attendance data changes
  useEffect(() => {
    if (existingAttendance && Array.isArray(existingAttendance)) {
      const statusMap: Record<string, AttendanceStatus> = {};
      existingAttendance.forEach((att) => {
        statusMap[att.studentId] = att.status;
      });
      setAttendanceStatuses(statusMap);
      setLastSaved(statusMap); // Initialize last saved state
      setHasUnsavedChanges(false);
    }
  }, [existingAttendance]);

  const students = studentsData?.students || [];

  // Debounced attendance statuses for auto-save
  const debouncedStatuses = useDebounce(attendanceStatuses, 2000); // 2 second delay

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!classId || !date || students.length === 0) return;

    // Check if there are actual changes
    const hasChanges = Object.keys(attendanceStatuses).some(
      (studentId) => attendanceStatuses[studentId] !== lastSaved[studentId]
    );

    if (!hasChanges) {
      setHasUnsavedChanges(false);
      return;
    }

    setIsSaving(true);
    setHasUnsavedChanges(true);

    try {
      const attendances = students.map((student: Student) => ({
        studentId: student.id,
        status: attendanceStatuses[student.id] || 'ABSENT',
      }));

      await api.post('/attendance/bulk', {
        classId,
        date,
        attendances,
      });

      setLastSaved({ ...attendanceStatuses });
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    } catch (error: any) {
      showError(error.message || 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  }, [attendanceStatuses, classId, date, students, lastSaved, queryClient, showError]);

  // Trigger auto-save when debounced statuses change
  useEffect(() => {
    if (Object.keys(debouncedStatuses).length > 0 && hasUnsavedChanges) {
      autoSave();
    }
  }, [debouncedStatuses, hasUnsavedChanges, autoSave]);

  const markBulkAttendanceMutation = useMutation({
    mutationFn: (data: any) => api.post('/attendance/bulk', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      setLastSaved({ ...attendanceStatuses });
      setHasUnsavedChanges(false);
      showSuccess('Attendance saved successfully');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to save attendance');
    },
  });

  // One-tap toggle: PRESENT <-> ABSENT
  const handleToggleStatus = (studentId: string) => {
    const currentStatus = attendanceStatuses[studentId] || 'ABSENT';
    const newStatus: AttendanceStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    
    setAttendanceStatuses((prev) => ({
      ...prev,
      [studentId]: newStatus,
    }));
    setHasUnsavedChanges(true);
  };

  // Manual status change (for LATE, EXCUSED)
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    setHasUnsavedChanges(true);
  };

  // Bulk mark all present
  const handleMarkAllPresent = () => {
    const newStatuses: Record<string, AttendanceStatus> = {};
    students.forEach((student: Student) => {
      newStatuses[student.id] = 'PRESENT';
    });
    setAttendanceStatuses(newStatuses);
    setHasUnsavedChanges(true);
    
    // Immediate save for bulk action
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 500);
  };

  // Manual save button
  const handleManualSave = () => {
    if (!classId || !date || students.length === 0) return;

    const attendances = students.map((student: Student) => ({
      studentId: student.id,
      status: attendanceStatuses[student.id] || 'ABSENT',
    }));

    markBulkAttendanceMutation.mutate({
      classId,
      date,
      attendances,
    });
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'ABSENT':
        return <X className="w-5 h-5 text-red-600" />;
      case 'LATE':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'EXCUSED':
        return <UserCheck className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'EXCUSED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Mark and track student attendance</p>
          </div>
          {/* Save Status Indicator */}
          {canMarkAttendance() && classId && students.length > 0 && (
            <div className="flex items-center gap-2">
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </div>
              )}
              {!isSaving && !hasUnsavedChanges && Object.keys(attendanceStatuses).length > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved</span>
                </div>
              )}
              {!isSaving && hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <span>Unsaved changes</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setAttendanceStatuses({});
                setHasUnsavedChanges(false);
              }}
              className="input"
            />
          </div>
          {!isParent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setAttendanceStatuses({});
                  setHasUnsavedChanges(false);
                }}
                className="input"
              >
                <option value="">Select Class</option>
                {classes?.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `- ${cls.section}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {!canMarkAttendance() ? (
        <div className="card">
          {isLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : existingAttendance && existingAttendance.length > 0 ? (
            <div className="space-y-3">
              {existingAttendance.map((att: AttendanceRecord) => (
                <div
                  key={att.id}
                  className={clsx('border rounded-lg p-4', getStatusColor(att.status))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(att.status)}
                      <div>
                        <p className="font-medium">
                          {att.student.firstName} {att.student.lastName}
                        </p>
                        <p className="text-sm opacity-75">
                          {att.student.class ? `${att.student.class.name}${att.student.class.section ? ` ${att.student.class.section}` : ''}` : ''} • {new Date(att.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="badge">{att.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No attendance records found</p>
          )}
        </div>
      ) : (
        <>
          {isLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : classId && students.length > 0 ? (
            <>
              <div className="card mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold">Mark Attendance</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkAllPresent}
                      className="btn btn-secondary text-xs sm:text-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Mark All Present
                    </button>
                    <button
                      onClick={handleManualSave}
                      disabled={markBulkAttendanceMutation.isPending || isSaving || !hasUnsavedChanges}
                      className="btn btn-primary text-xs sm:text-sm flex items-center gap-2"
                    >
                      {markBulkAttendanceMutation.isPending || isSaving ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {students.map((student: Student) => {
                    const status = attendanceStatuses[student.id] || 'ABSENT';
                    const isPresent = status === 'PRESENT';
                    
                    return (
                      <div
                        key={student.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs sm:text-sm text-gray-600 w-16 sm:w-24 flex-shrink-0">
                            {student.admissionNumber}
                          </span>
                          <span className="font-medium text-sm sm:text-base truncate">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* One-tap toggle button (PRESENT/ABSENT) */}
                          <button
                            onClick={() => handleToggleStatus(student.id)}
                            className={clsx(
                              'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 flex items-center gap-2 min-w-[120px] justify-center',
                              isPresent
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                                : 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                            )}
                          >
                            {isPresent ? (
                              <>
                                <Check className="w-4 h-4" />
                                Present
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4" />
                                Absent
                              </>
                            )}
                          </button>
                          
                          {/* Additional status options (LATE, EXCUSED) */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleStatusChange(student.id, 'LATE')}
                              className={clsx(
                                'px-2 py-1 rounded text-xs font-medium transition-colors',
                                status === 'LATE'
                                  ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                              )}
                              title="Mark as Late"
                            >
                              <Clock className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                              className={clsx(
                                'px-2 py-1 rounded text-xs font-medium transition-colors',
                                status === 'EXCUSED'
                                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                              )}
                              title="Mark as Excused"
                            >
                              <UserCheck className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    💡 Tip: Tap the Present/Absent button to toggle. Changes auto-save after 2 seconds.
                  </p>
                </div>
              </div>

              {existingAttendance && existingAttendance.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Previous Records</h2>
                  <div className="space-y-2">
                    {existingAttendance.map((att: AttendanceRecord) => (
                      <div
                        key={att.id}
                        className={clsx('border rounded-lg p-3', getStatusColor(att.status))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(att.status)}
                            <span className="font-medium">
                              {att.student.firstName} {att.student.lastName}
                            </span>
                          </div>
                          <span className="text-sm">{att.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : classId ? (
            <div className="card">
              <p className="text-gray-500 text-center py-12">No students found in this class</p>
            </div>
          ) : (
            <div className="card">
              <p className="text-gray-500 text-center py-12">Select a class to mark attendance</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
