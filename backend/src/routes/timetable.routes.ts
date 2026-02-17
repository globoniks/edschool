import { Router } from 'express';
import {
  createTimetable,
  getTimetables,
  updateTimetable,
  deleteTimetable,
} from '../controllers/timetable.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const timetableRoutes = Router();

timetableRoutes.use(authenticate);

// Only ACADEMIC_ADMIN and SCHOOL_ADMIN can manage timetables
timetableRoutes.post('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'), createTimetable);
timetableRoutes.get('/', getTimetables);
timetableRoutes.patch('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'), updateTimetable);
timetableRoutes.delete('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'), deleteTimetable);

