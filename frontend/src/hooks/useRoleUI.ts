import { useAuthStore } from '../store/authStore';

/** Role values aligned with backend (do not import @prisma/client in frontend). */
export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'ACADEMIC_ADMIN'
  | 'FINANCE_ADMIN'
  | 'HR_ADMIN'
  | 'HOD'
  | 'TEACHER'
  | 'PARENT'
  | 'STUDENT';

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
  STUDENT: {
    focus: 'progress',
    primaryColor: 'orange-600',
    accentColor: 'orange-500',
    priorityFeatures: ['progress', 'grades', 'attendance', 'homework'],
    dashboardLayout: 'progress-timeline',
    showMetrics: true,
    showCharts: true,
    showQuickActions: false,
    showAlerts: false,
    showFinance: false,
    showProgress: true,
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
  ACADEMIC_ADMIN: {
    focus: 'data',
    primaryColor: 'blue-600',
    accentColor: 'blue-500',
    priorityFeatures: ['academics', 'exams', 'attendance', 'reports'],
    dashboardLayout: 'data-dense',
    showMetrics: true,
    showCharts: true,
    showQuickActions: true,
    showAlerts: false,
    showFinance: false,
    showProgress: false,
  },
  FINANCE_ADMIN: {
    focus: 'data',
    primaryColor: 'green-600',
    accentColor: 'green-500',
    priorityFeatures: ['fees', 'payments', 'reports', 'analytics'],
    dashboardLayout: 'data-dense',
    showMetrics: true,
    showCharts: true,
    showQuickActions: true,
    showAlerts: false,
    showFinance: true,
    showProgress: false,
  },
  HR_ADMIN: {
    focus: 'data',
    primaryColor: 'indigo-600',
    accentColor: 'indigo-500',
    priorityFeatures: ['staff', 'students', 'reports', 'attendance'],
    dashboardLayout: 'data-dense',
    showMetrics: true,
    showCharts: true,
    showQuickActions: true,
    showAlerts: false,
    showFinance: false,
    showProgress: false,
  },
  HOD: {
    focus: 'data',
    primaryColor: 'teal-600',
    accentColor: 'teal-500',
    priorityFeatures: ['academics', 'exams', 'attendance', 'reports'],
    dashboardLayout: 'data-dense',
    showMetrics: true,
    showCharts: true,
    showQuickActions: true,
    showAlerts: false,
    showFinance: false,
    showProgress: false,
  },
};

export function useRoleUI() {
  const { user } = useAuthStore();
  const role = (user?.role || 'STUDENT') as UserRole;
  
  const config = roleConfigs[role] || roleConfigs.STUDENT;
  
  const isParent = role === 'PARENT';
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isAdmin = [
    'SUPER_ADMIN',
    'SCHOOL_ADMIN',
    'ACADEMIC_ADMIN',
    'FINANCE_ADMIN',
    'HR_ADMIN',
  ].includes(role);
  
  return {
    role,
    config,
    isParent,
    isStudent,
    isTeacher,
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

