import express from 'express';
import { userController } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes (authentication required)
router.use(authMiddleware.protect);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Admin only routes
router.get('/', authMiddleware.restrictTo('admin'), userController.getAllUsers);
router.get('/:id', authMiddleware.restrictTo('admin'), userController.getUserById);
router.put('/:id', authMiddleware.restrictTo('admin'), userController.updateUser);
router.delete('/:id', authMiddleware.restrictTo('admin'), userController.deleteUser);
router.put('/:id/deactivate', authMiddleware.restrictTo('admin'), userController.deactivateUser);
router.put('/:id/reactivate', authMiddleware.restrictTo('admin'), userController.reactivateUser);

export default router;
