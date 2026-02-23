import { Response, NextFunction } from 'express';
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

    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        students: {
          include: {
            student: {
              include: {
                class: true,
                studentTransport: {
                  include: {
                    route: { include: { bus: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent || !parent.students.length) {
      throw new AppError('No children found', 404);
    }

    const children = parent.students.map((ps) => ps.student);
    const result = children.map((student) => {
      const transport = Array.isArray(student.studentTransport)
        ? student.studentTransport[0]
        : student.studentTransport;
      if (!transport || transport.transportMode === 'PARENT_PICKUP') {
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          transportMode: 'PARENT_PICKUP',
          status: 'PARENT_PICKUP',
          message: 'Parent pick up – not using school bus',
        };
      }
      const route = transport.route;
      if (!route) {
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          transportMode: 'BUS',
          status: 'PARENT_PICKUP',
          message: 'Route or bus not configured',
        };
      }
      const bus = route.bus;
      const pickup = transport.pickupPoint ?? route.pickupPoint;
      const drop = transport.dropPoint ?? route.dropPoint;
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        transportMode: 'BUS',
        status: 'ON_ROUTE',
        estimatedArrival: '—',
        route: {
          id: route.id,
          number: route.routeNumber,
          pickupPoint: pickup,
          dropPoint: drop,
        },
        driver: bus
          ? { name: bus.driverName, phone: bus.driverPhone ?? undefined }
          : undefined,
      };
    });

    res.json({ children: result });
  } catch (error) {
    next(error);
  }
};
