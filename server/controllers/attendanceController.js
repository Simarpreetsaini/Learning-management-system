// controllers/attendanceController.js
const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');
const Department = require('../models/departmentModel');
const Semester = require('../models/semesterModel');
const mongoose = require('mongoose');

// Create a new attendance record
exports.createAttendance = async (req, res) => {
  try {
    const { subject, department, semester, section, date, classType, session, teacherId, students } = req.body;

    console.log('Creating attendance with data:', {
      subject,
      department,
      semester,
      section,
      date,
      classType,
      session,
      teacherId,
      studentsCount: students?.length
    });

    // Normalize classType to match model enum
    const normalizedClassType = classType ? 
      classType.charAt(0).toUpperCase() + classType.slice(1).toLowerCase() : 'Lecture';

    // Map frontend classType to model enum
    const classTypeMapping = {
      'lecture': 'Lecture',
      'practical': 'Lab',
      'tutorial': 'Tutorial',
      'seminar': 'Other'
    };

    const finalClassType = classTypeMapping[classType?.toLowerCase()] || normalizedClassType;

    const attendanceData = {
      subject,
      department,
      semester,
      date,
      classType: finalClassType,
      session,
      teacherId,
      students
    };

    // Add section only if it's provided (for practical classes)
    if (section) {
      attendanceData.section = section.toUpperCase();
    }

    const attendance = new Attendance(attendanceData);

    await attendance.save();
    res.status(201).json({ 
      success: true,
      message: 'Attendance record created successfully', 
      data: attendance 
    });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating attendance record', 
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
};

// Get all attendance records
exports.getAllAttendance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const attendanceRecords = await Attendance.find()
      .populate('subject', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name year')
      .populate('teacherId', 'name email fullname')
      .populate('students.studentId', 'name email rollNumber')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform the data to match frontend expectations
    const transformedRecords = attendanceRecords.map(record => ({
      _id: record._id,
      subject: record.subject,
      department: record.department,
      semester: record.semester,
      section: record.section, // Include section field
      date: record.date,
      classType: record.classType,
      topic: record.session || record.topic || '',
      teacher: record.teacherId,
      totalStudents: record.students ? record.students.length : 0,
      presentCount: record.students ? record.students.filter(s => s.status === 'Present').length : 0,
      students: record.students
    }));

    const total = await Attendance.countDocuments();

    res.status(200).json({
      success: true,
      attendanceRecords: transformedRecords,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attendance records', 
      error: error.message 
    });
  }
};

// Get attendance record by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id)
      .populate('subject', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name year')
      .populate('teacherId', 'name email fullname')
      .populate('students.studentId', 'fullname username');

    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }

    // Get student academic details for each student
    const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
    
    const attendanceWithDetails = {
      ...attendance.toObject(),
      students: await Promise.all(
        attendance.students.map(async (student) => {
          const academicDetails = await StudentAcademicDetails.findOne({ 
            userId: student.studentId._id 
          }).select('universityRollNo fullname');
          
          return {
            ...student.toObject(),
            studentId: {
              ...student.studentId.toObject(),
              academicDetails: academicDetails
            }
          };
        })
      )
    };

    res.status(200).json({
      success: true,
      data: attendanceWithDetails
    });
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attendance record', 
      error: error.message 
    });
  }
};

// Get attendance records by filters
exports.getAttendanceByFilters = async (req, res) => {
  try {
    const { subject, department, semester, date, teacherId, classType, session } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (subject) filters.subject = subject;
    if (department) filters.department = department;
    if (semester) filters.semester = semester;
    if (teacherId) filters.teacherId = teacherId;
    if (classType) filters.classType = classType;
    if (session) filters.session = session;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filters.date = { $gte: startDate, $lt: endDate };
    }

    const attendanceRecords = await Attendance.find(filters)
      .populate('subject', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name year')
      .populate('teacherId', 'name email')
      .populate('students.studentId', 'name email rollNumber')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: attendanceRecords,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attendance records', 
      error: error.message 
    });
  }
};

// Update an attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const attendance = await Attendance.findByIdAndUpdate(id, updates, { 
      new: true,
      runValidators: true 
    })
    .populate('subject', 'name code')
    .populate('department', 'name')
    .populate('semester', 'name year')
    .populate('teacherId', 'name email')
    .populate('students.studentId', 'name email rollNumber');

    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Attendance record updated successfully', 
      data: attendance 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error updating attendance record', 
      error: error.message 
    });
  }
};

// Delete an attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Attendance record deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error deleting attendance record', 
      error: error.message 
    });
  }
};

// Mark attendance for a specific class
exports.markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { students } = req.body;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }

    // Update student attendance
    attendance.students = students.map(student => ({
      studentId: student.studentId,
      status: student.status,
      reason: student.reason || null
    }));

    await attendance.save();
    
    const updatedAttendance = await Attendance.findById(id)
      .populate('subject', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name year')
      .populate('teacherId', 'name email')
      .populate('students.studentId', 'name email rollNumber');

    res.status(200).json({ 
      success: true,
      message: 'Attendance marked successfully', 
      data: updatedAttendance 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error marking attendance', 
      error: error.message 
    });
  }
};

// Get attendance statistics - FIXED VERSION
exports.getAttendanceStats = async (req, res) => {
  try {
    const { subject, department, semester, studentId } = req.query;

    // Get basic stats
    const totalClasses = await Attendance.countDocuments();
    
    // Get today's classes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const classesToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    // Get total unique students
    const studentStats = await Attendance.aggregate([
      { $unwind: '$students' },
      { $group: { _id: '$students.studentId' } },
      { $count: 'totalStudents' }
    ]);

    const totalStudents = studentStats.length > 0 ? studentStats[0].totalStudents : 0;

    // Calculate average attendance
    const attendanceStats = await Attendance.aggregate([
      { $unwind: '$students' },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentRecords: {
            $sum: { $cond: [{ $eq: ['$students.status', 'Present'] }, 1, 0] }
          }
        }
      }
    ]);

    const averageAttendance = attendanceStats.length > 0 && attendanceStats[0].totalRecords > 0
      ? Math.round((attendanceStats[0].presentRecords / attendanceStats[0].totalRecords) * 100)
      : 0;

    const stats = {
      totalClasses,
      averageAttendance,
      totalStudents,
      classesToday
    };

    res.status(200).json({
      success: true,
      stats: stats,
      message: 'Attendance statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Attendance Stats Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attendance statistics', 
      error: error.message 
    });
  }
};

// Get student's own attendance
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user._id; // Get from authenticated user
    const { subject, department, semester } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const matchStage = {
      'students.studentId': new mongoose.Types.ObjectId(studentId)
    };

    if (subject) matchStage.subject = new mongoose.Types.ObjectId(subject);
    if (department) matchStage.department = new mongoose.Types.ObjectId(department);
    if (semester) matchStage.semester = new mongoose.Types.ObjectId(semester);

    // Get attendance records
    const attendanceRecords = await Attendance.find(matchStage)
      .populate('subject', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name year')
      .populate('teacherId', 'name email fullname')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get subject-wise analytics
    const subjectAnalytics = await Attendance.aggregate([
      { $match: { 'students.studentId': new mongoose.Types.ObjectId(studentId) } },
      { $unwind: '$students' },
      { $match: { 'students.studentId': new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: '$subject',
          totalClasses: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$students.status', 'Present'] }, 1, 0] }
          },
          dates: { $push: '$date' },
          lastAttendance: { $max: '$date' }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectDetails'
        }
      },
      {
        $project: {
          subject: { $arrayElemAt: ['$subjectDetails', 0] },
          totalClasses: 1,
          presentCount: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentCount', '$totalClasses'] },
              100
            ]
          },
          lastAttendance: 1
        }
      }
    ]);

    // Get overall analytics
    const overallAnalytics = await Attendance.aggregate([
      { $match: { 'students.studentId': new mongoose.Types.ObjectId(studentId) } },
      { $unwind: '$students' },
      { $match: { 'students.studentId': new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$students.status', 'Present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$students.status', 'Absent'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalClasses: 1,
          presentCount: 1,
          absentCount: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentCount', '$totalClasses'] },
              100
            ]
          }
        }
      }
    ]);

    // Filter student's specific attendance from each record
    const studentAttendance = attendanceRecords.map(record => {
      const studentRecord = record.students.find(
        s => s.studentId.toString() === studentId.toString()
      );
      
      return {
        ...record,
        studentStatus: studentRecord ? studentRecord.status : 'Not Marked',
        section: record.section, // Include section for lab/practical classes
        students: undefined // Remove all students data for privacy
      };
    });

    const total = await Attendance.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      data: {
        records: studentAttendance,
        subjectWiseAnalytics: subjectAnalytics,
        overallAnalytics: overallAnalytics[0] || {
          totalClasses: 0,
          presentCount: 0,
          absentCount: 0,
          attendancePercentage: 0
        }
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Student Attendance Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching student attendance', 
      error: error.message 
    });
  }
};
