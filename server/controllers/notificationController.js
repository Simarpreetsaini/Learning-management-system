const { 
    getUserNotifications, 
    createGeneralNotification 
} = require('../services/notificationService');
const { 
    markNotificationAsRead, 
    markNotificationsAsRead, 
    getUnreadNotificationCount 
} = require('../models/notificationModel');

/**
 * Get notifications for the current user
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await getUserNotifications(userId, page, limit);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const count = await getUnreadNotificationCount(userId);

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message
        });
    }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id || req.user.id;

        const notification = await markNotificationAsRead(notificationId, userId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

/**
 * Mark multiple notifications as read
 */
const markMultipleAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        const userId = req.user._id || req.user.id;

        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification IDs provided'
            });
        }

        await markNotificationsAsRead(notificationIds, userId);

        res.status(200).json({
            success: true,
            message: 'Notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read',
            error: error.message
        });
    }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        // Get all unread notification IDs for the user
        const { Notification } = require('../models/notificationModel');
        const unreadNotifications = await Notification.find({
            recipientId: userId,
            isRead: false
        }).select('_id');

        const notificationIds = unreadNotifications.map(n => n._id);

        if (notificationIds.length > 0) {
            await markNotificationsAsRead(notificationIds, userId);
        }

        res.status(200).json({
            success: true,
            message: `Marked ${notificationIds.length} notifications as read`
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
};

/**
 * Create a new notification (admin only)
 */
const createNotification = async (req, res) => {
    try {
        const { recipientId, title, message, type, priority, metadata } = req.body;

        if (!recipientId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Recipient ID, title, and message are required'
            });
        }

        const notification = await createGeneralNotification(
            recipientId,
            title,
            message,
            type,
            priority,
            metadata
        );

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: error.message
        });
    }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id || req.user.id;

        const { Notification } = require('../models/notificationModel');
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipientId: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification
};
