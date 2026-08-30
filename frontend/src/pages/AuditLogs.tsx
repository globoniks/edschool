import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ScrollText, Filter, X } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

interface AuditLog {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

interface AuditResponse {
  logs: AuditLog[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

/** Colour by risk: money and permissions read differently from routine record edits. */
const actionTone = (action: string): string => {
  if (action.startsWith('user.password') || action === 'user.tags_updated') {
    return 'bg-amber-100 text-amber-800';
  }
  if (action.startsWith('fee_payment')) return 'bg-emerald-100 text-emerald-800';
  if (action.startsWith('exam_mark')) return 'bg-indigo-100 text-indigo-800';
  if (action.endsWith('.deleted')) return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-700';
};

const prettyAction = (action: string): string =>
  action.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AuditLogs() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const { data: actions = [] } = useQuery<string[]>({
    queryKey: ['audit-actions'],
    queryFn: () => api.get('/audit-logs/actions').then((res) => res.data),
    enabled: isAdmin,
  });

  const { data, isLoading, isError } = useQuery<AuditResponse>({
    queryKey: ['audit-logs', page, action, from, to],
    queryFn: () =>
      api
        .get('/audit-logs', {
          params: {
            page,
            pageSize: 25,
            ...(action ? { action } : {}),
            ...(from ? { from: new Date(from).toISOString() } : {}),
            // `to` is a date, so include the whole day rather than midnight.
            ...(to ? { to: new Date(`${to}T23:59:59.999`).toISOString() } : {}),
          },
        })
        .then((res) => res.data),
    enabled: isAdmin,
    placeholderData: keepPreviousData,
  });

  if (!isAdmin) {
    return (
      <div className="p-4">
        <p className="text-gray-600">
          Only School Admin and Super Admin can view the audit trail.
        </p>
      </div>
    );
  }

  const hasFilters = Boolean(action || from || to);
  const clearFilters = () => {
    setAction('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const onFilterChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
          <ScrollText className="w-5 h-5 text-brand-700" />
        </div>
        <div>
          <h1 className="font-headline text-2xl font-bold text-brand-900">Audit trail</h1>
          <p className="text-slate-500 text-sm">
            A permanent record of changes to marks, fees, student records and account
            permissions. Entries cannot be edited or deleted.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Filters
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-900"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="audit-action" className="block text-xs font-semibold text-slate-500 mb-1">
              Action
            </label>
            <select
              id="audit-action"
              value={action}
              onChange={(e) => onFilterChange(setAction)(e.target.value)}
              className="select"
            >
              <option value="">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {prettyAction(a)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="audit-from" className="block text-xs font-semibold text-slate-500 mb-1">
              From
            </label>
            <input
              id="audit-from"
              type="date"
              value={from}
              onChange={(e) => onFilterChange(setFrom)(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="audit-to" className="block text-xs font-semibold text-slate-500 mb-1">
              To
            </label>
            <input
              id="audit-to"
              type="date"
              value={to}
              onChange={(e) => onFilterChange(setTo)(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : isError ? (
        <EmptyState
          variant="error"
          title="Could not load the audit trail"
          description="Please try again in a moment."
        />
      ) : logs.length === 0 ? (
        <EmptyState
          variant={hasFilters ? 'no-results' : 'no-data'}
          title={hasFilters ? 'No entries match these filters' : 'No audit entries yet'}
          description={
            hasFilters
              ? 'Try widening the date range or clearing the action filter.'
              : 'Entries appear here as marks, fees, records and permissions are changed.'
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left font-bold text-slate-500 uppercase text-xs tracking-wider px-4 py-3">When</th>
                    <th className="text-left font-bold text-slate-500 uppercase text-xs tracking-wider px-4 py-3">Action</th>
                    <th className="text-left font-bold text-slate-500 uppercase text-xs tracking-wider px-4 py-3">What changed</th>
                    <th className="text-left font-bold text-slate-500 uppercase text-xs tracking-wider px-4 py-3">Who</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {format(new Date(log.createdAt), 'd MMM yyyy, HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${actionTone(log.action)}`}>
                          {prettyAction(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.summary}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-700">{log.actorEmail}</div>
                        <div className="text-xs text-slate-400 capitalize">
                          {log.actorRole.toLowerCase().replace(/_/g, ' ')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${actionTone(log.action)}`}>
                    {prettyAction(log.action)}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(log.createdAt), 'd MMM, HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mb-2">{log.summary}</p>
                <p className="text-xs text-slate-400 truncate">
                  {log.actorEmail} · {log.actorRole.toLowerCase().replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>

          {data && data.pagination.totalPages > 1 && (
            <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.total}
              itemsPerPage={data.pagination.pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
