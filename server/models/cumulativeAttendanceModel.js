const mongoose = require('mongoose');

const studentCumulativeAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lecturesAttended: {
    type: Number,
    required: true,
    min: 0
  },
  attendancePercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Adequate', 'Short']
  }
});

const cumulativeAttendanceSchema = new mongoose.Schema({
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
  dateUpTo: {
    type: Date,
    required: true
  },
  totalLecturesHeld: {
    type: Number,
    required: true,
    min: 1
  },
  permissibleLectures: {
    type: Number
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [studentCumulativeAttendanceSchema],
  session: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
cumulativeAttendanceSchema.index({ department: 1, semester: 1, dateUpTo: 1 });

// Pre-save middleware to calculate permissible lectures and attendance data
cumulativeAttendanceSchema.pre('save', function(next) {
  console.log('Pre-save middleware running for cumulative attendance');
  
  // Calculate permissible lectures (75% of total)
  this.permissibleLectures = Math.ceil(this.totalLecturesHeld * 0.75);
  
  // Calculate attendance percentage and status for each student
  if (this.students && this.students.length > 0) {
    this.students.forEach(student => {
      if (this.totalLecturesHeld > 0) {
        student.attendancePercentage = Math.round((student.lecturesAttended / this.totalLecturesHeld) * 100);
        student.status = student.attendancePercentage >= 75 ? 'Adequate' : 'Short';
        console.log(`Student ${student.studentId}: ${student.lecturesAttended}/${this.totalLecturesHeld} = ${student.attendancePercentage}% (${student.status})`);
      } else {
        student.attendancePercentage = 0;
        student.status = 'Short';
      }
    });
  }
  
  next();
});

const CumulativeAttendance = mongoose.model('CumulativeAttendance', cumulativeAttendanceSchema);

module.exports = CumulativeAttendance;
