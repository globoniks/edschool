import { prisma } from '../lib/prisma.js';
import { UserRole } from '@prisma/client';

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
 * Check if HOD has access to a specific subject/department
 */
export async function canHODAccessSubject(
  userId: string,
  subjectId: string
): Promise<boolean> {
  const hod = await prisma.hOD.findFirst({
    where: {
      userId,
      subjectId,
    },
  });
  return !!hod;
}

/**
 * Get all subject IDs that an HOD has access to
 */
export async function getHODAccessibleSubjects(userId: string): Promise<string[]> {
  const hods = await prisma.hOD.findMany({
    where: { userId },
    select: { subjectId: true },
  });
  return hods.map((hod) => hod.subjectId);
}

/**
 * Check if user has admin-level permissions
 */
export function isAdminRole(role: UserRole): boolean {
  return [
    'SUPER_ADMIN',
    'SCHOOL_ADMIN',
    'ACADEMIC_ADMIN',
    'FINANCE_ADMIN',
    'HR_ADMIN',
  ].includes(role);
}

/**
 * Check if user can manage academic operations
 */
export function canManageAcademic(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'].includes(role);
}

/**
 * Check if user can manage financial operations
 */
export function canManageFinance(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE_ADMIN'].includes(role);
}

/**
 * Check if user can manage staff/HR operations
 */
export function canManageHR(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'].includes(role);
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
export function canCreateExams(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'].includes(role);
}

/**
 * Check if user can enter exam marks
 */
export function canEnterExamMarks(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'HOD', 'TEACHER'].includes(role);
}

