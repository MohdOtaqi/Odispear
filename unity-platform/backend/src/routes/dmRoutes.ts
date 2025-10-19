import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createDM,
  createGroupDM,
  getDMChannels,
  getDMMessages,
  sendDMMessage,
  updateDMMessage,
  deleteDMMessage,
  addDMReaction,
  removeDMReaction,
  leaveDM,
} from '../controllers/dmController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// DM channel management
router.get('/channels', getDMChannels); // Changed from '/' to '/channels'
router.get('/', getDMChannels); // Keep backward compatibility
router.post('/create', createDM);
router.post('/group', createGroupDM);
router.delete('/:channelId/leave', leaveDM);

// DM messages
router.get('/:channelId/messages', getDMMessages);
router.post('/:channelId/messages', sendDMMessage);
router.patch('/messages/:messageId', updateDMMessage);
router.delete('/messages/:messageId', deleteDMMessage);

// DM reactions
router.post('/messages/:messageId/reactions', addDMReaction);
router.delete('/messages/:messageId/reactions/:emoji', removeDMReaction);

export default router;
