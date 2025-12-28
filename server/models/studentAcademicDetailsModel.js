const mongoose = require('mongoose');
require('dotenv').config();

const academicDetailsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    universityRollNo: {  // Changed from universityRollno
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    classRollNo: {
        type: String,
        required: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    fathername: {
        type: String,
        required: true,
        trim: true
    },
    mothername: {
        type: String,
        required: true,
        trim: true
    },
    dob: {
        type: Date,
        required: true
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
    section: {
        type: String,
        required: false,
        enum: ['A', 'B', 'C', 'D'],
        uppercase: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    fatherphone: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    photo: {
        type: String,
        required: false,
        validate: {
            validator: function(v) {
                if (!v) return true; // Allow empty values
                return /\.(jpg|jpeg|png|gif)$/i.test(v);
            },
            message: props => `${props.value} is not a valid image file!`
        }
    },
    session: {
        type: String,
        required: true,
        match: [/^[0-9]{4}-[0-9]{4}$/, 'Please enter a valid session (e.g., 2023-2024)']
    },
    lateralEntry: {  // Changed from lateralentry
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for faster queries
academicDetailsSchema.index({ classRollNo: 1 });
academicDetailsSchema.index({ department: 1 });
academicDetailsSchema.index({ semester: 1 });

// Virtual for student's full academic identifier
academicDetailsSchema.virtual('academicId').get(function() {
    return `${this.department}-${this.semester}-${this.section}-${this.classRollNo}`;
});

// Middleware to update timestamps
academicDetailsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const StudentAcademicDetails = mongoose.model('StudentAcademicDetails', academicDetailsSchema);
module.exports = StudentAcademicDetails;
