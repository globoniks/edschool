import { Router } from 'express';
import { getBusTracking } from '../controllers/bus.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const busRoutes = Router();

busRoutes.use(authenticate);
busRoutes.get('/tracking', getBusTracking);

