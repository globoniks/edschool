import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Clock, Printer } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { clsx } from 'clsx';

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  subject?: { name: string };
  teacher?: { firstName: string; lastName: string };
  class?: { name: string };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function ParentTimetable() {
  const { user } = useAuthStore();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parents/dashboard').then((res) => res.data),
    enabled: user?.role === 'PARENT',
  });

  const children = dashboardData?.children || [];
  const activeChild = selectedChildId
    ? children.find((c: any) => c.studentId === selectedChildId)
    : children[0];
  const classId = activeChild?.classId;

  const { data: timetableEntries } = useQuery<TimetableEntry[]>({
    queryKey: ['timetable', classId],
    queryFn: () => {
      const params = classId ? `?classId=${encodeURIComponent(classId)}` : '';
      return api.get(`/timetables${params}`).then((res) => res.data).catch(() => []);
    },
    enabled: user?.role === 'PARENT',
  });

  const { timeSlots, grid } = useMemo(() => {
    if (!timetableEntries?.length) return { timeSlots: [] as string[], grid: {} as Record<string, Record<number, TimetableEntry>> };
    const slots = Array.from(new Set(timetableEntries.map((e) => `${e.startTime}-${e.endTime}`))).sort();
    const grid: Record<string, Record<number, TimetableEntry>> = {};
    slots.forEach((slot) => { grid[slot] = {}; });
    timetableEntries.forEach((entry) => {
      if (entry.dayOfWeek >= 1 && entry.dayOfWeek <= 5) {
        const key = `${entry.startTime}-${entry.endTime}`;
        if (!grid[key]) grid[key] = {};
        grid[key][entry.dayOfWeek] = entry;
      }
    });
    return { timeSlots: slots, grid };
  }, [timetableEntries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="text-sm text-gray-600 mt-1">
            Weekly schedule for {activeChild?.class?.name || 'your child'}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {children.map((child: any) => (
            <button
              key={child.studentId}
              type="button"
              onClick={() => setSelectedChildId(child.studentId)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                (selectedChildId === child.studentId || (!selectedChildId && child === children[0]))
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {child.firstName} {child.lastName}
            </button>
          ))}
        </div>
      )}

      {timetableEntries && timetableEntries.length > 0 && timeSlots.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                  {DAYS.map((day) => (
                    <th key={day} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeSlots.map((slot) => {
                  const [start, end] = slot.split('-');
                  return (
                    <tr key={slot} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                        {start} – {end}
                      </td>
                      {[1, 2, 3, 4, 5].map((dayOfWeek) => {
                        const entry = grid[slot]?.[dayOfWeek];
                        return (
                          <td key={dayOfWeek} className="px-4 py-3 text-sm text-gray-600">
                            {entry ? (
                              <div>
                                <div className="font-medium text-gray-900">{entry.subject?.name ?? '—'}</div>
                                {entry.teacher && (
                                  <div className="text-xs text-gray-500">
                                    {entry.teacher.firstName} {entry.teacher.lastName}
                                  </div>
                                )}
                                {entry.room && <div className="text-xs text-gray-500">{entry.room}</div>}
                              </div>
                            ) : (
                              '—'
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
      ) : (
        <EmptyState
          icon={<Clock className="w-16 h-16 text-gray-400" />}
          title="No timetable available"
          description="Timetable will be displayed here once available"
        />
      )}
    </div>
  );
}

