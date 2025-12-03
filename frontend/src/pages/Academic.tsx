import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { BookMarked } from 'lucide-react';

export default function Academic() {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/academic/subjects').then((res) => res.data),
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Academic Management</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Manage classes, subjects, and academic settings</p>
      </div>

      <div className="card mb-6">
        <div className="flex space-x-2 sm:space-x-4 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 sm:px-4 py-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'classes'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600'
            }`}
          >
            Classes
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 sm:px-4 py-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600'
            }`}
          >
            Subjects
          </button>
        </div>
      </div>

      {activeTab === 'classes' && (
        <div className="card">
          <div className="space-y-3">
            {classes?.map((class_: any) => (
              <div key={class_.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{class_.name} {class_.section && `- ${class_.section}`}</h3>
                    <p className="text-sm text-gray-600">{class_.academicYear}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {class_._count?.students || 0} students
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="card">
          <div className="space-y-3">
            {subjects?.map((subject: any) => (
              <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{subject.name}</h3>
                    {subject.code && <p className="text-sm text-gray-600">Code: {subject.code}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

