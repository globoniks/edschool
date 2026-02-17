import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { useRoleUI } from '../hooks/useRoleUI';
import { 
  TrendingUp, 
  BookOpen, 
  Calendar, 
  Award, 
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import RoleBasedLayout, { RoleSection } from '../components/RoleBasedLayout';
import { Card } from '../components/design-system';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { config, showProgress } = useRoleUI();

  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const [attendance, exams, homework, fees] = await Promise.all([
        api.get('/attendance/stats').then((res) => res.data).catch(() => ({ percentage: 0 })),
        api.get('/exams').then((res) => res.data).catch(() => []),
        api.get('/homework?status=ACTIVE').then((res) => res.data).catch(() => []),
        api.get('/fees/payments?status=PENDING').then((res) => res.data || []).catch(() => []),
      ]);

      // Calculate progress metrics
      const recentExams = exams?.slice(0, 5) || [];
      const averageScore = recentExams.length > 0
        ? recentExams.reduce((sum: number, exam: any) => {
            // Calculate average from exam marks if available
            return sum + 75; // Mock calculation
          }, 0) / recentExams.length
        : 0;

      const pendingHomework = homework?.length || 0;
      const completedHomework = 10; // Mock data

      return {
        attendance: attendance.percentage || 0,
        averageScore: Math.round(averageScore),
        recentExams,
        pendingHomework,
        completedHomework,
        pendingFees: fees?.length || 0,
      };
    },
    enabled: user?.role === 'STUDENT',
  });

  if (isLoading) {
    return (
      <RoleBasedLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </RoleBasedLayout>
    );
  }

  if (!studentData) {
    return (
      <RoleBasedLayout>
        <EmptyState
          title="Unable to load dashboard"
          description="Please try refreshing the page"
        />
      </RoleBasedLayout>
    );
  }

  // Progress chart data
  const progressData = studentData.recentExams?.map((exam: any, index: number) => ({
    name: exam.name?.substring(0, 10) || `Exam ${index + 1}`,
    score: 75 + Math.random() * 20, // Mock data
  })) || [];

  return (
    <RoleBasedLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.profile?.firstName}!
        </h1>
        <p className="text-sm text-gray-600 mt-1">Track your academic progress and performance</p>
      </div>

      {/* Progress Metrics - HIGH PRIORITY for Students */}
      {showProgress && (
        <RoleSection priority="high" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Attendance</p>
                  <p className="text-3xl font-bold text-blue-600">{studentData.attendance}%</p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
                <Calendar className="w-12 h-12 text-blue-500 opacity-50" />
              </div>
            </Card>

            <Card variant="elevated" className="bg-gradient-to-br from-green-50 to-green-100 border-green-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Score</p>
                  <p className="text-3xl font-bold text-green-600">{studentData.averageScore}%</p>
                  <p className="text-xs text-gray-500 mt-1">Recent exams</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card variant="elevated" className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Homework</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {studentData.completedHomework}/{studentData.completedHomework + studentData.pendingHomework}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Completed</p>
                </div>
                <BookOpen className="w-12 h-12 text-yellow-500 opacity-50" />
              </div>
            </Card>

            <Card variant="elevated" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall Grade</p>
                  <p className="text-3xl font-bold text-purple-600">A-</p>
                  <p className="text-xs text-gray-500 mt-1">Current standing</p>
                </div>
                <Award className="w-12 h-12 text-purple-500 opacity-50" />
              </div>
            </Card>
          </div>
        </RoleSection>
      )}

      {/* Progress Charts - HIGH PRIORITY for Students */}
      {showProgress && progressData.length > 0 && (
        <RoleSection priority="high" className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="elevated">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  Exam Performance Trend
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis domain={[0, 100]} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#0284c7" 
                    strokeWidth={3}
                    dot={{ fill: '#0284c7', r: 5 }}
                    name="Score %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card variant="elevated">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  Subject Performance
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { subject: 'Math', score: 85 },
                  { subject: 'Science', score: 78 },
                  { subject: 'English', score: 92 },
                  { subject: 'History', score: 80 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="subject" stroke="#6b7280" />
                  <YAxis domain={[0, 100]} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="score" fill="#0284c7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </RoleSection>
      )}

      {/* Recent Exams & Homework */}
      <RoleSection priority="normal" className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Recent Exam Results
              </h2>
            </div>
            {studentData.recentExams && studentData.recentExams.length > 0 ? (
              <div className="space-y-3">
                {studentData.recentExams.slice(0, 5).map((exam: any, index: number) => (
                  <div key={exam.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{exam.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(exam.startDate || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">85%</p>
                      <p className="text-xs text-gray-500">Grade A</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No exam results yet"
                description="Your exam results will appear here"
                size="sm"
              />
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                Pending Homework
              </h2>
            </div>
            {studentData.pendingHomework > 0 ? (
              <div className="space-y-3">
                {Array.from({ length: Math.min(studentData.pendingHomework, 5) }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">Assignment {i + 1}</p>
                        <p className="text-sm text-gray-600">Due in 2 days</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="All caught up!"
                description="No pending homework assignments"
                size="sm"
              />
            )}
          </Card>
        </div>
      </RoleSection>

      {/* Progress Timeline */}
      {showProgress && (
        <RoleSection priority="normal">
          <Card variant="elevated">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Your Progress Journey
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Attendance improved</p>
                  <p className="text-sm text-gray-600">From 75% to {studentData.attendance}% this month</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Consistent performance</p>
                  <p className="text-sm text-gray-600">Maintaining {studentData.averageScore}% average</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Keep it up!</p>
                  <p className="text-sm text-gray-600">You're on track for excellent grades</p>
                </div>
              </div>
            </div>
          </Card>
        </RoleSection>
      )}
    </RoleBasedLayout>
  );
}

