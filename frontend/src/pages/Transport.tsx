import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, Pencil, Trash2, Bus } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { FormField, Input, Select } from '../components/FormField';

type BusRecord = {
  id: string;
  busNumber: string;
  driverName: string;
  driverPhone: string | null;
  capacity: number | null;
  isActive: boolean;
};

type RouteRecord = {
  id: string;
  routeNumber: string;
  busId: string | null;
  pickupPoint: string;
  dropPoint: string;
  isActive: boolean;
  bus?: BusRecord | null;
};

type AssignmentRecord = {
  id: string;
  studentId: string;
  transportMode: 'BUS' | 'PARENT_PICKUP';
  routeId: string | null;
  student: { id: string; firstName: string; lastName: string; admissionNumber: string; class?: { name: string } | null };
  route?: RouteRecord | null;
};

export default function Transport() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [busModalOpen, setBusModalOpen] = useState(false);
  const [busEditId, setBusEditId] = useState<string | null>(null);
  const [busForm, setBusForm] = useState({ busNumber: '', driverName: '', driverPhone: '', capacity: '', isActive: true });
  const [busDeleteId, setBusDeleteId] = useState<string | null>(null);

  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeEditId, setRouteEditId] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState({
    routeNumber: '',
    busId: '',
    pickupPoint: '',
    dropPoint: '',
    isActive: true,
  });
  const [routeDeleteId, setRouteDeleteId] = useState<string | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    transportMode: 'BUS' as 'BUS' | 'PARENT_PICKUP',
    routeId: '',
  });
  const [assignDeleteId, setAssignDeleteId] = useState<string | null>(null);

  const { data: buses = [], isLoading: busesLoading } = useQuery({
    queryKey: ['transport', 'buses'],
    queryFn: () => api.get('/transport/buses').then((res) => res.data),
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['transport', 'routes'],
    queryFn: () => api.get('/transport/routes').then((res) => res.data),
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['transport', 'assignments'],
    queryFn: () => api.get('/transport/assignments').then((res) => res.data),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students', 'list'],
    queryFn: () => api.get('/students?limit=500').then((res) => res.data),
  });
  const students = studentsData?.students ?? [];

  const createBusMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/transport/buses', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'buses'] });
      setBusModalOpen(false);
      setBusForm({ busNumber: '', driverName: '', driverPhone: '', capacity: '', isActive: true });
      showSuccess('Bus created');
    },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed to create bus'),
  });

  const updateBusMutation = useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown>) => api.patch(`/transport/buses/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'buses'] });
      setBusEditId(null);
      setBusModalOpen(false);
      showSuccess('Bus updated');
    },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed to update bus'),
  });

  const deleteBusMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transport/buses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'buses'] });
      queryClient.invalidateQueries({ queryKey: ['transport', 'routes'] });
      setBusDeleteId(null);
      showSuccess('Bus deleted');
    },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed to delete bus'),
  });

  const createRouteMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/transport/routes', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'routes'] });
      setRouteModalOpen(false);
      setRouteForm({ routeNumber: '', busId: '', pickupPoint: '', dropPoint: '', isActive: true });
      showSuccess('Route created');
    },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed to create route'),
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown>) => api.patch(`/transport/routes/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'routes'] });
      setRouteEditId(null);
      setRouteModalOpen(false);
      showSuccess('Route updated');
    },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed to update route'),
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transport/routes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'routes'] });
      queryClient.invalidateQueries({ queryKey: ['transport', 'assignments'] });
      setRouteDeleteId(null);
      showSuccess('Route deleted');
    },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed to delete route'),
  });

  const createAssignMutation = useMutation({
    mutationFn: (body: { studentId: string; transportMode: 'BUS' | 'PARENT_PICKUP'; routeId?: string }) =>
      api.post('/transport/assignments', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'assignments'] });
      setAssignModalOpen(false);
      setAssignForm({ studentId: '', transportMode: 'BUS', routeId: '' });
      showSuccess('Assignment created');
    },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed to create assignment'),
  });

  const deleteAssignMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transport/assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'assignments'] });
      setAssignDeleteId(null);
      showSuccess('Assignment removed');
    },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed to remove assignment'),
  });

  const openEditBus = (b: BusRecord) => {
    setBusEditId(b.id);
    setBusForm({
      busNumber: b.busNumber,
      driverName: b.driverName,
      driverPhone: b.driverPhone || '',
      capacity: b.capacity != null ? String(b.capacity) : '',
      isActive: b.isActive,
    });
    setBusModalOpen(true);
  };

  const openEditRoute = (r: RouteRecord) => {
    setRouteEditId(r.id);
    setRouteForm({
      routeNumber: r.routeNumber,
      busId: r.busId || '',
      pickupPoint: r.pickupPoint,
      dropPoint: r.dropPoint,
      isActive: r.isActive,
    });
    setRouteModalOpen(true);
  };

  const submitBus = () => {
    const payload = {
      busNumber: busForm.busNumber.trim(),
      driverName: busForm.driverName.trim(),
      driverPhone: busForm.driverPhone.trim() || undefined,
      capacity: busForm.capacity ? parseInt(busForm.capacity, 10) : undefined,
      isActive: busForm.isActive,
    };
    if (busEditId) updateBusMutation.mutate({ id: busEditId, ...payload });
    else createBusMutation.mutate(payload);
  };

  const submitRoute = () => {
    const payload = {
      routeNumber: routeForm.routeNumber.trim(),
      busId: routeForm.busId || null,
      pickupPoint: routeForm.pickupPoint.trim(),
      dropPoint: routeForm.dropPoint.trim(),
      isActive: routeForm.isActive,
    };
    if (routeEditId) updateRouteMutation.mutate({ id: routeEditId, ...payload });
    else createRouteMutation.mutate(payload);
  };

  const submitAssign = () => {
    if (!assignForm.studentId) {
      showError('Select a student');
      return;
    }
    if (assignForm.transportMode === 'BUS' && !assignForm.routeId) {
      showError('Select a route when using bus');
      return;
    }
    createAssignMutation.mutate({
      studentId: assignForm.studentId,
      transportMode: assignForm.transportMode,
      routeId: assignForm.transportMode === 'BUS' ? assignForm.routeId : undefined,
    });
  };

  const studentsWithAssignment = new Set((assignments as AssignmentRecord[]).map((a) => a.studentId));
  const availableStudents = students.filter((s: { id: string }) => !studentsWithAssignment.has(s.id));

  return (
    <div className="pb-20 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transport</h1>
        <p className="text-sm text-gray-600 mt-1">Manage buses, routes, and student transport (bus or parent pick up)</p>
      </div>

      {/* Buses */}
      <section className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bus className="w-5 h-5" />
            Buses
          </h2>
          <button
            type="button"
            onClick={() => { setBusEditId(null); setBusForm({ busNumber: '', driverName: '', driverPhone: '', capacity: '', isActive: true }); setBusModalOpen(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add bus
          </button>
        </div>
        {busesLoading ? (
          <LoadingSpinner size="md" />
        ) : (buses as BusRecord[]).length === 0 ? (
          <EmptyState title="No buses" description="Add a bus to get started" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2 pr-2">Bus #</th>
                  <th className="py-2 pr-2">Driver</th>
                  <th className="py-2 pr-2">Phone</th>
                  <th className="py-2 pr-2">Capacity</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 w-20" />
                </tr>
              </thead>
              <tbody>
                {(buses as BusRecord[]).map((b) => (
                  <tr key={b.id} className="border-b border-gray-100">
                    <td className="py-2">{b.busNumber}</td>
                    <td className="py-2">{b.driverName}</td>
                    <td className="py-2">{b.driverPhone || '—'}</td>
                    <td className="py-2">{b.capacity ?? '—'}</td>
                    <td className="py-2">{b.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="py-2 flex gap-1">
                      <button type="button" onClick={() => openEditBus(b)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setBusDeleteId(b.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Routes */}
      <section className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Routes</h2>
          <button
            type="button"
            onClick={() => { setRouteEditId(null); setRouteForm({ routeNumber: '', busId: '', pickupPoint: '', dropPoint: '', isActive: true }); setRouteModalOpen(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add route
          </button>
        </div>
        {routesLoading ? (
          <LoadingSpinner size="md" />
        ) : (routes as RouteRecord[]).length === 0 ? (
          <EmptyState title="No routes" description="Add a route and link a bus" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2 pr-2">Route #</th>
                  <th className="py-2 pr-2">Bus</th>
                  <th className="py-2 pr-2">Pickup</th>
                  <th className="py-2 pr-2">Drop</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 w-20" />
                </tr>
              </thead>
              <tbody>
                {(routes as RouteRecord[]).map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2">{r.routeNumber}</td>
                    <td className="py-2">{r.bus ? r.bus.busNumber : '—'}</td>
                    <td className="py-2">{r.pickupPoint}</td>
                    <td className="py-2">{r.dropPoint}</td>
                    <td className="py-2">{r.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="py-2 flex gap-1">
                      <button type="button" onClick={() => openEditRoute(r)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setRouteDeleteId(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Assignments */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Student transport</h2>
          <button
            type="button"
            onClick={() => { setAssignForm({ studentId: '', transportMode: 'BUS', routeId: '' }); setAssignModalOpen(true); }}
            className="btn-primary flex items-center gap-2"
            disabled={availableStudents.length === 0}
          >
            <Plus className="w-4 h-4" /> Add assignment
          </button>
        </div>
        {assignmentsLoading ? (
          <LoadingSpinner size="md" />
        ) : (assignments as AssignmentRecord[]).length === 0 ? (
          <EmptyState title="No assignments" description="Assign students to a route or parent pick up" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2 pr-2">Student</th>
                  <th className="py-2 pr-2">Class</th>
                  <th className="py-2 pr-2">Mode</th>
                  <th className="py-2 pr-2">Route / Bus</th>
                  <th className="py-2 w-20" />
                </tr>
              </thead>
              <tbody>
                {(assignments as AssignmentRecord[]).map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-2">{a.student.firstName} {a.student.lastName} ({a.student.admissionNumber})</td>
                    <td className="py-2">{a.student.class?.name ?? '—'}</td>
                    <td className="py-2">{a.transportMode === 'BUS' ? 'Bus' : 'Parent pick up'}</td>
                    <td className="py-2">
                      {a.transportMode === 'BUS' && a.route
                        ? `${a.route.routeNumber}${a.route.bus ? ` / ${a.route.bus.busNumber}` : ''}`
                        : '—'}
                    </td>
                    <td className="py-2">
                      <button type="button" onClick={() => setAssignDeleteId(a.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bus modal */}
      {busModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{busEditId ? 'Edit bus' : 'Add bus'}</h3>
            <div className="space-y-4">
              <FormField label="Bus number">
                <Input value={busForm.busNumber} onChange={(e) => setBusForm((f) => ({ ...f, busNumber: e.target.value }))} placeholder="e.g. BUS-001" />
              </FormField>
              <FormField label="Driver name">
                <Input value={busForm.driverName} onChange={(e) => setBusForm((f) => ({ ...f, driverName: e.target.value }))} placeholder="Driver name" />
              </FormField>
              <FormField label="Driver phone (optional)">
                <Input value={busForm.driverPhone} onChange={(e) => setBusForm((f) => ({ ...f, driverPhone: e.target.value }))} placeholder="+1234567890" />
              </FormField>
              <FormField label="Capacity (optional)">
                <Input type="number" value={busForm.capacity} onChange={(e) => setBusForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="40" />
              </FormField>
              <FormField label="Active">
                <Select
                  value={busForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setBusForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}
                  options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
                />
              </FormField>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button type="button" onClick={() => setBusModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={submitBus} className="btn-primary" disabled={createBusMutation.isPending || updateBusMutation.isPending}>
                {busEditId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route modal */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{routeEditId ? 'Edit route' : 'Add route'}</h3>
            <div className="space-y-4">
              <FormField label="Route number">
                <Input value={routeForm.routeNumber} onChange={(e) => setRouteForm((f) => ({ ...f, routeNumber: e.target.value }))} placeholder="e.g. Route 1" />
              </FormField>
              <FormField label="Bus (optional)">
                <Select
                  value={routeForm.busId}
                  onChange={(e) => setRouteForm((f) => ({ ...f, busId: e.target.value }))}
                  options={[{ value: '', label: '— None —' }, ...(buses as BusRecord[]).filter((b) => b.isActive).map((b) => ({ value: b.id, label: b.busNumber }))]}
                />
              </FormField>
              <FormField label="Pickup point">
                <Input value={routeForm.pickupPoint} onChange={(e) => setRouteForm((f) => ({ ...f, pickupPoint: e.target.value }))} placeholder="Main Gate" />
              </FormField>
              <FormField label="Drop point">
                <Input value={routeForm.dropPoint} onChange={(e) => setRouteForm((f) => ({ ...f, dropPoint: e.target.value }))} placeholder="School Gate" />
              </FormField>
              <FormField label="Active">
                <Select
                  value={routeForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setRouteForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}
                  options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
                />
              </FormField>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button type="button" onClick={() => setRouteModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={submitRoute} className="btn-primary" disabled={createRouteMutation.isPending || updateRouteMutation.isPending}>
                {routeEditId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add transport assignment</h3>
            <div className="space-y-4">
              <FormField label="Student">
                <Select
                  value={assignForm.studentId}
                  onChange={(e) => setAssignForm((f) => ({ ...f, studentId: e.target.value }))}
                  options={[{ value: '', label: 'Select student' }, ...availableStudents.map((s: { id: string; firstName: string; lastName: string; admissionNumber: string }) => ({
                    value: s.id,
                    label: `${s.firstName} ${s.lastName} (${s.admissionNumber})`,
                  }))]}
                />
              </FormField>
              <FormField label="Mode">
                <Select
                  value={assignForm.transportMode}
                  onChange={(e) => setAssignForm((f) => ({ ...f, transportMode: e.target.value as 'BUS' | 'PARENT_PICKUP' }))}
                  options={[{ value: 'BUS', label: 'Bus' }, { value: 'PARENT_PICKUP', label: 'Parent pick up' }]}
                />
              </FormField>
              {assignForm.transportMode === 'BUS' && (
                <FormField label="Route">
                  <Select
                    value={assignForm.routeId}
                    onChange={(e) => setAssignForm((f) => ({ ...f, routeId: e.target.value }))}
                    options={[{ value: '', label: 'Select route' }, ...(routes as RouteRecord[]).filter((r) => r.isActive).map((r) => ({ value: r.id, label: r.routeNumber }))]}
                  />
                </FormField>
              )}
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button type="button" onClick={() => setAssignModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={submitAssign} className="btn-primary" disabled={createAssignMutation.isPending}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!busDeleteId}
        title="Delete bus?"
        message="This cannot be undone. Routes linked to this bus will be unlinked."
        onConfirm={() => busDeleteId && deleteBusMutation.mutate(busDeleteId)}
        onCancel={() => setBusDeleteId(null)}
      />
      <ConfirmDialog
        open={!!routeDeleteId}
        title="Delete route?"
        message="Student assignments on this route will need to be updated."
        onConfirm={() => routeDeleteId && deleteRouteMutation.mutate(routeDeleteId)}
        onCancel={() => setRouteDeleteId(null)}
      />
      <ConfirmDialog
        open={!!assignDeleteId}
        title="Remove assignment?"
        message="The student will have no transport record until assigned again."
        onConfirm={() => assignDeleteId && deleteAssignMutation.mutate(assignDeleteId)}
        onCancel={() => setAssignDeleteId(null)}
      />
    </div>
  );
}
