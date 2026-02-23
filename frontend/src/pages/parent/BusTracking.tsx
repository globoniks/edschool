import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Bus, MapPin, Clock, Phone, UserCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

type ChildBus = {
  studentId: string;
  studentName: string;
  transportMode: 'BUS' | 'PARENT_PICKUP';
  status: string;
  message?: string;
  estimatedArrival?: string;
  route?: { id: string; number: string; pickupPoint: string; dropPoint: string };
  driver?: { name: string; phone?: string };
};

type TrackingResponse = {
  children: ChildBus[];
};

export default function ParentBusTracking() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['bus-tracking'],
    queryFn: () => api.get('/bus/tracking').then((res) => res.data as TrackingResponse).catch(() => null),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const children = (data?.children ?? []) as ChildBus[];

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">School Bus Tracking</h1>
        <p className="text-sm text-gray-600 mt-1">Track your child&apos;s bus or see parent pick up status</p>
      </div>

      {children.length > 0 ? (
        <div className="space-y-6">
          {children.map((child) => (
            <div key={child.studentId} className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {child.transportMode === 'PARENT_PICKUP' ? (
                  <UserCircle className="w-5 h-5 text-amber-600" />
                ) : (
                  <Bus className="w-5 h-5 text-primary-600" />
                )}
                {child.studentName}
              </h2>

              {child.transportMode === 'PARENT_PICKUP' || child.status === 'PARENT_PICKUP' ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-amber-800 font-medium">Parent pick up – not using school bus</p>
                  {child.message && child.message !== 'Parent pick up – not using school bus' && (
                    <p className="text-sm text-amber-700 mt-1">{child.message}</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`badge ${
                      child.status === 'ON_ROUTE' ? 'bg-green-100 text-green-800' :
                      child.status === 'ARRIVED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {child.status || 'Not Available'}
                    </span>
                    {child.estimatedArrival && child.estimatedArrival !== '—' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Estimated Arrival: {child.estimatedArrival}</span>
                      </div>
                    )}
                  </div>

                  {child.route && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Route Information
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Route Number:</span> {child.route.number || 'N/A'}</p>
                        <p><span className="font-medium">Pickup Point:</span> {child.route.pickupPoint || 'N/A'}</p>
                        <p><span className="font-medium">Drop Point:</span> {child.route.dropPoint || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {child.driver && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Driver Information
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Name:</span> {child.driver.name || 'N/A'}</p>
                        {child.driver.phone && (
                          <p><span className="font-medium">Contact:</span> {child.driver.phone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
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
