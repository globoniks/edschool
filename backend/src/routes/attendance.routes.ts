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

attendanceRoutes.post('/', authorize('ADMIN', 'TEACHER'), markAttendance);
attendanceRoutes.post('/bulk', authorize('ADMIN', 'TEACHER'), markBulkAttendance);
attendanceRoutes.get('/', getAttendance);
attendanceRoutes.get('/stats', getAttendanceStats);
attendanceRoutes.post('/teacher', authorize('ADMIN'), markTeacherAttendance);

