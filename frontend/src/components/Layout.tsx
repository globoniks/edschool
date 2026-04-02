import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  CalendarOff,
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
  Bus,
  Navigation,
  Shield,
} from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { usePermissions } from '../hooks/usePermissions';
import { clsx } from 'clsx';

const navigation: { name: string; href: string; icon: typeof LayoutDashboard; show?: (p: ReturnType<typeof usePermissions>) => boolean }[] = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, show: (p) => p.showDashboard() },
  { name: 'Driver Dashboard', href: '/app/driver-dashboard', icon: Navigation, show: (p) => p.showDriverDashboard() },
  { name: 'Parent Portal', href: '/app/parent-portal', icon: UserCircle, show: (p) => p.showParentPortal() },
  { name: 'Holidays', href: '/app/holidays', icon: Calendar, show: (p) => p.role !== 'DRIVER' },
  { name: 'Students', href: '/app/students', icon: Users, show: (p) => p.canViewStudents() },
  { name: 'Teachers', href: '/app/teachers', icon: GraduationCap, show: (p) => p.canManageTeachers() },
  { name: 'Drivers', href: '/app/drivers', icon: Shield, show: (p) => p.canManageDrivers() },
  { name: 'Transport', href: '/app/transport', icon: Bus, show: (p) => p.canManageTransport() },
  { name: 'Attendance', href: '/app/attendance', icon: Calendar, show: (p) => p.canViewAttendance() },
  { name: 'Leave', href: '/app/leave', icon: CalendarOff, show: (p) => p.role === 'TEACHER' || p.canManageHR() },
  { name: 'Fees', href: '/app/fees', icon: DollarSign, show: (p) => p.canViewFees() },
  { name: 'Exams', href: '/app/exams', icon: FileText, show: (p) => p.canViewExams() },
  { name: 'Timetable', href: '/app/timetable', icon: Clock, show: (p) => p.canViewTimetable() },
  { name: 'Homework', href: '/app/homework', icon: BookOpen, show: (p) => p.canViewHomework() },
  { name: 'Announcements', href: '/app/announcements', icon: Bell, show: (p) => p.canViewAnnouncements() },
  { name: 'Class photos', href: '/app/class-moments', icon: Camera, show: (p) => p.canViewClassMoments() },
  { name: 'Messages', href: '/app/messages', icon: MessageSquare, show: () => true },
  { name: 'Academic', href: '/app/academic', icon: BookMarked, show: (p) => p.showAcademicSetup() },
  { name: 'Users & permissions', href: '/app/users', icon: User, show: (p) => p.showUsersAndPermissions() },
];

function getProfileHref(role: string | undefined): string {
  if (role === 'PARENT') return '/app/parent/profile';
  if (role === 'TEACHER') return '/app/teacher-dashboard';
  if (role === 'DRIVER') return '/app/driver-dashboard';
  return '/app/dashboard';
}

function getDefaultRoute(role: string | undefined): string {
  if (role === 'PARENT') return '/app/parent-portal';
  if (role === 'TEACHER') return '/app/teacher-dashboard';
  if (role === 'DRIVER') return '/app/driver-dashboard';
  return '/app/dashboard';
}

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const permissions = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isParent = user?.role === 'PARENT';
  const isDriver = user?.role === 'DRIVER';

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

  const navItems = navigation.filter((item) => item.show?.(permissions) !== false);

  const profileHref = getProfileHref(user?.role);

  const pathname = location.pathname;
  const isParentOnlyRoute = pathname === '/app/parent-portal' || pathname.startsWith('/app/parent/');
  if (user && isParentOnlyRoute && user.role !== 'PARENT') {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }
  const isDriverOnlyRoute = pathname === '/app/driver-dashboard';
  if (user && isDriverOnlyRoute && user.role !== 'DRIVER') {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">

      {/* ── Top Header ─────────────────────────────────────────── */}
      <div
        className={clsx(
          'fixed top-0 left-0 right-0 z-40 min-h-[4rem] flex items-center justify-between px-4 safe-area-inset-top',
          'bg-white/80 backdrop-blur-xl shadow-sm shadow-blue-900/5',
          isParent || isDriver ? 'flex' : 'lg:hidden flex'
        )}
      >
        <div className="flex items-center gap-2 min-h-[2.75rem]">
          {!isParent && !isDriver && (
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="touch-target min-h-[2.75rem] min-w-[2.75rem] p-2 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
          <Link
            to={isParent ? '/app/parent-portal' : isDriver ? '/app/driver-dashboard' : '/app/dashboard'}
            className="flex items-center min-h-[2.75rem] gap-2"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)' }}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-blue-900 font-headline tracking-tight">EdSchool</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {isParent && (
            <Link
              to="/app/parent/alerts"
              className="touch-target min-h-[2.75rem] min-w-[2.75rem] p-2 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
              aria-label="View alerts"
            >
              <Bell className="w-5 h-5" />
            </Link>
          )}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="touch-target min-h-[2.75rem] min-w-[2.75rem] p-2 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors"
              aria-label="Account menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                {user?.profile?.firstName?.[0] ?? <User className="w-4 h-4" />}
              </div>
              <ChevronDown className={clsx('w-4 h-4 transition-transform text-slate-400', userMenuOpen && 'rotate-180')} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-100 bg-white py-1 shadow-xl shadow-blue-900/10 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-blue-900 truncate">
                    {user?.profile?.firstName} {user?.profile?.lastName}
                  </p>
                  <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <Link
                  to={profileHref}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserCircle className="w-4 h-4 flex-shrink-0 text-blue-700" />
                  {isParent ? 'Profile' : 'Account'}
                </Link>
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(false); logout(); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={clsx(
          'sidebar-drawer fixed inset-y-0 left-0 w-64 max-w-[85vw] bg-slate-50 border-r-0 shadow-xl transform transition-transform duration-300 ease-in-out z-30',
          isParent || isDriver
            ? 'md:hidden -translate-x-full'
            : sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:max-w-none'
        )}
      >
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          {/* Logo — Desktop only */}
          <div className="hidden lg:flex items-center gap-3 h-16 px-6 border-b border-slate-200/60">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)' }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-blue-900 font-headline leading-none">EdSchool</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">Management Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    'flex items-center px-3 py-2.5 min-h-[2.75rem] rounded-xl transition-all duration-200 text-sm font-medium group',
                    isActive
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-500 hover:bg-white/60 hover:translate-x-1 hover:text-blue-900'
                  )}
                >
                  <Icon className={clsx('w-5 h-5 mr-3 flex-shrink-0 transition-colors', isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-blue-700')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info + logout */}
          <div className="p-4 border-t border-slate-200/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                {user?.profile?.firstName?.[0] ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-900 truncate">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center w-full min-h-[2.5rem] px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content ────────────────────────────────────────── */}
      <div className={`pt-16 w-full min-w-0 ${isParent || isDriver ? '' : 'lg:pl-64 lg:pt-0'}`}>
        <main className="p-4 sm:p-5 md:p-6 lg:p-8 max-w-full overflow-x-hidden pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
