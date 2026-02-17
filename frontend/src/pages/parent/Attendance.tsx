import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Calendar, ChevronLeft, ChevronRight, Download, Printer, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/ToastProvider';
import { clsx } from 'clsx';

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  student?: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
}

const CACHE_KEY = 'parent-attendance-cache';
const CACHE_TIMESTAMP_KEY = 'parent-attendance-cache-timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
}

function setCachedData(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

function buildAttendanceCsv(records: AttendanceRecord[]): string {
  const headers = ['Date', 'Student', 'Admission Number', 'Status', 'Remarks'];
  const rows = records.map((r) => [
    new Date(r.date).toLocaleDateString(),
    r.student ? `${r.student.firstName} ${r.student.lastName}` : '',
    r.student?.admissionNumber ?? '',
    r.status,
    r.remarks ?? '',
  ]);
  const csvContent = [headers.join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  return csvContent;
}

export default function ParentAttendance() {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Get dashboard data for child selection
  const { data: dashboardData } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parents/dashboard').then((res) => res.data).catch(() => null),
    enabled: user?.role === 'PARENT',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // Fetch attendance data with caching
  const { data: attendanceData, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['parent-attendance', year, month, selectedChildId],
    queryFn: async () => {
      const cacheKey = `attendance-${year}-${month}-${selectedChildId || 'all'}`;
      const cached = getCachedData();
      
      if (cached && cached[cacheKey]) {
        // Return cached data immediately, then fetch fresh data
        setTimeout(async () => {
          try {
            const params = new URLSearchParams({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            });
            if (selectedChildId) {
              params.append('studentId', selectedChildId);
            }
            const freshData = await api.get(`/attendance?${params.toString()}`).then((res) => res.data);
            const updatedCache = { ...(cached || {}), [cacheKey]: freshData };
            setCachedData(updatedCache);
          } catch (error) {
            console.error('Error fetching fresh attendance data:', error);
          }
        }, 0);
        return cached[cacheKey];
      }

      // Fetch fresh data
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      if (selectedChildId) {
        params.append('studentId', selectedChildId);
      }
      const data = await api.get(`/attendance?${params.toString()}`).then((res) => res.data);
      
      // Cache the data
      const updatedCache = { ...(cached || {}), [cacheKey]: data };
      setCachedData(updatedCache);
      
      return data;
    },
    enabled: user?.role === 'PARENT',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate statistics
  const attendanceMap = new Map<string, AttendanceRecord>();
  attendanceData?.forEach((att) => {
    const dateKey = new Date(att.date).toISOString().split('T')[0];
    attendanceMap.set(dateKey, att);
  });

  const totalDays = attendanceData?.length || 0;
  const presentDays = attendanceData?.filter((a) => a.status === 'PRESENT').length || 0;
  const absentDays = attendanceData?.filter((a) => a.status === 'ABSENT').length || 0;
  const lateDays = attendanceData?.filter((a) => a.status === 'LATE').length || 0;
  const excusedDays = attendanceData?.filter((a) => a.status === 'EXCUSED').length || 0;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const children = dashboardData?.children || [];

  // Calendar generation
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays: (Date | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const getStatusColor = (date: Date | null): string => {
    if (!date) return '';
    const dateKey = date.toISOString().split('T')[0];
    const attendance = attendanceMap.get(dateKey);
    
    if (!attendance) {
      // Future dates or no attendance marked
      if (date > new Date()) return 'bg-gray-100 border-gray-200';
      return 'bg-white border-gray-200';
    }

    switch (attendance.status) {
      case 'PRESENT':
        return 'bg-green-100 border-green-500 text-green-900';
      case 'ABSENT':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'LATE':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'EXCUSED':
        return 'bg-blue-100 border-blue-500 text-blue-900';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getStatusIcon = (date: Date | null) => {
    if (!date) return null;
    const dateKey = date.toISOString().split('T')[0];
    const attendance = attendanceMap.get(dateKey);
    
    if (!attendance) return null;

    switch (attendance.status) {
      case 'PRESENT':
        return <CheckCircle className="w-4 h-4" />;
      case 'ABSENT':
        return <XCircle className="w-4 h-4" />;
      case 'LATE':
        return <Clock className="w-4 h-4" />;
      case 'EXCUSED':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading && !getCachedData()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const selectedDayAttendance = selectedDay
    ? attendanceMap.get(selectedDay.toISOString().split('T')[0])
    : null;

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-600 mt-1">Monthly attendance calendar</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="btn btn-secondary flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={() => {
                if (!attendanceData?.length) {
                  showError('No attendance data to export');
                  return;
                }
                const csv = buildAttendanceCsv(attendanceData);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `attendance_${year}_${month + 1}_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                showSuccess('Attendance exported to CSV');
              }}
              className="btn btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedChildId(null)}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                !selectedChildId
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All Children
            </button>
            {children.map((child: any) => (
              <button
                key={child.studentId}
                onClick={() => setSelectedChildId(child.studentId)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  selectedChildId === child.studentId
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {child.firstName} {child.lastName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Percentage Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Attendance</p>
            <p className="text-3xl font-bold text-primary-600">{percentage}%</p>
            <p className="text-xs text-gray-500 mt-1">{presentDays} of {totalDays} days</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Present</p>
            <p className="text-2xl font-bold text-green-600">{presentDays}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Absent</p>
            <p className="text-2xl font-bold text-red-600">{absentDays}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Late</p>
            <p className="text-2xl font-bold text-yellow-600">{lateDays}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Excused</p>
            <p className="text-2xl font-bold text-blue-600">{excusedDays}</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((date, index) => {
            const isToday = date && date.toDateString() === new Date().toDateString();
            const isSelected = date && selectedDay && date.toDateString() === selectedDay.toDateString();

            return (
              <button
                key={index}
                onClick={() => date && setSelectedDay(date)}
                disabled={!date}
                className={clsx(
                  'aspect-square p-2 rounded-lg border-2 transition-all text-sm font-medium',
                  'hover:scale-105 disabled:cursor-default',
                  getStatusColor(date),
                  isToday && 'ring-2 ring-primary-500 ring-offset-2',
                  isSelected && 'ring-2 ring-primary-600 ring-offset-2',
                  !date && 'opacity-0 cursor-default'
                )}
              >
                {date && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={clsx(
                      'text-base mb-1',
                      isToday && 'font-bold'
                    )}>
                      {date.getDate()}
                    </span>
                    {getStatusIcon(date) && (
                      <div className="mt-auto">
                        {getStatusIcon(date)}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Legend</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500" />
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-500" />
              <span className="text-sm text-gray-600">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-500" />
              <span className="text-sm text-gray-600">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-500" />
              <span className="text-sm text-gray-600">Excused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && selectedDayAttendance && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedDay.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
                {selectedDayAttendance.student && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedDayAttendance.student.firstName} {selectedDayAttendance.student.lastName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={clsx(
                  'badge',
                  selectedDayAttendance.status === 'PRESENT' && 'bg-green-100 text-green-800',
                  selectedDayAttendance.status === 'ABSENT' && 'bg-red-100 text-red-800',
                  selectedDayAttendance.status === 'LATE' && 'bg-yellow-100 text-yellow-800',
                  selectedDayAttendance.status === 'EXCUSED' && 'bg-blue-100 text-blue-800'
                )}>
                  {selectedDayAttendance.status}
                </span>
              </div>
              {selectedDayAttendance.remarks && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Remarks:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedDayAttendance.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!attendanceData || attendanceData.length === 0) && (
        <div className="mt-6">
          <EmptyState
            icon={<Calendar className="w-16 h-16 text-gray-400" />}
            title="No attendance records"
            description="Attendance records will appear here once marked for this month"
          />
        </div>
      )}

      {/* Offline Indicator */}
      {!navigator.onLine && (
        <div className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg z-40">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span>Showing cached data. You're currently offline.</span>
          </div>
        </div>
      )}
    </div>
  );
}
