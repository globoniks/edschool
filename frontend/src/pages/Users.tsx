import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { X, Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

/** Permission keys that can be assigned to tags (match backend PERMISSION_KEYS) */
const PERMISSION_KEYS = [
  'manageAcademic',
  'createExam',
  'enterMarks',
  'viewResults',
  'manageFees',
  'manageFinance',
  'viewReports',
  'manageTeachers',
  'manageStaff',
  'manageHR',
  'manageTransport',
  'viewBusTracking',
  'hodViewSubmissions',
  'hodEnterExamMarks',
] as const;

type UserRow = {
  id: string;
  email: string;
  role: string;
  tags: string[];
  profile?: { firstName?: string; lastName?: string };
};

type TagRow = {
  id: string;
  slug: string;
  name: string;
  type: string;
  permissions: string[];
  schoolId?: string | null;
};

export default function Users() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [tagModal, setTagModal] = useState<{ mode: 'create' | 'edit'; tag?: TagRow } | null>(null);
  const [tagForm, setTagForm] = useState({ name: '', slug: '', type: 'SUB_ADMIN' as 'SUB_ADMIN' | 'TEACHER', permissions: [] as string[] });
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SCHOOL_ADMIN';
  if (!canManage) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Only School Admin and Super Admin can manage users and permissions.</p>
      </div>
    );
  }

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((res) => res.data),
  });

  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((res) => res.data),
  });

  const updateUserTagsMutation = useMutation({
    mutationFn: ({ userId, tagSlugs }: { userId: string; tagSlugs: string[] }) =>
      api.patch(`/users/${userId}/tags`, { tagSlugs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      showSuccess('Tags updated');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || 'Failed to update tags');
    },
  });

  const createTagMutation = useMutation({
    mutationFn: (body: { name: string; slug: string; type: string; permissions: string[] }) =>
      api.post('/tags', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setTagModal(null);
      setTagForm({ name: '', slug: '', type: 'SUB_ADMIN', permissions: [] });
      showSuccess('Tag created');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || 'Failed to create tag');
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; slug?: string; type?: string; permissions?: string[] } }) =>
      api.patch(`/tags/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setTagModal(null);
      showSuccess('Tag updated');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || 'Failed to update tag');
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setDeleteTagId(null);
      showSuccess('Tag deleted');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || 'Failed to delete tag');
    },
  });

  const openEditUser = (u: UserRow) => {
    setEditUser(u);
    setSelectedTagSlugs(u.tags ?? []);
  };

  const openTagModal = (mode: 'create' | 'edit', tag?: TagRow) => {
    setTagModal({ mode, tag });
    if (mode === 'edit' && tag) {
      setTagForm({
        name: tag.name,
        slug: tag.slug,
        type: tag.type as 'SUB_ADMIN' | 'TEACHER',
        permissions: Array.isArray(tag.permissions) ? tag.permissions : [],
      });
    } else {
      setTagForm({ name: '', slug: '', type: 'SUB_ADMIN', permissions: [] });
    }
  };

  const tagsForRole = (role: string): TagRow[] => {
    if (role === 'SUB_ADMIN') return tags.filter((t: TagRow) => t.type === 'SUB_ADMIN');
    if (role === 'TEACHER') return tags.filter((t: TagRow) => t.type === 'TEACHER');
    return [];
  };

  const handleSaveUserTags = () => {
    if (!editUser) return;
    updateUserTagsMutation.mutate({ userId: editUser.id, tagSlugs: selectedTagSlugs });
  };

  const handleSaveTag = () => {
    if (tagModal?.mode === 'create') {
      createTagMutation.mutate({
        name: tagForm.name,
        slug: tagForm.slug.toUpperCase().replace(/\s+/g, '_'),
        type: tagForm.type,
        permissions: tagForm.permissions,
      });
    } else if (tagModal?.mode === 'edit' && tagModal.tag) {
      updateTagMutation.mutate({
        id: tagModal.tag.id,
        body: {
          name: tagForm.name,
          slug: tagForm.slug.toUpperCase().replace(/\s+/g, '_'),
          type: tagForm.type,
          permissions: tagForm.permissions,
        },
      });
    }
  };

  const togglePermission = (key: string) => {
    setTagForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const faculty = users.filter((u: UserRow) => u.role === 'SUB_ADMIN' || u.role === 'TEACHER');

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users & permissions</h1>
        <p className="text-gray-600 mt-1">
          Manage tags and assign them to faculty (sub-admins and teachers). Tags define what each role can access.
        </p>
      </div>

      {/* Manage tags section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
          <button
            type="button"
            onClick={() => openTagModal('create')}
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add tag
          </button>
        </div>
        {tagsLoading ? (
          <LoadingSpinner />
        ) : tags.length === 0 ? (
          <EmptyState
            title="No tags"
            description="Create tags (e.g. Academic, Finance, HOD) and assign them to faculty below."
          />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tags.map((t: TagRow) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{t.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex flex-wrap gap-1">
                        {(Array.isArray(t.permissions) ? t.permissions : []).slice(0, 3).map((p: string) => (
                          <span key={p} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                            {p}
                          </span>
                        ))}
                        {(Array.isArray(t.permissions) ? t.permissions : []).length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{(Array.isArray(t.permissions) ? t.permissions : []).length - 3} more
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openTagModal('edit', t)}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                        aria-label="Edit tag"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTagId(t.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ml-1"
                        aria-label="Delete tag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Faculty (assign tags) section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Faculty</h2>
        <p className="text-sm text-gray-600 mb-4">Assign tags to sub-admins and teachers to control their permissions.</p>
        {usersLoading ? (
          <LoadingSpinner />
        ) : faculty.length === 0 ? (
          <EmptyState title="No faculty" description="No sub-admins or teachers in this school." />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {faculty.map((u: UserRow) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {u.profile?.firstName} {u.profile?.lastName}
                      </span>
                      <span className="block text-sm text-gray-500">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.role.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      {u.tags?.length ? (
                        <span className="inline-flex flex-wrap gap-1">
                          {u.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-primary-100 text-primary-800 text-xs">
                              {t}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEditUser(u)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium inline-flex items-center gap-1"
                      >
                        <Tag className="w-4 h-4" />
                        Edit tags
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit user tags modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit tags – {editUser.email}</h2>
              <button type="button" onClick={() => setEditUser(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Role: {editUser.role.replace(/_/g, ' ')}</p>
            {tagsForRole(editUser.role).length > 0 ? (
              <>
                <div className="space-y-2 mb-6">
                  {tagsForRole(editUser.role).map((t: TagRow) => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTagSlugs.includes(t.slug)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTagSlugs((s) => [...s, t.slug]);
                          else setSelectedTagSlugs((s) => s.filter((x) => x !== t.slug));
                        }}
                        className="rounded border-gray-300"
                      />
                      <span>{t.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUserTags}
                    disabled={updateUserTagsMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {updateUserTagsMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No tags available for this role. Create a tag above first.</p>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit tag modal */}
      {tagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{tagModal.mode === 'create' ? 'Add tag' : 'Edit tag'}</h2>
              <button type="button" onClick={() => setTagModal(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={tagForm.name}
                  onChange={(e) => setTagForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Academic"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={tagForm.slug}
                  onChange={(e) => setTagForm((p) => ({ ...p, slug: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                  placeholder="e.g. ACADEMIC"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Letters, numbers, underscores only. Stored in uppercase.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={tagForm.type}
                  onChange={(e) => setTagForm((p) => ({ ...p, type: e.target.value as 'SUB_ADMIN' | 'TEACHER' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="SUB_ADMIN">Sub-admin (e.g. Academic, Finance, Transport)</option>
                  <option value="TEACHER">Teacher (e.g. HOD)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {PERMISSION_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tagForm.permissions.includes(key)}
                        onChange={() => togglePermission(key)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setTagModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTag}
                disabled={
                  !tagForm.name.trim() ||
                  !tagForm.slug.trim() ||
                  createTagMutation.isPending ||
                  updateTagMutation.isPending
                }
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {tagModal.mode === 'create' ? (createTagMutation.isPending ? 'Creating…' : 'Create') : (updateTagMutation.isPending ? 'Saving…' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete tag confirmation */}
      {deleteTagId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete tag?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will remove the tag from all users. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTagId(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteTagMutation.mutate(deleteTagId)}
                disabled={deleteTagMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTagMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
