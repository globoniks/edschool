import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Calendar as CalendarIcon, Plus, X, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';

interface Holiday {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'HOLIDAY' | 'EXAM_EVENT' | 'OTHER';
  isFullDay: boolean;
}

export default function Holidays() {
  const { user } = useAuthStore();
  const { canManageHolidays } = usePermissions();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const queryClient = useQueryClient();

  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays', month, year],
    queryFn: () =>
      api
        .get('/holidays', {
          params: { month, year },
        })
        .then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/holidays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Generate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    const firstDayOfWeek = date.getDay(); // 0 = Sunday
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = getDaysInMonth(year, month);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get holidays for a specific date
  const getHolidaysForDate = (date: Date) => {
    if (!holidays) return [];
    return holidays.filter((h: Holiday) => {
      const holidayDate = new Date(h.date);
      return holidayDate.getDate() === date.getDate() &&
             holidayDate.getMonth() === date.getMonth() &&
             holidayDate.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (date: Date) => {
    const now = new Date();
    return date.getDate() === now.getDate() &&
           date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            View school holidays, exam days, and important events
          </p>
        </div>
        {canManageHolidays() && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add Holiday
          </button>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Showing</p>
            <p className="text-base sm:text-lg font-semibold">{monthLabel}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                  viewMode === 'calendar' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                  viewMode === 'list' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                List
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                onClick={() => {
                  const newDate = new Date(year, month - 2, 1);
                  setMonth(newDate.getMonth() + 1);
                  setYear(newDate.getFullYear());
                }}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                onClick={() => {
                  setMonth(today.getMonth() + 1);
                  setYear(today.getFullYear());
                }}
              >
                Today
              </button>
              <button
                className="btn btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                onClick={() => {
                  const newDate = new Date(year, month, 1);
                  setMonth(newDate.getMonth() + 1);
                  setYear(newDate.getFullYear());
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : viewMode === 'calendar' ? (
        <div className="card">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="min-h-24 border border-gray-100" />;
              }
              
              const dayHolidays = getHolidaysForDate(date);
              const hasHolidays = dayHolidays.length > 0;
              const isTodayDate = isToday(date);
              
              return (
                <div
                  key={index}
                  className={`min-h-24 border p-2 ${
                    isTodayDate ? 'bg-primary-50 border-primary-300' : 'border-gray-200'
                  } ${hasHolidays ? 'bg-green-50' : 'bg-white'}`}
                >
                  <div className={`text-sm font-medium ${isTodayDate ? 'text-primary-700' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayHolidays.map((holiday: Holiday) => (
                      <div
                        key={holiday.id}
                        className={`text-xs p-1 rounded truncate ${
                          holiday.type === 'HOLIDAY'
                            ? 'bg-green-200 text-green-900'
                            : holiday.type === 'EXAM_EVENT'
                            ? 'bg-blue-200 text-blue-900'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                        title={holiday.title}
                      >
                        {holiday.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span className="text-sm text-gray-600">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span className="text-sm text-gray-600">Exam/Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-sm text-gray-600">Other</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          {(!holidays || holidays.length === 0) && (
            <p className="text-gray-500">No holidays or events for this period.</p>
          )}
          <div className="space-y-3">
            {holidays?.map((holiday: Holiday) => (
              <div key={holiday.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <div className="flex items-center flex-1">
                  <div className="p-3 rounded-full bg-primary-50 mr-4">
                    <CalendarIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{holiday.title}</p>
                    {holiday.description && (
                      <p className="text-sm text-gray-600 mt-1">{holiday.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(holiday.date).toLocaleDateString()} ·{' '}
                      {holiday.isFullDay ? 'Full day' : 'Partial day'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`badge ${
                      holiday.type === 'HOLIDAY'
                        ? 'bg-green-100 text-green-800'
                        : holiday.type === 'EXAM_EVENT'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {holiday.type === 'HOLIDAY'
                      ? 'Holiday'
                      : holiday.type === 'EXAM_EVENT'
                      ? 'Exam / Event'
                      : 'Other'}
                  </span>
                  {canManageHolidays() && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this holiday?')) {
                          deleteMutation.mutate(holiday.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete holiday"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {showAddModal && (
        <AddHolidayModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
          }}
        />
      )}
    </div>
  );
}

// Add Holiday Modal Component
function AddHolidayModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    type: 'HOLIDAY' as 'HOLIDAY' | 'EXAM_EVENT' | 'OTHER',
    isFullDay: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/holidays', data),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Add Holiday</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              className="input w-full"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Independence Day"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="input w-full"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              className="input w-full"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              className="input w-full"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="HOLIDAY">Holiday</option>
              <option value="EXAM_EVENT">Exam / Event</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFullDay"
              className="mr-2"
              checked={formData.isFullDay}
              onChange={(e) => setFormData({ ...formData, isFullDay: e.target.checked })}
            />
            <label htmlFor="isFullDay" className="text-sm text-gray-700">
              Full day event
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Holiday'}
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-red-600 text-sm">
              Error creating holiday. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

