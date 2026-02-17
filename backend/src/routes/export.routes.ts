import { Router } from 'express';
import {
  exportStudents,
  exportTeachers,
  exportExams,
  exportFees,
} from '../controllers/export.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const exportRoutes = Router();

exportRoutes.use(authenticate);

// Export routes - accessible to users with appropriate permissions
exportRoutes.get('/students', exportStudents);
exportRoutes.get('/teachers', exportTeachers);
exportRoutes.get('/exams', exportExams);
exportRoutes.get('/fees', exportFees);

