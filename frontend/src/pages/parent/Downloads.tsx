import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Download, FileText, Search, Folder } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useState } from 'react';

export default function ParentDownloads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['downloads', searchQuery, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      return api.get(`/downloads?${params.toString()}`).then((res) => res.data).catch(() => []);
    },
  });

  const categories = ['Report Cards', 'Forms', 'Certificates', 'Other'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredDocs = documents || [];

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Downloads</h1>
        <p className="text-sm text-gray-600 mt-1">Access forms, reports, and documents</p>
      </div>

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-lg text-sm ${
              !selectedCategory
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-sm ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredDocs.length > 0 ? (
        <div className="space-y-3">
          {filteredDocs.map((doc: any) => (
            <div key={doc.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{doc.name}</h3>
                    <p className="text-xs text-gray-600">{doc.category || 'Other'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.url}
                  download
                  className="btn btn-primary flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Folder className="w-16 h-16 text-gray-400" />}
          title="No documents available"
          description="Documents will appear here once uploaded"
        />
      )}
    </div>
  );
}

