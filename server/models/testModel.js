const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function(options) {
                return options.length >= 2 && options.length <= 6;
            },
            message: 'A question must have between 2 and 6 options'
        }
    },
    correctAnswerIndex: {
        type: Number,
        required: true,
        validate: {
            validator: function(index) {
                return index >= 0 && index < this.options.length;
            },
            message: 'Correct answer index must be valid'
        }
    },
    marks: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    }
});

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 200
    },
    description: {
        type: String,
        trim: true,
        maxLength: 1000
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questions: {
        type: [questionSchema],
        required: true,
        validate: {
            validator: function(questions) {
                return questions.length > 0;
            },
            message: 'Test must have at least one question'
        }
    },
    totalMarks: {
        type: Number,
        required: false,
        min: 1
    },
    duration: {
        type: Number, // Duration in minutes
        min: 1,
        max: 600, // Maximum 10 hours
        default: null // null means no time limit
    },
    dueDate: {
        type: Date,
        validate: {
            validator: function(date) {
                return !date || date > new Date();
            },
            message: 'Due date must be in the future'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    allowReview: {
        type: Boolean,
        default: false // Allow students to review answers after submission
    },
    randomizeQuestions: {
        type: Boolean,
        default: false
    },
    randomizeOptions: {
        type: Boolean,
        default: false
    },
    maxAttempts: {
        type: Number,
        default: 1,
        min: 1,
        max: 5
    },
    instructions: {
        type: String,
        maxLength: 2000
    }
}, {
    timestamps: true
});

// Pre-save middleware to calculate total marks
testSchema.pre('save', function(next) {
    if (this.questions && this.questions.length > 0) {
        this.totalMarks = this.questions.reduce((sum, question) => sum + question.marks, 0);
    }
    next();
});

// Index for better query performance
testSchema.index({ department: 1, semester: 1, subject: 1 });
testSchema.index({ createdBy: 1 });
testSchema.index({ isActive: 1, dueDate: 1 });

const Test = mongoose.model('Test', testSchema);
module.exports = Test;
