import { useState, useRef, useEffect } from 'react';
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
  Menu,
  X,
  UserCircle,
  Camera,
  User,
  ChevronDown,
} from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN', 'HOD', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Parent Portal', href: '/app/parent-portal', icon: UserCircle, roles: ['PARENT'] },
  { name: 'Holidays', href: '/app/holidays', icon: Calendar, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN', 'HOD', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Students', href: '/app/students', icon: Users, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN', 'TEACHER'] },
  { name: 'Teachers', href: '/app/teachers', icon: GraduationCap, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'] },
  { name: 'Attendance', href: '/app/attendance', icon: Calendar, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'HOD', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Fees', href: '/app/fees', icon: DollarSign, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Exams', href: '/app/exams', icon: FileText, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'HOD', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Timetable', href: '/app/timetable', icon: Clock, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'HOD', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Homework', href: '/app/homework', icon: BookOpen, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'HOD', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Announcements', href: '/app/announcements', icon: Bell, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Class photos', href: '/app/class-moments', icon: Camera, roles: ['TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Messages', href: '/app/messages', icon: MessageSquare, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN', 'HOD', 'TEACHER', 'PARENT', 'STUDENT'] },
  { name: 'Academic', href: '/app/academic', icon: BookMarked, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'HOD', 'TEACHER'] },
];

function getProfileHref(role: string | undefined): string {
  switch (role) {
    case 'PARENT':
      return '/app/parent/profile';
    case 'TEACHER':
      return '/app/teacher-dashboard';
    case 'STUDENT':
      return '/app/student-dashboard';
    default:
      return '/app/dashboard';
  }
}

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isParent = user?.role === 'PARENT';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => setUserMenuOpen(false), [location.pathname]);

  // Normalize role for nav: backend uses SUPER_ADMIN, SCHOOL_ADMIN, etc.; handle legacy or display variants
  const knownRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN', 'HOD', 'TEACHER', 'PARENT', 'STUDENT'];
  const navRole = (() => {
    const r = user?.role;
    if (!r) return r;
    const upper = String(r).toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
    if (knownRoles.includes(upper)) return upper;
    if (upper === 'ADMIN' || r === 'Admin') return 'SCHOOL_ADMIN';
    // Any role containing "admin" (e.g. "School Admin", "Academic Admin") -> map to known admin
    if (upper.includes('ADMIN')) {
      if (upper.includes('SUPER')) return 'SUPER_ADMIN';
      if (upper.includes('ACADEMIC')) return 'ACADEMIC_ADMIN';
      if (upper.includes('FINANCE')) return 'FINANCE_ADMIN';
      if (upper.includes('HR_') || upper === 'HR') return 'HR_ADMIN';
      return 'SCHOOL_ADMIN';
    }
    return r;
  })();

  const filteredNav = navigation.filter(
    (item) => !navRole || item.roles.includes(navRole)
  );
  // Fallback: if no items match (e.g. unknown or legacy role), show admin-capable links so sidebar isn't blank
  const adminRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN', 'HOD'];
  const navItems =
    filteredNav.length > 0
      ? filteredNav
      : navigation.filter((item) => item.roles.some((r) => adminRoles.includes(r)));

  const profileHref = getProfileHref(user?.role);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Top header: on mobile for all roles; on desktop only for parent (no sidebar) */}
      <div className={`fixed top-0 left-0 right-0 z-40 bg-white shadow-md min-h-[4rem] flex items-center justify-between px-4 safe-area-inset-top ${isParent ? 'flex' : 'lg:hidden flex'}`}>
        <div className="flex items-center gap-2 min-h-[2.75rem]">
          {!isParent && (
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="touch-target min-h-[2.75rem] min-w-[2.75rem] p-2 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
          <Link to={isParent ? '/app/parent-portal' : '/app/dashboard'} className="flex items-center min-h-[2.75rem]">
            <h1 className="text-lg sm:text-xl font-bold text-primary-600">EdSchool</h1>
          </Link>
        </div>

        {/* User menu – Profile & Logout always visible */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="touch-target min-h-[2.75rem] min-w-[2.75rem] p-2 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1"
            aria-label="Account menu"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <User className="w-5 h-5" />
            <ChevronDown className={clsx('w-4 h-4 transition-transform', userMenuOpen && 'rotate-180')} />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Link
                to={profileHref}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setUserMenuOpen(false)}
              >
                <UserCircle className="w-4 h-4 flex-shrink-0" />
                {isParent ? 'Profile' : 'Account'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar – drawer on mobile/tablet, fixed on lg+ */}
      <div
        className={`sidebar-drawer fixed inset-y-0 left-0 w-64 max-w-[85vw] bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30 ${
          isParent ? 'md:hidden -translate-x-full' : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
        } lg:translate-x-0 lg:max-w-none`}
      >
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          {/* Logo - Desktop only */}
          <div className="hidden lg:flex items-center justify-center h-16 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-primary-600">EdSchool</h1>
          </div>

          {/* Navigation – touch-friendly link height */}
          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`nav-link flex items-center px-4 py-3 min-h-[2.75rem] rounded-lg transition-colors text-base ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center w-full min-h-[2.75rem] px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content – padding: top bar always; sidebar offset only for non-parent on lg */}
      <div className={`pt-16 w-full min-w-0 ${isParent ? '' : 'lg:pl-64 lg:pt-0'}`}>
        <main className="p-4 sm:p-5 md:p-6 lg:p-8 max-w-full overflow-x-hidden pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation on Mobile – role-specific tabs (Parent, Teacher, Student, Admin) */}
      <BottomNavigation />
    </div>
  );
}

