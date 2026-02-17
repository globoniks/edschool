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

// Only FINANCE_ADMIN and SCHOOL_ADMIN can manage fees
feeRoutes.post('/structures', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE_ADMIN'), createFeeStructure);
feeRoutes.get('/structures', getFeeStructures);
feeRoutes.post('/payments', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE_ADMIN'), createPayment);
feeRoutes.patch('/payments/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE_ADMIN'), updatePayment);
feeRoutes.get('/payments', getPayments);
feeRoutes.get('/dues/:studentId', getFeeDues);

