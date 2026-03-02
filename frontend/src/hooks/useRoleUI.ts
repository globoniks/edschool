import { useAuthStore } from '../store/authStore';

/** Role values aligned with backend (tag-based: SUB_ADMIN has permissions via tags). */
export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'SUB_ADMIN'
  | 'TEACHER'
  | 'PARENT'
  | 'DRIVER';

export type RoleFocus = 'finance-alerts' | 'progress' | 'action' | 'data';

interface RoleUIConfig {
  focus: RoleFocus;
  primaryColor: string;
  accentColor: string;
  priorityFeatures: string[];
  dashboardLayout: 'card-grid' | 'action-focused' | 'data-dense' | 'progress-timeline';
  showMetrics: boolean;
  showCharts: boolean;
  showQuickActions: boolean;
  showAlerts: boolean;
  showFinance: boolean;
  showProgress: boolean;
}

const roleConfigs: Record<string, RoleUIConfig> = {
  PARENT: {
    focus: 'finance-alerts',
    primaryColor: 'primary-600',
    accentColor: 'blue-600',
    priorityFeatures: ['fees', 'alerts', 'attendance', 'homework'],
    dashboardLayout: 'card-grid',
    showMetrics: true,
    showCharts: false,
    showQuickActions: true,
    showAlerts: true,
    showFinance: true,
    showProgress: false,
  },
  TEACHER: {
    focus: 'action',
    primaryColor: 'green-600',
    accentColor: 'green-500',
    priorityFeatures: ['attendance', 'homework', 'marks', 'classes'],
    dashboardLayout: 'action-focused',
    showMetrics: true,
    showCharts: false,
    showQuickActions: true,
    showAlerts: false,
    showFinance: false,
    showProgress: false,
  },
  SUPER_ADMIN: {
    focus: 'data',
    primaryColor: 'purple-600',
    accentColor: 'purple-500',
    priorityFeatures: ['analytics', 'reports', 'users', 'settings'],
    dashboardLayout: 'data-dense',
    showMetrics: true,
    showCharts: true,
    showQuickActions: true,
    showAlerts: true,
    showFinance: true,
    showProgress: false,
  },
  SCHOOL_ADMIN: {
    focus: 'data',
    primaryColor: 'purple-600',
    accentColor: 'purple-500',
    priorityFeatures: ['analytics', 'reports', 'students', 'teachers'],
    dashboardLayout: 'data-dense',
    showMetrics: true,
    showCharts: true,
    showQuickActions: true,
    showAlerts: true,
    showFinance: true,
    showProgress: false,
  },
  SUB_ADMIN: {
    focus: 'data',
    primaryColor: 'blue-600',
    accentColor: 'blue-500',
    priorityFeatures: ['academics', 'exams', 'attendance', 'fees', 'staff', 'transport'],
    dashboardLayout: 'data-dense',
    showMetrics: true,
    showCharts: true,
    showQuickActions: true,
    showAlerts: false,
    showFinance: true,
    showProgress: false,
  },
  DRIVER: {
    focus: 'action',
    primaryColor: 'emerald-600',
    accentColor: 'emerald-500',
    priorityFeatures: ['trip', 'gps', 'route'],
    dashboardLayout: 'action-focused',
    showMetrics: false,
    showCharts: false,
    showQuickActions: true,
    showAlerts: false,
    showFinance: false,
    showProgress: false,
  },
};

export function useRoleUI() {
  const { user } = useAuthStore();
  const role = (user?.role || 'PARENT') as UserRole;

  const config = roleConfigs[role] || roleConfigs.PARENT;

  const isParent = role === 'PARENT';
  const isTeacher = role === 'TEACHER';
  const isDriver = role === 'DRIVER';
  const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUB_ADMIN'].includes(role);
  
  return {
    role,
    config,
    isParent,
    isTeacher,
    isDriver,
    isAdmin,
    // Quick access to config properties
    focus: config.focus,
    primaryColor: config.primaryColor,
    accentColor: config.accentColor,
    priorityFeatures: config.priorityFeatures,
    dashboardLayout: config.dashboardLayout,
    showMetrics: config.showMetrics,
    showCharts: config.showCharts,
    showQuickActions: config.showQuickActions,
    showAlerts: config.showAlerts,
    showFinance: config.showFinance,
    showProgress: config.showProgress,
  };
}

