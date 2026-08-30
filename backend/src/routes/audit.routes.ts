import { Router } from 'express';
import { listAuditLogs, listAuditActions } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const auditRoutes = Router();

// Read-only, admins only. There is intentionally no write/delete route.
auditRoutes.use(authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'));

auditRoutes.get('/', listAuditLogs);
auditRoutes.get('/actions', listAuditActions);
