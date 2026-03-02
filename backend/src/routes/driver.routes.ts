import { Router } from 'express';
import { authenticate, authorizePermissions } from '../middleware/auth.middleware.js';
import {
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  toggleDriverStatus,
} from '../controllers/driver.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorizePermissions('manageTransport'));

router.get('/', listDrivers);
router.get('/:id', getDriver);
router.post('/', createDriver);
router.patch('/:id', updateDriver);
router.patch('/:id/toggle', toggleDriverStatus);
router.delete('/:id', deleteDriver);

export default router;
