import { Router } from 'express';
import {
  createFeeStructure,
  getFeeStructures,
  createPayment,
  updatePayment,
  getPayments,
  getFeeDues,
} from '../controllers/fee.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const feeRoutes = Router();

feeRoutes.use(authenticate);

feeRoutes.post('/structures', authorize('ADMIN'), createFeeStructure);
feeRoutes.get('/structures', getFeeStructures);
feeRoutes.post('/payments', authorize('ADMIN', 'TEACHER'), createPayment);
feeRoutes.patch('/payments/:id', authorize('ADMIN', 'TEACHER'), updatePayment);
feeRoutes.get('/payments', getPayments);
feeRoutes.get('/dues/:studentId', getFeeDues);

