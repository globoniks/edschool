import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { canTeacherAccessClass, getTeacherAccessibleClasses, getParentAccessibleStudents } from '../utils/permissions.js';

const markAttendanceSchema = z.object({
  studentId: z.string(),
  classId: z.string(),
  date: z.string().transform((str) => new Date(str)),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  remarks: z.string().optional(),
});

const bulkAttendanceSchema = z.object({
  classId: z.string(),
  date: z.string().transform((str) => new Date(str)),
  attendances: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    remarks: z.string().optional(),
  })),
});

export const markAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = markAttendanceSchema.parse(req.body);
    const schoolId = req.user!.schoolId;
    const markedBy = req.user!.id;

    // Verify teacher has access to this class
    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (teacher) {
        const hasAccess = await canTeacherAccessClass(teacher.id, data.classId);
        if (!hasAccess) {
          throw new AppError('Teacher does not have access to this class', 403);
        }
      }
    }

    // Check if attendance already exists
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId: data.studentId,
          date: data.date,
        },
      },
    });

    if (existing) {
      // Update existing
      const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          ...data,
          markedBy,
        },
      });

      return res.json(attendance);
    }

    // Create new
    const attendance = await prisma.attendance.create({
      data: {
        ...data,
        schoolId,
        markedBy,
      },
      include: {
        student: true,
        class: true,
      },
    });

    res.status(201).json(attendance);
  } catch (error) {
    next(error);
  }
};

export const markBulkAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = bulkAttendanceSchema.parse(req.body);
    const schoolId = req.user!.schoolId;
    const markedBy = req.user!.id;

    const results = await Promise.all(
      data.attendances.map(async (att) => {
        const existing = await prisma.attendance.findUnique({
          where: {
            studentId_date: {
              studentId: att.studentId,
              date: data.date,
            },
          },
        });

        if (existing) {
          return prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: att.status,
              remarks: att.remarks,
              markedBy,
            },
          });
        }

        return prisma.attendance.create({
          data: {
            studentId: att.studentId,
            classId: data.classId,
            date: data.date,
            status: att.status,
            remarks: att.remarks,
            schoolId,
            markedBy,
          },
        });
      })
    );

    res.status(201).json({ attendances: results });
  } catch (error) {
    next(error);
  }
};

export const getAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, classId, startDate, endDate } = req.query;
    const schoolId = req.user!.schoolId;

    const where: any = { schoolId };

    // Students can only see their own attendance
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (!me) {
        throw new AppError('Student not found', 404);
      }
      where.studentId = me.id;
    }
    // Parents can only see their children's attendance
    else if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (parent) {
        const accessibleStudentIds = await getParentAccessibleStudents(parent.id);
        where.studentId = { in: accessibleStudentIds };
      } else {
        where.studentId = { in: [] }; // No access
      }
    } else if (studentId) {
      where.studentId = studentId as string;
    }

    if (classId) {
      where.classId = classId as string;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const MAX_ATTENDANCE_LIST = 5000;
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: true,
        class: true,
      },
      orderBy: { date: 'desc' },
      take: MAX_ATTENDANCE_LIST,
    });

    res.setHeader('X-List-Limit', MAX_ATTENDANCE_LIST.toString());
    if (attendances.length === MAX_ATTENDANCE_LIST) {
      const total = await prisma.attendance.count({ where });
      if (total > MAX_ATTENDANCE_LIST) {
        res.setHeader('X-List-Truncated', 'true');
        res.setHeader('X-Total-Count', total.toString());
      }
    }
    res.json(attendances);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, classId, month, year } = req.query;
    const schoolId = req.user!.schoolId;

    const startDate = new Date(
      Number(year) || new Date().getFullYear(),
      (Number(month) || new Date().getMonth() + 1) - 1,
      1
    );
    const endDate = new Date(
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
      0
    );

    const where: any = {
      schoolId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Students can only see their own stats
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (!me) {
        throw new AppError('Student not found', 404);
      }
      where.studentId = me.id;
    }
    // Parents can only see their children's stats
    else if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (parent) {
        const accessibleStudentIds = await getParentAccessibleStudents(parent.id);
        where.studentId = { in: accessibleStudentIds };
      } else {
        where.studentId = { in: [] }; // No access
      }
    } else if (studentId) {
      where.studentId = studentId as string;
    }

    if (classId) {
      where.classId = classId as string;
    }

    // Aggregate in DB for 5k scale (avoid loading all rows)
    const grouped = await prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const total = grouped.reduce((sum, g) => sum + g._count.status, 0);
    const present = grouped.find((g) => g.status === 'PRESENT')?._count.status ?? 0;
    const absent = grouped.find((g) => g.status === 'ABSENT')?._count.status ?? 0;
    const late = grouped.find((g) => g.status === 'LATE')?._count.status ?? 0;
    const excused = grouped.find((g) => g.status === 'EXCUSED')?._count.status ?? 0;
    const presentOrLate = present + late;

    const stats = {
      total,
      present,
      absent,
      late,
      excused,
      percentage: total > 0 ? ((presentOrLate / total) * 100).toFixed(2) : '0',
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const markTeacherAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teacherId, date, status, checkIn, checkOut, remarks } = req.body;
    const dateObj = new Date(date);

    const existing = await prisma.teacherAttendance.findUnique({
      where: {
        teacherId_date: {
          teacherId,
          date: dateObj,
        },
      },
    });

    if (existing) {
      const attendance = await prisma.teacherAttendance.update({
        where: { id: existing.id },
        data: {
          status,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          remarks,
        },
      });

      return res.json(attendance);
    }

    const attendance = await prisma.teacherAttendance.create({
      data: {
        teacherId,
        date: dateObj,
        status,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        remarks,
      },
      include: {
        teacher: true,
      },
    });

    res.status(201).json(attendance);
  } catch (error) {
    next(error);
  }
};

