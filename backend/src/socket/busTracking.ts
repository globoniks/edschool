import { Server } from 'socket.io';
import { AuthSocket } from './index.js';
import { prisma } from '../lib/prisma.js';
import { sendBusNearNotification } from '../utils/busNotifications.js';

interface LiveLocation {
  busId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  driverId: string;
  schoolId: string;
}

const liveLocations = new Map<string, LiveLocation>();

const BATCH_INTERVAL_MS = 30_000;
const pendingWrites: Array<{
  tripId: string;
  busId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recordedAt: Date;
}> = [];

let batchTimer: ReturnType<typeof setInterval> | null = null;

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
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

async function flushPendingWrites() {
  if (pendingWrites.length === 0) return;
  const batch = pendingWrites.splice(0, pendingWrites.length);
  try {
    await prisma.busLocation.createMany({ data: batch });
  } catch (err) {
    console.error('Failed to batch-write bus locations:', err);
  }
}

export function getLiveLocation(busId: string): LiveLocation | undefined {
  return liveLocations.get(busId);
}

export function getAllLiveLocations(schoolId: string): LiveLocation[] {
  return Array.from(liveLocations.values()).filter(
    (loc) => loc.schoolId === schoolId,
  );
}

export function setupBusTracking(io: Server) {
  if (!batchTimer) {
    batchTimer = setInterval(flushPendingWrites, BATCH_INTERVAL_MS);
  }

  io.on('connection', (socket: AuthSocket) => {
    const user = socket.user!;

    socket.on('driver:location-update', async (data: {
      busId: string;
      tripId: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    }) => {
      if (user.role !== 'DRIVER') return;

      const loc: LiveLocation = {
        busId: data.busId,
        tripId: data.tripId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed ?? null,
        heading: data.heading ?? null,
        timestamp: Date.now(),
        driverId: user.id,
        schoolId: user.schoolId,
      };

      liveLocations.set(data.busId, loc);

      pendingWrites.push({
        tripId: data.tripId,
        busId: data.busId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed ?? null,
        heading: data.heading ?? null,
        recordedAt: new Date(),
      });

      const locationPayload = {
        busId: data.busId,
        tripId: data.tripId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed ?? null,
        heading: data.heading ?? null,
        timestamp: loc.timestamp,
      };

      io.to(`bus:${data.busId}`).emit('bus:location', locationPayload);
      io.to(`school-buses:${user.schoolId}`).emit('bus:location', locationPayload);

      // Check proximity to stops (async, fire-and-forget)
      checkStopProximity(io, data.busId, data.tripId, data.latitude, data.longitude).catch(() => {});
    });

    socket.on('subscribe:bus', (busId: string) => {
      socket.join(`bus:${busId}`);
      const loc = liveLocations.get(busId);
      if (loc) {
        socket.emit('bus:location', {
          busId: loc.busId,
          tripId: loc.tripId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed: loc.speed,
          heading: loc.heading,
          timestamp: loc.timestamp,
        });
      }
    });

    socket.on('unsubscribe:bus', (busId: string) => {
      socket.leave(`bus:${busId}`);
    });

    socket.on('subscribe:school-buses', () => {
      socket.join(`school-buses:${user.schoolId}`);
    });

    socket.on('disconnect', () => {
      if (user.role === 'DRIVER') {
        for (const [busId, loc] of liveLocations.entries()) {
          if (loc.driverId === user.id) {
            liveLocations.delete(busId);
            io.to(`bus:${busId}`).emit('bus:offline', { busId });
            break;
          }
        }
      }
    });
  });
}

const PROXIMITY_THRESHOLD_KM = 0.5;
const notifiedStops = new Map<string, Set<string>>();

async function checkStopProximity(
  io: Server,
  busId: string,
  tripId: string,
  lat: number,
  lng: number,
) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      routeId: true,
      route: {
        select: {
          stops: { orderBy: { orderIndex: 'asc' } },
        },
      },
    },
  });

  if (!trip?.route?.stops?.length) return;

  const key = tripId;
  if (!notifiedStops.has(key)) notifiedStops.set(key, new Set());
  const notified = notifiedStops.get(key)!;

  for (const stop of trip.route.stops) {
    if (notified.has(stop.id)) continue;
    const dist = haversineDistance(lat, lng, stop.latitude, stop.longitude);
    if (dist <= PROXIMITY_THRESHOLD_KM) {
      notified.add(stop.id);
      const speed = liveLocations.get(busId)?.speed ?? 30;
      const etaMinutes = speed > 0 ? Math.round((dist / speed) * 60) : 0;

      io.to(`bus:${busId}`).emit('bus:near-stop', {
        busId,
        stopId: stop.id,
        stopName: stop.name,
        distanceKm: Math.round(dist * 100) / 100,
        etaMinutes,
      });

      sendBusNearNotification(busId, stop.name, etaMinutes).catch(() => {});
    }
  }
}
