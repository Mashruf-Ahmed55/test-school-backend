import { Router } from 'express';
import {
  getAllUsers,
  getCertificationStats,
  getQuestionBankStats,
  getSystemStats,
  manageUser,
} from '../controllers/admin.controller.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/protectAdmin.js';

export const adminRouter = Router();

adminRouter.get(
  '/get-system-stats',
  authenticateUser,
  authorizeRoles('admin'),
  getSystemStats
);

adminRouter.get(
  '/get-certification-stats',
  authenticateUser,
  authorizeRoles('admin'),
  getCertificationStats
);

adminRouter.get(
  '/get-user/:id',
  authenticateUser,
  authorizeRoles('admin'),
  manageUser
);

adminRouter.get(
  '/get-all-users',
  authenticateUser,
  authorizeRoles('admin'),
  getAllUsers
);

adminRouter.get(
  '/get-question-bank-stats',
  authenticateUser,
  authorizeRoles('admin'),
  getQuestionBankStats
);

export default adminRouter;
