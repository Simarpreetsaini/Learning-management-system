const mongoose = require('mongoose')
require('dotenv').config()

const noticeboardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true,
        trim: true
    },
    noticedocument: {
        type: String,
        required: false,
    },
    // New fields for visibility control
    visibility: {
        type: String,
        enum: ['public', 'students', 'all'],
        default: 'all',
        required: true
    },
    // Teacher information
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model for teachers
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    // Priority levels
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    // Categories for better organization
    category: {
        type: String,
        enum: ['general', 'academic', 'events', 'event', 'exam', 'holiday', 'maintenance', 'urgent'],
        default: 'general'
    },
    // Expiry date for notices
    expiryDate: {
        type: Date,
        required: false
    },
    // Status for active/inactive notices
    status: {
        type: String,
        enum: ['active', 'inactive', 'expired'],
        default: 'active'
    },
    // Tags for better searchability
    tags: [{
        type: String,
        trim: true
    }],
    // View count
    viewCount: {
        type: Number,
        default: 0
    },
    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for better query performance
noticeboardSchema.index({ visibility: 1, status: 1, timestamp: -1 });
noticeboardSchema.index({ expiryDate: 1 });
noticeboardSchema.index({ category: 1 });

// Middleware to update the updatedAt field
noticeboardSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Method to check if notice is expired
noticeboardSchema.methods.isExpired = function() {
    return this.expiryDate && this.expiryDate < new Date();
};

// Static method to get active notices by visibility
noticeboardSchema.statics.getActiveNotices = function(visibility = 'all') {
    let visibilityConditions = [];
    
    if (visibility !== 'all') {
        visibilityConditions = [
            { visibility: visibility },
            { visibility: 'all' }
        ];
    } else {
        visibilityConditions = [
            { visibility: 'all' },
            { visibility: 'public' },
            { visibility: 'students' }
        ];
    }
    
    const query = {
        status: 'active',
        $and: [
            {
                $or: visibilityConditions
            },
            {
                $or: [
                    { expiryDate: { $gt: new Date() } },
                    { expiryDate: null }
                ]
            }
        ]
    };
    
    return this.find(query).sort({ priority: -1, timestamp: -1 });
};

const Noticeboard = mongoose.model("Noticeboard", noticeboardSchema);
module.exports = Noticeboard;