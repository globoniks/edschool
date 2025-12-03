import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  BookOpen,
  Bell,
  MessageSquare,
  BookMarked,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Holidays', href: '/app/holidays', icon: Calendar, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Students', href: '/app/students', icon: Users, roles: ['ADMIN', 'TEACHER'] },
  { name: 'Teachers', href: '/app/teachers', icon: GraduationCap, roles: ['ADMIN'] },
  { name: 'Attendance', href: '/app/attendance', icon: Calendar, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Fees', href: '/app/fees', icon: DollarSign, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Exams', href: '/app/exams', icon: FileText, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Timetable', href: '/app/timetable', icon: Clock, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Homework', href: '/app/homework', icon: BookOpen, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Announcements', href: '/app/announcements', icon: Bell, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Messages', href: '/app/messages', icon: MessageSquare, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Academic', href: '/app/academic', icon: BookMarked, roles: ['ADMIN', 'TEACHER'] },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-primary-600">EdSchool</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation
              .filter((item) => !user?.role || item.roles.includes(user.role))
              .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

