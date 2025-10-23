import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getOnlineUsers,
  updateUserStatus,
  setCustomStatus,
  clearCustomStatus,
  getUserStatus
} from '../controllers/statusController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User status routes
router.get('/online', getOnlineUsers);
router.get('/user/:userId', getUserStatus);
router.patch('/update', updateUserStatus);
router.post('/custom', setCustomStatus);
router.delete('/custom', clearCustomStatus);

export default router;