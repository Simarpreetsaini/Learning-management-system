const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification
} = require('../controllers/notificationController');

// Import authentication middleware
const authMiddleware = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for the current user
 * @access  Private
 * @query   page, limit
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for the current user
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:notificationId/read', markAsRead);

/**
 * @route   PUT /api/notifications/mark-multiple-read
 * @desc    Mark multiple notifications as read
 * @access  Private
 * @body    { notificationIds: [id1, id2, ...] }
 */
router.put('/mark-multiple-read', markMultipleAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for the current user
 * @access  Private
 */
router.put('/mark-all-read', markAllAsRead);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification (admin only)
 * @access  Private (Admin)
 * @body    { recipientId, title, message, type?, priority?, metadata? }
 */
router.post('/', (req, res, next) => {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
}, createNotification);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:notificationId', deleteNotification);

module.exports = router;
