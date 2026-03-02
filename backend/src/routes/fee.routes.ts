import { Router } from 'express';
import {
  createFeeStructure,
  getFeeStructures,
  createPayment,
  updatePayment,
  getPayments,
  getFeeDues,
} from '../controllers/fee.controller.js';
import { authenticate, authorizeRoles, authorizePermissions } from '../middleware/auth.middleware.js';

export const feeRoutes = Router();

feeRoutes.use(authenticate);

// STEP 6: POST /fees requires SCHOOL_ADMIN or SUB_ADMIN + manageFees
feeRoutes.post('/structures', authorizeRoles('SCHOOL_ADMIN', 'SUB_ADMIN'), authorizePermissions('manageFees', 'manageFinance'), createFeeStructure);
feeRoutes.get('/structures', getFeeStructures);
feeRoutes.post('/payments', authorizeRoles('SCHOOL_ADMIN', 'SUB_ADMIN'), authorizePermissions('manageFees', 'manageFinance'), createPayment);
feeRoutes.patch('/payments/:id', authorizeRoles('SCHOOL_ADMIN', 'SUB_ADMIN'), authorizePermissions('manageFees', 'manageFinance'), updatePayment);
feeRoutes.get('/payments', getPayments);
feeRoutes.get('/dues/:studentId', getFeeDues);

