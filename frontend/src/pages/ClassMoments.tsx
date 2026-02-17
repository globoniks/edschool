import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Camera } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function ClassMoments() {
  const { data: moments = [], isLoading } = useQuery({
    queryKey: ['class-moments'],
    queryFn: () => api.get('/class-moments').then((res) => res.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Camera className="w-8 h-8 text-primary-600" />
          Class photos
        </h1>
        <p className="text-gray-600 mt-1">
          Photos shared by teachers with your class
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : Array.isArray(moments) && moments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {moments.map((m: any) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <a
                href={m.imageUrl.startsWith('http') ? m.imageUrl : m.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square bg-gray-100"
              >
                <img
                  src={m.imageUrl.startsWith('http') ? m.imageUrl : m.imageUrl}
                  alt={m.caption || 'Class photo'}
                  className="w-full h-full object-cover"
                />
              </a>
              <div className="p-3">
                {m.caption && (
                  <p className="text-sm text-gray-800 mb-1 line-clamp-2">{m.caption}</p>
                )}
                <p className="text-xs text-gray-500">
                  {m.class?.name}
                  {m.class?.section ? ` ${m.class.section}` : ''}
                  {m.teacher && ` · ${m.teacher.firstName} ${m.teacher.lastName}`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {m.createdAt
                    ? new Date(m.createdAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Camera className="w-16 h-16 text-gray-400" />}
          title="No class photos yet"
          description="When your teacher shares a photo with the class, it will appear here."
        />
      )}
    </div>
  );
}
