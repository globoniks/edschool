import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createClassSchema = z.object({
  name: z.string(),
  section: z.string().optional(),
  academicYear: z.string(),
  capacity: z.number().positive().optional(),
});

const createSubjectSchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  description: z.string().optional(),
});

const assignClassSubjectSchema = z.object({
  classId: z.string(),
  subjectId: z.string(),
  teacherId: z.string().optional(),
});

const updateClassSchema = z.object({
  classTeacherId: z.string().nullable().optional(),
  responsibilities: z.array(z.string()).optional(),
});

export const createClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createClassSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const class_ = await prisma.class.create({
      data: {
        ...data,
        schoolId,
        capacity: data.capacity || 40,
      },
      include: {
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
      },
    });

    res.status(201).json(class_);
  } catch (error) {
    next(error);
  }
};

export const getClasses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { academicYear } = req.query;

    const where: any = { schoolId };

    if (academicYear) {
      where.academicYear = academicYear as string;
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
        classTeacher: {
          select: { id: true, firstName: true, lastName: true, email: true, employeeId: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(classes);
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createSubjectSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const subject = await prisma.subject.create({
      data: {
        ...data,
        schoolId,
      },
    });

    res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
};

export const getSubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;

    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });

    res.json(subjects);
  } catch (error) {
    next(error);
  }
};

export const assignClassSubject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = assignClassSubjectSchema.parse(req.body);

    const classSubject = await prisma.classSubject.upsert({
      where: {
        classId_subjectId: {
          classId: data.classId,
          subjectId: data.subjectId,
        },
      },
      update: {
        teacherId: data.teacherId,
      },
      create: data,
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    res.status(201).json(classSubject);
  } catch (error) {
    next(error);
  }
};

export const getClassSubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId } = req.params;

    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: true,
        teacher: true,
      },
    });

    res.json(classSubjects);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/academic/class-subjects - remove a subject from a class (body: classId, subjectId) */
export const removeClassSubject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = z.object({ classId: z.string(), subjectId: z.string() }).parse(req.body);
    const schoolId = req.user!.schoolId;

    const class_ = await prisma.class.findFirst({
      where: { id: body.classId, schoolId },
    });
    if (!class_) throw new AppError('Class not found', 404);

    await prisma.classSubject.deleteMany({
      where: {
        classId: body.classId,
        subjectId: body.subjectId,
      },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
export const getClassFull = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId } = req.params;
    const schoolId = req.user!.schoolId;

    const class_ = await prisma.class.findFirst({
      where: { id: classId, schoolId },
      include: {
        _count: { select: { students: true } },
        classTeacher: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true } },
        subjects: {
          include: {
            subject: true,
            teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
          },
        },
      },
    });

    if (!class_) throw new AppError('Class not found', 404);
    res.json(class_);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/academic/classes/:id - update class (e.g. class teacher, responsibilities) */
export const updateClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const body = updateClassSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const class_ = await prisma.class.findFirst({
      where: { id, schoolId },
    });
    if (!class_) throw new AppError('Class not found', 404);

    if (body.classTeacherId !== undefined) {
      if (body.classTeacherId) {
        const teacher = await prisma.teacher.findFirst({
          where: { id: body.classTeacherId, schoolId },
        });
        if (!teacher) throw new AppError('Teacher not found', 404);
      }
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        ...(body.classTeacherId !== undefined && { classTeacherId: body.classTeacherId }),
        ...(body.responsibilities !== undefined && { responsibilities: body.responsibilities }),
      },
      include: {
        _count: { select: { students: true, subjects: true } },
        classTeacher: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

