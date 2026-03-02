import { Router } from 'express';
import { subscribe, unsubscribe, getVapidKey } from '../controllers/push.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const pushRoutes = Router();

pushRoutes.get('/vapid-key', getVapidKey);

pushRoutes.use(authenticate);
pushRoutes.post('/subscribe', subscribe);
pushRoutes.delete('/unsubscribe', unsubscribe);
