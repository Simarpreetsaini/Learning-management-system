const mongoose = require('mongoose');

const submittedAnswerSchema = new mongoose.Schema({
    questionIndex: {
        type: Number,
        required: true,
        min: 0
    },
    selectedOptionIndex: {
        type: Number,
        required: true,
        min: 0
    },
    isCorrect: {
        type: Boolean,
        default: false
    },
    marksObtained: {
        type: Number,
        default: 0,
        min: 0
    },
    timeTaken: {
        type: Number, // Time taken for this question in seconds
        default: 0
    }
});

const testSubmissionSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attemptNumber: {
        type: Number,
        default: 1,
        min: 1
    },
    submittedAnswers: {
        type: [submittedAnswerSchema],
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    timeTaken: {
        type: Number, // Total time taken in minutes
        min: 0
    },
    isLateSubmission: {
        type: Boolean,
        default: false
    },
    questionOrder: {
        type: [Number], // For randomized questions
        default: []
    },
    optionOrders: {
        type: Map, // For randomized options per question
        of: [Number],
        default: new Map()
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Pre-save middleware to calculate percentage and time taken
testSubmissionSchema.pre('save', function(next) {
    if (this.score !== undefined && this.totalMarks > 0) {
        this.percentage = Math.round((this.score / this.totalMarks) * 100 * 100) / 100;
    }
    
    if (this.startTime && this.endTime) {
        this.timeTaken = Math.round((this.endTime - this.startTime) / (1000 * 60) * 100) / 100;
    }
    
    next();
});

// Compound index to ensure one submission per attempt per student per test
testSubmissionSchema.index({ testId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
testSubmissionSchema.index({ studentId: 1, submissionDate: -1 });
testSubmissionSchema.index({ testId: 1, score: -1 });

const TestSubmission = mongoose.model('TestSubmission', testSubmissionSchema);
module.exports = TestSubmission;
