import { prisma } from '../lib/prisma.js';
import { UserRole } from '@prisma/client';

/** Permission keys used for tag-based and role-based access (STEP 5). */
export const PERMISSION_KEYS = [
  // ACADEMIC
  'manageAcademic',
  'createExam',
  'enterMarks',
  'viewResults',
  // FINANCE
  'manageFees',
  'manageFinance', // backward compat
  'viewReports',
  // HR
  'manageTeachers',
  'manageStaff',
  'manageHR', // backward compat
  // TRANSPORT
  'manageTransport',
  'viewBusTracking',
  // HOD
  'hodViewSubmissions',
  'hodEnterExamMarks',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/** User with optional userTags (from DB include) for permission resolution */
export interface UserWithTags {
  role: UserRole;
  userTags?: { tag: { slug: string; permissions: unknown } }[];
}

/**
 * Resolve permission keys for a user from role + tags.
 * SUPER_ADMIN/SCHOOL_ADMIN get all; SUB_ADMIN from tags only; TEACHER gets enterMarks + tag permissions (e.g. HOD).
 */
export function getUserPermissions(user: UserWithTags): string[] {
  const set = new Set<string>();
  if (user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN') {
    PERMISSION_KEYS.forEach((p) => set.add(p));
    return Array.from(set);
  }
  if (user.role === 'SUB_ADMIN' && user.userTags) {
    for (const ut of user.userTags) {
      const perms = ut.tag.permissions as string[] | undefined;
      if (Array.isArray(perms)) perms.forEach((p) => set.add(p));
    }
  }
  if (user.role === 'TEACHER') {
    set.add('enterMarks'); // base permission for all teachers
    if (user.userTags) {
      for (const ut of user.userTags) {
        const perms = ut.tag.permissions as string[] | undefined;
        if (Array.isArray(perms)) perms.forEach((p) => set.add(p));
      }
    }
  }
  if (user.role === 'DRIVER') {
    set.add('viewBusTracking');
  }
  return Array.from(set);
}

/**
 * Check if a teacher has access to a specific class
 */
export async function canTeacherAccessClass(
  teacherId: string,
  classId: string
): Promise<boolean> {
  const classSubject = await prisma.classSubject.findFirst({
    where: {
      classId,
      teacherId,
    },
  });
  return !!classSubject;
}

/**
 * Check if a teacher has access to a specific subject
 */
export async function canTeacherAccessSubject(
  teacherId: string,
  subjectId: string
): Promise<boolean> {
  const classSubject = await prisma.classSubject.findFirst({
    where: {
      subjectId,
      teacherId,
    },
  });
  return !!classSubject;
}

/**
 * Get all class IDs that a teacher has access to
 */
export async function getTeacherAccessibleClasses(teacherId: string): Promise<string[]> {
  const classSubjects = await prisma.classSubject.findMany({
    where: { teacherId },
    select: { classId: true },
    distinct: ['classId'],
  });
  return classSubjects.map((cs) => cs.classId);
}

/**
 * Get all subject IDs that a teacher has access to
 */
export async function getTeacherAccessibleSubjects(teacherId: string): Promise<string[]> {
  const classSubjects = await prisma.classSubject.findMany({
    where: { teacherId },
    select: { subjectId: true },
    distinct: ['subjectId'],
  });
  return classSubjects.map((cs) => cs.subjectId);
}

/**
 * Check if a parent has access to a specific student
 */
export async function canParentAccessStudent(
  parentId: string,
  studentId: string
): Promise<boolean> {
  const parentStudent = await prisma.parentStudent.findUnique({
    where: {
      parentId_studentId: {
        parentId,
        studentId,
      },
    },
  });
  return !!parentStudent;
}

/**
 * Get all student IDs that a parent has access to
 */
export async function getParentAccessibleStudents(parentId: string): Promise<string[]> {
  const parentStudents = await prisma.parentStudent.findMany({
    where: { parentId },
    select: { studentId: true },
  });
  return parentStudents.map((ps) => ps.studentId);
}

/**
 * Get all class IDs that a parent has access to (through their children)
 */
export async function getParentAccessibleClasses(parentId: string): Promise<string[]> {
  const parentStudents = await prisma.parentStudent.findMany({
    where: { parentId },
    include: {
      student: {
        select: { classId: true },
      },
    },
  });
  const classIds = parentStudents
    .map((ps) => ps.student.classId)
    .filter((id): id is string => !!id);
  return [...new Set(classIds)]; // Remove duplicates
}

/**
 * Check if user has admin-level permissions (SUPER_ADMIN, SCHOOL_ADMIN, or SUB_ADMIN)
 */
export function isAdminRole(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUB_ADMIN'].includes(role);
}

/**
 * Check if user can manage academic operations (role or permission)
 */
export function canManageAcademic(role: UserRole, permissions: string[] = []): boolean {
  if (role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') return true;
  return role === 'SUB_ADMIN' && permissions.includes('manageAcademic');
}

/**
 * Check if user can manage financial operations (manageFees or legacy manageFinance)
 */
export function canManageFinance(role: UserRole, permissions: string[] = []): boolean {
  if (role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') return true;
  return role === 'SUB_ADMIN' && (permissions.includes('manageFees') || permissions.includes('manageFinance'));
}

/**
 * Check if user can manage staff/HR operations
 */
export function canManageHR(role: UserRole, permissions: string[] = []): boolean {
  if (role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') return true;
  return role === 'SUB_ADMIN' && permissions.includes('manageHR');
}

/**
 * Check if user can manage transport (role or permission)
 */
export function canManageTransport(role: UserRole, permissions: string[] = []): boolean {
  if (role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') return true;
  return role === 'SUB_ADMIN' && permissions.includes('manageTransport');
}

/**
 * Check if user can create homework (only TEACHER)
 */
export function canCreateHomework(role: UserRole): boolean {
  return role === 'TEACHER';
}

/**
 * Check if user can mark attendance (only TEACHER)
 */
export function canMarkAttendance(role: UserRole): boolean {
  return role === 'TEACHER';
}

/**
 * Check if user can create exams
 */
export function canCreateExams(role: UserRole, permissions: string[] = []): boolean {
  if (role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') return true;
  return role === 'SUB_ADMIN' && permissions.includes('manageAcademic');
}

/**
 * Check if user can enter exam marks (TEACHER has enterMarks by default; HOD has hodEnterExamMarks)
 */
export function canEnterExamMarks(role: UserRole, permissions: string[] = []): boolean {
  if (role === 'TEACHER') return permissions.includes('enterMarks') || permissions.includes('hodEnterExamMarks');
  if (role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') return true;
  return role === 'SUB_ADMIN' && permissions.includes('manageAcademic');
}

/**
 * Check if user has HOD-level view (e.g. homework submissions across section)
 */
export function canHODViewSubmissions(role: UserRole, permissions: string[] = []): boolean {
  if (role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') return true;
  if (role === 'SUB_ADMIN' && permissions.includes('manageAcademic')) return true;
  return role === 'TEACHER' && permissions.includes('hodViewSubmissions');
}

