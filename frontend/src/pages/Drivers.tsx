import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { FormField, Input, Select } from '../components/FormField';
import {
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Bus,
  X,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

type DriverRecord = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  bloodGroup: string | null;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  experience: number | null;
  previousEmployer: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  salary: number | null;
  joiningDate: string;
  isActive: boolean;
  userId: string | null;
  user: { id: string; email: string; isActive: boolean; lastLogin: string | null } | null;
  assignedBuses: { id: string; busNumber: string }[];
};

const EMPTY_FORM = {
  employeeId: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  bloodGroup: '',
  licenseNumber: '',
  licenseType: 'HMV',
  licenseExpiry: '',
  experience: '',
  previousEmployer: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  salary: '',
  joiningDate: new Date().toISOString().split('T')[0],
  createLogin: true,
  password: '',
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const LICENSE_TYPES = [
  { value: 'LMV', label: 'LMV — Light Motor Vehicle' },
  { value: 'HMV', label: 'HMV — Heavy Motor Vehicle' },
  { value: 'HGMV', label: 'HGMV — Heavy Goods Motor Vehicle' },
  { value: 'HTV', label: 'HTV — Heavy Transport Vehicle' },
  { value: 'PSV', label: 'PSV — Public Service Vehicle' },
];

export default function Drivers() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: drivers = [], isLoading } = useQuery<DriverRecord[]>({
    queryKey: ['drivers'],
    queryFn: () => api.get('/drivers').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/drivers', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      closeModal();
      showSuccess('Driver created successfully');
    },
    onError: (e: any) => showError(e.response?.data?.error || 'Failed to create driver'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown>) => api.patch(`/drivers/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      closeModal();
      showSuccess('Driver updated');
    },
    onError: (e: any) => showError(e.response?.data?.error || 'Failed to update driver'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDeleteId(null);
      showSuccess('Driver removed');
    },
    onError: (e: any) => showError(e.response?.data?.error || 'Failed to delete driver'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/drivers/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      showSuccess('Status updated');
    },
    onError: (e: any) => showError(e.response?.data?.error || 'Failed to update status'),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (d: DriverRecord) => {
    setEditId(d.id);
    setForm({
      employeeId: d.employeeId,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      email: d.email || '',
      dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : '',
      gender: d.gender || '',
      address: d.address || '',
      bloodGroup: d.bloodGroup || '',
      licenseNumber: d.licenseNumber,
      licenseType: d.licenseType,
      licenseExpiry: d.licenseExpiry ? d.licenseExpiry.split('T')[0] : '',
      experience: d.experience != null ? String(d.experience) : '',
      previousEmployer: d.previousEmployer || '',
      emergencyContactName: d.emergencyContactName || '',
      emergencyContactPhone: d.emergencyContactPhone || '',
      emergencyContactRelation: d.emergencyContactRelation || '',
      salary: d.salary != null ? String(d.salary) : '',
      joiningDate: d.joiningDate ? d.joiningDate.split('T')[0] : '',
      createLogin: false,
      password: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showError('First name and last name are required');
      return;
    }
    if (!form.licenseNumber.trim() || !form.licenseExpiry) {
      showError('License number and expiry are required');
      return;
    }
    const expiryYear = new Date(form.licenseExpiry).getFullYear();
    if (isNaN(expiryYear) || expiryYear < 1900 || expiryYear > 2100) {
      showError('License expiry date is invalid');
      return;
    }
    if (!form.phone.trim()) {
      showError('Phone number is required');
      return;
    }

    const payload: Record<string, unknown> = {
      employeeId: form.employeeId.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      address: form.address.trim() || undefined,
      bloodGroup: form.bloodGroup || undefined,
      licenseNumber: form.licenseNumber.trim(),
      licenseType: form.licenseType,
      licenseExpiry: form.licenseExpiry,
      experience: form.experience ? parseInt(form.experience, 10) : 0,
      previousEmployer: form.previousEmployer.trim() || undefined,
      emergencyContactName: form.emergencyContactName.trim() || undefined,
      emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
      emergencyContactRelation: form.emergencyContactRelation.trim() || undefined,
      salary: form.salary ? parseFloat(form.salary) : undefined,
      joiningDate: form.joiningDate || undefined,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      payload.createLogin = form.createLogin;
      if (form.password.trim()) payload.password = form.password.trim();
      createMutation.mutate(payload);
    }
  };

  const filtered = drivers.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.firstName.toLowerCase().includes(q) ||
      d.lastName.toLowerCase().includes(q) ||
      d.employeeId.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      d.licenseNumber.toLowerCase().includes(q)
    );
  });

  const isLicenseExpiring = (expiry: string) => {
    const diff = new Date(expiry).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };
  const isLicenseExpired = (expiry: string) => new Date(expiry).getTime() < Date.now();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-sm text-gray-500 mt-1">{drivers.length} driver{drivers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      {/* Search */}
      {drivers.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, phone, or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-16 h-16 text-gray-400" />}
          title={search ? 'No drivers found' : 'No drivers yet'}
          description={search ? 'Try a different search' : 'Add your first driver to get started'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const expanded = expandedId === d.id;
            return (
              <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Summary row */}
                <div
                  className="px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : d.id)}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${d.isActive ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {d.firstName[0]}{d.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{d.firstName} {d.lastName}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono shrink-0">{d.employeeId}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>
                      <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{d.licenseNumber}</span>
                      {d.assignedBuses.length > 0 && (
                        <span className="flex items-center gap-1"><Bus className="w-3 h-3" />{d.assignedBuses.map((b) => b.busNumber).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isLicenseExpired(d.licenseExpiry) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">License expired</span>
                    ) : isLicenseExpiring(d.licenseExpiry) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">Expiring soon</span>
                    ) : null}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${d.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-gray-100 px-4 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm mb-4">
                      <Detail label="Date of Birth" value={d.dateOfBirth ? new Date(d.dateOfBirth).toLocaleDateString() : '—'} />
                      <Detail label="Gender" value={d.gender || '—'} />
                      <Detail label="Blood Group" value={d.bloodGroup || '—'} />
                      <Detail label="License Type" value={d.licenseType} />
                      <Detail label="License Expiry" value={new Date(d.licenseExpiry).toLocaleDateString()} warn={isLicenseExpired(d.licenseExpiry) || isLicenseExpiring(d.licenseExpiry)} />
                      <Detail label="Experience" value={d.experience != null ? `${d.experience} years` : '—'} />
                      <Detail label="Joining Date" value={new Date(d.joiningDate).toLocaleDateString()} />
                      <Detail label="Previous Employer" value={d.previousEmployer || '—'} />
                      <Detail label="Salary" value={d.salary != null ? `₹${d.salary.toLocaleString()}` : '—'} />
                      {d.email && <Detail label="Email" value={d.email} />}
                      {d.address && <Detail label="Address" value={d.address} className="col-span-2" />}
                    </div>

                    {(d.emergencyContactName || d.emergencyContactPhone) && (
                      <div className="bg-red-50 rounded-lg p-3 mb-4">
                        <p className="text-xs font-semibold text-red-700 mb-1">Emergency Contact</p>
                        <p className="text-sm text-red-900">
                          {d.emergencyContactName || '—'}
                          {d.emergencyContactRelation && <span className="text-red-500"> ({d.emergencyContactRelation})</span>}
                          {d.emergencyContactPhone && <span className="ml-2">{d.emergencyContactPhone}</span>}
                        </p>
                      </div>
                    )}

                    {d.user && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-800">Login: <span className="font-medium">{d.user.email}</span></span>
                        {d.user.lastLogin && (
                          <span className="text-blue-400 text-xs ml-auto">Last login: {new Date(d.user.lastLogin).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button type="button" onClick={() => openEdit(d)} className="btn-secondary text-sm flex items-center gap-1.5 py-1.5 px-3">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(d.id)}
                        className="btn-secondary text-sm flex items-center gap-1.5 py-1.5 px-3"
                      >
                        {d.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {d.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button type="button" onClick={() => setDeleteId(d.id)} className="btn-secondary text-sm flex items-center gap-1.5 py-1.5 px-3 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Edit Driver' : 'Add New Driver'}</h3>
              <button type="button" onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Personal Info */}
              <Section title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Employee ID" required>
                    <Input value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} placeholder="DRV-001" />
                  </FormField>
                  <FormField label="Gender">
                    <Select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                  </FormField>
                  <FormField label="First Name" required>
                    <Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="John" />
                  </FormField>
                  <FormField label="Last Name" required>
                    <Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Doe" />
                  </FormField>
                  <FormField label="Phone" required>
                    <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                  </FormField>
                  <FormField label="Email">
                    <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="driver@email.com" />
                  </FormField>
                  <FormField label="Date of Birth">
                    <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
                  </FormField>
                  <FormField label="Blood Group">
                    <Select value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}>
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Address" className="sm:col-span-2">
                    <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Full address" />
                  </FormField>
                </div>
              </Section>

              {/* License Info */}
              <Section title="License & Driving">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="License Number" required>
                    <Input value={form.licenseNumber} onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))} placeholder="CH01 2020 1234567" />
                  </FormField>
                  <FormField label="License Type" required>
                    <Select value={form.licenseType} onChange={(e) => setForm((f) => ({ ...f, licenseType: e.target.value }))}>
                      {LICENSE_TYPES.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="License Expiry" required>
                    <Input type="date" value={form.licenseExpiry} onChange={(e) => setForm((f) => ({ ...f, licenseExpiry: e.target.value }))} />
                  </FormField>
                  <FormField label="Driving Experience (years)">
                    <Input type="number" min="0" value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="5" />
                  </FormField>
                  <FormField label="Previous Employer">
                    <Input value={form.previousEmployer} onChange={(e) => setForm((f) => ({ ...f, previousEmployer: e.target.value }))} placeholder="Company name" />
                  </FormField>
                </div>
              </Section>

              {/* Emergency Contact */}
              <Section title="Emergency Contact">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Name">
                    <Input value={form.emergencyContactName} onChange={(e) => setForm((f) => ({ ...f, emergencyContactName: e.target.value }))} placeholder="Contact name" />
                  </FormField>
                  <FormField label="Phone">
                    <Input value={form.emergencyContactPhone} onChange={(e) => setForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))} placeholder="+91 98765 43210" />
                  </FormField>
                  <FormField label="Relation">
                    <Input value={form.emergencyContactRelation} onChange={(e) => setForm((f) => ({ ...f, emergencyContactRelation: e.target.value }))} placeholder="e.g. Spouse, Brother" />
                  </FormField>
                </div>
              </Section>

              {/* Employment */}
              <Section title="Employment">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Joining Date">
                    <Input type="date" value={form.joiningDate} onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))} />
                  </FormField>
                  <FormField label="Monthly Salary (₹)">
                    <Input type="number" min="0" value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} placeholder="15000" />
                  </FormField>
                </div>
              </Section>

              {/* Login Account */}
              {!editId && (
                <Section title="Login Account">
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.createLogin}
                      onChange={(e) => setForm((f) => ({ ...f, createLogin: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Create login account for this driver</span>
                  </label>
                  {form.createLogin && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Login Email" hint={!form.email ? 'Will use employeeId@driver.local' : `Will use: ${form.email}`}>
                        <Input disabled value={form.email || `${form.employeeId || 'empid'}@driver.local`} className="bg-gray-50" />
                      </FormField>
                      <FormField label="Password" hint="Default: driver123">
                        <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Leave empty for default" />
                      </FormField>
                    </div>
                  )}
                </Section>
              )}
            </div>

            <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-200">
              <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editId ? 'Update Driver' : 'Add Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Remove driver?"
        message="This will deactivate the driver's login account and unassign them from all buses. This cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-1.5 border-b border-gray-100">{title}</h4>
      {children}
    </div>
  );
}

function Detail({ label, value, warn, className }: { label: string; value: string; warn?: boolean; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${warn ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}
