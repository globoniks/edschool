import { Router } from 'express';
import { getSyllabusTracking } from '../controllers/syllabus.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const syllabusRoutes = Router();

syllabusRoutes.use(authenticate);
syllabusRoutes.get('/tracking', getSyllabusTracking);

