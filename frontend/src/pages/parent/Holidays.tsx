import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function ParentHolidays() {
  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => api.get('/holidays').then((res) => res.data).catch(() => []),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const upcomingHolidays = holidays?.filter((h: any) => {
    const holidayDate = new Date(h.date);
    return holidayDate >= new Date();
  }) || [];

  const pastHolidays = holidays?.filter((h: any) => {
    const holidayDate = new Date(h.date);
    return holidayDate < new Date();
  }) || [];

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
        <p className="text-sm text-gray-600 mt-1">View school holidays and important dates</p>
      </div>

      {upcomingHolidays.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Holidays</h2>
          <div className="space-y-3">
            {upcomingHolidays
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((holiday: any) => (
                <div key={holiday.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-sm">{holiday.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    {holiday.description && (
                      <p className="text-xs text-gray-600 max-w-xs">{holiday.description}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {pastHolidays.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Past Holidays</h2>
          <div className="space-y-3">
            {pastHolidays
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((holiday: any) => (
                <div key={holiday.id} className="border border-gray-200 rounded-lg p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm text-gray-600">{holiday.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(holiday.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {(!holidays || holidays.length === 0) && (
        <EmptyState
          icon={<Calendar className="w-16 h-16 text-gray-400" />}
          title="No holidays"
          description="Holiday calendar will be updated here"
        />
      )}
    </div>
  );
}

