import { Router } from 'express';
import {
  createExam,
  getExams,
  createExamMark,
  getExamMarks,
  getReportCard,
} from '../controllers/exam.controller.js';
import { authenticate, authorizeRoles, authorizePermissions, authorizeByPermission } from '../middleware/auth.middleware.js';

export const examRoutes = Router();

examRoutes.use(authenticate);

// Create exam: SCHOOL_ADMIN or SUB_ADMIN with manageAcademic
examRoutes.post('/', authorizeByPermission('manageAcademic'), createExam);
examRoutes.get('/', getExams);
// STEP 6: POST /exam/marks requires SCHOOL_ADMIN or TEACHER + enterMarks or hodEnterExamMarks
examRoutes.post('/marks', authorizeRoles('SCHOOL_ADMIN', 'TEACHER'), authorizePermissions('enterMarks', 'hodEnterExamMarks'), createExamMark);
examRoutes.get('/marks', getExamMarks);
examRoutes.get('/report-card/:studentId/:examId', getReportCard);

