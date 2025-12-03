import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function Timetable() {
  const [classId, setClassId] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  const { data: timetableData, isLoading } = useQuery({
    queryKey: ['timetable', classId],
    queryFn: () => api.get(`/timetables?classId=${classId}`).then((res) => res.data),
    enabled: !!classId,
  });

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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Timetable</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">View and manage class timetables</p>
      </div>

      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input">
          <option value="">Select Class</option>
          {classes?.map((cls: any) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} {cls.section ? `- ${cls.section}` : ''}
            </option>
          ))}
        </select>
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
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-500 text-center py-12">Select a class to view timetable</p>
        </div>
      )}
    </div>
  );
}

