const express = require('express');
const router = express.Router();
const cumulativeAttendanceController = require('../controllers/cumulativeAttendanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body, validationResult } = require('express-validator');

// Helper middleware to check if user is admin or teacher
const checkTeacherOrAdmin = (req, res, next) => {
  const userRole = req.user.role.toLowerCase();
  if (userRole === 'admin' || userRole === 'teacher') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: `Access denied. User role '${req.user.role}' not authorized for this operation.`
    });
  }
};

// Validation middleware for cumulative attendance data
const validateCumulativeAttendanceData = [
  body('department')
    .isMongoId()
    .withMessage('Department must be a valid MongoDB ObjectId'),
  body('semester')
    .isMongoId()
    .withMessage('Semester must be a valid MongoDB ObjectId'),
  body('dateUpTo')
    .isISO8601()
    .withMessage('Date up to must be a valid date'),
  body('totalLecturesHeld')
    .isInt({ min: 1 })
    .withMessage('Total lectures held must be a positive integer'),
  body('students')
    .isArray({ min: 1 })
    .withMessage('Students array is required and must contain at least one student'),
  body('students.*.studentId')
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId'),
  body('students.*.lecturesAttended')
    .isInt({ min: 0 })
    .withMessage('Lectures attended must be a non-negative integer'),
  body('session')
    .notEmpty()
    .withMessage('Session is required'),
  
  // Custom validation to ensure lectures attended doesn't exceed total lectures
  body('students.*.lecturesAttended').custom((value, { req }) => {
    const totalLectures = req.body.totalLecturesHeld;
    if (value > totalLectures) {
      throw new Error('Lectures attended cannot exceed total lectures held');
    }
    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Route to create or update cumulative attendance record
router.post(
  '/',
  authMiddleware,
  checkTeacherOrAdmin,
  validateCumulativeAttendanceData,
  cumulativeAttendanceController.createOrUpdateCumulativeAttendance
);

// Route to get cumulative attendance records by filters
router.get(
  '/',
  authMiddleware,
  checkTeacherOrAdmin,
  cumulativeAttendanceController.getCumulativeAttendanceByFilters
);

// Route to get cumulative attendance statistics
router.get(
  '/stats',
  authMiddleware,
  checkTeacherOrAdmin,
  cumulativeAttendanceController.getCumulativeAttendanceStats
);

// Route to get a specific cumulative attendance record by ID
router.get(
  '/:id',
  authMiddleware,
  checkTeacherOrAdmin,
  cumulativeAttendanceController.getCumulativeAttendanceById
);

// Route to delete a cumulative attendance record
router.delete(
  '/:id',
  authMiddleware,
  checkTeacherOrAdmin,
  cumulativeAttendanceController.deleteCumulativeAttendance
);

// Route for students to get their own cumulative attendance records
router.get(
  '/student/my-cumulative-attendance',
  authMiddleware,
  cumulativeAttendanceController.getStudentCumulativeAttendance
);

module.exports = router;
