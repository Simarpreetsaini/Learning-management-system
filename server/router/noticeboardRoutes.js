const express = require('express');
const router = express.Router();
const {
    createNotice,
    getAllNotices,
    getActiveNotices,
    getNoticeById,
    updateNotice,
    deleteNotice,
    getNoticesByAuthor,
    getNoticesByCategory,
    updateNoticeStatus,
    searchNotices,
    getNoticeStats,
    downloadNoticeDocument
} = require('../controllers/noticeboardController');

// Import your existing auth middleware
const authMiddleware = require('../middlewares/authMiddleware');
const { documentUpload, handleMulterError } = require('../middlewares/multerConfig');
const Noticeboard = require('../models/noticeBoardModel');

// Public routes (no authentication required)
router.get('/search', searchNotices); // Search notices
router.get('/category/:category', getNoticesByCategory); // Get notices by category
router.get('/public', async (req, res) => {
  try {
    const publicNotices = await Noticeboard.find({
      visibility: { $in: ['public', 'all'] },
      status: 'active',
      $or: [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: null }
      ]
    })
    .populate('author', 'fullname username role')
    .sort({ priority: -1, timestamp: -1 });

    res.json({
      success: true,
      notices: publicNotices
    });
  } catch (error) {
    console.error('Error fetching public notices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public notices'
    });
  }
});

// Public download route for notice documents (no authentication required)
router.get('/:id/download', downloadNoticeDocument); // Download notice document

// Protected routes (authentication required)
router.use(authMiddleware); // Apply auth middleware to all routes below

// Active notices route (needs authentication to determine visibility)
router.get('/active', getActiveNotices); // Get all active notices

// CRUD operations
router.post('/', documentUpload.single('noticedocument'), handleMulterError, createNotice); // Create new notice (teachers only)
router.get('/', getAllNotices); // Get all notices with filtering
router.get('/stats', getNoticeStats); // Get dashboard statistics

// Single notice operations
router.get('/:id', getNoticeById); // Get single notice by ID
router.put('/:id', documentUpload.single('noticedocument'), handleMulterError, updateNotice); // Update notice
router.delete('/:id', deleteNotice); // Delete notice

// Additional routes
router.get('/author/:authorId', getNoticesByAuthor); // Get notices by author
router.patch('/:id/status', updateNoticeStatus); // Update notice status only

module.exports = router;