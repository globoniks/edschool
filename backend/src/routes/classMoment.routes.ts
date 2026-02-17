import { Router } from 'express';
import { createClassMoment, getClassMoments } from '../controllers/classMoment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const classMomentRoutes = Router();

classMomentRoutes.use(authenticate);

classMomentRoutes.post('/', createClassMoment);
classMomentRoutes.get('/', getClassMoments);
