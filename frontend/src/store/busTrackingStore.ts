import { create } from 'zustand';

export interface BusLocationData {
  busId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  online: boolean;
}

export interface NearStopEvent {
  busId: string;
  stopId: string;
  stopName: string;
  distanceKm: number;
  etaMinutes: number;
  timestamp: number;
}

interface BusTrackingState {
  locations: Record<string, BusLocationData>;
  nearStops: NearStopEvent[];
  updateLocation: (busId: string, data: Omit<BusLocationData, 'online'>) => void;
  setBusOffline: (busId: string) => void;
  addNearStop: (event: Omit<NearStopEvent, 'timestamp'>) => void;
  clearNearStops: () => void;
}

export const useBusTrackingStore = create<BusTrackingState>((set) => ({
  locations: {},
  nearStops: [],

  updateLocation: (busId, data) =>
    set((state) => ({
      locations: {
        ...state.locations,
        [busId]: { ...data, online: true },
      },
    })),

  setBusOffline: (busId) =>
    set((state) => {
      const existing = state.locations[busId];
      if (!existing) return state;
      return {
        locations: {
          ...state.locations,
          [busId]: { ...existing, online: false },
        },
      };
    }),

  addNearStop: (event) =>
    set((state) => ({
      nearStops: [
        { ...event, timestamp: Date.now() },
        ...state.nearStops.slice(0, 49),
      ],
    })),

  clearNearStops: () => set({ nearStops: [] }),
}));
