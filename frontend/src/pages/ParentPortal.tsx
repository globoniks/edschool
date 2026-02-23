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
import MetricCard from '../components/MetricCard';
import FeatureCard from '../components/FeatureCard';
import EmptyState from '../components/EmptyState';
import RoleBasedLayout, { RoleSection } from '../components/RoleBasedLayout';

export default function ParentPortal() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { config, showFinance, showAlerts } = useRoleUI();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: dashboardData, isLoading, isError, refetch } = useQuery({
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

  if (!dashboardData && !isLoading) {
    return (
      <RoleBasedLayout className="pb-20 md:pb-0">
        <EmptyState
          variant={isError ? 'error' : 'default'}
          title={isError ? 'Something went wrong' : 'No data available'}
          description="Unable to load dashboard data. Please try again later."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="btn btn-primary mt-4"
            >
              Try again
            </button>
          }
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
      {/* Header with compact child toggle */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Welcome, {parent?.firstName || 'Parent'}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">Here's what's happening with your child</p>
        </div>
        {activeChild && children.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-gray-600 hidden sm:inline">Child:</span>
            <div className="flex rounded-lg border border-gray-300 bg-white p-0.5 shadow-sm">
              {children.map((child: any) => (
                <button
                  key={child.studentId}
                  type="button"
                  onClick={() => setSelectedChildId(child.studentId)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    (selectedChildId === child.studentId || (!selectedChildId && child === children[0]))
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {child.firstName} {child.lastName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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

      {/* Academic & Tracking – icon + title tiles, mobile-friendly */}
      <RoleSection priority="normal" className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          <FeatureCard
            title="Academic Performance"
            icon={TrendingUp}
            color="green"
            href="/app/parent/academic-performance"
            compact
          />
          <FeatureCard
            title="Syllabus Tracking"
            icon={School}
            color="blue"
            href="/app/parent/syllabus"
            compact
          />
          <FeatureCard
            title="School Bus"
            icon={Bus}
            color="yellow"
            href="/app/parent/bus"
            compact
          />
          <FeatureCard
            title="Subject Videos"
            icon={Video}
            color="purple"
            href="/app/parent/videos"
            compact
          />
        </div>
      </RoleSection>

      {/* Additional Features – icon + title tiles */}
      <RoleSection priority="low" className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          <FeatureCard
            title="Event Gallery"
            icon={ImageIcon}
            color="green"
            href="/app/parent/gallery"
            compact
          />
          <FeatureCard
            title="Holidays"
            icon={Calendar}
            color="blue"
            href="/app/parent/holidays"
            compact
          />
          <FeatureCard
            title="Timetable"
            icon={Clock}
            color="yellow"
            href="/app/parent/timetable"
            compact
          />
          <FeatureCard
            title="Downloads"
            icon={Download}
            color="gray"
            href="/app/parent/downloads"
            compact
          />
        </div>
      </RoleSection>

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
