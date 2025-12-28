// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const attendanceMiddleware = require('../middlewares/attendanceMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

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

// Route to create a new attendance record
router.post(
  '/',
  authMiddleware,
  checkTeacherOrAdmin,
  attendanceMiddleware.validateAttendanceData,
  attendanceController.createAttendance
);

// Route to get all attendance records
router.get(
  '/',
  authMiddleware,
  checkTeacherOrAdmin,
  attendanceController.getAllAttendance
);

// Route to get attendance statistics
router.get(
  '/stats',
  authMiddleware,
  checkTeacherOrAdmin,
  attendanceController.getAttendanceStats
);

// Route to get attendance records by filters
router.get(
  '/filters',
  attendanceMiddleware.authenticateUser,
  attendanceMiddleware.authorizeUser(['Admin', 'Teacher']),
  attendanceController.getAttendanceByFilters
);

// Route to get a specific attendance record by ID
router.get(
  '/:id',
  attendanceMiddleware.authenticateUser,
  attendanceMiddleware.authorizeUser(['Admin', 'Teacher']),
  attendanceMiddleware.checkAttendanceExists,
  attendanceController.getAttendanceById
);

// Route to update an attendance record
router.put(
  '/:id',
  attendanceMiddleware.authenticateUser,
  attendanceMiddleware.authorizeUser(['Admin', 'Teacher']),
  attendanceMiddleware.checkAttendanceExists,
  attendanceMiddleware.validateAttendanceData,
  attendanceController.updateAttendance
);

// Route to delete an attendance record
router.delete(
  '/:id',
  attendanceMiddleware.authenticateUser,
  attendanceMiddleware.authorizeUser(['Admin']),
  attendanceMiddleware.checkAttendanceExists,
  attendanceController.deleteAttendance
);

// Route to mark attendance for a specific class
router.post(
  '/:id/mark',
  attendanceMiddleware.authenticateUser,
  attendanceMiddleware.authorizeUser(['Admin', 'Teacher']),
  attendanceMiddleware.checkAttendanceExists,
  attendanceController.markAttendance
);

// Route for students to get their own attendance records and analytics
router.get(
  '/student/my-attendance',
  authMiddleware,
  attendanceController.getStudentAttendance
);

module.exports = router;
