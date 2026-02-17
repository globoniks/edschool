import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Video, Play, Search } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useState } from 'react';

export default function ParentSubjectVideos() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: videos, isLoading } = useQuery({
    queryKey: ['subject-videos', searchQuery],
    queryFn: () => api.get(`/videos?search=${searchQuery}`).then((res) => res.data).catch(() => []),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredVideos = videos?.filter((video: any) =>
    video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subject Videos</h1>
        <p className="text-sm text-gray-600 mt-1">Access class-wise learning videos</p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search videos by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video: any) => (
            <div key={video.id} className="card cursor-pointer hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center relative">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Video className="w-12 h-12 text-gray-400" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                  <Play className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{video.title}</h3>
              <p className="text-xs text-gray-600 mb-2">{video.subject}</p>
              <p className="text-xs text-gray-500">Class: {video.className || 'N/A'}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Video className="w-16 h-16 text-gray-400" />}
          title="No videos available"
          description="Subject videos will appear here once uploaded"
        />
      )}
    </div>
  );
}

