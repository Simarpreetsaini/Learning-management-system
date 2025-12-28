// MultipleFiles/attendanceModel.js
const mongoose = require('mongoose');

const studentAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave'], // Added 'Leave' as a possible status
    required: true
  }
});

const attendanceRecordSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject', // Reference to the Subject model
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department', // Reference to the Department model
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester', // Reference to the Semester model
    required: true
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: false, // Optional field - only required for practical classes
    uppercase: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now // Default to current date
  },
  classType: {
    type: String,
    enum: ['Lecture', 'Lab', 'Tutorial', 'Other', 'lecture', 'practical', 'tutorial', 'seminar'], // Allow both cases
    default: 'Lecture'
  },
  session: {
    type: String, // e.g., "2023-2024" or topic
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model (assuming teacher is a user)
    required: true
  },
  students: [studentAttendanceSchema] // Array of student attendance records for this class
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

const Attendance = mongoose.model('Attendance', attendanceRecordSchema);

module.exports = Attendance;

