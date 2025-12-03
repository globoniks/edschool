import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createHolidaySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  type: z.enum(['HOLIDAY', 'EXAM_EVENT', 'OTHER']).optional(),
  isFullDay: z.boolean().optional(),
});

export const createHoliday = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createHolidaySchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const holiday = await prisma.holiday.create({
      data: {
        ...data,
        schoolId,
        type: data.type || 'HOLIDAY',
        isFullDay: data.isFullDay ?? true,
      },
    });

    res.status(201).json(holiday);
  } catch (error) {
    next(error);
  }
};

export const getHolidays = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { month, year, startDate, endDate, type } = req.query;

    const where: any = { schoolId };

    if (type) {
      where.type = type as string;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else if (month || year) {
      const y = Number(year) || new Date().getFullYear();
      const m = (Number(month) || new Date().getMonth() + 1) - 1;
      const rangeStart = new Date(y, m, 1);
      const rangeEnd = new Date(y, m + 1, 0);
      where.date = {
        gte: rangeStart,
        lte: rangeEnd,
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    res.json(holidays);
  } catch (error) {
    next(error);
  }
};

export const updateHoliday = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = createHolidaySchema.partial().parse(req.body);

    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }

    const updated = await prisma.holiday.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteHoliday = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }

    await prisma.holiday.delete({
      where: { id },
    });

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    next(error);
  }
};



