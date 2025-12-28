const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        required: true,
        enum: ['study_material', 'assignment', 'assignment_submission', 'test', 'test_submission', 'notice', 'grade', 'attendance', 'system', 'reminder', 'paid_note']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        // Can reference different collections based on type
    },
    relatedModel: {
        type: String,
        // Model name that relatedId references
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        // Additional data specific to notification type
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });

// TTL index for expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model('Notification', notificationSchema);

// Helper functions for the activities service
const getNotificationsForStudent = async (studentId, limit = 20) => {
    try {
        const notifications = await Notification.find({
            recipientId: studentId,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        })
        .populate('senderId', 'fullname username role')
        .sort({ createdAt: -1 })
        .limit(limit);
        
        return notifications;
    } catch (error) {
        console.error('Error fetching notifications for student:', error);
        throw error;
    }
};

// Create a new notification
const createNotification = async (notificationData) => {
    try {
        const notification = new Notification(notificationData);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Create bulk notifications
const createBulkNotifications = async (notifications) => {
    try {
        const result = await Notification.insertMany(notifications);
        return result;
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
        throw error;
    }
};

// Mark notification as read
const markNotificationAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipientId: userId },
            { 
                $set: { 
                    isRead: true,
                    readAt: new Date()
                }
            },
            { new: true }
        );
        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Mark multiple notifications as read
const markNotificationsAsRead = async (notificationIds, userId) => {
    try {
        await Notification.updateMany(
            { 
                _id: { $in: notificationIds },
                recipientId: userId
            },
            { 
                $set: { 
                    isRead: true,
                    readAt: new Date()
                }
            }
        );
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
    }
};

// Get unread notification count
const getUnreadNotificationCount = async (userId) => {
    try {
        const count = await Notification.countDocuments({
            recipientId: userId,
            isRead: false,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        });
        return count;
    } catch (error) {
        console.error('Error getting unread notification count:', error);
        throw error;
    }
};

// Delete old notifications
const deleteExpiredNotifications = async () => {
    try {
        const result = await Notification.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        return result;
    } catch (error) {
        console.error('Error deleting expired notifications:', error);
        throw error;
    }
};

module.exports = {
    Notification,
    getNotificationsForStudent,
    createNotification,
    createBulkNotifications,
    markNotificationAsRead,
    markNotificationsAsRead,
    getUnreadNotificationCount,
    deleteExpiredNotifications
};
