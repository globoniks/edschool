import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ImagePlus, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import { LogoMark } from '../components/Logo';

interface School {
  id: string;
  name: string;
  logo?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * School identity settings — the admin side of white-labelling.
 *
 * The name and logo saved here are what every parent and teacher of this
 * school sees in the app chrome (via useBrand). Without this page the
 * School.logo column was write-only: the API accepted it but no UI existed.
 */
export default function SchoolSettings() {
  const { user, updateUser } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const schoolId = user?.school?.id;
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const { data: school, isLoading } = useQuery<School>({
    queryKey: ['school', schoolId],
    queryFn: () => api.get(`/schools/${schoolId}`).then((res) => res.data),
    enabled: Boolean(schoolId) && isAdmin,
  });

  const [name, setName] = useState<string | null>(null);
  const effectiveName = name ?? school?.name ?? '';

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<Pick<School, 'name' | 'logo'>>) =>
      api.patch(`/schools/${schoolId}`, patch).then((res) => res.data),
    onSuccess: (updated: School) => {
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] });
      // Update the cached session so the chrome rebrands immediately,
      // rather than on next sign-in.
      if (user?.school) {
        updateUser({ school: { ...user.school, name: updated.name, logo: updated.logo } });
      }
      showSuccess('School branding updated');
    },
    onError: (err: Error) => showError(err.message || 'Could not save changes'),
  });

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('The logo must be an image');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/upload/single', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateMutation.mutate({ logo: data.url });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Only School Admin and Super Admin can edit school settings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-brand-700" />
        </div>
        <div>
          <h1 className="font-headline text-2xl font-bold text-brand-900">School settings</h1>
          <p className="text-slate-500 text-sm">
            The name and logo shown to everyone at your school — parents, teachers and staff.
          </p>
        </div>
      </div>

      {/* Name */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <label htmlFor="school-name" className="block text-sm font-semibold text-slate-600 mb-1.5">
          School name
        </label>
        <div className="flex gap-3">
          <input
            id="school-name"
            type="text"
            value={effectiveName}
            onChange={(e) => setName(e.target.value)}
            className="input flex-1"
            maxLength={120}
          />
          <button
            type="button"
            disabled={
              updateMutation.isPending ||
              !effectiveName.trim() ||
              effectiveName.trim() === school?.name
            }
            onClick={() => updateMutation.mutate({ name: effectiveName.trim() })}
            className="px-5 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold disabled:opacity-50 hover:bg-brand-700 transition-colors"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </section>

      {/* Logo */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Logo</h2>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
            {school?.logo ? (
              <img src={school.logo} alt="School logo" className="w-full h-full object-contain" />
            ) : (
              <LogoMark className="w-12 h-12" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-brand-900 hover:bg-brand-50 disabled:opacity-50 transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
                {uploading ? 'Uploading…' : school?.logo ? 'Replace logo' : 'Upload logo'}
              </button>
              {school?.logo && (
                <button
                  type="button"
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ logo: '' })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              PNG or SVG with a transparent background works best. Square images fit the app
              chrome; without a logo, the default mark is shown.
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLogoUpload(file);
          }}
        />
      </section>
    </div>
  );
}
