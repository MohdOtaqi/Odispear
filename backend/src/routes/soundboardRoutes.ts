import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import {
  getSounds,
  uploadSound,
  deleteSound,
  toggleFavorite,
  playSound,
  getGuildSounds
} from '../controllers/soundboardController';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      // @ts-ignore
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// Sound management
router.get('/sounds', getSounds);
router.get('/guilds/:guildId/sounds', getGuildSounds);
router.post('/upload', upload.single('file'), uploadSound);
router.delete('/sounds/:soundId', deleteSound);
router.post('/sounds/:soundId/favorite', toggleFavorite);
router.post('/play', playSound);

export default router; // <-- This line was missing
