import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Calendar, Check, X, Clock, UserCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

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

export default function Attendance() {
  const { user } = useAuthStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState('');
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, AttendanceStatus>>({});
  const queryClient = useQueryClient();
  const isAdminOrTeacher = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  // Fetch students for selected class
  const { data: studentsData } = useQuery({
    queryKey: ['students', classId],
    queryFn: () => api.get(`/students?classId=${classId}`).then((res) => res.data),
    enabled: !!classId && isAdminOrTeacher,
  });

  // Fetch existing attendance for the date
  const { data: existingAttendance, isLoading } = useQuery({
    queryKey: ['attendance', date, classId],
    queryFn: () => api.get(`/attendance?date=${date}&classId=${classId}`).then((res) => res.data),
    enabled: !!classId && !!date,
    onSuccess: (data: AttendanceRecord[]) => {
      const statusMap: Record<string, AttendanceStatus> = {};
      data.forEach((att) => {
        statusMap[att.studentId] = att.status;
      });
      setAttendanceStatuses(statusMap);
    },
  });

  const students = studentsData?.students || [];

  const markBulkAttendanceMutation = useMutation({
    mutationFn: (data: any) => api.post('/attendance/bulk', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newStatuses: Record<string, AttendanceStatus> = {};
    students.forEach((student: Student) => {
      newStatuses[student.id] = status;
    });
    setAttendanceStatuses(newStatuses);
  };

  const handleSave = () => {
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
        return <Check className="w-4 h-4 text-green-600" />;
      case 'ABSENT':
        return <X className="w-4 h-4 text-red-600" />;
      case 'LATE':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'EXCUSED':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-2">Mark and track student attendance</p>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setAttendanceStatuses({});
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
        </div>
      </div>

      {!isAdminOrTeacher ? (
        <div className="card">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : existingAttendance && existingAttendance.length > 0 ? (
            <div className="space-y-3">
              {existingAttendance.map((att: AttendanceRecord) => (
                <div
                  key={att.id}
                  className={`border rounded-lg p-4 ${getStatusColor(att.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(att.status)}
                      <div>
                        <p className="font-medium">
                          {att.student.firstName} {att.student.lastName}
                        </p>
                        <p className="text-sm opacity-75">
                          {new Date(att.date).toLocaleDateString()}
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
            <div className="text-center py-12">Loading...</div>
          ) : classId && students.length > 0 ? (
            <>
              <div className="card mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Mark Attendance</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkAll('PRESENT')}
                      className="btn btn-secondary text-sm"
                    >
                      Mark All Present
                    </button>
                    <button
                      onClick={() => handleMarkAll('ABSENT')}
                      className="btn btn-secondary text-sm"
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {students.map((student: Student) => {
                    const status = attendanceStatuses[student.id] || 'ABSENT';
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-24">
                            {student.admissionNumber}
                          </span>
                          <span className="font-medium">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(
                            (s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(student.id, s)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  status === s
                                    ? getStatusColor(s)
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {s}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={markBulkAttendanceMutation.isPending}
                    className="btn btn-primary"
                  >
                    {markBulkAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </div>

              {existingAttendance && existingAttendance.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Previous Records</h2>
                  <div className="space-y-2">
                    {existingAttendance.map((att: AttendanceRecord) => (
                      <div
                        key={att.id}
                        className={`border rounded-lg p-3 ${getStatusColor(att.status)}`}
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

