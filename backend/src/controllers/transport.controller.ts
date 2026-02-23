import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const transportRoles = ['TRANSPORT_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'];

function getSchoolId(req: AuthRequest): string {
  const schoolId = req.user!.schoolId;
  if (!schoolId) throw new AppError('School context required', 403);
  return schoolId;
}

// --- Buses ---
const createBusSchema = z.object({
  busNumber: z.string().min(1),
  driverName: z.string().min(1),
  driverPhone: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const listBuses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const buses = await prisma.bus.findMany({
      where: { schoolId },
      orderBy: { busNumber: 'asc' },
    });
    res.json(buses);
  } catch (error) {
    next(error);
  }
};

export const createBus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const data = createBusSchema.parse(req.body);
    const existing = await prisma.bus.findUnique({
      where: { schoolId_busNumber: { schoolId, busNumber: data.busNumber } },
    });
    if (existing) throw new AppError('Bus number already exists for this school', 400);
    const bus = await prisma.bus.create({
      data: { ...data, schoolId },
    });
    res.status(201).json(bus);
  } catch (error) {
    next(error);
  }
};

export const updateBus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const data = createBusSchema.partial().parse(req.body);
    const bus = await prisma.bus.findFirst({ where: { id, schoolId } });
    if (!bus) throw new AppError('Bus not found', 404);
    if (data.busNumber && data.busNumber !== bus.busNumber) {
      const existing = await prisma.bus.findUnique({
        where: { schoolId_busNumber: { schoolId, busNumber: data.busNumber } },
      });
      if (existing) throw new AppError('Bus number already exists for this school', 400);
    }
    const updated = await prisma.bus.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteBus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const bus = await prisma.bus.findFirst({ where: { id, schoolId } });
    if (!bus) throw new AppError('Bus not found', 404);
    await prisma.bus.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// --- Routes ---
const createRouteSchema = z.object({
  routeNumber: z.string().min(1),
  busId: z.string().optional().nullable(),
  pickupPoint: z.string().min(1),
  dropPoint: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const listRoutes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const routes = await prisma.route.findMany({
      where: { schoolId },
      include: { bus: true },
      orderBy: { routeNumber: 'asc' },
    });
    res.json(routes);
  } catch (error) {
    next(error);
  }
};

export const createRoute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const data = createRouteSchema.parse(req.body);
    if (data.busId) {
      const bus = await prisma.bus.findFirst({ where: { id: data.busId, schoolId } });
      if (!bus) throw new AppError('Bus not found', 400);
    }
    const route = await prisma.route.create({
      data: {
        schoolId,
        routeNumber: data.routeNumber,
        busId: data.busId || undefined,
        pickupPoint: data.pickupPoint,
        dropPoint: data.dropPoint,
        isActive: data.isActive ?? true,
      },
      include: { bus: true },
    });
    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
};

export const updateRoute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const data = createRouteSchema.partial().parse(req.body);
    const route = await prisma.route.findFirst({ where: { id, schoolId } });
    if (!route) throw new AppError('Route not found', 404);
    if (data.busId !== undefined && data.busId) {
      const bus = await prisma.bus.findFirst({ where: { id: data.busId, schoolId } });
      if (!bus) throw new AppError('Bus not found', 400);
    }
    const updated = await prisma.route.update({
      where: { id },
      data: {
        ...data,
        busId: data.busId === null ? null : data.busId,
      },
      include: { bus: true },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteRoute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const route = await prisma.route.findFirst({ where: { id, schoolId } });
    if (!route) throw new AppError('Route not found', 404);
    await prisma.route.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// --- Student transport (assignments) ---
const createAssignmentSchema = z.object({
  studentId: z.string(),
  transportMode: z.enum(['BUS', 'PARENT_PICKUP']),
  routeId: z.string().optional().nullable(),
  pickupPoint: z.string().optional(),
  dropPoint: z.string().optional(),
});

export const listAssignments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { routeId } = req.query;
    const students = await prisma.student.findMany({
      where: { schoolId },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);
    const where: { studentId: { in: string[] }; routeId?: string | null } = {
      studentId: { in: studentIds },
    };
    if (routeId && routeId !== '') {
      const route = await prisma.route.findFirst({ where: { id: routeId as string, schoolId } });
      if (route) where.routeId = route.id;
    }
    const assignments = await prisma.studentTransport.findMany({
      where,
      include: {
        student: { include: { class: true } },
        route: { include: { bus: true } },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};

export const createAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const data = createAssignmentSchema.parse(req.body);
    const student = await prisma.student.findFirst({ where: { id: data.studentId, schoolId } });
    if (!student) throw new AppError('Student not found', 400);
    if (data.transportMode === 'BUS') {
      if (!data.routeId) throw new AppError('routeId required when transportMode is BUS', 400);
      const route = await prisma.route.findFirst({ where: { id: data.routeId, schoolId } });
      if (!route) throw new AppError('Route not found', 400);
    }
    const existing = await prisma.studentTransport.findUnique({
      where: { studentId: data.studentId },
    });
    if (existing) throw new AppError('Student already has a transport assignment; update or delete it first', 400);
    const assignment = await prisma.studentTransport.create({
      data: {
        studentId: data.studentId,
        transportMode: data.transportMode as 'BUS' | 'PARENT_PICKUP',
        routeId: data.transportMode === 'BUS' ? data.routeId! : null,
        pickupPoint: data.pickupPoint,
        dropPoint: data.dropPoint,
      },
      include: {
        student: { include: { class: true } },
        route: { include: { bus: true } },
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const data = createAssignmentSchema.partial().parse(req.body);
    const assignment = await prisma.studentTransport.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!assignment || assignment.student.schoolId !== schoolId) throw new AppError('Assignment not found', 404);
    const transportMode = (data.transportMode ?? assignment.transportMode) as 'BUS' | 'PARENT_PICKUP';
    const routeId = data.routeId !== undefined ? data.routeId : assignment.routeId;
    if (transportMode === 'BUS' && !routeId) throw new AppError('routeId required when transportMode is BUS', 400);
    if (routeId) {
      const route = await prisma.route.findFirst({ where: { id: routeId, schoolId } });
      if (!route) throw new AppError('Route not found', 400);
    }
    const updated = await prisma.studentTransport.update({
      where: { id },
      data: {
        transportMode,
        routeId: transportMode === 'BUS' ? routeId : null,
        pickupPoint: data.pickupPoint !== undefined ? data.pickupPoint : assignment.pickupPoint,
        dropPoint: data.dropPoint !== undefined ? data.dropPoint : assignment.dropPoint,
      },
      include: {
        student: { include: { class: true } },
        route: { include: { bus: true } },
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const assignment = await prisma.studentTransport.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!assignment || assignment.student.schoolId !== schoolId) throw new AppError('Assignment not found', 404);
    await prisma.studentTransport.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
