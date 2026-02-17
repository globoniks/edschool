import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getBusTracking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const schoolId = req.user!.schoolId;

    // Get parent's children
    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        students: {
          include: {
            student: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    if (!parent || !parent.students.length) {
      throw new AppError('No children found', 404);
    }

    // For now, return mock data structure
    // TODO: Implement actual bus tracking when schema is updated
    res.json({
      status: 'ON_ROUTE',
      estimatedArrival: '15 minutes',
      route: {
        number: 'BUS-001',
        pickupPoint: 'Main Gate',
        dropPoint: 'School Gate',
      },
      driver: {
        name: 'John Doe',
        phone: '+1234567890',
      },
    });
  } catch (error) {
    next(error);
  }
};

