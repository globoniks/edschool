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

examRoutes.post('/', authorize('ADMIN', 'TEACHER'), createExam);
examRoutes.get('/', getExams);
examRoutes.post('/marks', authorize('ADMIN', 'TEACHER'), createExamMark);
examRoutes.get('/marks', getExamMarks);
examRoutes.get('/report-card/:studentId/:examId', getReportCard);

