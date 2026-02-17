import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { getTeacherAccessibleClasses } from '../utils/permissions.js';

const createTeacherSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  employeeId: z.string(),
  dateOfBirth: z.string().transform((str) => (str ? new Date(str) : null)).optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  qualification: z.string().optional(),
  experience: z.number().optional(),
  photo: z.string().optional(),
  address: z.string().optional(),
  userId: z.string().optional(),
});

export const createTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createTeacherSchema.parse(req.body);
    const schoolId = (req as any).schoolId || req.body.schoolId;

    // Check if employeeId exists
    const existing = await prisma.teacher.findUnique({
      where: { employeeId: data.employeeId },
    });

    if (existing) {
      throw new AppError('Employee ID already exists', 400);
    }

    const teacher = await prisma.teacher.create({
      data: {
        ...data,
        schoolId,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        school: true,
      },
    });

    res.status(201).json(teacher);
  } catch (error) {
    next(error);
  }
};

export const getTeachers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { search, isActive, page = '1', limit = '50' } = req.query;

    const where: any = { schoolId };

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { employeeId: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const MAX_LIST_LIMIT = 600; // safe cap for 5k-student schools
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, MAX_LIST_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.teacher.count({ where }),
    ]);

    res.json({
      teachers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        school: true,
      },
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    res.json(teacher);
  } catch (error) {
    next(error);
  }
};

export const updateTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = createTeacherSchema.partial().parse(req.body);

    const teacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    await prisma.teacher.delete({
      where: { id },
    });

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getTeacherDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const schoolId = req.user!.schoolId;

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    // Get accessible classes
    const accessibleClassIds = await getTeacherAccessibleClasses(teacher.id);
    
    const classes = await prisma.class.findMany({
      where: {
        id: { in: accessibleClassIds },
        schoolId,
      },
      include: {
        students: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
        { section: 'asc' },
      ],
    });

    // Get today's classes from timetable
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const todaysTimetable = await prisma.timetable.findMany({
      where: {
        teacherId: teacher.id,
        dayOfWeek,
        schoolId,
      },
      include: {
        class: true,
        subject: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Get current time to determine which classes are upcoming
    const currentTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
    
    const todaysClasses = todaysTimetable.map((tt) => {
      const isUpcoming = tt.startTime >= currentTime;
      const isOngoing = tt.startTime <= currentTime && tt.endTime >= currentTime;
      
      return {
        id: tt.id,
        class: {
          id: tt.class.id,
          name: tt.class.name,
          section: tt.class.section,
        },
        subject: {
          id: tt.subject.id,
          name: tt.subject.name,
        },
        startTime: tt.startTime,
        endTime: tt.endTime,
        room: tt.room,
        status: isOngoing ? 'ongoing' : isUpcoming ? 'upcoming' : 'completed',
      };
    });

    // Get pending homework count
    const pendingHomeworkCount = await prisma.homework.count({
      where: {
        teacherId: teacher.id,
        status: 'ACTIVE',
        dueDate: {
          gte: new Date(),
        },
      },
    });

    // Get today's attendance status (if marked)
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        classId: { in: accessibleClassIds },
        date: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
      select: {
        classId: true,
      },
      distinct: ['classId'],
    });

    const classesWithAttendance = todayAttendance.map((att) => att.classId);

    res.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        employeeId: teacher.employeeId,
      },
      classes: classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        section: cls.section,
        studentCount: cls._count.students,
      })),
      todaysClasses,
      stats: {
        totalClasses: classes.length,
        todaysClassesCount: todaysClasses.length,
        pendingHomework: pendingHomeworkCount,
        attendanceMarked: classesWithAttendance.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
