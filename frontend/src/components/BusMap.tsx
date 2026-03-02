import { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  OverlayView,
} from '@react-google-maps/api';
import { Bus as BusIcon, MapPin } from 'lucide-react';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

export interface BusMarker {
  busId: string;
  busNumber: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  online: boolean;
}

export interface StopMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
}

interface BusMapProps {
  buses?: BusMarker[];
  stops?: StopMarker[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  className?: string;
  onBusClick?: (busId: string) => void;
  showRoute?: boolean;
  interactive?: boolean;
  followBus?: boolean;
}

const DEFAULT_CENTER = { lat: 30.7333, lng: 76.7794 };
const containerStyle = { width: '100%', height: '100%' };

export default function BusMap({
  buses = [],
  stops = [],
  center,
  zoom = 13,
  className = 'w-full h-[400px] rounded-lg overflow-hidden',
  onBusClick,
  showRoute = false,
  interactive = true,
  followBus = false,
}: BusMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const initialized = useRef(false);
  const prevCenterRef = useRef(center);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const computedCenter = useMemo(() => {
    if (center) return { lat: center.latitude, lng: center.longitude };
    const firstBus = buses.find((b) => b.online);
    if (firstBus) return { lat: firstBus.latitude, lng: firstBus.longitude };
    const firstStop = stops[0];
    if (firstStop) return { lat: firstStop.latitude, lng: firstStop.longitude };
    return DEFAULT_CENTER;
  }, [center, buses, stops]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (center && (center.latitude !== prevCenterRef.current?.latitude || center.longitude !== prevCenterRef.current?.longitude)) {
      mapRef.current.panTo({ lat: center.latitude, lng: center.longitude });
      mapRef.current.setZoom(zoom);
      prevCenterRef.current = center;
      initialized.current = true;
      return;
    }

    if (initialized.current && !followBus) return;

    const firstBus = buses.find((b) => b.online);
    const firstStop = stops[0];
    if (firstBus) {
      mapRef.current.panTo({ lat: firstBus.latitude, lng: firstBus.longitude });
      initialized.current = true;
    } else if (firstStop && !initialized.current) {
      mapRef.current.panTo({ lat: firstStop.latitude, lng: firstStop.longitude });
      initialized.current = true;
    }
  }, [buses, stops, center, zoom, followBus]);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.orderIndex - b.orderIndex),
    [stops],
  );

  const routePath = useMemo(
    () => sortedStops.map((s) => ({ lat: s.latitude, lng: s.longitude })),
    [sortedStops],
  );

  const mapOptions: google.maps.MapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: interactive ? 'auto' : 'none',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    }),
    [interactive],
  );

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center border border-gray-200 rounded-lg`}>
        <div className="text-center text-gray-500 p-4">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Map not configured</p>
          <p className="text-xs mt-1">Set VITE_GOOGLE_MAPS_KEY in your environment</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-gray-50 flex items-center justify-center border border-gray-200 rounded-lg`}>
        <div className="text-center text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={computedCenter}
        zoom={zoom}
        onLoad={onLoad}
        options={mapOptions}
      >
        {showRoute && routePath.length >= 2 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: '#4F46E5',
              strokeOpacity: 0.8,
              strokeWeight: 3,
            }}
          />
        )}

        {sortedStops.map((stop, idx) => (
          <OverlayView
            key={stop.id}
            position={{ lat: stop.latitude, lng: stop.longitude }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="flex flex-col items-center" style={{ transform: 'translate(-50%, -100%)' }}>
              <div className="bg-white border-2 border-indigo-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-md">
                {idx + 1}
              </div>
              <span className="text-[10px] font-medium bg-white/90 px-1 rounded shadow mt-0.5 whitespace-nowrap max-w-[100px] truncate">
                {stop.name}
              </span>
            </div>
          </OverlayView>
        ))}

        {/* Bus markers -- key includes position to force OverlayView remount on move */}
        {buses.map((bus) => (
          <OverlayView
            key={`${bus.busId}-${bus.latitude.toFixed(5)}-${bus.longitude.toFixed(5)}`}
            position={{ lat: bus.latitude, lng: bus.longitude }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              className="relative cursor-pointer"
              style={{ transform: `translate(-50%, -50%) ${bus.heading ? `rotate(${bus.heading}deg)` : ''}` }}
              title={`${bus.busNumber}${bus.speed ? ` — ${Math.round(bus.speed)} km/h` : ''}`}
              onClick={() => onBusClick?.(bus.busId)}
            >
              {/* Pulse ring for online buses */}
              {bus.online && (
                <div className="absolute inset-0 -m-2 rounded-full bg-green-400 opacity-30 animate-ping" />
              )}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 relative z-10 ${
                  bus.online
                    ? 'bg-green-500 border-white text-white'
                    : 'bg-gray-400 border-gray-300 text-white'
                }`}
              >
                <BusIcon className="w-4 h-4" />
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-white px-1.5 py-0.5 rounded-full shadow whitespace-nowrap z-10 border border-gray-200">
                {bus.busNumber}
              </span>
            </div>
          </OverlayView>
        ))}
      </GoogleMap>
    </div>
  );
}
