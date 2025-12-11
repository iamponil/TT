import { Router } from 'express';
import { body } from 'express-validator';
import AuthController from './controllers/AuthController';
import UserController from './controllers/UserController';
import { loginLimiter, registerLimiter } from './middleware/rateLimit';
import { authenticate } from './middleware/auth';
import { authorize } from './middleware/role';

const router = Router();

// ----------------- AUTH -----------------
// Register
router.post(
  '/register',
  registerLimiter,
  [
    body('name').isLength({ min: 2 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('password must be at least 8 chars'),
  ],
  AuthController.register
);

// Login
router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').exists()],
  AuthController.login
);

// Refresh token
router.post('/refresh', AuthController.refresh);

// Logout
router.post('/logout', AuthController.logout);

// ----------------- USER -----------------
// Get all users (Admin only)
router.get('/', authenticate, authorize('Admin'), UserController.getAllUsers);

// Get current user
router.get('/me', authenticate, UserController.me);

// Admin-only role change
router.patch(
  '/:id/role',
  authenticate,
  authorize('Admin'),
  body('role').isIn(['Admin', 'Éditeur', 'Rédacteur', 'Lecteur']),
  UserController.updateRole
);

// ----------------- DASHBOARD STATISTICS -----------------
// User summary
router.get('/api/v1/users/summary', authenticate, UserController.getSummary);

// Signups by day
router.get('/api/v1/users/signups-by-day', authenticate, UserController.getSignupsByDay);

// Users by role
router.get('/api/v1/users/by-role', authenticate, UserController.getUsersByRole);

// Active users per hour
router.get('/api/v1/users/active-per-hour', authenticate, UserController.getActivePerHour);

// Top contributors
router.get('/api/v1/users/top-contributors', authenticate, UserController.getTopContributors);

export default router;
