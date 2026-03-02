import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusSocket } from '../hooks/useBusSocket';
import BusMap from '../components/BusMap';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  Play,
  Square,
  Navigation,
  Bus,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  History,
  Route,
  ChevronDown,
  LocateFixed,
} from 'lucide-react';

type BusRecord = {
  id: string;
  busNumber: string;
  driverName: string;
  routes: {
    id: string;
    routeNumber: string;
    pickupPoint: string;
    dropPoint: string;
    stops: { id: string; name: string; latitude: number; longitude: number; orderIndex: number }[];
  }[];
};

type TripRecord = {
  id: string;
  busId: string;
  routeId: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  bus: { busNumber: string };
  route: {
    routeNumber: string;
    pickupPoint: string;
    dropPoint: string;
    stops?: { id: string; name: string; latitude: number; longitude: number; orderIndex: number }[];
  };
};

const LOCATION_INTERVAL_MS = 5000;

export default function DriverDashboard() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { connected, sendLocationUpdate } = useBusSocket();
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number; speed: number | null; heading: number | null } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);

  const { data: buses = [], isLoading: busesLoading } = useQuery<BusRecord[]>({
    queryKey: ['driver-buses'],
    queryFn: () => api.get('/trips/my-buses').then((r) => r.data),
  });

  const { data: activeTrip, isLoading: tripLoading } = useQuery<TripRecord | null>({
    queryKey: ['active-trip'],
    queryFn: () => api.get('/trips/active').then((r) => r.data),
  });

  const { data: tripHistory = [] } = useQuery<TripRecord[]>({
    queryKey: ['trip-history'],
    queryFn: () => api.get('/trips/history').then((r) => r.data),
    enabled: showHistory,
  });

  const startTripMutation = useMutation({
    mutationFn: (body: { busId: string; routeId: string }) =>
      api.post('/trips/start', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      showSuccess('Trip started! GPS sharing is now active.');
    },
    onError: (e: any) => showError(e.response?.data?.error || 'Failed to start trip'),
  });

  const endTripMutation = useMutation({
    mutationFn: (tripId: string) =>
      api.patch(`/trips/${tripId}/end`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      queryClient.invalidateQueries({ queryKey: ['trip-history'] });
      showSuccess('Trip ended. GPS sharing stopped.');
    },
    onError: (e: any) => showError(e.response?.data?.error || 'Failed to end trip'),
  });

  const startGPSTracking = useCallback(
    (trip: TripRecord) => {
      if (!navigator.geolocation) {
        showError('GPS not available on this device');
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          lastPositionRef.current = pos;
          setCurrentPos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed ? pos.coords.speed * 3.6 : null,
            heading: pos.coords.heading,
          });
        },
        (err) => console.error('GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
      );

      intervalRef.current = setInterval(() => {
        const pos = lastPositionRef.current;
        if (!pos) return;
        sendLocationUpdate({
          busId: trip.busId,
          tripId: trip.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed: pos.coords.speed ? pos.coords.speed * 3.6 : undefined,
          heading: pos.coords.heading ?? undefined,
        });
      }, LOCATION_INTERVAL_MS);
    },
    [sendLocationUpdate, showError],
  );

  const stopGPSTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastPositionRef.current = null;
    setCurrentPos(null);
  }, []);

  useEffect(() => {
    if (activeTrip?.status === 'IN_PROGRESS') {
      startGPSTracking(activeTrip);
    }
    return () => stopGPSTracking();
  }, [activeTrip, startGPSTracking, stopGPSTracking]);

  const handleStartTrip = () => {
    if (!selectedBusId || !selectedRouteId) {
      showError('Select a bus and route first');
      return;
    }
    startTripMutation.mutate({ busId: selectedBusId, routeId: selectedRouteId });
  };

  const handleEndTrip = () => {
    if (!activeTrip) return;
    stopGPSTracking();
    endTripMutation.mutate(activeTrip.id);
  };

  const selectedBus = buses.find((b) => b.id === (activeTrip?.busId || selectedBusId));
  const selectedRoute = selectedBus?.routes.find(
    (r) => r.id === (activeTrip?.routeId || selectedRouteId),
  );
  const stops = activeTrip?.route?.stops ?? selectedRoute?.stops ?? [];

  const elapsedTime = activeTrip?.startedAt
    ? Math.floor((Date.now() - new Date(activeTrip.startedAt).getTime()) / 60000)
    : 0;

  if (busesLoading || tripLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8 max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bus className="w-6 h-6 text-primary-600" />
          Driver Dashboard
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            connected
              ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
              : 'bg-red-50 text-red-600 ring-1 ring-red-200'
          }`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Live' : 'Offline'}
          </span>
          {currentPos && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <LocateFixed className="w-3 h-3" />
              {currentPos.lat.toFixed(4)}, {currentPos.lng.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {buses.length === 0 ? (
        <EmptyState
          icon={<Bus className="w-16 h-16 text-gray-400" />}
          title="No bus assigned"
          description="Contact the school administrator to assign a bus to your account"
        />
      ) : activeTrip?.status === 'IN_PROGRESS' ? (
        /* ====== ACTIVE TRIP VIEW ====== */
        <div className="space-y-4">
          {/* Trip status card */}
          <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
            <div className="bg-green-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Navigation className="w-5 h-5 animate-pulse" />
                <span className="font-semibold">Trip in Progress</span>
              </div>
              <span className="text-green-50 text-sm font-medium">
                {elapsedTime} min
              </span>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">{activeTrip.bus.busNumber}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Route className="w-3.5 h-3.5" />
                    {activeTrip.route.routeNumber} &middot; {activeTrip.route.pickupPoint} → {activeTrip.route.dropPoint}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Started</p>
                  <p className="text-sm font-medium text-gray-700">
                    {activeTrip.startedAt ? new Date(activeTrip.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-green-50 rounded-lg mb-4 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-xs font-medium text-green-700">
                    GPS active &middot; Sharing every {LOCATION_INTERVAL_MS / 1000}s
                    {currentPos?.speed ? ` &middot; ${Math.round(currentPos.speed)} km/h` : ''}
                  </span>
                </div>
                {currentPos && (
                  <p className="text-[10px] text-green-600 pl-4 font-mono">
                    {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleEndTrip}
                disabled={endTripMutation.isPending}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Square className="w-4 h-4" />
                {endTripMutation.isPending ? 'Ending...' : 'End Trip'}
              </button>
            </div>
          </div>

          {/* Live Map */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-gray-800">Live Map</span>
              <span className="text-xs text-gray-400 ml-auto">{stops.length} stops</span>
            </div>
            <BusMap
              stops={stops}
              buses={
                currentPos
                  ? [{
                      busId: activeTrip.busId,
                      busNumber: activeTrip.bus.busNumber,
                      latitude: currentPos.lat,
                      longitude: currentPos.lng,
                      heading: currentPos.heading,
                      speed: currentPos.speed,
                      online: true,
                    }]
                  : []
              }
              showRoute
              followBus
              className="w-full h-[350px]"
              zoom={15}
            />
          </div>

          {/* Stops list */}
          {stops.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Route className="w-4 h-4 text-indigo-500" />
                Route Stops
              </h3>
              <div className="relative pl-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-indigo-100" />
                {stops.map((s, i) => (
                  <div key={s.id} className="relative flex items-center gap-3 py-2">
                    <div className="relative z-10 w-4 h-4 rounded-full bg-indigo-500 text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-700">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ====== START TRIP VIEW ====== */
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              Start a New Trip
            </h2>

            <div className="space-y-4">
              {/* Bus selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bus</label>
                <div className="relative">
                  <select
                    value={selectedBusId}
                    onChange={(e) => {
                      setSelectedBusId(e.target.value);
                      setSelectedRouteId('');
                    }}
                    className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="">Select a bus</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.busNumber} — {b.driverName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Route selector */}
              {selectedBusId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Route</label>
                  <div className="relative">
                    <select
                      value={selectedRouteId}
                      onChange={(e) => setSelectedRouteId(e.target.value)}
                      className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="">Select a route</option>
                      {(buses.find((b) => b.id === selectedBusId)?.routes ?? []).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.routeNumber} — {r.pickupPoint} → {r.dropPoint}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Stops preview + map */}
              {selectedRouteId && stops.length > 0 && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <BusMap
                    stops={stops}
                    showRoute
                    className="w-full h-[200px]"
                    interactive={false}
                  />
                  <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {stops.length} stops on this route
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stops.map((s, i) => (
                        <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 px-2 py-1 rounded-lg text-gray-600">
                          <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleStartTrip}
                disabled={!selectedBusId || !selectedRouteId || startTripMutation.isPending}
                className="w-full py-3.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <Play className="w-5 h-5" />
                {startTripMutation.isPending ? 'Starting...' : 'Start Trip'}
              </button>
            </div>
          </div>

          {/* Trip history */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 font-medium transition-colors"
          >
            <History className="w-4 h-4" />
            {showHistory ? 'Hide History' : 'View Trip History'}
          </button>

          {showHistory && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Trips</h3>
              {tripHistory.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No trips yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tripHistory.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {trip.bus.busNumber} &middot; {trip.route.routeNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {trip.startedAt
                            ? new Date(trip.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Not started'}
                          {trip.startedAt && (
                            <span className="ml-1.5">
                              {new Date(trip.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {trip.endedAt && (
                                <> — {new Date(trip.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                              )}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                        trip.status === 'COMPLETED'
                          ? 'bg-green-50 text-green-700'
                          : trip.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-blue-50 text-blue-600'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
