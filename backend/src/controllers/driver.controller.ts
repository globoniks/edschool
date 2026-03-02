import { Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

function getSchoolId(req: AuthRequest): string {
  const schoolId = req.user!.schoolId;
  if (!schoolId) throw new AppError('School context required', 403);
  return schoolId;
}

const createDriverSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  photo: z.string().optional(),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseType: z.string().min(1, 'License type is required'),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
  experience: z.number().int().min(0).optional(),
  previousEmployer: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  salary: z.number().min(0).optional(),
  joiningDate: z.string().optional(),
  createLogin: z.boolean().optional().default(true),
  password: z.string().min(6).optional(),
});

export const listDrivers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);

    const drivers = await prisma.driver.findMany({
      where: { schoolId },
      include: {
        user: {
          select: { id: true, email: true, isActive: true, lastLogin: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const driverIds = drivers
      .filter((d) => d.userId)
      .map((d) => d.userId!);

    const busAssignments = driverIds.length
      ? await prisma.bus.findMany({
          where: { driverId: { in: driverIds }, schoolId },
          select: { id: true, busNumber: true, driverId: true },
        })
      : [];

    const busMap = new Map<string, { id: string; busNumber: string }[]>();
    for (const bus of busAssignments) {
      if (!bus.driverId) continue;
      const list = busMap.get(bus.driverId) ?? [];
      list.push({ id: bus.id, busNumber: bus.busNumber });
      busMap.set(bus.driverId, list);
    }

    const result = drivers.map((d) => ({
      ...d,
      assignedBuses: d.userId ? busMap.get(d.userId) ?? [] : [],
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    const driver = await prisma.driver.findFirst({
      where: { id, schoolId },
      include: {
        user: {
          select: { id: true, email: true, isActive: true, lastLogin: true },
        },
      },
    });

    if (!driver) throw new AppError('Driver not found', 404);

    const assignedBuses = driver.userId
      ? await prisma.bus.findMany({
          where: { driverId: driver.userId, schoolId },
          select: { id: true, busNumber: true },
        })
      : [];

    res.json({ ...driver, assignedBuses });
  } catch (error) {
    next(error);
  }
};

export const createDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const data = createDriverSchema.parse(req.body);

    const existingEmp = await prisma.driver.findUnique({
      where: { employeeId: data.employeeId },
    });
    if (existingEmp) throw new AppError('Employee ID already exists', 400);

    let userId: string | undefined;

    if (data.createLogin) {
      const loginEmail = data.email || `${data.employeeId.toLowerCase()}@driver.local`;
      const existing = await prisma.user.findUnique({ where: { email: loginEmail } });
      if (existing) throw new AppError(`Email ${loginEmail} already in use`, 400);

      const password = data.password || 'driver123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: loginEmail,
          password: hashedPassword,
          role: 'DRIVER',
          schoolId,
          isActive: true,
          profile: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone,
            },
          },
        },
      });
      userId = user.id;
    }

    const parseDate = (val: string, label: string): Date => {
      const d = new Date(val);
      if (isNaN(d.getTime()) || d.getFullYear() < 1900 || d.getFullYear() > 2100) {
        throw new AppError(`Invalid ${label} date: ${val}`, 400);
      }
      return d;
    };

    const driver = await prisma.driver.create({
      data: {
        schoolId,
        userId,
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || undefined,
        dateOfBirth: data.dateOfBirth ? parseDate(data.dateOfBirth, 'date of birth') : undefined,
        gender: data.gender || undefined,
        address: data.address || undefined,
        bloodGroup: data.bloodGroup || undefined,
        licenseNumber: data.licenseNumber,
        licenseType: data.licenseType,
        licenseExpiry: parseDate(data.licenseExpiry, 'license expiry'),
        experience: data.experience ?? 0,
        previousEmployer: data.previousEmployer || undefined,
        emergencyContactName: data.emergencyContactName || undefined,
        emergencyContactPhone: data.emergencyContactPhone || undefined,
        emergencyContactRelation: data.emergencyContactRelation || undefined,
        salary: data.salary ?? undefined,
        joiningDate: data.joiningDate ? parseDate(data.joiningDate, 'joining date') : new Date(),
        isActive: true,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    res.status(201).json(driver);
  } catch (error) {
    next(error);
  }
};

const updateDriverSchema = createDriverSchema.partial().omit({ createLogin: true, password: true });

export const updateDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const data = updateDriverSchema.parse(req.body);

    const existing = await prisma.driver.findFirst({ where: { id, schoolId } });
    if (!existing) throw new AppError('Driver not found', 404);

    if (data.employeeId && data.employeeId !== existing.employeeId) {
      const dup = await prisma.driver.findUnique({ where: { employeeId: data.employeeId } });
      if (dup) throw new AppError('Employee ID already exists', 400);
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...data,
        email: data.email || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    if (existing.userId) {
      await prisma.userProfile.updateMany({
        where: { userId: existing.userId },
        data: {
          ...(data.firstName ? { firstName: data.firstName } : {}),
          ...(data.lastName ? { lastName: data.lastName } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
        },
      });
    }

    res.json(driver);
  } catch (error) {
    next(error);
  }
};

export const deleteDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    const driver = await prisma.driver.findFirst({ where: { id, schoolId } });
    if (!driver) throw new AppError('Driver not found', 404);

    if (driver.userId) {
      await prisma.bus.updateMany({
        where: { driverId: driver.userId },
        data: { driverId: null },
      });
    }

    await prisma.driver.delete({ where: { id } });

    if (driver.userId) {
      await prisma.user.update({
        where: { id: driver.userId },
        data: { isActive: false },
      });
    }

    res.json({ message: 'Driver deleted' });
  } catch (error) {
    next(error);
  }
};

export const toggleDriverStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    const driver = await prisma.driver.findFirst({ where: { id, schoolId } });
    if (!driver) throw new AppError('Driver not found', 404);

    const updated = await prisma.driver.update({
      where: { id },
      data: { isActive: !driver.isActive },
    });

    if (driver.userId) {
      await prisma.user.update({
        where: { id: driver.userId },
        data: { isActive: !driver.isActive },
      });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
