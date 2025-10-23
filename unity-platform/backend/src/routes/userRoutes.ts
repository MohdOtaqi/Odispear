import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as userController from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Upload image (avatar/banner)
router.post('/upload-image', userController.uploadMiddleware, userController.uploadImage);

// Update profile
router.patch('/profile', userController.updateProfile);

// Change password
router.post('/change-password', userController.changePassword);

// Get user profile
router.get('/:userId', userController.getUserProfile);

export default router;
