import { Router } from 'express';
import { getAlerts, markAlertAsRead, markAllAlertsAsRead } from '../controllers/alert.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const alertRoutes = Router();

alertRoutes.use(authenticate);
alertRoutes.get('/', getAlerts);
alertRoutes.patch('/:id/read', markAlertAsRead);
alertRoutes.patch('/read-all', markAllAlertsAsRead);

