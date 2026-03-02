import { useAuthStore } from '../store/authStore';

type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'SUB_ADMIN'
  | 'TEACHER'
  | 'PARENT';

export function usePermissions() {
  const { user } = useAuthStore();
  const role = (user?.role || '') as UserRole;
  const permissions: string[] = user?.permissions ?? [];
  const tags = user?.tags ?? [];

  const hasPermission = (key: string) =>
    role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN' || permissions.includes(key);

  const isAdminRole = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUB_ADMIN'].includes(role);
  };

  const canManageAcademic = (): boolean => {
    return hasPermission('manageAcademic');
  };

  const canManageFinance = (): boolean => {
    return hasPermission('manageFinance') || hasPermission('manageFees');
  };

  const canManageHR = (): boolean => {
    return hasPermission('manageHR') || hasPermission('manageTeachers') || hasPermission('manageStaff');
  };

  const canManageTransport = (): boolean => {
    return hasPermission('manageTransport');
  };

  const canCreateHomework = (): boolean => {
    return role === 'TEACHER';
  };

  const canMarkAttendance = (): boolean => {
    return role === 'TEACHER' || hasPermission('manageAcademic');
  };

  const canCreateExams = (): boolean => {
    return hasPermission('manageAcademic') || hasPermission('createExam');
  };

  const canEnterExamMarks = (): boolean => {
    return hasPermission('enterMarks') || hasPermission('hodEnterExamMarks') || hasPermission('manageAcademic');
  };

  const canManageStudents = (): boolean => {
    return hasPermission('manageHR');
  };

  const canManageTeachers = (): boolean => {
    return hasPermission('manageHR');
  };

  const canManageFees = (): boolean => {
    return hasPermission('manageFees') || hasPermission('manageFinance');
  };

  const canManageHolidays = (): boolean => {
    return role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN';
  };

  const canManageTimetable = (): boolean => {
    return hasPermission('manageAcademic');
  };

  const canManageAcademicSetup = (): boolean => {
    return hasPermission('manageAcademic');
  };

  const canCreateAnnouncements = (): boolean => {
    return role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN' || role === 'TEACHER';
  };

  const canViewHomeworkSubmissions = (): boolean => {
    return role === 'TEACHER' || hasPermission('hodViewSubmissions') || hasPermission('manageAcademic');
  };

  const isReadOnly = (): boolean => {
    return role === 'PARENT';
  };

  /** Permission-based visibility for sidebar (use instead of hardcoded role checks) */
  const canViewFees = (): boolean => canManageFees() || isReadOnly();
  const canViewExams = (): boolean => canCreateExams() || canEnterExamMarks() || isReadOnly();
  const canViewAttendance = (): boolean => canMarkAttendance() || canManageHR() || isReadOnly();
  const canViewTimetable = (): boolean => canManageTimetable() || role === 'TEACHER' || isReadOnly();
  const canViewHomework = (): boolean => canCreateHomework() || canViewHomeworkSubmissions() || isReadOnly();
  const canViewAnnouncements = (): boolean => canCreateAnnouncements() || isReadOnly();
  const canViewClassMoments = (): boolean => role === 'TEACHER' || isReadOnly();
  const canViewStudents = (): boolean => canManageStudents() || role === 'TEACHER';
  const showParentPortal = (): boolean => role === 'PARENT';
  const showDashboard = (): boolean => role !== 'PARENT';
  const showAcademicSetup = (): boolean => canManageAcademicSetup() || role === 'TEACHER';
  const showUsersAndPermissions = (): boolean => role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN';

  return {
    role,
    tags,
    permissions,
    isAdminRole,
    canManageAcademic,
    canManageFinance,
    canManageHR,
    canManageTransport,
    canCreateHomework,
    canMarkAttendance,
    canCreateExams,
    canEnterExamMarks,
    canManageStudents,
    canManageTeachers,
    canManageFees,
    canManageHolidays,
    canManageTimetable,
    canManageAcademicSetup,
    canCreateAnnouncements,
    canViewHomeworkSubmissions,
    isReadOnly,
    canViewFees,
    canViewExams,
    canViewAttendance,
    canViewTimetable,
    canViewHomework,
    canViewAnnouncements,
    canViewClassMoments,
    canViewStudents,
    showParentPortal,
    showDashboard,
    showAcademicSetup,
    showUsersAndPermissions,
  };
}
