import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Image as ImageIcon, Calendar, Download } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useState } from 'react';

export default function ParentEventGallery() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['event-gallery'],
    queryFn: () => api.get('/gallery/events').then((res) => res.data).catch(() => []),
  });

  const { data: eventPhotos } = useQuery({
    queryKey: ['event-photos', selectedEvent],
    queryFn: () => api.get(`/gallery/events/${selectedEvent}/photos`).then((res) => res.data).catch(() => []),
    enabled: !!selectedEvent,
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
        <h1 className="text-2xl font-bold text-gray-900">Event Gallery</h1>
        <p className="text-sm text-gray-600 mt-1">View photos and videos from school events</p>
      </div>

      {events && events.length > 0 ? (
        <div className="space-y-6">
          {events.map((event: any) => (
            <div key={event.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{event.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                  className="btn btn-secondary text-sm"
                >
                  {selectedEvent === event.id ? 'Hide' : 'View'} Photos
                </button>
              </div>
              {event.description && (
                <p className="text-sm text-gray-700 mb-4">{event.description}</p>
              )}
              {selectedEvent === event.id && eventPhotos && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {eventPhotos.map((photo: any) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Event photo'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ImageIcon className="w-16 h-16 text-gray-400" />}
          title="No events"
          description="Event gallery will be updated here"
        />
      )}
    </div>
  );
}

