import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  User,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Camera,
  Users,
  Bus,
  Navigation,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../store/authStore';

type TabConfig = { name: string; href: string; icon: React.ComponentType<{ className?: string }>; activePaths?: string[] };

const PARENT_TABS: TabConfig[] = [
  { name: 'Home', href: '/app/parent-portal', icon: Home },
  { name: 'Messages', href: '/app/parent/messages', icon: MessageSquare, activePaths: ['/app/parent/messages'] },
  { name: 'Profile', href: '/app/parent/profile', icon: User, activePaths: ['/app/parent/profile'] },
];

const TEACHER_TABS: TabConfig[] = [
  { name: 'Home', href: '/app/teacher-dashboard', icon: Home, activePaths: ['/app/teacher-dashboard'] },
  { name: 'Attendance', href: '/app/attendance', icon: Calendar, activePaths: ['/app/attendance'] },
  { name: 'Homework', href: '/app/homework', icon: BookOpen, activePaths: ['/app/homework'] },
  { name: 'Photos', href: '/app/class-moments', icon: Camera, activePaths: ['/app/class-moments'] },
  { name: 'Messages', href: '/app/messages', icon: MessageSquare, activePaths: ['/app/messages'] },
];

const ADMIN_TABS: TabConfig[] = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, activePaths: ['/app/dashboard'] },
  { name: 'Students', href: '/app/students', icon: Users, activePaths: ['/app/students'] },
  { name: 'Messages', href: '/app/messages', icon: MessageSquare, activePaths: ['/app/messages'] },
];

const TRANSPORT_TABS: TabConfig[] = [
  { name: 'Transport', href: '/app/transport', icon: Bus, activePaths: ['/app/transport'] },
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, activePaths: ['/app/dashboard'] },
  { name: 'Messages', href: '/app/messages', icon: MessageSquare, activePaths: ['/app/messages'] },
];

const DRIVER_TABS: TabConfig[] = [
  { name: 'Dashboard', href: '/app/driver-dashboard', icon: Navigation, activePaths: ['/app/driver-dashboard'] },
  { name: 'Messages', href: '/app/messages', icon: MessageSquare, activePaths: ['/app/messages'] },
];

function getTabsForRole(role: string | undefined, permissions?: string[]): TabConfig[] {
  if (role === 'PARENT') return PARENT_TABS;
  if (role === 'TEACHER') return TEACHER_TABS;
  if (role === 'DRIVER') return DRIVER_TABS;
  if (role === 'SUB_ADMIN' && permissions?.includes('manageTransport')) return TRANSPORT_TABS;
  if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUB_ADMIN'].includes(role ?? '')) return ADMIN_TABS;
  return [];
}

function isTabActive(tab: TabConfig, pathname: string): boolean {
  if (tab.href === '/app/parent-portal') {
    return pathname === '/app/parent-portal' || (pathname.startsWith('/app/parent') && !pathname.startsWith('/app/parent/messages') && !pathname.startsWith('/app/parent/profile'));
  }
  if (pathname === tab.href) return true;
  if (tab.activePaths) {
    return tab.activePaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }
  return pathname.startsWith(tab.href);
}

export default function BottomNavigation() {
  const location = useLocation();
  const { user } = useAuthStore();
  const role = user?.role;
  const tabs = getTabsForRole(role, user?.permissions);

  if (tabs.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Bottom navigation"
    >
      {/* Frosted-glass container */}
      <div className="mx-2 mb-2 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-100/20 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]">
        <div
          className="grid min-h-[3.75rem] px-2 py-1"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(tab, location.pathname);
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 rounded-2xl py-1.5 min-h-[2.75rem]',
                  active
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-400 hover:text-blue-700'
                )}
              >
                <span className="flex items-center justify-center flex-shrink-0" aria-hidden>
                  <Icon className={clsx('w-5 h-5', active ? 'text-blue-700' : '')} />
                </span>
                <span className="text-[10px] font-semibold leading-tight text-center px-0.5 truncate max-w-full block">
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="h-safe-area-inset-bottom bg-transparent" />
    </nav>
  );
}
