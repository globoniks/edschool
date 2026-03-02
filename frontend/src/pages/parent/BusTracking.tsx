import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { useBusSocket } from '../../hooks/useBusSocket';
import { useBusTrackingStore } from '../../store/busTrackingStore';
import BusMap, { type BusMarker, type StopMarker } from '../../components/BusMap';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Bus, MapPin, Clock, Phone, UserCircle, Radio, Bell, Navigation } from 'lucide-react';

type ChildBus = {
  studentId: string;
  studentName: string;
  transportMode: 'BUS' | 'PARENT_PICKUP';
  status: string;
  message?: string;
  route?: {
    id: string;
    number: string;
    pickupPoint: string;
    dropPoint: string;
    stops: { id: string; name: string; latitude: number; longitude: number; orderIndex: number }[];
  };
  bus?: { id: string; busNumber: string };
  driver?: { name: string; phone?: string };
  live?: {
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    timestamp: number;
  };
};

type TrackingResponse = { children: ChildBus[] };

type ETAResponse = {
  online: boolean;
  busId: string;
  stops: {
    id: string;
    name: string;
    distanceKm: number;
    etaMinutes: number;
  }[];
};

export default function ParentBusTracking() {
  const { user } = useAuthStore();
  const { connected, subscribeToBus, unsubscribeFromBus } = useBusSocket();
  const { locations, nearStops } = useBusTrackingStore();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bus-tracking'],
    queryFn: () =>
      api
        .get('/bus/tracking')
        .then((res) => res.data as TrackingResponse)
        .catch(() => null),
  });

  const children = (data?.children ?? []) as ChildBus[];
  const busChildren = children.filter((c) => c.transportMode === 'BUS' && c.bus?.id);

  useEffect(() => {
    busChildren.forEach((c) => {
      if (c.bus?.id) subscribeToBus(c.bus.id);
    });
    return () => {
      busChildren.forEach((c) => {
        if (c.bus?.id) unsubscribeFromBus(c.bus.id);
      });
    };
  }, [busChildren.map((c) => c.bus?.id).join(',')]);

  const activeChild = selectedChild
    ? children.find((c) => c.studentId === selectedChild)
    : busChildren[0] ?? children[0];

  const busId = activeChild?.bus?.id;
  const socketLoc = busId ? locations[busId] : undefined;
  const isLive = socketLoc?.online || activeChild?.status === 'LIVE';

  const busMarkers: BusMarker[] = [];
  if (busId && (socketLoc || activeChild?.live)) {
    busMarkers.push({
      busId,
      busNumber: activeChild?.bus?.busNumber ?? '',
      latitude: socketLoc?.latitude ?? activeChild?.live?.latitude ?? 0,
      longitude: socketLoc?.longitude ?? activeChild?.live?.longitude ?? 0,
      heading: socketLoc?.heading ?? activeChild?.live?.heading,
      speed: socketLoc?.speed ?? activeChild?.live?.speed,
      online: isLive,
    });
  }

  const stopMarkers: StopMarker[] =
    activeChild?.route?.stops?.map((s) => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      orderIndex: s.orderIndex,
    })) ?? [];

  const { data: etaData } = useQuery<ETAResponse>({
    queryKey: ['bus-eta', busId],
    queryFn: () => api.get(`/trips/eta/${busId}`).then((r) => r.data),
    enabled: !!busId && isLive,
    refetchInterval: 15_000,
  });

  const recentAlerts = nearStops.filter(
    (n) => busId && n.busId === busId && Date.now() - n.timestamp < 300_000,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">School Bus Tracking</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track your child&apos;s bus in real-time
          {connected && (
            <span className="ml-2 text-green-600">
              <Radio className="w-3 h-3 inline animate-pulse" /> Live
            </span>
          )}
        </p>
      </div>

      {/* Alerts */}
      {recentAlerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {recentAlerts.slice(0, 3).map((alert, i) => (
            <div
              key={`${alert.stopId}-${alert.timestamp}`}
              className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <Bell className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Bus is near {alert.stopName}
                </p>
                <p className="text-xs text-amber-600">
                  {alert.etaMinutes > 0 ? `ETA: ${alert.etaMinutes} min` : 'Arrived'} —{' '}
                  {alert.distanceKm} km away
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.studentId}
              type="button"
              onClick={() => setSelectedChild(child.studentId)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                (selectedChild ?? busChildren[0]?.studentId ?? children[0]?.studentId) ===
                child.studentId
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {child.studentName}
            </button>
          ))}
        </div>
      )}

      {children.length > 0 && activeChild ? (
        <div className="space-y-4">
          {activeChild.transportMode === 'PARENT_PICKUP' ||
          activeChild.status === 'PARENT_PICKUP' ? (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-amber-600" />
                {activeChild.studentName}
              </h2>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-amber-800 font-medium">
                  Parent pick up — not using school bus
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Status & Map */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Bus className="w-5 h-5 text-primary-600" />
                    {activeChild.studentName}
                  </h2>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      isLive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isLive ? 'Live' : 'Idle'}
                  </span>
                </div>

                {/* Map */}
                {(busMarkers.length > 0 || stopMarkers.length > 0) && (
                  <BusMap
                    buses={busMarkers}
                    stops={stopMarkers}
                    showRoute={stopMarkers.length >= 2}
                    className="w-full h-[300px] rounded-lg overflow-hidden mb-4"
                  />
                )}

                {/* ETA to stops */}
                {isLive && etaData?.stops && etaData.stops.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> ETA to Stops
                    </h3>
                    <div className="space-y-1.5">
                      {etaData.stops.map((stop) => (
                        <div
                          key={stop.id}
                          className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-sm text-gray-700">{stop.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {stop.etaMinutes} min
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({stop.distanceKm} km)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bus speed indicator */}
                {isLive && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-green-600" />
                      <span>
                        {socketLoc?.speed
                          ? `${Math.round(socketLoc.speed)} km/h`
                          : 'Stationary'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>
                        Updated{' '}
                        {socketLoc?.timestamp
                          ? new Date(socketLoc.timestamp).toLocaleTimeString()
                          : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Route info */}
              {activeChild.route && (
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Route Information
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Route:</span>{' '}
                      {activeChild.route.number || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Pickup:</span>{' '}
                      {activeChild.route.pickupPoint || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Drop:</span>{' '}
                      {activeChild.route.dropPoint || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Driver info */}
              {activeChild.driver && (
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Driver Information
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Name:</span>{' '}
                      {activeChild.driver.name || 'N/A'}
                    </p>
                    {activeChild.driver.phone && (
                      <p>
                        <span className="font-medium">Contact:</span>{' '}
                        <a
                          href={`tel:${activeChild.driver.phone}`}
                          className="text-primary-600 underline"
                        >
                          {activeChild.driver.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Bus className="w-16 h-16 text-gray-400" />}
          title="Bus tracking not available"
          description="Transport information for your children will appear here once the school has set it up"
        />
      )}
    </div>
  );
}
