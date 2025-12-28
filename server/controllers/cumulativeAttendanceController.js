const CumulativeAttendance = require('../models/cumulativeAttendanceModel');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');
const Department = require('../models/departmentModel');
const Semester = require('../models/semesterModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
const mongoose = require('mongoose');

// Create or update cumulative attendance record
exports.createOrUpdateCumulativeAttendance = async (req, res) => {
  try {
    const { 
      department, 
      semester, 
      dateUpTo, 
      totalLecturesHeld, 
      students, 
      session 
    } = req.body;

    console.log('Creating/updating cumulative attendance with data:', {
      department,
      semester,
      dateUpTo,
      totalLecturesHeld,
      studentsCount: students?.length,
      session
    });

    // Check if a record already exists for this combination
    const existingRecord = await CumulativeAttendance.findOne({
      department,
      semester,
      dateUpTo: new Date(dateUpTo)
    });

    // Calculate attendance data before saving
    const processedStudents = students.map(student => {
      const attendancePercentage = Math.round((student.lecturesAttended / totalLecturesHeld) * 100);
      return {
        ...student,
        attendancePercentage: attendancePercentage,
        status: attendancePercentage >= 75 ? 'Adequate' : 'Short'
      };
    });

    const attendanceData = {
      department,
      semester,
      dateUpTo: new Date(dateUpTo),
      totalLecturesHeld,
      permissibleLectures: Math.ceil(totalLecturesHeld * 0.75),
      teacherId: req.user._id,
      students: processedStudents,
      session
    };

    console.log('Processed students data:', processedStudents);

    let cumulativeAttendance;

    if (existingRecord) {
      // Update existing record - use save() instead of findByIdAndUpdate to ensure middleware runs
      Object.assign(existingRecord, attendanceData);
      cumulativeAttendance = await existingRecord.save();
      
      cumulativeAttendance = await CumulativeAttendance.findById(cumulativeAttendance._id)
        .populate('department', 'name')
        .populate('semester', 'name year')
        .populate('teacherId', 'fullname email')
        .populate('students.studentId', 'fullname email');
    } else {
      // Create new record
      cumulativeAttendance = new CumulativeAttendance(attendanceData);
      await cumulativeAttendance.save();
      
      cumulativeAttendance = await CumulativeAttendance.findById(cumulativeAttendance._id)
        .populate('department', 'name')
        .populate('semester', 'name year')
        .populate('teacherId', 'fullname email')
        .populate('students.studentId', 'fullname email');
    }

    res.status(existingRecord ? 200 : 201).json({
      success: true,
      message: `Cumulative attendance ${existingRecord ? 'updated' : 'created'} successfully`,
      data: cumulativeAttendance
    });
  } catch (error) {
    console.error('Error creating/updating cumulative attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing cumulative attendance',
      error: error.message
    });
  }
};

// Get cumulative attendance records by filters
exports.getCumulativeAttendanceByFilters = async (req, res) => {
  try {
    const { department, semester, dateUpTo, teacherId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (department) filters.department = department;
    if (semester) filters.semester = semester;
    if (teacherId) filters.teacherId = teacherId;
    if (dateUpTo) {
      filters.dateUpTo = { $lte: new Date(dateUpTo) };
    }

    const records = await CumulativeAttendance.find(filters)
      .populate('department', 'name')
      .populate('semester', 'name year')
      .populate('teacherId', 'fullname email')
      .populate('students.studentId', 'fullname email')
      .sort({ dateUpTo: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get student academic details for each student
    const recordsWithDetails = await Promise.all(
      records.map(async (record) => {
        const studentsWithDetails = await Promise.all(
          record.students.map(async (student) => {
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
        );

        return {
          ...record.toObject(),
          students: studentsWithDetails
        };
      })
    );

    const total = await CumulativeAttendance.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: recordsWithDetails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching cumulative attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cumulative attendance records',
      error: error.message
    });
  }
};

// Get cumulative attendance record by ID
exports.getCumulativeAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await CumulativeAttendance.findById(id)
      .populate('department', 'name')
      .populate('semester', 'name year')
      .populate('teacherId', 'fullname email')
      .populate('students.studentId', 'fullname email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Cumulative attendance record not found'
      });
    }

    // Get student academic details
    const studentsWithDetails = await Promise.all(
      record.students.map(async (student) => {
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
    );

    const recordWithDetails = {
      ...record.toObject(),
      students: studentsWithDetails
    };

    res.status(200).json({
      success: true,
      data: recordWithDetails
    });
  } catch (error) {
    console.error('Error fetching cumulative attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cumulative attendance record',
      error: error.message
    });
  }
};

// Delete cumulative attendance record
exports.deleteCumulativeAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await CumulativeAttendance.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Cumulative attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cumulative attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cumulative attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting cumulative attendance record',
      error: error.message
    });
  }
};

// Get cumulative attendance statistics
exports.getCumulativeAttendanceStats = async (req, res) => {
  try {
    const { department, semester } = req.query;

    const matchFilters = {};
    if (department) matchFilters.department = new mongoose.Types.ObjectId(department);
    if (semester) matchFilters.semester = new mongoose.Types.ObjectId(semester);

    // Get total records
    const totalRecords = await CumulativeAttendance.countDocuments(matchFilters);

    // Get students with adequate attendance (75% or above)
    const adequateAttendanceStats = await CumulativeAttendance.aggregate([
      { $match: matchFilters },
      { $unwind: '$students' },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          adequateStudents: {
            $sum: { $cond: [{ $eq: ['$students.status', 'Adequate'] }, 1, 0] }
          },
          shortStudents: {
            $sum: { $cond: [{ $eq: ['$students.status', 'Short'] }, 1, 0] }
          },
          averageAttendance: { $avg: '$students.attendancePercentage' }
        }
      }
    ]);

    // Get department-wise statistics
    const departmentWiseStats = await CumulativeAttendance.aggregate([
      { $match: matchFilters },
      { $unwind: '$students' },
      {
        $group: {
          _id: '$department',
          totalStudents: { $sum: 1 },
          adequateStudents: {
            $sum: { $cond: [{ $eq: ['$students.status', 'Adequate'] }, 1, 0] }
          },
          averageAttendance: { $avg: '$students.attendancePercentage' },
          totalLectures: { $first: '$totalLecturesHeld' }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentDetails'
        }
      },
      {
        $project: {
          department: { $arrayElemAt: ['$departmentDetails', 0] },
          totalStudents: 1,
          adequateStudents: 1,
          adequatePercentage: {
            $multiply: [
              { $divide: ['$adequateStudents', '$totalStudents'] },
              100
            ]
          },
          averageAttendance: { $round: ['$averageAttendance', 1] },
          totalLectures: 1
        }
      }
    ]);

    const stats = adequateAttendanceStats[0] || {
      totalStudents: 0,
      adequateStudents: 0,
      shortStudents: 0,
      averageAttendance: 0
    };

    res.status(200).json({
      success: true,
      stats: {
        totalRecords,
        totalStudents: stats.totalStudents,
        adequateStudents: stats.adequateStudents,
        shortStudents: stats.shortStudents,
        adequatePercentage: stats.totalStudents > 0 
          ? Math.round((stats.adequateStudents / stats.totalStudents) * 100) 
          : 0,
        averageAttendance: Math.round(stats.averageAttendance || 0),
        departmentWiseStats
      },
      message: 'Cumulative attendance statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching cumulative attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cumulative attendance statistics',
      error: error.message
    });
  }
};

// Get student's cumulative attendance records
exports.getStudentCumulativeAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { department, semester } = req.query;

    const matchFilters = {
      'students.studentId': new mongoose.Types.ObjectId(studentId)
    };

    if (department) matchFilters.department = new mongoose.Types.ObjectId(department);
    if (semester) matchFilters.semester = new mongoose.Types.ObjectId(semester);

    const records = await CumulativeAttendance.find(matchFilters)
      .populate('department', 'name')
      .populate('semester', 'name year')
      .populate('teacherId', 'fullname email')
      .sort({ dateUpTo: -1, createdAt: -1 })
      .lean();

    // Filter to show only the student's data and remove duplicates
    const studentRecords = [];
    const seenCombinations = new Set();

    console.log(`Found ${records.length} total cumulative attendance records for student ${studentId}`);

    for (const record of records) {
      const studentData = record.students.find(
        s => s.studentId.toString() === studentId.toString()
      );

      if (studentData) {
        // Create a unique key for department + semester + session combination
        const uniqueKey = `${record.department._id}-${record.semester._id}-${record.session}`;
        
        console.log(`Processing record: ${record._id}, Department: ${record.department.name}, Semester: ${record.semester.name}, Session: ${record.session}, UniqueKey: ${uniqueKey}`);
        
        // Only add if we haven't seen this combination before
        if (!seenCombinations.has(uniqueKey)) {
          seenCombinations.add(uniqueKey);
          
          console.log(`Adding unique record: ${record._id}`);
          
          studentRecords.push({
            _id: record._id,
            department: record.department,
            semester: record.semester,
            dateUpTo: record.dateUpTo,
            totalLecturesHeld: record.totalLecturesHeld,
            permissibleLectures: record.permissibleLectures,
            teacherId: record.teacherId,
            session: record.session,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            studentData: studentData
          });
        } else {
          console.log(`Skipping duplicate record: ${record._id} with key: ${uniqueKey}`);
        }
      }
    }

    console.log(`Returning ${studentRecords.length} unique records to student`);

    res.status(200).json({
      success: true,
      data: studentRecords,
      message: 'Student cumulative attendance records retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching student cumulative attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student cumulative attendance',
      error: error.message
    });
  }
};
