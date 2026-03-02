import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import {
  Plus, Pencil, Trash2, Bus as BusIcon, Radio, MapPin, Users, Shield,
  Route, X, Phone, User, GripVertical,
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { FormField, Input, Select } from '../components/FormField';
import { usePermissions } from '../hooks/usePermissions';

/* ─── Types ─── */
type DriverUser = {
  id: string;
  email: string;
  profile: { firstName: string; lastName: string; phone: string | null } | null;
};

type BusRecord = {
  id: string;
  busNumber: string;
  driverName: string;
  driverPhone: string | null;
  driverId: string | null;
  capacity: number | null;
  isActive: boolean;
  driver: DriverUser | null;
  routes: { id: string; routeNumber: string }[];
};

type StopRecord = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
};

type RouteRecord = {
  id: string;
  routeNumber: string;
  busId: string | null;
  pickupPoint: string;
  dropPoint: string;
  isActive: boolean;
  bus?: { busNumber: string } | null;
  stops?: StopRecord[];
};

type AssignmentRecord = {
  id: string;
  studentId: string;
  transportMode: 'BUS' | 'PARENT_PICKUP';
  routeId: string | null;
  student: { id: string; firstName: string; lastName: string; admissionNumber: string; class?: { name: string } | null };
  route?: RouteRecord | null;
};

type RegisteredDriver = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  userId: string | null;
  isActive: boolean;
};

type StopForm = { _key: string; name: string; latitude: string; longitude: string };

let _stopKey = 0;
const nextKey = () => String(++_stopKey);

export default function Transport() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const perms = usePermissions();

  /* ── Bus state ── */
  const [busModalOpen, setBusModalOpen] = useState(false);
  const [busEditId, setBusEditId] = useState<string | null>(null);
  const [busForm, setBusForm] = useState({ busNumber: '', driverId: '', capacity: '', isActive: true });
  const [busDeleteId, setBusDeleteId] = useState<string | null>(null);

  /* ── Route state ── */
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeEditId, setRouteEditId] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState({ routeNumber: '', busId: '', pickupPoint: '', dropPoint: '', isActive: true });
  const [routeStops, setRouteStops] = useState<StopForm[]>([]);
  const [routeDeleteId, setRouteDeleteId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  /* ── Assignment state ── */
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ studentId: '', transportMode: 'BUS' as 'BUS' | 'PARENT_PICKUP', busId: '', routeId: '' });
  const [assignDeleteId, setAssignDeleteId] = useState<string | null>(null);

  /* ── Queries ── */
  const { data: buses = [], isLoading: busesLoading } = useQuery<BusRecord[]>({
    queryKey: ['transport', 'buses'],
    queryFn: () => api.get('/transport/buses').then((r) => r.data),
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery<RouteRecord[]>({
    queryKey: ['transport', 'routes'],
    queryFn: () => api.get('/transport/routes').then((r) => r.data),
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<AssignmentRecord[]>({
    queryKey: ['transport', 'assignments'],
    queryFn: () => api.get('/transport/assignments').then((r) => r.data),
  });

  const { data: registeredDrivers = [] } = useQuery<RegisteredDriver[]>({
    queryKey: ['drivers'],
    queryFn: () => api.get('/drivers').then((r) => r.data),
    enabled: perms.canManageDrivers(),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students', 'list'],
    queryFn: () => api.get('/students?limit=500').then((r) => r.data),
  });
  const students = studentsData?.students ?? [];

  const inv = (key: string) => queryClient.invalidateQueries({ queryKey: ['transport', key] });

  /* ── Bus mutations ── */
  const createBusMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/transport/buses', body),
    onSuccess: () => { inv('buses'); setBusModalOpen(false); showSuccess('Bus created'); },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed'),
  });
  const updateBusMut = useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown>) => api.patch(`/transport/buses/${id}`, body),
    onSuccess: () => { inv('buses'); setBusEditId(null); setBusModalOpen(false); showSuccess('Bus updated'); },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed'),
  });
  const deleteBusMut = useMutation({
    mutationFn: (id: string) => api.delete(`/transport/buses/${id}`),
    onSuccess: () => { inv('buses'); inv('routes'); setBusDeleteId(null); showSuccess('Bus deleted'); },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed'),
  });

  /* ── Route mutations ── */
  const createRouteMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/transport/routes', body),
    onSuccess: () => { inv('routes'); setRouteModalOpen(false); showSuccess('Route created'); },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed'),
  });
  const updateRouteMut = useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown>) => api.patch(`/transport/routes/${id}`, body),
    onSuccess: () => { inv('routes'); setRouteEditId(null); setRouteModalOpen(false); showSuccess('Route updated'); },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed'),
  });
  const deleteRouteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/transport/routes/${id}`),
    onSuccess: () => { inv('routes'); inv('assignments'); setRouteDeleteId(null); showSuccess('Route deleted'); },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed'),
  });

  /* ── Assignment mutations ── */
  const createAssignMut = useMutation({
    mutationFn: (body: { studentId: string; transportMode: 'BUS' | 'PARENT_PICKUP'; routeId?: string }) =>
      api.post('/transport/assignments', body),
    onSuccess: () => { inv('assignments'); setAssignModalOpen(false); showSuccess('Assignment created'); },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed'),
  });
  const deleteAssignMut = useMutation({
    mutationFn: (id: string) => api.delete(`/transport/assignments/${id}`),
    onSuccess: () => { inv('assignments'); setAssignDeleteId(null); showSuccess('Assignment removed'); },
    onError: (e: any) => showError(e.response?.data?.message || 'Failed'),
  });

  /* ── Helpers ── */
  const driverByUserId = new Map<string, RegisteredDriver>();
  for (const d of registeredDrivers) { if (d.userId) driverByUserId.set(d.userId, d); }

  const getDriverInfo = (b: BusRecord) => {
    if (b.driverId) {
      const reg = driverByUserId.get(b.driverId);
      if (reg) return { name: `${reg.firstName} ${reg.lastName}`, phone: reg.phone, empId: reg.employeeId, registered: true };
      if (b.driver?.profile) return { name: `${b.driver.profile.firstName} ${b.driver.profile.lastName}`, phone: b.driver.profile.phone || '', empId: '', registered: true };
    }
    return { name: b.driverName || 'No driver', phone: b.driverPhone || '', empId: '', registered: false };
  };

  /* ── Bus form handlers ── */
  const openCreateBus = () => { setBusEditId(null); setBusForm({ busNumber: '', driverId: '', capacity: '', isActive: true }); setBusModalOpen(true); };
  const openEditBus = (b: BusRecord) => {
    setBusEditId(b.id);
    setBusForm({ busNumber: b.busNumber, driverId: b.driverId || '', capacity: b.capacity != null ? String(b.capacity) : '', isActive: b.isActive });
    setBusModalOpen(true);
  };
  const submitBus = () => {
    const sel = registeredDrivers.find((d) => d.userId === busForm.driverId);
    const payload: Record<string, unknown> = {
      busNumber: busForm.busNumber.trim(),
      driverName: sel ? `${sel.firstName} ${sel.lastName}` : 'Unassigned',
      driverPhone: sel?.phone || undefined,
      driverId: busForm.driverId || null,
      capacity: busForm.capacity ? parseInt(busForm.capacity, 10) : undefined,
      isActive: busForm.isActive,
    };
    if (busEditId) updateBusMut.mutate({ id: busEditId, ...payload });
    else createBusMut.mutate(payload);
  };

  /* ── Route form handlers ── */
  const openCreateRoute = () => {
    setRouteEditId(null);
    setRouteForm({ routeNumber: '', busId: '', pickupPoint: '', dropPoint: '', isActive: true });
    setRouteStops([]);
    setRouteModalOpen(true);
  };
  const openEditRoute = (r: RouteRecord) => {
    setRouteEditId(r.id);
    setRouteForm({ routeNumber: r.routeNumber, busId: r.busId || '', pickupPoint: r.pickupPoint, dropPoint: r.dropPoint, isActive: r.isActive });
    setRouteStops((r.stops || []).map((s) => ({ _key: nextKey(), name: s.name, latitude: String(s.latitude), longitude: String(s.longitude) })));
    setRouteModalOpen(true);
  };
  const addStop = () => setRouteStops((prev) => [...prev, { _key: nextKey(), name: '', latitude: '', longitude: '' }]);
  const removeStop = (key: string) => setRouteStops((prev) => prev.filter((s) => s._key !== key));
  const updateStop = (key: string, field: keyof StopForm, value: string) =>
    setRouteStops((prev) => prev.map((s) => (s._key === key ? { ...s, [field]: value } : s)));

  const handleDragStart = useCallback((idx: number) => setDragIdx(idx), []);
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setRouteStops((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(dragIdx, 1);
      copy.splice(idx, 0, item);
      return copy;
    });
    setDragIdx(idx);
  }, [dragIdx]);
  const handleDragEnd = useCallback(() => setDragIdx(null), []);

  const submitRoute = () => {
    const stops = routeStops
      .filter((s) => s.name.trim())
      .map((s, i) => ({
        name: s.name.trim(),
        latitude: parseFloat(s.latitude) || 0,
        longitude: parseFloat(s.longitude) || 0,
        orderIndex: i,
      }));
    const payload: Record<string, unknown> = {
      routeNumber: routeForm.routeNumber.trim(),
      busId: routeForm.busId || null,
      pickupPoint: routeForm.pickupPoint.trim(),
      dropPoint: routeForm.dropPoint.trim(),
      isActive: routeForm.isActive,
      stops,
    };
    if (routeEditId) updateRouteMut.mutate({ id: routeEditId, ...payload });
    else createRouteMut.mutate(payload);
  };

  /* ── Assignment form ── */
  const submitAssign = () => {
    if (!assignForm.studentId) { showError('Select a student'); return; }
    if (assignForm.transportMode === 'BUS' && !assignForm.routeId) { showError('Select a route'); return; }
    createAssignMut.mutate({
      studentId: assignForm.studentId,
      transportMode: assignForm.transportMode,
      routeId: assignForm.transportMode === 'BUS' ? assignForm.routeId : undefined,
    });
  };

  const studentsWithAssignment = new Set(assignments.map((a) => a.studentId));
  const availableStudents = students.filter((s: { id: string }) => !studentsWithAssignment.has(s.id));

  const routesForSelectedBus = assignForm.busId
    ? routes.filter((r) => r.isActive && r.busId === assignForm.busId)
    : [];

  const assignmentsByBus = (() => {
    const grouped = new Map<string, { bus: BusRecord | null; items: AssignmentRecord[] }>();
    const noBusKey = '__no_bus__';
    const parentKey = '__parent__';
    for (const a of assignments) {
      if (a.transportMode === 'PARENT_PICKUP') {
        if (!grouped.has(parentKey)) grouped.set(parentKey, { bus: null, items: [] });
        grouped.get(parentKey)!.items.push(a);
        continue;
      }
      const busId = a.route?.busId;
      const key = busId || noBusKey;
      if (!grouped.has(key)) grouped.set(key, { bus: busId ? buses.find((b) => b.id === busId) ?? null : null, items: [] });
      grouped.get(key)!.items.push(a);
    }
    return grouped;
  })();

  const studentCountByBus = (() => {
    const counts = new Map<string, number>();
    for (const a of assignments) {
      if (a.transportMode === 'BUS' && a.route?.busId) {
        counts.set(a.route.busId, (counts.get(a.route.busId) || 0) + 1);
      }
    }
    return counts;
  })();

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="pb-20 md:pb-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport</h1>
          <p className="text-sm text-gray-500 mt-1">Manage buses, routes, and student transport</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          {perms.canManageDrivers() && (
            <Link to="/app/drivers" className="btn-secondary flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" /> Drivers
            </Link>
          )}
          <Link to="/app/transport/live" className="btn-primary flex items-center gap-2 text-sm">
            <Radio className="w-4 h-4" /> Live Tracking
          </Link>
        </div>
      </div>

      {/* ════════ BUSES ════════ */}
      <Section
        icon={<BusIcon className="w-5 h-5 text-primary-600" />}
        title="Buses"
        count={buses.length}
        action={<Btn onClick={openCreateBus}><Plus className="w-4 h-4" /> Add Bus</Btn>}
        loading={busesLoading}
        empty={buses.length === 0}
        emptyMsg="Add a bus to get started"
      >
        <div className="divide-y divide-gray-50">
          {buses.map((b) => {
            const info = getDriverInfo(b);
            const stuCount = studentCountByBus.get(b.id) || 0;
            return (
              <div key={b.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${b.isActive ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                    <BusIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{b.busNumber}</span>
                      <Badge active={b.isActive} />
                      {b.capacity && <span className="text-[10px] text-gray-400">{b.capacity} seats</span>}
                      {stuCount > 0 && (
                        <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5">
                          <Users className="w-3 h-3" /> {stuCount} student{stuCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs">
                      {info.registered ? (
                        <span className="inline-flex items-center gap-1 text-gray-700"><User className="w-3 h-3 text-green-500" /><span className="font-medium">{info.name}</span>{info.empId && <span className="text-gray-400">({info.empId})</span>}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600"><User className="w-3 h-3" />{info.name === 'No driver' ? 'No driver assigned' : info.name}</span>
                      )}
                      {info.phone && <span className="inline-flex items-center gap-1 text-gray-400"><Phone className="w-3 h-3" />{info.phone}</span>}
                    </div>
                    {b.routes.length > 0 && (
                      <div className="flex gap-1 mt-1.5">{b.routes.map((r) => <RouteBadge key={r.id}>{r.routeNumber}</RouteBadge>)}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 sm:ml-auto">
                  <IconBtn onClick={() => openEditBus(b)} label="Edit"><Pencil className="w-4 h-4" /></IconBtn>
                  <IconBtn onClick={() => setBusDeleteId(b.id)} label="Delete" danger><Trash2 className="w-4 h-4" /></IconBtn>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ════════ ROUTES ════════ */}
      <Section
        icon={<Route className="w-5 h-5 text-indigo-500" />}
        title="Routes"
        count={routes.length}
        action={<Btn onClick={openCreateRoute}><Plus className="w-4 h-4" /> Add Route</Btn>}
        loading={routesLoading}
        empty={routes.length === 0}
        emptyMsg="Add a route and link a bus"
      >
        <div className="divide-y divide-gray-50">
          {routes.map((r) => (
            <div key={r.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{r.routeNumber}</span>
                  {r.bus && <RouteBadge>{r.bus.busNumber}</RouteBadge>}
                  <Badge active={r.isActive} />
                  {(r.stops?.length ?? 0) > 0 && (
                    <span className="text-[10px] text-gray-400">{r.stops!.length} stops</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{r.pickupPoint} → {r.dropPoint}</p>
                {(r.stops?.length ?? 0) > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {r.stops!.map((s, i) => (
                      <span key={s.id} className="inline-flex items-center gap-1 text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">
                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[8px] font-bold flex items-center justify-center">{i + 1}</span>
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <IconBtn onClick={() => openEditRoute(r)} label="Edit"><Pencil className="w-4 h-4" /></IconBtn>
                <IconBtn onClick={() => setRouteDeleteId(r.id)} label="Delete" danger><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════ ASSIGNMENTS ════════ */}
      <Section
        icon={<Users className="w-5 h-5 text-orange-500" />}
        title="Student Transport"
        count={assignments.length}
        action={<Btn onClick={() => { setAssignForm({ studentId: '', transportMode: 'BUS', busId: '', routeId: '' }); setAssignModalOpen(true); }} disabled={availableStudents.length === 0}><Plus className="w-4 h-4" /> Assign Student</Btn>}
        loading={assignmentsLoading}
        empty={assignments.length === 0}
        emptyMsg="Assign students to a bus so their parents can track live location"
        last
      >
        <div>
          {Array.from(assignmentsByBus.entries()).map(([key, { bus, items }]) => (
            <div key={key}>
              <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                {key === '__parent__' ? (
                  <>
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Parent Pick Up</span>
                    <span className="text-[10px] text-gray-400 ml-1">({items.length})</span>
                  </>
                ) : (
                  <>
                    <BusIcon className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      {bus ? bus.busNumber : 'No Bus Assigned'}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1">({items.length} student{items.length !== 1 ? 's' : ''})</span>
                  </>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {a.student.firstName} {a.student.lastName}
                        <span className="text-gray-400 font-normal ml-1">({a.student.admissionNumber})</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.student.class?.name ?? '—'}
                        {a.transportMode === 'BUS' && a.route && (
                          <> &middot; <span className="text-primary-600">{a.route.routeNumber}</span></>
                        )}
                      </p>
                    </div>
                    <IconBtn onClick={() => setAssignDeleteId(a.id)} label="Remove" danger><Trash2 className="w-4 h-4" /></IconBtn>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════ BUS MODAL ════════ */}
      <Modal open={busModalOpen} onClose={() => setBusModalOpen(false)} title={busEditId ? 'Edit Bus' : 'Add Bus'}>
        <div className="space-y-4">
          <FormField label="Bus Number" required>
            <Input value={busForm.busNumber} onChange={(e) => setBusForm((f) => ({ ...f, busNumber: e.target.value }))} placeholder="BUS-003" />
          </FormField>
          <FormField label="Assign Driver">
            <Select value={busForm.driverId} onChange={(e) => setBusForm((f) => ({ ...f, driverId: e.target.value }))}>
              <option value="">— No driver —</option>
              {registeredDrivers.filter((d) => d.isActive && d.userId).map((d) => (
                <option key={d.id} value={d.userId!}>{d.firstName} {d.lastName} ({d.employeeId})</option>
              ))}
            </Select>
            {registeredDrivers.length === 0 && <p className="text-xs text-amber-600 mt-1">No registered drivers. <Link to="/app/drivers" className="underline">Add drivers first</Link></p>}
          </FormField>
          <FormField label="Capacity">
            <Input type="number" value={busForm.capacity} onChange={(e) => setBusForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="40" />
          </FormField>
          <FormField label="Status">
            <Select value={busForm.isActive ? 'true' : 'false'} onChange={(e) => setBusForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </FormField>
        </div>
        <ModalFooter onCancel={() => setBusModalOpen(false)} onSubmit={submitBus} loading={createBusMut.isPending || updateBusMut.isPending} label={busEditId ? 'Update' : 'Create'} />
      </Modal>

      {/* ════════ ROUTE MODAL ════════ */}
      <Modal open={routeModalOpen} onClose={() => setRouteModalOpen(false)} title={routeEditId ? 'Edit Route' : 'Add Route'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Route Number" required>
              <Input value={routeForm.routeNumber} onChange={(e) => setRouteForm((f) => ({ ...f, routeNumber: e.target.value }))} placeholder="Route 3" />
            </FormField>
            <FormField label="Bus">
              <Select value={routeForm.busId} onChange={(e) => setRouteForm((f) => ({ ...f, busId: e.target.value }))}>
                <option value="">— None —</option>
                {buses.filter((b) => b.isActive).map((b) => (
                  <option key={b.id} value={b.id}>{b.busNumber}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Pickup Point" required>
              <Input value={routeForm.pickupPoint} onChange={(e) => setRouteForm((f) => ({ ...f, pickupPoint: e.target.value }))} placeholder="ISBT Sector 43" />
            </FormField>
            <FormField label="Drop Point" required>
              <Input value={routeForm.dropPoint} onChange={(e) => setRouteForm((f) => ({ ...f, dropPoint: e.target.value }))} placeholder="School (Sector 9)" />
            </FormField>
          </div>
          <FormField label="Status">
            <Select value={routeForm.isActive ? 'true' : 'false'} onChange={(e) => setRouteForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </FormField>

          {/* ── STOPS ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-500" /> Stops
                <span className="text-xs text-gray-400 font-normal ml-1">{routeStops.length}</span>
              </label>
              <button type="button" onClick={addStop} className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Stop
              </button>
            </div>

            {routeStops.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No stops yet</p>
                <button type="button" onClick={addStop} className="text-xs font-medium text-primary-600 hover:text-primary-700 mt-2">
                  + Add your first stop
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {routeStops.map((stop, idx) => (
                  <div
                    key={stop._key}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-start gap-2 rounded-xl border p-3 transition-all ${
                      dragIdx === idx ? 'border-primary-400 bg-primary-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1 pt-2 shrink-0 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        type="text"
                        value={stop.name}
                        onChange={(e) => updateStop(stop._key, 'name', e.target.value)}
                        placeholder="Stop name (e.g. Sector 17 Plaza)"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={stop.latitude}
                          onChange={(e) => updateStop(stop._key, 'latitude', e.target.value)}
                          placeholder="Latitude"
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                        />
                        <input
                          type="text"
                          value={stop.longitude}
                          onChange={(e) => updateStop(stop._key, 'longitude', e.target.value)}
                          placeholder="Longitude"
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(stop._key)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 mt-1"
                      aria-label="Remove stop"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <ModalFooter onCancel={() => setRouteModalOpen(false)} onSubmit={submitRoute} loading={createRouteMut.isPending || updateRouteMut.isPending} label={routeEditId ? 'Update' : 'Create'} />
      </Modal>

      {/* ════════ ASSIGNMENT MODAL ════════ */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Student to Bus">
        <div className="space-y-4">
          <FormField label="Student" required>
            <Select value={assignForm.studentId} onChange={(e) => setAssignForm((f) => ({ ...f, studentId: e.target.value }))}>
              <option value="">Select student</option>
              {availableStudents.map((s: { id: string; firstName: string; lastName: string; admissionNumber: string; class?: { name: string } | null }) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber}){s.class ? ` — ${s.class.name}` : ''}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Transport Mode" required>
            <Select value={assignForm.transportMode} onChange={(e) => setAssignForm((f) => ({ ...f, transportMode: e.target.value as 'BUS' | 'PARENT_PICKUP', busId: '', routeId: '' }))}>
              <option value="BUS">School Bus</option>
              <option value="PARENT_PICKUP">Parent Pick Up</option>
            </Select>
          </FormField>
          {assignForm.transportMode === 'BUS' && (
            <>
              <FormField label="Bus" required>
                <Select value={assignForm.busId} onChange={(e) => setAssignForm((f) => ({ ...f, busId: e.target.value, routeId: '' }))}>
                  <option value="">Select a bus</option>
                  {buses.filter((b) => b.isActive).map((b) => {
                    const cnt = studentCountByBus.get(b.id) || 0;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.busNumber}{b.capacity ? ` (${cnt}/${b.capacity})` : cnt > 0 ? ` (${cnt} students)` : ''}
                      </option>
                    );
                  })}
                </Select>
              </FormField>
              {assignForm.busId && (
                <FormField label="Route" required>
                  <Select value={assignForm.routeId} onChange={(e) => setAssignForm((f) => ({ ...f, routeId: e.target.value }))}>
                    <option value="">Select a route</option>
                    {routesForSelectedBus.map((r) => (
                      <option key={r.id} value={r.id}>{r.routeNumber} ({r.pickupPoint} → {r.dropPoint})</option>
                    ))}
                  </Select>
                  {routesForSelectedBus.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No routes linked to this bus. <span className="underline cursor-pointer" onClick={() => { setAssignModalOpen(false); openCreateRoute(); }}>Create a route first.</span></p>
                  )}
                </FormField>
              )}
            </>
          )}
          {assignForm.transportMode === 'BUS' && assignForm.busId && assignForm.routeId && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                <BusIcon className="w-3.5 h-3.5" />
                Parents will see live bus location once a trip starts on this bus
              </p>
            </div>
          )}
        </div>
        <ModalFooter onCancel={() => setAssignModalOpen(false)} onSubmit={submitAssign} loading={createAssignMut.isPending} label="Assign" />
      </Modal>

      {/* ════════ CONFIRM DIALOGS ════════ */}
      <ConfirmDialog isOpen={!!busDeleteId} title="Delete bus?" message="Routes linked to this bus will be unlinked." onConfirm={() => busDeleteId && deleteBusMut.mutate(busDeleteId)} onClose={() => setBusDeleteId(null)} />
      <ConfirmDialog isOpen={!!routeDeleteId} title="Delete route?" message="Student assignments on this route will need updating." onConfirm={() => routeDeleteId && deleteRouteMut.mutate(routeDeleteId)} onClose={() => setRouteDeleteId(null)} />
      <ConfirmDialog isOpen={!!assignDeleteId} title="Remove assignment?" message="The student will have no transport record." onConfirm={() => assignDeleteId && deleteAssignMut.mutate(assignDeleteId)} onClose={() => setAssignDeleteId(null)} />
    </div>
  );
}

/* ═══════════════════ Shared sub-components ═══════════════════ */

function Section({ icon, title, count, action, loading, empty, emptyMsg, children, last }: {
  icon: React.ReactNode; title: string; count: number; action: React.ReactNode;
  loading: boolean; empty: boolean; emptyMsg: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <section className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${last ? '' : 'mb-6'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          {icon} {title}
          <span className="text-xs text-gray-400 font-normal ml-1">{count}</span>
        </h2>
        {action}
      </div>
      {loading ? (
        <div className="p-8"><LoadingSpinner size="md" /></div>
      ) : empty ? (
        <div className="p-8"><EmptyState title={`No ${title.toLowerCase()}`} description={emptyMsg} /></div>
      ) : children}
    </section>
  );
}

function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-xl w-full my-8 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onSubmit, loading, label }: { onCancel: () => void; onSubmit: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-gray-100">
      <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
      <button type="button" onClick={onSubmit} disabled={loading} className="btn-primary text-sm">{loading ? 'Saving...' : label}</button>
    </div>
  );
}

function Btn({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn-primary flex items-center gap-1.5 text-sm shrink-0 self-start sm:self-auto">
      {children}
    </button>
  );
}

function IconBtn({ onClick, label, children, danger }: { onClick: () => void; label: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`p-1.5 rounded-lg transition-colors ${danger ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`} aria-label={label}>
      {children}
    </button>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function RouteBadge({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-medium">{children}</span>;
}
