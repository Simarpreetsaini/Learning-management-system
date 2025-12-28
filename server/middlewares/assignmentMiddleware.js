const User = require('../models/userModel');
const Assignment = require('../models/assignmentModel');
const Department = require('../models/departmentModel');
const Semester = require('../models/semesterModel');
const Subject = require('../models/subjectModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');

// Check user roles
const isTeacher = (req, res, next) => {
  if (req.user.role !== 'Teacher') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teacher role required.'
    });
  }
  next();
};

// Check if user is admin or teacher
const isAdminOrTeacher = (req, res, next) => {
    if (!['Admin', 'Teacher'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Teacher role required.'
        });
    }
    next();
};

const isStudent = (req, res, next) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student role required.'
    });
  }
  next();
};

const isTeacherOrStudent = (req, res, next) => {
  if (!['Teacher', 'Student'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teacher or Student role required.'
    });
  }
  next();
};

// Validate assignment data
const validateAssignmentData = async (req, res, next) => {
  try {
    const { title, department, semester, subject, dueDate } = req.body;
    const isUpdate = req.method === 'PUT' || req.route?.path?.includes('update'); // Check if this is an update operation
    
    console.log('Assignment validation - Method:', req.method, 'IsUpdate:', isUpdate);
    console.log('Assignment validation - Body:', { title, department, semester, subject, dueDate });

    // For updates, only validate fields that are provided and non-empty
    if (!isUpdate) {
      // For creation, check required fields
      if (!title || !department || !semester || !subject || !dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Title, department, semester, subject, and due date are required'
        });
      }
    } else {
      // For updates, check that at least title is provided (minimum requirement)
      if (!title || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
    }

    // Validate due date if provided
    if (dueDate && dueDate.trim() !== '') {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format'
        });
      }
      
      // For new assignments, due date must be in the future
      // For updates, allow past dates (teacher might be updating other fields)
      if (!isUpdate && dueDateObj <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Due date must be in the future'
        });
      }
    }

    // Check if department exists (if provided and not empty)
    if (department && department.trim() !== '') {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department selected'
        });
      }
    }

    // Check if semester exists (if provided and not empty)
    if (semester && semester.trim() !== '') {
      const semesterExists = await Semester.findById(semester);
      if (!semesterExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid semester selected'
        });
      }
    }

    // Check if subject exists and belongs to selected department and semester (if all provided and not empty)
    if (subject && subject.trim() !== '' && department && department.trim() !== '' && semester && semester.trim() !== '') {
      const subjectExists = await Subject.findOne({
        _id: subject,
        department: department,
        semester: semester,
        isActive: true
      });

      if (!subjectExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subject or subject does not belong to selected department and semester'
        });
      }
    }

    // Validate max marks if provided
    if (req.body.maxMarks && (req.body.maxMarks < 1 || req.body.maxMarks > 1000)) {
      return res.status(400).json({
        success: false,
        message: 'Max marks must be between 1 and 1000'
      });
    }

    console.log('Assignment validation passed');
    next();
  } catch (error) {
    console.error('Error validating assignment data:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating assignment data',
      error: error.message
    });
  }
};

// Validate submission data
const validateSubmissionData = (req, res, next) => {
  const { submissionFile } = req.body;

  if (!submissionFile) {
    return res.status(400).json({
      success: false,
      message: 'Submission file is required'
    });
  }

  // Add file validation logic here if needed (file type, size, etc.)

  next();
};

// Check submission deadline
const checkSubmissionDeadline = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (new Date() > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Assignment submission deadline has passed'
      });
    }

    req.assignment = assignment; // Attach assignment to request for later use
    next();
  } catch (error) {
    console.error('Error checking submission deadline:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking submission deadline',
      error: error.message
    });
  }
};

// Check if student already submitted
const checkExistingSubmission = async (req, res, next) => {
  try {
    // Assumes req.assignment is already set by a previous middleware (e.g., checkSubmissionDeadline or checkAssignmentAccess)
    const assignment = req.assignment;
    const studentId = req.user.id;

    const existingSubmission = assignment.submissions.find(
      sub => sub.studentId.toString() === studentId
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment.'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking existing submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking existing submission',
      error: error.message
    });
  }
};

// Check assignment ownership (for teachers)
const checkAssignmentOwnership = async (req, res, next) => {
  try {
    const { assignmentId, id } = req.params; // Allow either assignmentId or id from params
    const teacherId = req.user.id;
    const assignmentIdToCheck = assignmentId || id;

    const assignment = await Assignment.findOne({
      _id: assignmentIdToCheck,
      createdBy: teacherId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or you are not authorized to access it'
      });
    }

    req.assignment = assignment; // Attach assignment to request for later use
    next();
  } catch (error) {
    console.error('Error checking assignment ownership:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking assignment ownership',
      error: error.message
    });
  }
};

// Check submission ownership (for students or teachers accessing specific submission)
const checkSubmissionOwnership = async (req, res, next) => {
  try {
    // Assumes req.assignment is already set by a previous middleware (e.g., checkAssignmentOwnership or checkAssignmentAccess)
    const assignment = req.assignment;
    const { submissionId } = req.params;
    const userId = req.user.id; // Can be studentId or teacherId

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // If user is student, check if they own the submission
    if (req.user.role === 'Student' && submission.studentId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this submission'
      });
    }
    // If user is teacher, check if they created the assignment (already done by checkAssignmentOwnership)
    // No additional check needed here for teachers, as they can access all submissions for their assignments.

    req.submission = submission; // Attach submission to request for later use
    next();
  } catch (error) {
    console.error('Error checking submission ownership:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking submission ownership',
      error: error.message
    });
  }
};

const validateGradeData = (req, res, next) => {
  let { grade, feedback } = req.body;

  console.log('validateGradeData - received grade:', grade, 'type:', typeof grade);

  if (grade === undefined || grade === null) {
    return res.status(400).json({
      success: false,
      message: 'Grade is required'
    });
  }

  // Trim grade if it's a string
  if (typeof grade === 'string') {
    grade = grade.trim();
  }

  grade = Number(grade); // Convert grade to number

  if (isNaN(grade) || grade < 0) {
    return res.status(400).json({
      success: false,
      message: 'Grade must be a non-negative number'
    });
  }

  // Optional: Check if grade exceeds max marks (requires req.assignment to be set)
  if (req.assignment && grade > req.assignment.maxMarks) {
    return res.status(400).json({
      success: false,
      message: `Grade cannot exceed maximum marks (${req.assignment.maxMarks})`
    });
  }

  req.body.grade = grade; // Update grade in request body to number

  next();
};

// Check assignment access for students (department and semester match)
const checkAssignmentAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role === 'Teacher') {
      // Teachers can access any assignment for viewing
      return next();
    }

    if (user.role === 'Student') {
      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Get student's academic details from StudentAcademicDetails model
      const academicDetails = await StudentAcademicDetails.findOne({ userId: user.id });
      if (!academicDetails) {
        return res.status(404).json({
          success: false,
          message: 'Student academic details not found'
        });
      }

      // Check if student's department and semester match assignment
      // Use safe comparison with proper null checks
      const studentDepartment = academicDetails.department ? academicDetails.department.toString() : null;
      const studentSemester = academicDetails.semester ? academicDetails.semester.toString() : null;
      const assignmentDepartment = assignment.department ? assignment.department.toString() : null;
      const assignmentSemester = assignment.semester ? assignment.semester.toString() : null;

      if (!studentDepartment || !studentSemester || !assignmentDepartment || !assignmentSemester) {
        return res.status(403).json({
          success: false,
          message: 'Unable to verify assignment access - missing department or semester information'
        });
      }

      if (studentDepartment !== assignmentDepartment || studentSemester !== assignmentSemester) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this assignment'
        });
      }

      req.assignment = assignment; // Attach assignment to request for later use
    }

    next();
  } catch (error) {
    console.error('Error checking assignment access:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking assignment access',
      error: error.message
    });
  }
};

// Check if student can update submission (not graded yet and before deadline)
const checkSubmissionUpdatePermission = async (req, res, next) => {
  try {
    // Assumes req.assignment and req.submission are already set by previous middlewares
    const assignment = req.assignment;
    const submission = req.submission;

    if (submission.isGraded) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update submission that has already been graded'
      });
    }

    // Check if assignment deadline has passed
    if (new Date() > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update submission after deadline'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking submission update permission:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking submission update permission',
      error: error.message
    });
  }
};

// Validate department and semester parameters
const validateDeptAndSemParams = async (req, res, next) => {
  try {
    const { departmentId, semesterId } = req.params;

    if (!departmentId || !semesterId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID and Semester ID are required'
      });
    }

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    req.department = department; // Attach department to request
    req.semester = semester;     // Attach semester to request
    next();
  } catch (error) {
    console.error('Error validating department and semester parameters:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating parameters',
      error: error.message
    });
  }
};

module.exports = {
  isAdminOrTeacher,
  isTeacher,
  isStudent,
  isTeacherOrStudent,
  validateAssignmentData,
  validateSubmissionData,
  checkSubmissionDeadline,
  checkExistingSubmission,
  checkAssignmentOwnership,
  checkSubmissionOwnership,
  validateGradeData,
  checkAssignmentAccess,
  checkSubmissionUpdatePermission,
  validateDeptAndSemParams
};