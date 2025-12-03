import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Users, GraduationCap, Calendar, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

  const isAdminOrTeacher = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.role],
    queryFn: async () => {
      if (!isAdminOrTeacher) {
        // For students/parents, focus on personal attendance and dues count
        const [attendance, fees] = await Promise.all([
          api.get('/attendance/stats').then((res) => res.data),
          api.get('/fees/payments?status=PENDING').then((res) => res.data.length || 0),
        ]);
        return { attendance, fees };
      }

      const [students, teachers, attendance, fees] = await Promise.all([
        api.get('/students?limit=1').then((res) => res.data.pagination?.total || 0),
        api.get('/teachers?limit=1').then((res) => res.data.pagination?.total || 0),
        api.get('/attendance/stats').then((res) => res.data),
        api.get('/fees/payments?status=PENDING').then((res) => res.data.length || 0),
      ]);

      return { students, teachers, attendance, fees };
    },
  });

  const statCards = isAdminOrTeacher
    ? [
        {
          title: 'Total Students',
          value: stats?.students || 0,
          icon: Users,
          color: 'bg-blue-500',
        },
        {
          title: 'Total Teachers',
          value: stats?.teachers || 0,
          icon: GraduationCap,
          color: 'bg-green-500',
        },
        {
          title: "Today's Attendance",
          value: `${stats?.attendance?.percentage || 0}%`,
          icon: Calendar,
          color: 'bg-yellow-500',
        },
        {
          title: 'Pending Fees',
          value: stats?.fees || 0,
          icon: DollarSign,
          color: 'bg-red-500',
        },
      ]
    : [
        {
          title: "Your Attendance (this month)",
          value: `${stats?.attendance?.percentage || 0}%`,
          icon: Calendar,
          color: 'bg-blue-500',
        },
        {
          title: 'Your Pending Fees',
          value: stats?.fees || 0,
          icon: DollarSign,
          color: 'bg-red-500',
        },
      ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.profile?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">Here's what's happening at your school today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Announcements</h2>
          <p className="text-gray-500">No announcements yet.</p>
        </div>

        {isAdminOrTeacher && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full btn btn-primary text-left">Mark Attendance</button>
              <button className="w-full btn btn-secondary text-left">Add Student</button>
              <button className="w-full btn btn-secondary text-left">Create Exam</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

