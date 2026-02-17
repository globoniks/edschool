import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Bus, MapPin, Clock, Phone } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function ParentBusTracking() {
  const { user } = useAuthStore();

  const { data: busData, isLoading } = useQuery({
    queryKey: ['bus-tracking'],
    queryFn: () => api.get('/bus/tracking').then((res) => res.data).catch(() => null),
  });

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
        <p className="text-sm text-gray-600 mt-1">Track your child's bus location and schedule</p>
      </div>

      {busData ? (
        <div className="space-y-6">
          {/* Bus Status */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bus className="w-6 h-6 text-primary-600" />
                <h2 className="text-lg font-semibold">Bus Status</h2>
              </div>
              <span className={`badge ${
                busData.status === 'ON_ROUTE' ? 'bg-green-100 text-green-800' :
                busData.status === 'ARRIVED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {busData.status || 'Not Available'}
              </span>
            </div>
            {busData.estimatedArrival && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Estimated Arrival: {busData.estimatedArrival}</span>
              </div>
            )}
          </div>

          {/* Route Information */}
          {busData.route && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Route Information
              </h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Route Number:</span> {busData.route.number || 'N/A'}</p>
                <p><span className="font-medium">Pickup Point:</span> {busData.route.pickupPoint || 'N/A'}</p>
                <p><span className="font-medium">Drop Point:</span> {busData.route.dropPoint || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Driver Information */}
          {busData.driver && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Driver Information
              </h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {busData.driver.name || 'N/A'}</p>
                {busData.driver.phone && (
                  <p><span className="font-medium">Contact:</span> {busData.driver.phone}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Bus className="w-16 h-16 text-gray-400" />}
          title="Bus tracking not available"
          description="Bus tracking information will appear here once available"
        />
      )}
    </div>
  );
}

