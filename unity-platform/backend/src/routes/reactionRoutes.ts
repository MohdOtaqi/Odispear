import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  addReaction,
  removeReaction,
  getReactions,
  bulkAddReactions,
  getReactionUsers
} from '../controllers/reactionController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Reaction routes
router.post('/message/:messageId', addReaction);
router.delete('/message/:messageId/:emoji', removeReaction);
router.get('/message/:messageId', getReactions);
router.post('/message/:messageId/bulk', bulkAddReactions);
router.get('/message/:messageId/:emoji/users', getReactionUsers);

export default router;