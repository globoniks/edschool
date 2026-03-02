import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusSocket } from '../hooks/useBusSocket';
import { useBusTrackingStore } from '../store/busTrackingStore';
import BusMap, { type BusMarker, type StopMarker } from '../components/BusMap';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  Bus,
  Users,
  MapPin,
  Radio,
  ArrowLeft,
  Navigation,
  Phone,
  Clock,
  Route,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type LiveBus = {
  busId: string;
  busNumber: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  tripId: string;
};

type BusStudent = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  routeNumber?: string;
  pickupPoint?: string;
  class?: { name: string; section?: string | null } | null;
  parents?: { parent: { firstName: string; lastName: string; phone: string } }[];
};

type RouteStop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
};

export default function AdminBusTracking() {
  const { connected, subscribeToSchoolBuses } = useBusSocket();
  const { locations } = useBusTrackingStore();
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  useEffect(() => {
    subscribeToSchoolBuses();
  }, [subscribeToSchoolBuses]);

  const { data: liveBuses = [], isLoading } = useQuery<LiveBus[]>({
    queryKey: ['live-buses'],
    queryFn: () => api.get('/trips/live').then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: studentsData } = useQuery<{ busNumber: string; students: BusStudent[] }>({
    queryKey: ['bus-students', selectedBusId],
    queryFn: () => api.get(`/trips/students/${selectedBusId}`).then((r) => r.data),
    enabled: !!selectedBusId,
  });

  const selectedBusTrip = selectedBusId
    ? liveBuses.find((b) => b.busId === selectedBusId)
    : null;

  const { data: routeStops = [] } = useQuery<RouteStop[]>({
    queryKey: ['route-stops', selectedBusTrip?.tripId],
    queryFn: async () => {
      if (!selectedBusTrip?.tripId) return [];
      const trip = await api.get(`/trips/eta/${selectedBusId}`).then((r) => r.data);
      return trip.stops ?? [];
    },
    enabled: !!selectedBusTrip?.tripId,
  });

  const busMarkers: BusMarker[] = liveBuses.map((bus) => {
    const socketLoc = locations[bus.busId];
    return {
      busId: bus.busId,
      busNumber: bus.busNumber,
      latitude: socketLoc?.latitude ?? bus.latitude,
      longitude: socketLoc?.longitude ?? bus.longitude,
      heading: socketLoc?.heading ?? bus.heading,
      speed: socketLoc?.speed ?? bus.speed,
      online: socketLoc ? socketLoc.online : true,
    };
  });

  const stopMarkers: StopMarker[] = routeStops.map((s) => ({
    id: s.id,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    orderIndex: s.orderIndex ?? 0,
  }));

  const selectedBusMarker = selectedBusId
    ? busMarkers.find((b) => b.busId === selectedBusId)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/app/transport"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Live Bus Tracking</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-500">
                {liveBuses.length} bus{liveBuses.length !== 1 ? 'es' : ''} on road
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                connected
                  ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                  : 'bg-red-50 text-red-600 ring-1 ring-red-200'
              }`}>
                {connected ? <Radio className="w-2.5 h-2.5 animate-pulse" /> : null}
                {connected ? 'Live' : 'Reconnecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {liveBuses.length === 0 ? (
        <EmptyState
          icon={<Bus className="w-16 h-16 text-gray-400" />}
          title="No active buses"
          description="Buses will appear here when drivers start their trips"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <BusMap
                buses={selectedBusId ? busMarkers.filter((b) => b.busId === selectedBusId) : busMarkers}
                stops={stopMarkers}
                onBusClick={setSelectedBusId}
                showRoute={!!selectedBusId && stopMarkers.length >= 2}
                className="w-full h-[500px] lg:h-[600px]"
                zoom={selectedBusId ? 14 : 12}
                center={selectedBusMarker ? { latitude: selectedBusMarker.latitude, longitude: selectedBusMarker.longitude } : undefined}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Bus list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Bus className="w-4 h-4 text-primary-600" />
                  Active Buses
                </h2>
                {selectedBusId && (
                  <button
                    type="button"
                    onClick={() => setSelectedBusId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50 max-h-[250px] overflow-y-auto">
                {busMarkers.map((bus) => {
                  const busInfo = liveBuses.find((b) => b.busId === bus.busId);
                  return (
                    <button
                      key={bus.busId}
                      type="button"
                      onClick={() => setSelectedBusId(bus.busId === selectedBusId ? null : bus.busId)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        selectedBusId === bus.busId
                          ? 'bg-primary-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            bus.online ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Bus className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{bus.busNumber}</p>
                            <p className="text-xs text-gray-400">
                              {busInfo?.driverName || 'Driver'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              {bus.speed ? `${Math.round(bus.speed)} km/h` : 'Stopped'}
                            </p>
                            <div className={`w-2 h-2 rounded-full ml-auto mt-1 ${
                              bus.online ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
                            }`} />
                          </div>
                          <Navigation
                            className="w-3.5 h-3.5 text-gray-300"
                            style={{ transform: bus.heading ? `rotate(${bus.heading}deg)` : undefined }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Route stops for selected bus */}
            {selectedBusId && stopMarkers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Route className="w-4 h-4 text-indigo-500" />
                    Route Stops
                  </h3>
                </div>
                <div className="p-4">
                  <div className="relative pl-4">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-indigo-100" />
                    {stopMarkers.sort((a, b) => a.orderIndex - b.orderIndex).map((s, i) => (
                      <div key={s.id} className="relative flex items-center gap-3 py-1.5">
                        <div className="relative z-10 w-4 h-4 rounded-full bg-indigo-500 text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white flex-shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-sm text-gray-700">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Student list for selected bus */}
            {selectedBusId && studentsData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    Students
                  </h3>
                  <span className="text-xs text-gray-400">{studentsData.students.length} riders</span>
                </div>
                {studentsData.students.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No students assigned</p>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                    {studentsData.students.map((s) => (
                      <div key={s.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {s.firstName} {s.lastName}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {s.class?.name}{s.class?.section ? ` ${s.class.section}` : ''} &middot; {s.admissionNumber}
                            </p>
                          </div>
                        </div>
                        {s.pickupPoint && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1.5">
                            <MapPin className="w-3 h-3 text-gray-300" /> {s.pickupPoint}
                          </p>
                        )}
                        {s.parents && s.parents.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="w-3 h-3 text-gray-300" />
                            {s.parents[0].parent.firstName} {s.parents[0].parent.lastName} — {s.parents[0].parent.phone}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
