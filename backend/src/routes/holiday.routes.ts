import { Router } from 'express';
import {
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holiday.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const holidayRoutes = Router();

holidayRoutes.use(authenticate);

// Only SCHOOL_ADMIN can manage holidays
holidayRoutes.post('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), createHoliday);
holidayRoutes.patch('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), updateHoliday);
holidayRoutes.delete('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), deleteHoliday);

// All authenticated roles can read holidays for their school
holidayRoutes.get('/', getHolidays);



