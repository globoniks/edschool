import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { User, LogOut, Settings } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import StudentProfileCard from '../../components/StudentProfileCard';

export default function ParentProfile() {
  const { user, logout } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parents/dashboard').then((res) => res.data),
    enabled: user?.role === 'PARENT',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { parent, children } = dashboardData || {};

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your account and view child profiles</p>
      </div>

      {/* Parent Profile */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {parent?.firstName} {parent?.lastName}
            </h2>
            <p className="text-sm text-gray-600">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Phone:</span>{' '}
              <span className="font-medium">{parent?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>{' '}
              <span className="font-medium">{user?.email || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Children Profiles */}
      {children && children.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Children</h2>
          <div className="space-y-4">
            {children.map((child: any) => (
              <StudentProfileCard
                key={child.studentId}
                name={`${child.firstName} ${child.lastName}`}
                class={child.class ? `${child.class.name}${child.class.section ? ` ${child.class.section}` : ''}` : 'N/A'}
                admissionNumber={child.admissionNumber}
                photo={child.photo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Settings
        </h2>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-sm">
            Notification Preferences
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-sm">
            Change Password
          </button>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

