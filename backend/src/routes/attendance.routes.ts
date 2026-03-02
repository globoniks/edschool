import { Router } from 'express';
import {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  getAttendanceStats,
  markTeacherAttendance,
  getTeacherAttendance,
  getTeacherAttendanceStats,
} from '../controllers/attendance.controller.js';
import { authenticate, authorizeByPermission, allowTeacherOrPermission } from '../middleware/auth.middleware.js';

export const attendanceRoutes = Router();

attendanceRoutes.use(authenticate);

attendanceRoutes.post('/', allowTeacherOrPermission('manageAcademic'), markAttendance);
attendanceRoutes.post('/bulk', allowTeacherOrPermission('manageAcademic'), markBulkAttendance);
attendanceRoutes.get('/', getAttendance);
attendanceRoutes.get('/stats', getAttendanceStats);
attendanceRoutes.post('/teacher', authorizeByPermission('manageHR'), markTeacherAttendance);
attendanceRoutes.get('/teacher/stats', allowTeacherOrPermission('manageHR'), getTeacherAttendanceStats);
attendanceRoutes.get('/teacher', allowTeacherOrPermission('manageHR'), getTeacherAttendance);

