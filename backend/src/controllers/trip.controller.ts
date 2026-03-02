import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { getLiveLocation, getAllLiveLocations } from '../socket/busTracking.js';

const startTripSchema = z.object({
  busId: z.string(),
  routeId: z.string(),
});

export const startTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driverId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const data = startTripSchema.parse(req.body);

    const bus = await prisma.bus.findFirst({
      where: { id: data.busId, schoolId, driverId },
    });
    if (!bus) throw new AppError('Bus not found or not assigned to you', 404);

    const route = await prisma.route.findFirst({
      where: { id: data.routeId, schoolId, busId: data.busId },
    });
    if (!route) throw new AppError('Route not found for this bus', 404);

    const activeTrip = await prisma.trip.findFirst({
      where: { driverId, status: 'IN_PROGRESS' },
    });
    if (activeTrip) throw new AppError('You already have an active trip. End it first.', 400);

    const trip = await prisma.trip.create({
      data: {
        schoolId,
        busId: data.busId,
        routeId: data.routeId,
        driverId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        bus: true,
        route: { include: { stops: { orderBy: { orderIndex: 'asc' } } } },
      },
    });

    res.status(201).json(trip);
  } catch (error) {
    next(error);
  }
};

export const endTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driverId = req.user!.id;
    const { id } = req.params;

    const trip = await prisma.trip.findFirst({
      where: { id, driverId, status: 'IN_PROGRESS' },
    });
    if (!trip) throw new AppError('Active trip not found', 404);

    const updated = await prisma.trip.update({
      where: { id },
      data: { status: 'COMPLETED', endedAt: new Date() },
      include: { bus: true, route: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getActiveTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driverId = req.user!.id;

    const trip = await prisma.trip.findFirst({
      where: { driverId, status: 'IN_PROGRESS' },
      include: {
        bus: true,
        route: { include: { stops: { orderBy: { orderIndex: 'asc' } } } },
      },
    });

    res.json(trip);
  } catch (error) {
    next(error);
  }
};

export const getDriverBuses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driverId = req.user!.id;
    const schoolId = req.user!.schoolId;

    const buses = await prisma.bus.findMany({
      where: { driverId, schoolId, isActive: true },
      include: {
        routes: {
          where: { isActive: true },
          include: { stops: { orderBy: { orderIndex: 'asc' } } },
        },
      },
    });

    res.json(buses);
  } catch (error) {
    next(error);
  }
};

export const getTripHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driverId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const trips = await prisma.trip.findMany({
      where: { driverId },
      include: { bus: true, route: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json(trips);
  } catch (error) {
    next(error);
  }
};

export const getLiveBusLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { busId } = req.params;
    const loc = getLiveLocation(busId);

    if (!loc) {
      res.json({ online: false, busId });
      return;
    }

    res.json({ online: true, ...loc });
  } catch (error) {
    next(error);
  }
};

export const getAllLiveBuses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const locations = getAllLiveLocations(schoolId);

    const busIds = locations.map((l) => l.busId);
    const buses = busIds.length
      ? await prisma.bus.findMany({
          where: { id: { in: busIds } },
          select: { id: true, busNumber: true, driverName: true },
        })
      : [];

    const busMap = new Map(buses.map((b) => [b.id, b]));
    const result = locations.map((loc) => ({
      ...loc,
      busNumber: busMap.get(loc.busId)?.busNumber ?? '',
      driverName: busMap.get(loc.busId)?.driverName ?? '',
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getStudentsOnBus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { busId } = req.params;

    const bus = await prisma.bus.findFirst({ where: { id: busId, schoolId } });
    if (!bus) throw new AppError('Bus not found', 404);

    const routes = await prisma.route.findMany({
      where: { busId, schoolId },
      select: { id: true },
    });
    const routeIds = routes.map((r) => r.id);

    const assignments = await prisma.studentTransport.findMany({
      where: { routeId: { in: routeIds }, transportMode: 'BUS' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            photo: true,
            class: { select: { name: true, section: true } },
            parents: {
              select: {
                parent: {
                  select: { firstName: true, lastName: true, phone: true },
                },
              },
            },
          },
        },
        route: { select: { routeNumber: true } },
      },
    });

    const students = assignments.map((a) => ({
      ...a.student,
      routeNumber: a.route?.routeNumber,
      pickupPoint: a.pickupPoint,
      dropPoint: a.dropPoint,
    }));

    res.json({ busNumber: bus.busNumber, students });
  } catch (error) {
    next(error);
  }
};

export const addBusStops = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { routeId } = req.params;

    const route = await prisma.route.findFirst({ where: { id: routeId, schoolId } });
    if (!route) throw new AppError('Route not found', 404);

    const stopsSchema = z.array(
      z.object({
        name: z.string().min(1),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        orderIndex: z.number().int().min(0),
      }),
    );

    const stops = stopsSchema.parse(req.body);

    await prisma.busStop.deleteMany({ where: { routeId } });

    const created = await prisma.busStop.createMany({
      data: stops.map((s) => ({ ...s, routeId })),
    });

    const result = await prisma.busStop.findMany({
      where: { routeId },
      orderBy: { orderIndex: 'asc' },
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getRouteStops = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { routeId } = req.params;
    const stops = await prisma.busStop.findMany({
      where: { routeId },
      orderBy: { orderIndex: 'asc' },
    });
    res.json(stops);
  } catch (error) {
    next(error);
  }
};

export const assignDriverToBus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { busId } = req.params;
    const { driverId } = req.body;

    const bus = await prisma.bus.findFirst({ where: { id: busId, schoolId } });
    if (!bus) throw new AppError('Bus not found', 404);

    if (driverId) {
      const driver = await prisma.user.findFirst({
        where: { id: driverId, schoolId, role: 'DRIVER', isActive: true },
        include: { profile: true },
      });
      if (!driver) throw new AppError('Driver not found or inactive', 404);

      const updated = await prisma.bus.update({
        where: { id: busId },
        data: {
          driverId,
          driverName: driver.profile
            ? `${driver.profile.firstName} ${driver.profile.lastName}`
            : driver.email,
          driverPhone: driver.profile?.phone ?? bus.driverPhone,
        },
        include: { driver: { include: { profile: true } } },
      });
      res.json(updated);
    } else {
      const updated = await prisma.bus.update({
        where: { id: busId },
        data: { driverId: null },
      });
      res.json(updated);
    }
  } catch (error) {
    next(error);
  }
};

export const getETA = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { busId } = req.params;
    const loc = getLiveLocation(busId);

    if (!loc) {
      res.json({ online: false, busId, stops: [] });
      return;
    }

    const trip = await prisma.trip.findFirst({
      where: { id: loc.tripId },
      select: {
        route: {
          select: {
            stops: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    if (!trip?.route?.stops?.length) {
      res.json({ online: true, busId, stops: [] });
      return;
    }

    const speed = loc.speed && loc.speed > 0 ? loc.speed : 30;

    const stops = trip.route.stops.map((stop) => {
      const dist = haversineDistance(loc.latitude, loc.longitude, stop.latitude, stop.longitude);
      const etaMinutes = Math.round((dist / speed) * 60);
      return {
        id: stop.id,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        distanceKm: Math.round(dist * 100) / 100,
        etaMinutes,
      };
    });

    res.json({ online: true, busId, latitude: loc.latitude, longitude: loc.longitude, stops });
  } catch (error) {
    next(error);
  }
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
