import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X, Check, Clock } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import { FormField, Input, Select } from '../components/FormField';

const LEAVE_TYPES = ['SICK', 'CASUAL', 'EARNED', 'UNPAID', 'OTHER'];

export default function Leave() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { canManageHR, role } = usePermissions();
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ startDate: '', endDate: '', type: 'CASUAL', reason: '' });

  const { data: leaveList, isLoading } = useQuery({
    queryKey: ['leave'],
    queryFn: () => api.get('/leave').then((res) => res.data),
  });

  const applyLeaveMutation = useMutation({
    mutationFn: (data: { startDate: string; endDate: string; type: string; reason?: string }) =>
      api.post('/leave', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      setShowApply(false);
      setForm({ startDate: '', endDate: '', type: 'CASUAL', reason: '' });
      showSuccess('Leave application submitted');
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Failed to apply');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: 'APPROVED' | 'REJECTED'; remarks?: string }) =>
      api.patch(`/leave/${id}`, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      showSuccess('Leave updated');
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Failed to update');
    },
  });

  const list = Array.isArray(leaveList) ? leaveList : [];

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leave</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {role === 'TEACHER' ? 'Apply for leave and view your applications' : 'View and manage staff leave applications'}
          </p>
        </div>
        {role === 'TEACHER' && (
          <button onClick={() => setShowApply(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Apply for leave
          </button>
        )}
      </div>

      {showApply && role === 'TEACHER' && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Apply for leave</h2>
            <button onClick={() => setShowApply(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyLeaveMutation.mutate({
                startDate: form.startDate,
                endDate: form.endDate,
                type: form.type,
                reason: form.reason || undefined,
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Start date" required>
                <Input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </FormField>
              <FormField label="End date" required>
                <Input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </FormField>
            </div>
            <FormField label="Type" required>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Reason">
              <Input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Optional"
              />
            </FormField>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowApply(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={applyLeaveMutation.isPending} className="btn btn-primary flex items-center gap-2">
                {applyLeaveMutation.isPending && <LoadingSpinner size="sm" />}
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{canManageHR() ? 'All leave applications' : 'My leave'}</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : list.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No leave applications yet.</p>
        ) : (
          <div className="space-y-3">
            {list.map((item: any) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  {canManageHR() && (
                    <p className="font-medium text-gray-900">
                      {item.teacher?.firstName} {item.teacher?.lastName}
                      {item.teacher?.employeeId && (
                        <span className="text-gray-500 text-sm ml-2">({item.teacher.employeeId})</span>
                      )}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()} · {item.type}
                  </p>
                  {item.reason && <p className="text-sm text-gray-500 mt-1">{item.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      item.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                  {canManageHR() && item.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'APPROVED' })}
                        disabled={updateStatusMutation.isPending}
                        className="btn btn-secondary text-sm flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'REJECTED' })}
                        disabled={updateStatusMutation.isPending}
                        className="btn btn-danger text-sm flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
