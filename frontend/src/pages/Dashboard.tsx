import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useRoleUI } from '../hooks/useRoleUI';
import api from '../lib/api';
import { Users, GraduationCap, Calendar, DollarSign, Bell, FileText, BookOpen, ArrowRight, MessageSquare, AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, BarChart3, Database } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import RoleBasedLayout, { RoleSection } from '../components/RoleBasedLayout';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { clsx } from 'clsx';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { showCharts, showMetrics } = useRoleUI();

  // Redirect parents to parent portal
  if (user?.role === 'PARENT') {
    return <Navigate to="/app/parent-portal" replace />;
  }

  // Redirect teachers to teacher dashboard
  if (user?.role === 'TEACHER') {
    return <Navigate to="/app/teacher-dashboard" replace />;
  }

  // Redirect students to student dashboard
  if (user?.role === 'STUDENT') {
    return <Navigate to="/app/student-dashboard" replace />;
  }

  const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN'].includes(user?.role || '');
  const isParent = user?.role === 'PARENT';
  const isStudent = user?.role === 'STUDENT';
  const isHOD = user?.role === 'HOD';

  // Fetch parent dashboard data for parents
  const { data: parentDashboard } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parents/dashboard').then((res) => res.data),
    enabled: isParent,
  });

  // Admin Dashboard Stats
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      if (!isAdmin) return null;

      const [studentsRes, teachersRes, attendanceRes, feesRes] = await Promise.all([
        api.get('/students?limit=1').then((res) => res.data).catch(() => ({ pagination: { total: 0 }, students: [] })),
        api.get('/teachers?limit=1').then((res) => res.data).catch(() => ({ pagination: { total: 0 }, teachers: [] })),
        api.get('/attendance/stats').then((res) => res.data).catch(() => ({ percentage: 0, total: 0, present: 0 })),
        api.get('/fees/payments').then((res) => res.data || []).catch(() => []),
      ]);

      const totalStudents = studentsRes.pagination?.total || studentsRes.students?.length || 0;
      const totalTeachers = teachersRes.pagination?.total || teachersRes.teachers?.length || 0;
      const attendancePercentage = parseFloat(attendanceRes.percentage || '0');
      
      // Fee stats: backend returns payments with amount (paid), finalAmount (total due), status (PAID|PENDING|PARTIAL|FAILED)
      const allFees = feesRes || [];
      const totalFees = allFees.reduce((sum: number, fee: any) => sum + (fee.finalAmount || 0), 0);
      const collectedFees = allFees
        .filter((fee: any) => fee.status === 'PAID')
        .reduce((sum: number, fee: any) => sum + (fee.amount ?? fee.finalAmount ?? 0), 0);
      const pendingFees = allFees
        .filter((fee: any) => fee.status === 'PENDING' || fee.status === 'PARTIAL')
        .reduce((sum: number, fee: any) => {
          const total = fee.finalAmount ?? 0;
          const paid = fee.amount ?? 0;
          return sum + Math.max(0, total - paid);
        }, 0);
      const collectionRate = totalFees > 0 ? (collectedFees / totalFees) * 100 : 0;

      // Calculate month-over-month changes (mock for now)
      const studentsChange = 5.2; // +5.2%
      const teachersChange = 0;
      const attendanceChange = 2.1; // +2.1%
      const feesChange = 8.5; // +8.5%

      return {
        students: totalStudents,
        teachers: totalTeachers,
        attendance: attendancePercentage,
        feeCollection: collectedFees,
        feeCollectionRate: collectionRate,
        pendingFees,
        studentsChange,
        teachersChange,
        attendanceChange,
        feesChange,
      };
    },
    enabled: isAdmin,
  });

  // Alerts for Admin Dashboard
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      if (!isAdmin) return [];

      const alertsList = [];

      // Check for pending fees
      if (adminStats?.pendingFees && adminStats.pendingFees > 0) {
        alertsList.push({
          id: 'pending-fees',
          type: 'warning',
          title: 'Pending Fee Payments',
          message: `₹${adminStats.pendingFees.toLocaleString()} in pending fees require attention.`,
          action: '/app/fees',
        });
      }

      // Check for low attendance
      if (adminStats?.attendance && adminStats.attendance < 75) {
        alertsList.push({
          id: 'low-attendance',
          type: 'error',
          title: 'Low Attendance Rate',
          message: `Current attendance is ${adminStats.attendance.toFixed(1)}%, below the 75% threshold.`,
          action: '/app/attendance',
        });
      }

      // Check for upcoming exams
      try {
        const exams = await api.get('/exams').then((res) => res.data || []).catch(() => []);
        const upcomingExams = exams.filter((exam: any) => {
          const endDate = new Date(exam.endDate);
          const today = new Date();
          const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntil > 0 && daysUntil <= 7;
        });
        if (upcomingExams.length > 0) {
          alertsList.push({
            id: 'upcoming-exams',
            type: 'info',
            title: 'Upcoming Exams',
            message: `${upcomingExams.length} exam${upcomingExams.length > 1 ? 's' : ''} scheduled in the next 7 days.`,
            action: '/app/exams',
          });
        }
      } catch (error) {
        // Ignore errors
      }

      // Check for pending homework
      try {
        const homework = await api.get('/homework?status=ACTIVE&limit=1').then((res) => res.data || []).catch(() => []);
        if (homework.length > 0) {
          alertsList.push({
            id: 'active-homework',
            type: 'info',
            title: 'Active Homework',
            message: 'There are active homework assignments that need monitoring.',
            action: '/app/homework',
          });
        }
      } catch (error) {
        // Ignore errors
      }

      return alertsList;
    },
    enabled: isAdmin && !!adminStats,
  });

  // Chart data for attendance trends (last 7 days)
  const { data: attendanceChartData } = useQuery({
    queryKey: ['attendance-chart'],
    queryFn: async () => {
      try {
        // Generate last 7 days data
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          days.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            attendance: Math.floor(Math.random() * 20) + 80, // Mock data - replace with real API
          });
        }
        return days;
      } catch {
        return [];
      }
    },
    enabled: isAdmin,
  });

  // Chart data for fee collection (last 6 months)
  const { data: feesChartData } = useQuery({
    queryKey: ['fees-chart'],
    queryFn: async () => {
      try {
        const months = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          months.push({
            month: monthNames[date.getMonth()],
            collected: Math.floor(Math.random() * 50000) + 20000, // Mock data
            pending: Math.floor(Math.random() * 20000) + 5000,
          });
        }
        return months;
      } catch {
        return [];
      }
    },
    enabled: isAdmin,
  });

  // Chart data for student-teacher ratio
  const { data: ratioChartData } = useQuery({
    queryKey: ['ratio-chart'],
    queryFn: async () => {
      if (!adminStats) return null;
      return [
        { name: 'Students', value: adminStats.students },
        { name: 'Teachers', value: adminStats.teachers },
      ];
    },
    enabled: isAdmin && !!adminStats,
  });

  // Chart data for exam performance
  const { data: examChartData } = useQuery({
    queryKey: ['exam-chart'],
    queryFn: async () => {
      try {
        // Mock data for grade distribution
        return [
          { name: 'A+', students: 15 },
          { name: 'A', students: 25 },
          { name: 'B+', students: 30 },
          { name: 'B', students: 20 },
          { name: 'C', students: 10 },
        ];
      } catch {
        return [];
      }
    },
    enabled: isAdmin,
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // For non-admin users, use existing logic
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.role, isParent],
    queryFn: async () => {
      if (isParent && parentDashboard) {
        const children = parentDashboard.children || [];
        if (children.length === 0) {
          return { attendance: { percentage: 0 }, fees: 0, feesAmount: 0 };
        }
        const totalAttendance = children.reduce((sum: number, child: any) => {
          return sum + (child.attendance?.percentage || 0);
        }, 0);
        const avgAttendance = Math.round(totalAttendance / children.length);
        const totalPendingFees = children.reduce((sum: number, child: any) => {
          return sum + (child.fees?.totalPending || 0);
        }, 0);
        const totalPendingCount = children.reduce((sum: number, child: any) => {
          return sum + (child.fees?.pendingCount || 0);
        }, 0);
        return {
          attendance: { percentage: avgAttendance },
          fees: totalPendingCount,
          feesAmount: totalPendingFees,
        };
      }
      if (isStudent) {
        const [attendance, fees] = await Promise.all([
          api.get('/attendance/stats').then((res) => res.data).catch(() => ({ percentage: 0 })),
          api.get('/fees/payments?status=PENDING').then((res) => res.data?.length || 0).catch(() => 0),
        ]);
        return { attendance, fees };
      }
      return {};
    },
    enabled: !isAdmin && (!isParent || !!parentDashboard),
  });

  const { data: announcements } = useQuery({
    queryKey: ['recent-announcements'],
    queryFn: () => api.get('/announcements?limit=5').then((res) => res.data).catch(() => []),
  });

  // Admin Dashboard KPI Cards
  const adminKPICards = isAdmin && adminStats ? [
    {
      title: 'Total Students',
      value: adminStats.students.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: adminStats.studentsChange,
      trend: 'up' as const,
    },
    {
      title: 'Total Teachers',
      value: adminStats.teachers.toLocaleString(),
      icon: GraduationCap,
      color: 'bg-green-500',
      change: adminStats.teachersChange,
      trend: adminStats.teachersChange > 0 ? 'up' as const : 'neutral' as const,
    },
    {
      title: 'Attendance Rate',
      value: `${adminStats.attendance.toFixed(1)}%`,
      icon: Calendar,
      color: 'bg-yellow-500',
      change: adminStats.attendanceChange,
      trend: 'up' as const,
    },
    {
      title: 'Fee Collection',
      value: `₹${adminStats.feeCollection.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: adminStats.feesChange,
      trend: 'up' as const,
      subtitle: `${adminStats.feeCollectionRate.toFixed(1)}% collection rate`,
    },
  ] : [];

  return (
    <RoleBasedLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome back, {user?.profile?.firstName}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          {isAdmin ? 'Comprehensive data and analytics dashboard' : 'Here\'s what\'s happening at your school today.'}
        </p>
      </div>

      {/* Admin KPI Cards - HIGH PRIORITY for Admins (Data-Focused) */}
      {isAdmin && showMetrics && (
        <RoleSection priority="high" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-600" />
              Key Performance Indicators
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            ) : (
              adminKPICards.map((stat) => {
                const Icon = stat.icon;
                const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
                return (
                  <div key={stat.title} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {stat.change !== undefined && stat.change !== 0 && (
                        <div className={clsx(
                          'flex items-center gap-1 text-sm font-medium',
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        )}>
                          <TrendIcon className="w-4 h-4" />
                          {Math.abs(stat.change).toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </RoleSection>
        )}

        {/* Charts Section - HIGH PRIORITY for Admins (Data-Focused) */}
        {isAdmin && showCharts && (
          <RoleSection priority="high" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                Analytics & Insights
              </h2>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Attendance Trends Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Attendance Trends</h2>
                <span className="text-sm text-gray-500">Last 7 Days</span>
              </div>
              {attendanceChartData && attendanceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={attendanceChartData}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis domain={[0, 100]} stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="attendance"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorAttendance)"
                      name="Attendance %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Chart placeholder</p>
                    <p className="text-xs">Attendance data will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Fee Collection Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Fee Collection</h2>
                <span className="text-sm text-gray-500">Last 6 Months</span>
              </div>
              {feesChartData && feesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => `₹${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="pending" fill="#ef4444" name="Pending" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Chart placeholder</p>
                    <p className="text-xs">Fee collection data will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Student-Teacher Ratio Chart */}
            {ratioChartData && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Student-Teacher Ratio</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ratioChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ratioChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Exam Performance Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Exam Grade Distribution</h2>
              </div>
              {examChartData && examChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={examChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="students" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Chart placeholder</p>
                    <p className="text-xs">Exam performance data will appear here</p>
                  </div>
                </div>
              )}
            </div>
            </div>
          </RoleSection>
        )}

        {/* Alerts Panel & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Alerts Panel */}
            <div className="lg:col-span-1">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Alerts
                  </h2>
                </div>
                {alertsLoading ? (
                  <LoadingSpinner />
                ) : !alerts || alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-gray-600">All clear! No alerts at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert: any) => (
                      <div
                        key={alert.id}
                        className={clsx(
                          'p-4 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 transition-colors',
                          alert.type === 'error' && 'border-red-500 bg-red-50',
                          alert.type === 'warning' && 'border-yellow-500 bg-yellow-50',
                          alert.type === 'info' && 'border-blue-500 bg-blue-50'
                        )}
                        onClick={() => alert.action && navigate(alert.action)}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={clsx(
                              'w-5 h-5 mt-0.5 flex-shrink-0',
                              alert.type === 'error' && 'text-red-600',
                              alert.type === 'warning' && 'text-yellow-600',
                              alert.type === 'info' && 'text-blue-600'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1">{alert.title}</h3>
                            <p className="text-sm text-gray-600">{alert.message}</p>
                            {alert.action && (
                              <button className="text-xs text-primary-600 hover:text-primary-700 mt-2 font-medium">
                                View Details →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Recent Announcements
                  </h2>
                  <Link to="/app/announcements" className="text-sm text-primary-600 hover:text-primary-700">
                    View All
                  </Link>
                </div>
                {!announcements || announcements.length === 0 ? (
                  <EmptyState
                    icon={<Bell className="w-12 h-12 text-gray-400" />}
                    title="No announcements"
                    description="Check back later for updates"
                  />
                ) : (
                  <div className="space-y-3">
                    {announcements.slice(0, 5).map((announcement: any) => (
                      <div key={announcement.id} className="border-l-4 border-primary-500 pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition-colors">
                        <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{announcement.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/app/students')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <Users className="w-6 h-6 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Add Student</h3>
                <p className="text-sm text-gray-600">Register a new student</p>
              </button>
              <button
                onClick={() => navigate('/app/attendance')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <Calendar className="w-6 h-6 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Mark Attendance</h3>
                <p className="text-sm text-gray-600">Record daily attendance</p>
              </button>
              <button
                onClick={() => navigate('/app/exams')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <FileText className="w-6 h-6 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Create Exam</h3>
                <p className="text-sm text-gray-600">Schedule a new exam</p>
              </button>
              <button
                onClick={() => navigate('/app/fees')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <DollarSign className="w-6 h-6 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Manage Fees</h3>
                <p className="text-sm text-gray-600">View fee payments</p>
              </button>
            </div>
          </div>

      {/* Non-Admin Dashboard (existing logic for HOD, Student) */}
      {!isAdmin && (
        <div className="text-center py-12">
          <p className="text-gray-500">Dashboard content for your role is being prepared.</p>
        </div>
      )}
    </RoleBasedLayout>
  );
}
