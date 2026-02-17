import { useAuthStore } from '../store/authStore';

type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'ACADEMIC_ADMIN'
  | 'FINANCE_ADMIN'
  | 'HR_ADMIN'
  | 'HOD'
  | 'TEACHER'
  | 'PARENT'
  | 'STUDENT';

export function usePermissions() {
  const { user } = useAuthStore();
  const role = (user?.role || '') as UserRole;

  const isAdminRole = (): boolean => {
    return [
      'SUPER_ADMIN',
      'SCHOOL_ADMIN',
      'ACADEMIC_ADMIN',
      'FINANCE_ADMIN',
      'HR_ADMIN',
    ].includes(role);
  };

  const canManageAcademic = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'].includes(role);
  };

  const canManageFinance = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE_ADMIN'].includes(role);
  };

  const canManageHR = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'].includes(role);
  };

  const canCreateHomework = (): boolean => {
    return role === 'TEACHER';
  };

  const canMarkAttendance = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'TEACHER'].includes(role);
  };

  const canCreateExams = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'].includes(role);
  };

  const canEnterExamMarks = (): boolean => {
    return [
      'SUPER_ADMIN',
      'SCHOOL_ADMIN',
      'ACADEMIC_ADMIN',
      'HOD',
      'TEACHER',
    ].includes(role);
  };

  const canManageStudents = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'].includes(role);
  };

  const canManageTeachers = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'].includes(role);
  };

  const canManageFees = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE_ADMIN'].includes(role);
  };

  const canManageHolidays = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(role);
  };

  const canManageTimetable = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'].includes(role);
  };

  const canManageAcademicSetup = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'].includes(role);
  };

  const canCreateAnnouncements = (): boolean => {
    return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(role);
  };

  const isReadOnly = (): boolean => {
    return ['PARENT', 'STUDENT'].includes(role);
  };

  return {
    role,
    isAdminRole,
    canManageAcademic,
    canManageFinance,
    canManageHR,
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
    isReadOnly,
  };
}





