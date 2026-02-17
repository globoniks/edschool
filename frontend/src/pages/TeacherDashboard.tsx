import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRoleUI } from '../hooks/useRoleUI';
import { useToast } from '../components/ToastProvider';
import api from '../lib/api';
import { Calendar, BookOpen, FileText, Clock, ChevronDown, CheckCircle, PlayCircle, AlertCircle, Zap, Target, Camera, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import RoleBasedLayout, { RoleSection } from '../components/RoleBasedLayout';
import { Button } from '../components/design-system';
import { clsx } from 'clsx';

interface Class {
  id: string;
  name: string;
  section?: string;
  studentCount: number;
}

interface TodaysClass {
  id: string;
  class: {
    id: string;
    name: string;
    section?: string;
  };
  subject: {
    id: string;
    name: string;
  };
  startTime: string;
  endTime: string;
  room?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { config, showQuickActions } = useRoleUI();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [sharePhotoModalOpen, setSharePhotoModalOpen] = useState(false);
  const [sharePhotoFile, setSharePhotoFile] = useState<File | null>(null);
  const [sharePhotoCaption, setSharePhotoCaption] = useState('');
  const sharePhotoInputRef = useRef<HTMLInputElement>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: () => api.get('/teachers/dashboard').then((res) => res.data),
    enabled: user?.role === 'TEACHER',
  });

  const { data: classMoments = [] } = useQuery({
    queryKey: ['class-moments', selectedClassId],
    queryFn: () =>
      api
        .get('/class-moments', { params: selectedClassId ? { classId: selectedClassId } : {} })
        .then((res) => res.data),
    enabled: user?.role === 'TEACHER',
  });

  const classes: Class[] = dashboardData?.classes || [];
  const todaysClasses: TodaysClass[] = dashboardData?.todaysClasses || [];
  const stats = dashboardData?.stats || {
    totalClasses: 0,
    todaysClassesCount: 0,
    pendingHomework: 0,
    attendanceMarked: 0,
  };

  // Auto-select first class when data loads (avoid setState during render)
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes.length, selectedClassId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const sharePhotoMutation = useMutation({
    mutationFn: async () => {
      if (!sharePhotoFile || !selectedClassId) throw new Error('Select a class and photo');
      const formData = new FormData();
      formData.append('file', sharePhotoFile);
      const uploadRes = await api.post<{ url: string }>('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadRes.data?.url ?? '';
      if (!imageUrl) throw new Error('Upload failed');
      await api.post('/class-moments', {
        classId: selectedClassId,
        imageUrl,
        caption: sharePhotoCaption.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-moments'] });
      setSharePhotoModalOpen(false);
      setSharePhotoFile(null);
      setSharePhotoCaption('');
      showSuccess('Photo shared with class');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || err?.message || 'Failed to share photo');
    },
  });

  const handleSharePhotoClick = () => {
    if (!selectedClassId && classes.length > 0) {
      setIsClassDropdownOpen(true);
      return;
    }
    if (!selectedClassId) {
      showError('Please select a class first');
      return;
    }
    setSharePhotoModalOpen(true);
    setSharePhotoFile(null);
    setSharePhotoCaption('');
  };

  const handleSharePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) setSharePhotoFile(file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleQuickAction = (action: 'attendance' | 'homework' | 'marks') => {
    if (!selectedClassId) {
      // If no class selected, show class selector
      setIsClassDropdownOpen(true);
      return;
    }

    switch (action) {
      case 'attendance':
        navigate(`/app/attendance?classId=${selectedClassId}`);
        break;
      case 'homework':
        navigate(`/app/homework?classId=${selectedClassId}`);
        break;
      case 'marks':
        navigate(`/app/exams?classId=${selectedClassId}`);
        break;
    }
  };

  const formatTime = (time: string) => {
    // time is in HH:MM format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return todaysClasses.find((cls) => {
      return cls.startTime <= currentTime && cls.endTime >= currentTime;
    });
  };

  const currentPeriod = getCurrentPeriod();

  return (
    <RoleBasedLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.profile?.firstName || 'Teacher'}!
        </h1>
        <p className="text-sm text-gray-600 mt-1">Quick access to your classes and tasks</p>
      </div>

      {/* Class Selector Dropdown */}
      <div className="mb-6">
        <div className="relative">
          <button
            onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
            className="w-full md:w-auto min-w-[200px] flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">
              {selectedClass
                ? `${selectedClass.name}${selectedClass.section ? ` ${selectedClass.section}` : ''}`
                : 'Select a class'}
            </span>
            <ChevronDown
              className={clsx(
                'w-5 h-5 text-gray-500 transition-transform',
                isClassDropdownOpen && 'transform rotate-180'
              )}
            />
          </button>

          {isClassDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsClassDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 md:right-auto mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                {classes.length > 0 ? (
                  classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setIsClassDropdownOpen(false);
                      }}
                      className={clsx(
                        'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors',
                        selectedClassId === cls.id && 'bg-primary-50 text-primary-700'
                      )}
                    >
                      <div className="font-medium">
                        {cls.name}
                        {cls.section && ` ${cls.section}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">No classes assigned</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions - HIGH PRIORITY for Teachers (Action-Focused) */}
      {showQuickActions && selectedClassId && (
        <RoleSection priority="high" className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-600" />
              Quick Actions
            </h2>
            <p className="text-sm text-gray-600 mt-1">One-tap access to common tasks</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleQuickAction('attendance')}
            className="card cursor-pointer hover:shadow-lg transition-all active:scale-95 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Mark Attendance</h3>
                <p className="text-xs text-gray-600">Quick attendance marking</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction('homework')}
            className="card cursor-pointer hover:shadow-lg transition-all active:scale-95 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Assign Homework</h3>
                <p className="text-xs text-gray-600">Create new assignment</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction('marks')}
            className="card cursor-pointer hover:shadow-lg transition-all active:scale-95 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Enter Marks</h3>
                <p className="text-xs text-gray-600">Record exam results</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleSharePhotoClick}
            className="card cursor-pointer hover:shadow-lg transition-all active:scale-95 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Share photo</h3>
                <p className="text-xs text-gray-600">Take a picture, share with class</p>
              </div>
            </div>
          </button>
        </div>
        </RoleSection>
      )}

      {/* Share photo to class – modal */}
      {sharePhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Share photo with class</h3>
              <button
                type="button"
                onClick={() => { setSharePhotoModalOpen(false); setSharePhotoFile(null); setSharePhotoCaption(''); }}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Class: <span className="font-medium text-gray-900">{selectedClass ? `${selectedClass.name}${selectedClass.section ? ` ${selectedClass.section}` : ''}` : '—'}</span>
              </p>
              <input
                ref={sharePhotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleSharePhotoFileChange}
              />
              <button
                type="button"
                onClick={() => sharePhotoInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-400 hover:bg-amber-50/50 transition-colors flex flex-col items-center gap-2 text-gray-600"
              >
                <Camera className="w-10 h-10 text-amber-500" />
                <span className="text-sm font-medium">Take photo or choose image</span>
              </button>
              {sharePhotoFile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={URL.createObjectURL(sharePhotoFile)}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sharePhotoFile.name}</p>
                    <p className="text-xs text-gray-500">{(sharePhotoFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSharePhotoFile(null)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
                <input
                  type="text"
                  value={sharePhotoCaption}
                  onChange={(e) => setSharePhotoCaption(e.target.value)}
                  placeholder="e.g. Science experiment today!"
                  className="input w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <Button
                variant="secondary"
                onClick={() => { setSharePhotoModalOpen(false); setSharePhotoFile(null); setSharePhotoCaption(''); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => sharePhotoMutation.mutate()}
                disabled={!sharePhotoFile || sharePhotoMutation.isPending}
                className="flex-1"
              >
                {sharePhotoMutation.isPending ? 'Sharing…' : 'Share with class'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <RoleSection priority="normal" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Classes</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Today's Classes</p>
            <p className="text-2xl font-bold text-primary-600">{stats.todaysClassesCount}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Pending Homework</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pendingHomework}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Attendance Marked</p>
            <p className="text-2xl font-bold text-green-600">{stats.attendanceMarked}</p>
          </div>
        </div>
        </div>
      </RoleSection>

      {/* Today's Classes List - HIGH PRIORITY for Teachers */}
      <RoleSection priority="high">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            Today's Schedule
          </h2>
          {currentPeriod && (
            <span className="badge bg-green-100 text-green-800 flex items-center gap-1">
              <PlayCircle className="w-3 h-3" />
              Class in progress
            </span>
          )}
        </div>

        {todaysClasses.length > 0 ? (
          <div className="space-y-3">
            {todaysClasses.map((cls) => {
              const isCurrent = cls.id === currentPeriod?.id;
              const isUpcoming = cls.status === 'upcoming' && !isCurrent;
              const isCompleted = cls.status === 'completed';

              return (
                <div
                  key={cls.id}
                  className={clsx(
                    'p-4 rounded-lg border-2 transition-all',
                    isCurrent
                      ? 'bg-green-50 border-green-500 shadow-md'
                      : isUpcoming
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200 opacity-75'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {isCurrent && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                        <h3 className="font-semibold text-gray-900">
                          {cls.subject.name}
                        </h3>
                        {isCurrent && (
                          <span className="badge bg-green-100 text-green-800 text-xs">
                            Now
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="badge bg-blue-100 text-blue-800 text-xs">
                            Upcoming
                          </span>
                        )}
                        {isCompleted && (
                          <span className="badge bg-gray-100 text-gray-600 text-xs">
                            Completed
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {cls.class.name}
                          {cls.class.section && ` ${cls.class.section}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                        </span>
                        {cls.room && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            Room: {cls.room}
                          </span>
                        )}
                      </div>
                    </div>
                    {isCurrent && (
                      <button
                        onClick={() => handleQuickAction('attendance')}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Mark Attendance
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar className="w-16 h-16 text-gray-400" />}
            title="No classes today"
            description="You have no scheduled classes for today"
          />
        )}
      </div>
      </RoleSection>

      {/* Recent class photos (moments) */}
      {Array.isArray(classMoments) && classMoments.length > 0 && (
        <RoleSection priority="normal" className="mt-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary-600" />
              Recent class photos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {classMoments.slice(0, 8).map((m: any) => (
                <div key={m.id} className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <a
                    href={m.imageUrl.startsWith('http') ? m.imageUrl : m.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square"
                  >
                    <img
                      src={m.imageUrl.startsWith('http') ? m.imageUrl : m.imageUrl}
                      alt={m.caption || 'Class photo'}
                      className="w-full h-full object-cover"
                    />
                  </a>
                  {m.caption && (
                    <p className="p-2 text-xs text-gray-600 truncate" title={m.caption}>{m.caption}</p>
                  )}
                  <p className="px-2 pb-2 text-xs text-gray-400">
                    {m.class?.name}{m.class?.section ? ` ${m.class.section}` : ''} · {m.teacher ? `${m.teacher.firstName} ${m.teacher.lastName}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </RoleSection>
      )}

      {/* No Classes Message */}
      {classes.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<AlertCircle className="w-16 h-16 text-gray-400" />}
            title="No classes assigned"
            description="Please contact the administrator to assign classes to your account"
          />
        </div>
      )}
    </RoleBasedLayout>
  );
}

