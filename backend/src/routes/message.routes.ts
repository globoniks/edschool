import { Router } from 'express';
import {
  sendMessage,
  getMessages,
  markAsRead,
} from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const messageRoutes = Router();

messageRoutes.use(authenticate);

messageRoutes.post('/', sendMessage);
messageRoutes.get('/', getMessages);
messageRoutes.patch('/:id/read', markAsRead);

