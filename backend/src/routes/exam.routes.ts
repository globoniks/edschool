import { Router } from 'express';
import {
  createExam,
  getExams,
  createExamMark,
  getExamMarks,
  getReportCard,
} from '../controllers/exam.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const examRoutes = Router();

examRoutes.use(authenticate);

// SCHOOL_ADMIN and ACADEMIC_ADMIN can create exams
examRoutes.post('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'), createExam);
examRoutes.get('/', getExams);
// ACADEMIC_ADMIN, HOD, and TEACHER can enter marks
examRoutes.post('/marks', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'HOD', 'TEACHER'), createExamMark);
examRoutes.get('/marks', getExamMarks);
examRoutes.get('/report-card/:studentId/:examId', getReportCard);

