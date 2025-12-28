const mongoose = require('mongoose');

const academicMarksSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'StudentAcademicDetails', 
        required: [true, 'Student reference is required'],
        validate: {
            validator: async function(value) {
                if (!value) return false;
                const StudentAcademicDetails = mongoose.model('StudentAcademicDetails');
                const student = await StudentAcademicDetails.findById(value);
                return !!student;
            },
            message: 'Referenced student does not exist'
        }
    },
    subject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject', 
        required: [true, 'Subject reference is required'],
        validate: {
            validator: async function(value) {
                if (!value) return false;
                const Subject = mongoose.model('Subject');
                const subject = await Subject.findById(value);
                return !!subject;
            },
            message: 'Referenced subject does not exist'
        }
    },
    marks: { 
        type: Number, 
        required: [true, 'Marks are required'],
        min: [0, 'Marks cannot be negative'],
        max: [1000, 'Marks cannot exceed 1000'],
        validate: [
            {
                validator: function(value) {
                    if (typeof this.maxMarks !== 'number') return true; // skip validation if context is missing
                    return value <= this.maxMarks;
                },
                message: 'Marks ({VALUE}) cannot exceed maximum marks'
            },
            {
                validator: function(value) {
                    return Number.isFinite(value) && value >= 0;
                },
                message: 'Marks must be a valid non-negative number'
            }
        ]
    },
    maxMarks: { 
        type: Number, 
        required: [true, 'Maximum marks are required'], 
        default: 100,
        min: [1, 'Maximum marks must be at least 1'],
        max: [1000, 'Maximum marks cannot exceed 1000'],
        validate: {
            validator: function(value) {
                return Number.isFinite(value) && value > 0;
            },
            message: 'Maximum marks must be a valid positive number'
        }
    },
    passingMarks: { 
        type: Number, 
        required: [true, 'Passing marks are required'], 
        default: 40,
        min: [0, 'Passing marks cannot be negative'],
        validate: [
            {
                validator: function(value) {
                    if (typeof this.maxMarks !== 'number') return true; // skip validation if context is missing
                    return value <= this.maxMarks;
                },
                message: 'Passing marks ({VALUE}) cannot exceed maximum marks'
            },
            {
                validator: function(value) {
                    return Number.isFinite(value) && value >= 0;
                },
                message: 'Passing marks must be a valid non-negative number'
            }
        ]
    },
    examType: { 
        type: String, 
        required: [true, 'Exam type is required'],
        trim: true,
        uppercase: false,
        validate: {
            validator: function(value) {
                // Enhanced exam type validation with more patterns
                const patterns = [
                    /^MST[1-9]$/,           // MST1, MST2, etc.
                    /^ClassTest[1-9]$/,     // ClassTest1, ClassTest2, etc.
                    /^Assignment[1-9]$/,    // Assignment1, Assignment2, etc.
                    /^Quiz[1-9]$/,          // Quiz1, Quiz2, etc.
                    /^Lab[1-9]$/,           // Lab1, Lab2, etc.
                    /^Project[1-9]$/,       // Project1, Project2, etc.
                    /^Viva[1-9]$/,          // Viva1, Viva2, etc.
                    /^Final$/,              // Final
                    /^Midterm$/,            // Midterm
                    /^(MST|ClassTest|Assignment)$/  // Backward compatibility
                ];
                return patterns.some(pattern => pattern.test(value));
            },
            message: 'ExamType must be in format: MST1, ClassTest2, Assignment3, Quiz1, Lab1, Project1, Viva1, Final, Midterm, etc.'
        }
    },
    examDate: { 
        type: Date, 
        required: [true, 'Exam date is required'],
        validate: {
            validator: function(value) {
                if (!value) return false;
                const date = new Date(value);
                const now = new Date();
                const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                return date >= oneYearAgo && date <= oneYearFromNow;
            },
            message: 'Exam date must be within the last year or next year'
        }
    },
    semester: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Semester', 
        required: [true, 'Semester reference is required'],
        validate: {
            validator: async function(value) {
                if (!value) return false;
                const Semester = mongoose.model('Semester');
                const semester = await Semester.findById(value);
                return !!semester;
            },
            message: 'Referenced semester does not exist'
        }
    },
    department: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Department', 
        required: [true, 'Department reference is required'],
        validate: {
            validator: async function(value) {
                if (!value) return false;
                const Department = mongoose.model('Department');
                const department = await Department.findById(value);
                return !!department;
            },
            message: 'Referenced department does not exist'
        }
    },
    section: { 
        type: String, 
        required: [true, 'Section is required'],
        uppercase: true,
        trim: true,
        minlength: [1, 'Section must be at least 1 character'],
        maxlength: [5, 'Section cannot exceed 5 characters'],
        validate: {
            validator: function(value) {
                return /^[A-Z0-9]+$/.test(value);
            },
            message: 'Section can only contain uppercase letters and numbers'
        }
    },
    // Audit trail fields
    createdAt: { 
        type: Date, 
        default: Date.now,
        immutable: true
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    version: {
        type: Number,
        default: 1,
        min: 1
    },
    // Additional metadata
    metadata: {
        source: {
            type: String,
            enum: ['manual', 'import', 'api', 'migration'],
            default: 'manual'
        },
        importBatch: {
            type: String,
            required: false
        },
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }
});

// Pre-save middleware to update the updatedAt field and validate data consistency
academicMarksSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Additional validation to ensure data consistency
    if (this.marks > this.maxMarks) {
        return next(new Error(`Marks (${this.marks}) cannot exceed maximum marks (${this.maxMarks})`));
    }
    
    if (this.passingMarks > this.maxMarks) {
        return next(new Error(`Passing marks (${this.passingMarks}) cannot exceed maximum marks (${this.maxMarks})`));
    }
    
    next();
});

// Pre-findOneAndUpdate middleware to update the updatedAt field and validate data consistency
academicMarksSchema.pre('findOneAndUpdate', async function(next) {
    this.set({ updatedAt: new Date() });
    
    // Get the update data
    const update = this.getUpdate();
    
    // If we're updating marks-related fields, ensure consistency
    if (update.marks !== undefined || update.maxMarks !== undefined || update.passingMarks !== undefined) {
        const marks = update.marks;
        const maxMarks = update.maxMarks;
        const passingMarks = update.passingMarks;
        
        // Determine effective maxMarks for validation
        let effectiveMaxMarks = maxMarks;
        
        // If maxMarks is not being updated, get the current maxMarks from the document
        if (maxMarks === undefined && (marks !== undefined || passingMarks !== undefined)) {
            try {
                // Add timeout to prevent hanging
                const currentDoc = await Promise.race([
                    this.model.findOne(this.getQuery()).select('maxMarks').lean(),
                    new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Database query timeout')), 3000);
                    })
                ]);
                
                if (currentDoc && currentDoc.maxMarks !== undefined) {
                    effectiveMaxMarks = currentDoc.maxMarks;
                }
            } catch (error) {
                console.warn('Error fetching current maxMarks for validation:', error.message);
                // Continue without this validation if we can't fetch current data
                // Let the application-level validation handle this
                return next();
            }
        }
        
        // Only validate if we have effective maxMarks and the values are valid numbers
        if (effectiveMaxMarks !== undefined && effectiveMaxMarks !== null) {
            // Validate marks against effective maxMarks
            if (marks !== undefined && !isNaN(marks) && !isNaN(effectiveMaxMarks) && marks > effectiveMaxMarks) {
                return next(new Error(`Marks (${marks}) cannot exceed maximum marks (${effectiveMaxMarks})`));
            }
            
            // Validate passingMarks against effective maxMarks
            if (passingMarks !== undefined && !isNaN(passingMarks) && !isNaN(effectiveMaxMarks) && passingMarks > effectiveMaxMarks) {
                return next(new Error(`Passing marks (${passingMarks}) cannot exceed maximum marks (${effectiveMaxMarks})`));
            }
        }
    }
    
    next();
});

// Compound index to ensure uniqueness per student-subject-semester-examType combination
// This allows multiple exam types (MST1, MST2, ClassTest1, etc.) for the same student-subject-semester
academicMarksSchema.index(
    { student: 1, subject: 1, semester: 1, examType: 1 }, 
    { 
        unique: true,
        name: 'student_1_subject_1_semester_1_examType_1'
    }
);

// Additional indexes for efficient queries
academicMarksSchema.index({ student: 1, semester: 1 }); // For student marks lookup
academicMarksSchema.index({ subject: 1, semester: 1, section: 1 }); // For teacher subject-wise queries
academicMarksSchema.index({ department: 1, semester: 1, section: 1 }); // For department-wise queries
academicMarksSchema.index({ examDate: 1 }); // For date-based queries

// Virtual for calculating percentage
academicMarksSchema.virtual('percentage').get(function() {
    return this.maxMarks > 0 ? ((this.marks / this.maxMarks) * 100).toFixed(2) : 0;
});

// Virtual for pass/fail status
academicMarksSchema.virtual('isPassed').get(function() {
    return this.marks >= this.passingMarks;
});

// Virtual for grade calculation (basic grading system)
academicMarksSchema.virtual('grade').get(function() {
    const percentage = this.percentage;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
});

// Ensure virtual fields are serialized
academicMarksSchema.set('toJSON', { virtuals: true });
academicMarksSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AcademicMarks', academicMarksSchema);
