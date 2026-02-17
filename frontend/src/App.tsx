import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AIAssistant from './components/AIAssistant';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Lazy load pages for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Fees = lazy(() => import('./pages/Fees'));
const Exams = lazy(() => import('./pages/Exams'));
const Timetable = lazy(() => import('./pages/Timetable'));
const Homework = lazy(() => import('./pages/Homework'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Messages = lazy(() => import('./pages/Messages'));
const Academic = lazy(() => import('./pages/Academic'));
const Holidays = lazy(() => import('./pages/Holidays'));
const ParentPortal = lazy(() => import('./pages/ParentPortal'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const ClassMoments = lazy(() => import('./pages/ClassMoments'));

// Parent-specific pages
const ParentAttendance = lazy(() => import('./pages/parent/Attendance'));
const ParentHomework = lazy(() => import('./pages/parent/Homework'));
const ParentNotices = lazy(() => import('./pages/parent/Notices'));
const ParentAcademicPerformance = lazy(() => import('./pages/parent/AcademicPerformance'));
const ParentSyllabusTracking = lazy(() => import('./pages/parent/SyllabusTracking'));
const ParentBusTracking = lazy(() => import('./pages/parent/BusTracking'));
const ParentSubjectVideos = lazy(() => import('./pages/parent/SubjectVideos'));
const ParentEventGallery = lazy(() => import('./pages/parent/EventGallery'));
const ParentFeesPayments = lazy(() => import('./pages/parent/FeesPayments'));
const ParentTimetable = lazy(() => import('./pages/parent/Timetable'));
const ParentDownloads = lazy(() => import('./pages/parent/Downloads'));
const ParentMessages = lazy(() => import('./pages/parent/Messages'));
const ParentProfile = lazy(() => import('./pages/parent/Profile'));
const ParentAlerts = lazy(() => import('./pages/parent/Alerts'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Helper function to get default route based on user role
const getDefaultRoute = (role?: string): string => {
  if (role === 'PARENT') return '/app/parent-portal';
  if (role === 'TEACHER') return '/app/teacher-dashboard';
  if (role === 'STUDENT') return '/app/student-dashboard';
  return '/app/dashboard';
};

// Routes that depend on auth – rendered inside Router so hooks and useNavigate work correctly
function AppRoutes() {
  const { token, user } = useAuthStore();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to={getDefaultRoute(user?.role)} replace /> : <Landing />}
        />
        <Route path="/login" element={token ? <Navigate to={getDefaultRoute(user?.role)} replace /> : <Login />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={getDefaultRoute(user?.role)} replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="fees" element={<Fees />} />
          <Route path="exams" element={<Exams />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="homework" element={<Homework />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="messages" element={<Messages />} />
          <Route path="academic" element={<Academic />} />
          <Route path="holidays" element={<Holidays />} />
          <Route path="parent-portal" element={<ParentPortal />} />
          <Route path="teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="student-dashboard" element={<StudentDashboard />} />
          <Route path="class-moments" element={<ClassMoments />} />
          
          {/* Parent-specific routes */}
          <Route path="parent/attendance" element={<ParentAttendance />} />
          <Route path="parent/homework" element={<ParentHomework />} />
          <Route path="parent/notices" element={<ParentNotices />} />
          <Route path="parent/academic-performance" element={<ParentAcademicPerformance />} />
          <Route path="parent/syllabus" element={<ParentSyllabusTracking />} />
          <Route path="parent/bus" element={<ParentBusTracking />} />
          <Route path="parent/videos" element={<ParentSubjectVideos />} />
          <Route path="parent/gallery" element={<ParentEventGallery />} />
          <Route path="parent/fees" element={<ParentFeesPayments />} />
          <Route path="parent/timetable" element={<ParentTimetable />} />
        <Route path="parent/downloads" element={<ParentDownloads />} />
        <Route path="parent/messages" element={<ParentMessages />} />
        <Route path="parent/profile" element={<ParentProfile />} />
        <Route path="parent/alerts" element={<ParentAlerts />} />
        </Route>
        {/* Redirect old routes to new /app routes for backward compatibility */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/students" element={<Navigate to="/app/students" replace />} />
        <Route path="/teachers" element={<Navigate to="/app/teachers" replace />} />
        <Route path="/attendance" element={<Navigate to="/app/attendance" replace />} />
        <Route path="/fees" element={<Navigate to="/app/fees" replace />} />
        <Route path="/exams" element={<Navigate to="/app/exams" replace />} />
        <Route path="/timetable" element={<Navigate to="/app/timetable" replace />} />
        <Route path="/homework" element={<Navigate to="/app/homework" replace />} />
        <Route path="/announcements" element={<Navigate to="/app/announcements" replace />} />
        <Route path="/messages" element={<Navigate to="/app/messages" replace />} />
        <Route path="/academic" element={<Navigate to="/app/academic" replace />} />
        <Route path="/holidays" element={<Navigate to="/app/holidays" replace />} />
      </Routes>
    </Suspense>
  );
}

// Match router basename to Vite base so /edschool/login works when app is served at /edschool/
const routerBasename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter
        basename={routerBasename}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ErrorBoundary>
          <AppRoutes />
          <AIAssistant position="bottom-right" />
          <PWAInstallPrompt />
        </ErrorBoundary>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

