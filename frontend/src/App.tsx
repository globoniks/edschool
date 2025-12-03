import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Exams from './pages/Exams';
import Timetable from './pages/Timetable';
import Homework from './pages/Homework';
import Announcements from './pages/Announcements';
import Messages from './pages/Messages';
import Academic from './pages/Academic';
import Holidays from './pages/Holidays';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" replace /> : <Landing />}
        />
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
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
    </BrowserRouter>
  );
}

export default App;

