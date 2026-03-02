import { Router } from 'express';
import {
  sendMessage,
  getMessages,
  markAsRead,
  getRecipients,
  getRecipientClasses,
  sendToClass,
} from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const messageRoutes = Router();

messageRoutes.use(authenticate);

messageRoutes.get('/recipients', getRecipients);
messageRoutes.get('/recipient-classes', getRecipientClasses);
messageRoutes.post('/send-to-class', sendToClass);
messageRoutes.post('/', sendMessage);
messageRoutes.get('/', getMessages);
messageRoutes.patch('/:id/read', markAsRead);

