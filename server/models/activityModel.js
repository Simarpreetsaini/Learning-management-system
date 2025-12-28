const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['assignment', 'test', 'notice', 'material', 'attendance', 'login', 'submission', 'grade']
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        // Can reference different collections based on type
    },
    relatedModel: {
        type: String,
        // Model name that relatedId references (Assignment, Test, etc.)
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        // Additional data specific to activity type
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });

const Activity = mongoose.model('Activity', activitySchema);

// Helper functions for the activities service
const getActivitiesByUserIds = async (userIds) => {
    try {
        const activities = await Activity.find({
            userId: { $in: userIds }
        })
        .populate('userId', 'fullname username role')
        .sort({ timestamp: -1 })
        .limit(50); // Limit to recent 50 activities
        
        return activities;
    } catch (error) {
        console.error('Error fetching activities by user IDs:', error);
        throw error;
    }
};

// Create a new activity
const createActivity = async (activityData) => {
    try {
        const activity = new Activity(activityData);
        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error creating activity:', error);
        throw error;
    }
};

// Get activities for a specific user
const getActivitiesByUserId = async (userId, limit = 20) => {
    try {
        const activities = await Activity.find({ userId })
            .populate('userId', 'fullname username role')
            .sort({ timestamp: -1 })
            .limit(limit);
        
        return activities;
    } catch (error) {
        console.error('Error fetching activities by user ID:', error);
        throw error;
    }
};

// Mark activities as read
const markActivitiesAsRead = async (activityIds) => {
    try {
        await Activity.updateMany(
            { _id: { $in: activityIds } },
            { $set: { isRead: true } }
        );
    } catch (error) {
        console.error('Error marking activities as read:', error);
        throw error;
    }
};

module.exports = {
    Activity,
    getActivitiesByUserIds,
    createActivity,
    getActivitiesByUserId,
    markActivitiesAsRead
};
