import { Router } from 'express';
import {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  getAttendanceStats,
  markTeacherAttendance,
} from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const attendanceRoutes = Router();

attendanceRoutes.use(authenticate);

// TEACHER and school admins can mark student attendance
attendanceRoutes.post('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'TEACHER'), markAttendance);
attendanceRoutes.post('/bulk', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'TEACHER'), markBulkAttendance);
attendanceRoutes.get('/', getAttendance);
attendanceRoutes.get('/stats', getAttendanceStats);
// Only SCHOOL_ADMIN can mark teacher attendance
attendanceRoutes.post('/teacher', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'), markTeacherAttendance);

