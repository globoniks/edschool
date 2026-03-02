import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const createLeaveSchema = z.object({
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  type: z.enum(['SICK', 'CASUAL', 'EARNED', 'UNPAID', 'OTHER']),
  reason: z.string().optional(),
});

const updateLeaveStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
});

/** GET /api/leave - list leave (teacher: own; admin/HR: all or by teacherId) */
export const listLeave = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { teacherId, status, startDate, endDate } = req.query;

    const where: any = { schoolId };

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (!teacher) return res.json([]);
      where.teacherId = teacher.id;
    } else if (teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: teacherId as string, schoolId },
      });
      if (!teacher) throw new AppError('Teacher not found', 404);
      where.teacherId = teacherId as string;
    }

    if (status) where.status = status;
    if (startDate && endDate) {
      where.OR = [
        { startDate: { gte: new Date(startDate as string) }, endDate: { lte: new Date(endDate as string) } },
        { startDate: { lte: new Date(endDate as string) }, endDate: { gte: new Date(startDate as string) } },
      ];
    }

    const list = await prisma.leave.findMany({
      where,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { startDate: 'desc' },
      take: 200,
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

/** POST /api/leave - apply for leave (teacher only) */
export const createLeave = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const data = createLeaveSchema.parse(req.body);

    const teacher = await prisma.teacher.findFirst({
      where: { userId: req.user!.id, schoolId },
    });
    if (!teacher) throw new AppError('Teacher profile not found', 404);

    if (data.endDate < data.startDate) {
      throw new AppError('End date must be on or after start date', 400);
    }

    const leave = await prisma.leave.create({
      data: {
        teacherId: teacher.id,
        schoolId,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        reason: data.reason,
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.status(201).json(leave);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/leave/:id - approve/reject (admin/HR only) */
export const updateLeaveStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const body = updateLeaveStatusSchema.parse(req.body);

    const leave = await prisma.leave.findFirst({
      where: { id, schoolId },
    });
    if (!leave) throw new AppError('Leave not found', 404);
    if (leave.status !== 'PENDING') throw new AppError('Leave has already been processed', 400);

    const updated = await prisma.leave.update({
      where: { id },
      data: {
        status: body.status,
        remarks: body.remarks,
        approvedById: req.user!.id,
        approvedAt: new Date(),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
