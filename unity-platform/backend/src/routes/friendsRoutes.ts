import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getFriends,
  getPendingRequests,
  getSentRequests,
  getBlockedUsers,
  searchUsers,
} from '../controllers/friendsController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Friend management
router.get('/', getFriends);
router.post('/request', sendFriendRequest);
router.get('/pending', getPendingRequests);
router.get('/sent', getSentRequests);
router.post('/:requestId/accept', acceptFriendRequest);
router.post('/:requestId/reject', rejectFriendRequest);
router.delete('/:friendId', removeFriend);

// Block management
router.get('/blocked', getBlockedUsers);
router.post('/block/:userId', blockUser);
router.post('/unblock/:userId', unblockUser);

// User search
router.get('/search', searchUsers);

export default router;
