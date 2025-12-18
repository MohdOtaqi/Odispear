import { Router } from 'express';
import { register, login, logout, refreshToken, getCurrentUser, updateProfile, googleAuthCallback, requestPasswordReset, resetPassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import passport from '../config/passport';
import Joi from 'joi';

const router = Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(50).required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  display_name: Joi.string().max(100),
  status: Joi.string().valid('online', 'idle', 'dnd', 'offline'),
  status_text: Joi.string().max(200).allow(''),
  avatar_url: Joi.string().uri().allow(''),
});

const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required(),
});

const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

// PUBLIC routes - NO auth middleware
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleAuthCallback as any);

// Password reset routes
router.post('/forgot-password', validate(passwordResetRequestSchema), requestPasswordReset);
router.post('/reset-password', validate(passwordResetSchema), resetPassword);

// PROTECTED routes - require auth
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);
router.patch('/me', authenticateToken, validate(updateProfileSchema), updateProfile);

export default router;
