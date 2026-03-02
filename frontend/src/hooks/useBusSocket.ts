import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useBusTrackingStore } from '../store/busTrackingStore';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : window.location.origin;

export function useBusSocket() {
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { updateLocation, setBusOffline, addNearStop } = useBusTrackingStore();

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('bus:location', (data: {
      busId: string;
      tripId: string;
      latitude: number;
      longitude: number;
      speed: number | null;
      heading: number | null;
      timestamp: number;
    }) => {
      updateLocation(data.busId, data);
    });

    socket.on('bus:offline', (data: { busId: string }) => {
      setBusOffline(data.busId);
    });

    socket.on('bus:near-stop', (data: {
      busId: string;
      stopId: string;
      stopName: string;
      distanceKm: number;
      etaMinutes: number;
    }) => {
      addNearStop(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, updateLocation, setBusOffline, addNearStop]);

  const subscribeToBus = useCallback((busId: string) => {
    socketRef.current?.emit('subscribe:bus', busId);
  }, []);

  const unsubscribeFromBus = useCallback((busId: string) => {
    socketRef.current?.emit('unsubscribe:bus', busId);
  }, []);

  const subscribeToSchoolBuses = useCallback(() => {
    socketRef.current?.emit('subscribe:school-buses');
  }, []);

  const sendLocationUpdate = useCallback(
    (data: {
      busId: string;
      tripId: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    }) => {
      socketRef.current?.emit('driver:location-update', data);
    },
    [],
  );

  return {
    connected,
    subscribeToBus,
    unsubscribeFromBus,
    subscribeToSchoolBuses,
    sendLocationUpdate,
    socket: socketRef.current,
  };
}
