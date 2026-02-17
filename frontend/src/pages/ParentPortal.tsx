import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useRoleUI } from '../hooks/useRoleUI';
import {
  Calendar,
  DollarSign,
  FileText,
  BookOpen,
  MessageSquare,
  Bell,
  TrendingUp,
  Bus,
  Video,
  Image as ImageIcon,
  Clock,
  Download,
  Printer,
  School,
  AlertCircle,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonCard } from '../components/Skeleton';
import StudentProfileCard from '../components/StudentProfileCard';
import MetricCard from '../components/MetricCard';
import FeatureCard from '../components/FeatureCard';
import QuickActionCard from '../components/QuickActionCard';
import EmptyState from '../components/EmptyState';
import RoleBasedLayout, { RoleSection } from '../components/RoleBasedLayout';

export default function ParentPortal() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { config, showFinance, showAlerts } = useRoleUI();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parents/dashboard').then((res) => res.data),
    enabled: user?.role === 'PARENT',
  });

  // Fetch alerts (HIGH PRIORITY for parents)
  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then((res) => res.data).catch(() => []),
    enabled: showAlerts && user?.role === 'PARENT',
  });

  // Fetch fees data (HIGH PRIORITY for parents)
  const { data: feesData } = useQuery({
    queryKey: ['parent-fees'],
    queryFn: () => api.get('/fees/payments?status=PENDING').then((res) => res.data || []).catch(() => []),
    enabled: showFinance && user?.role === 'PARENT',
  });

  // Fetch additional data
  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements?limit=10').then((res) => res.data).catch(() => []),
  });

  const { data: holidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => api.get('/holidays').then((res) => res.data).catch(() => []),
  });

  if (isLoading) {
    return (
      <RoleBasedLayout className="pb-20 md:pb-0">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </RoleBasedLayout>
    );
  }

  if (!dashboardData) {
    return (
      <RoleBasedLayout className="pb-20 md:pb-0">
        <EmptyState
          title="No data available"
          description="Unable to load dashboard data. Please try again later."
        />
      </RoleBasedLayout>
    );
  }

  const { parent, children } = dashboardData;
  const activeChild = selectedChildId
    ? children.find((c: any) => c.studentId === selectedChildId)
    : children[0];

  if (!activeChild && children.length > 0) {
    return (
      <RoleBasedLayout className="pb-20 md:pb-0">
        <EmptyState
          title="No child selected"
          description="Please select a child to view their information."
        />
      </RoleBasedLayout>
    );
  }

  // Calculate unread alerts count
  const unreadAlerts = alerts?.filter((alert: any) => !alert.read)?.length || 0;
  
  // Calculate total pending fees
  const totalPendingFees = activeChild?.fees?.totalPending || 0;
  const pendingFeesCount = activeChild?.fees?.pendingCount || 0;

  // Calculate upcoming holidays
  const upcomingHolidays = holidays?.filter((h: any) => {
    const holidayDate = new Date(h.date);
    return holidayDate >= new Date();
  }) || [];
  const nextHoliday = upcomingHolidays.sort((a: any, b: any) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )[0];

  const unreadNotices = announcements?.length || 0;

  return (
    <RoleBasedLayout className="pb-20 md:pb-0">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Welcome, {parent?.firstName || 'Parent'}!
        </h1>
        <p className="text-sm text-gray-600 mt-1">Here's what's happening with your child</p>
      </div>

      {/* Student Profile Card */}
      {activeChild && (
        <StudentProfileCard
          name={`${activeChild.firstName} ${activeChild.lastName}`}
          class={activeChild.class ? `${activeChild.class.name}${activeChild.class.section ? ` ${activeChild.class.section}` : ''}` : 'N/A'}
          admissionNumber={activeChild.admissionNumber}
          photo={activeChild.photo}
          showSelector={children.length > 1}
          onChildSelect={() => {
            const childIds = children.map((c: any) => c.studentId);
            const currentIndex = childIds.indexOf(selectedChildId || childIds[0]);
            const nextIndex = (currentIndex + 1) % childIds.length;
            setSelectedChildId(childIds[nextIndex]);
          }}
        >
          {children.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {children.map((child: any) => (
                  <button
                    key={child.studentId}
                    onClick={() => setSelectedChildId(child.studentId)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      (selectedChildId === child.studentId || (!selectedChildId && child === children[0]))
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {child.firstName} {child.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </StudentProfileCard>
      )}

      {/* HIGH PRIORITY: Finance & Alerts Section (Parent Focus) */}
      <RoleSection priority="high" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Finance Cards - Prominent for Parents */}
          {showFinance && (
            <>
              <MetricCard
                title="Fees Due"
                value={`₹${totalPendingFees.toLocaleString()}`}
                icon={DollarSign}
                color="red"
                subtitle={`${pendingFeesCount} payment${pendingFeesCount !== 1 ? 's' : ''} due`}
                href="/app/parent/fees"
                className="border-2 border-red-200 bg-red-50"
              />
              <MetricCard
                title="Payment Status"
                value={pendingFeesCount === 0 ? 'All Paid' : 'Pending'}
                icon={DollarSign}
                color={pendingFeesCount === 0 ? 'green' : 'yellow'}
                subtitle={pendingFeesCount === 0 ? 'Up to date' : 'Action required'}
                href="/app/parent/fees"
              />
            </>
          )}

          {/* Alerts Card - Prominent for Parents */}
          {showAlerts && (
            <MetricCard
              title="Alerts"
              value={unreadAlerts}
              icon={AlertCircle}
              color="red"
              subtitle="Urgent notifications"
              badge={unreadAlerts > 0 ? unreadAlerts : undefined}
              href="/app/parent/alerts"
              className={unreadAlerts > 0 ? 'border-2 border-red-300 bg-red-50 animate-pulse' : ''}
            />
          )}

          {/* Attendance */}
          <MetricCard
            title="Attendance"
            value={`${activeChild?.attendance?.percentage || 0}%`}
            icon={Calendar}
            color="blue"
            subtitle={`${activeChild?.attendance?.presentCount || 0} of ${activeChild?.attendance?.totalCount || 0} days`}
            href="/app/parent/attendance"
          />
        </div>
      </RoleSection>

      {/* Finance Details Section (Parent Focus) */}
      {showFinance && totalPendingFees > 0 && (
        <RoleSection priority="high" className="mb-6">
          <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-600" />
                  Payment Required
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingFeesCount} fee payment{pendingFeesCount !== 1 ? 's' : ''} need your attention
                </p>
              </div>
              <button
                onClick={() => navigate('/app/parent/fees')}
                className="btn btn-primary"
              >
                Pay Now
              </button>
            </div>
            {activeChild?.fees?.dues && activeChild.fees.dues.length > 0 && (
              <div className="space-y-2">
                {activeChild.fees.dues.slice(0, 3).map((fee: any) => (
                  <div key={fee.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-gray-900">{fee.feeStructureName}</p>
                      <p className="text-xs text-gray-600">
                        Due: {new Date(fee.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">₹{fee.due.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Due</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </RoleSection>
      )}

      {/* Alerts Section (Parent Focus) */}
      {showAlerts && unreadAlerts > 0 && (
        <RoleSection priority="high" className="mb-6">
          <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-600" />
                  Important Alerts
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {unreadAlerts} unread alert{unreadAlerts !== 1 ? 's' : ''} require your attention
                </p>
              </div>
              <button
                onClick={() => navigate('/app/parent/alerts')}
                className="btn btn-warning"
              >
                View All
              </button>
            </div>
            {alerts && alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.filter((a: any) => !a.read).slice(0, 3).map((alert: any) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </RoleSection>
      )}

      {/* Standard Metrics */}
      <RoleSection priority="normal" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <MetricCard
            title="Homework"
            value={activeChild?.homework?.upcoming?.length || 0}
            icon={BookOpen}
            color="yellow"
            subtitle="Assignments pending"
            href="/app/parent/homework"
          />
          <MetricCard
            title="Notices"
            value={unreadNotices}
            icon={Bell}
            color="purple"
            subtitle="Unread announcements"
            badge={unreadNotices > 0 ? unreadNotices : undefined}
            href="/app/parent/notices"
          />
        </div>
      </RoleSection>

      {/* Academic & Tracking */}
      <RoleSection priority="normal" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <FeatureCard
            title="Academic Performance"
            description={`${activeChild?.exams?.recent?.length || 0} recent results`}
            icon={TrendingUp}
            color="green"
            href="/app/parent/academic-performance"
          />
          <FeatureCard
            title="Syllabus Tracking"
            description="Track completion progress"
            icon={School}
            color="blue"
            href="/app/parent/syllabus"
          />
          <FeatureCard
            title="School Bus"
            description="Track bus location"
            icon={Bus}
            color="yellow"
            href="/app/parent/bus"
          />
          <FeatureCard
            title="Subject Videos"
            description="Class-wise learning videos"
            icon={Video}
            color="purple"
            href="/app/parent/videos"
          />
        </div>
      </RoleSection>

      {/* Additional Features */}
      <RoleSection priority="low" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <FeatureCard
            title="Event Gallery"
            description="School events & photos"
            icon={ImageIcon}
            color="green"
            href="/app/parent/gallery"
          />
          <FeatureCard
            title="Holidays"
            description={nextHoliday ? `Next: ${new Date(nextHoliday.date).toLocaleDateString()}` : 'View calendar'}
            icon={Calendar}
            color="blue"
            href="/app/parent/holidays"
          />
          <FeatureCard
            title="Timetable"
            description="Weekly schedule"
            icon={Clock}
            color="yellow"
            href="/app/parent/timetable"
          />
          <FeatureCard
            title="Downloads"
            description="Forms, reports & documents"
            icon={Download}
            color="gray"
            href="/app/parent/downloads"
          />
        </div>
      </RoleSection>

      {/* Quick Actions */}
      <QuickActionCard
        title="Quick Actions"
        actions={[
          {
            label: 'Pay Fees',
            icon: DollarSign,
            href: '/app/parent/fees',
            primary: true,
          },
          {
            label: 'View Alerts',
            icon: AlertCircle,
            href: '/app/parent/alerts',
            primary: unreadAlerts > 0,
          },
          {
            label: 'Message Teacher',
            icon: MessageSquare,
            href: '/app/parent/messages',
          },
          {
            label: 'Download Report',
            icon: Download,
            onClick: () => {
              navigate('/app/parent/downloads');
            },
          },
        ]}
      />

      {/* No Children Message */}
      {children.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="No children linked"
            description="Please contact the school administration to link your child's account"
          />
        </div>
      )}
    </RoleBasedLayout>
  );
}
