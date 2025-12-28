const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submissionFile: {
    type: String,
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: null
  },
  isGraded: {
    type: Boolean,
    default: false
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  serialNumber: {
    type: String,
    unique: true,
    required: false
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  instructions: {
    type: String
  },
  attachments: [
    {
      type: String
    }
  ],
  submissions: [submissionSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate serial number
assignmentSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Count assignments for the same subject to generate serial number
      const count = await this.constructor.countDocuments({
        subject: this.subject
      });
      this.serialNumber = `ASSIGN-${this.subject.toString().slice(-6).toUpperCase()}-${(count + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;