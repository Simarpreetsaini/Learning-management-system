// middlewares/attendanceMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Attendance = require('../models/attendanceModel');
const { body, validationResult, param, query } = require('express-validator');

// Middleware to authenticate user
exports.authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    console.log('Attendance auth - Headers:', {
      authorization: authHeader,
      hasAuth: !!authHeader,
      startsWithBearer: authHeader?.startsWith('Bearer ')
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Attendance auth - No valid auth header');
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided or invalid format.' 
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    console.log('Attendance auth - Token extracted:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log('Attendance auth - Token decoded:', { userId: decoded.userId, role: decoded.role });
    
    const user = await User.findById(decoded.userId).select({ password: 0 });
    
    if (!user) {
      console.log('Attendance auth - User not found for ID:', decoded.userId);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. User not found.' 
      });
    }

    console.log('Attendance auth - User found:', { id: user._id, role: user.role, fullname: user.fullname });
    
    req.user = user;
    req.token = token;
    req.userID = user._id;
    next();
  } catch (error) {
    console.log('Attendance auth error:', error);
    return res.status(403).json({ 
      success: false,
      message: 'Invalid token.',
      error: error.message
    });
  }
};

// Middleware to authorize user roles
exports.authorizeUser = (roles) => {
  return (req, res, next) => {
    console.log('Authorization check:', {
      userRole: req.user?.role,
      userRoleLower: req.user?.role?.toLowerCase(),
      allowedRoles: roles,
      allowedRolesLower: roles.map(r => r.toLowerCase()),
      hasUser: !!req.user
    });
    
    if (!req.user) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User not authenticated.' 
      });
    }
    
    const userRoleLower = req.user.role.toLowerCase();
    const allowedRolesLower = roles.map(r => r.toLowerCase());
    
    if (!allowedRolesLower.includes(userRoleLower)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. User role '${req.user.role}' not in allowed roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

// Middleware to validate attendance data for creation/update
exports.validateAttendanceData = [
  body('subject')
    .isMongoId()
    .withMessage('Subject ID must be a valid MongoDB ObjectId.')
    .notEmpty()
    .withMessage('Subject is required.'),
  
  body('department')
    .isMongoId()
    .withMessage('Department ID must be a valid MongoDB ObjectId.')
    .notEmpty()
    .withMessage('Department is required.'),
  
  body('semester')
    .isMongoId()
    .withMessage('Semester ID must be a valid MongoDB ObjectId.')
    .notEmpty()
    .withMessage('Semester is required.'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date.'),
  
  body('classType')
    .optional()
    .isIn(['lecture', 'practical', 'tutorial', 'seminar', 'Lecture', 'Lab', 'Tutorial', 'Other'])
    .withMessage('Class type must be one of the allowed values.'),
  
  body('session')
    .isString()
    .withMessage('Session must be a string.')
    .notEmpty()
    .withMessage('Session is required.')
    .isLength({ min: 1, max: 100 })
    .withMessage('Session must be between 1 and 100 characters.'),
  
  body('teacherId')
    .isMongoId()
    .withMessage('Teacher ID must be a valid MongoDB ObjectId.')
    .notEmpty()
    .withMessage('Teacher ID is required.'),
  
  body('students')
    .isArray()
    .withMessage('Students must be an array.')
    .optional(),
  
  body('students.*.studentId')
    .if(body('students').exists())
    .isMongoId()
    .withMessage('Each student ID must be a valid MongoDB ObjectId.'),
  
  body('students.*.status')
    .if(body('students').exists())
    .isIn(['Present', 'Absent', 'Leave'])
    .withMessage('Status must be one of the following: Present, Absent, Leave.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

// Middleware to validate mark attendance data
exports.validateMarkAttendanceData = [
  body('students')
    .isArray({ min: 1 })
    .withMessage('Students array is required and must contain at least one student.'),
  
  body('students.*.studentId')
    .isMongoId()
    .withMessage('Each student ID must be a valid MongoDB ObjectId.'),
  
  body('students.*.status')
    .isIn(['Present', 'Absent', 'Leave'])
    .withMessage('Status must be one of the following: Present, Absent, Leave.'),
  
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

// Middleware to validate MongoDB ObjectId parameters
exports.validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid attendance ID. Must be a valid MongoDB ObjectId.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid parameters',
        errors: errors.array() 
      });
    }
    next();
  }
];

// Middleware to validate query parameters for filtering
exports.validateFilterParams = [
  query('subject')
    .optional()
    .isMongoId()
    .withMessage('Subject ID must be a valid MongoDB ObjectId.'),
  
  query('department')
    .optional()
    .isMongoId()
    .withMessage('Department ID must be a valid MongoDB ObjectId.'),
  
  query('semester')
    .optional()
    .isMongoId()
    .withMessage('Semester ID must be a valid MongoDB ObjectId.'),
  
  query('teacherId')
    .optional()
    .isMongoId()
    .withMessage('Teacher ID must be a valid MongoDB ObjectId.'),
  
  query('studentId')
    .optional()
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId.'),
  
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date.'),
  
  query('classType')
    .optional()
    .isIn(['Lecture', 'Lab', 'Tutorial', 'Other'])
    .withMessage('Class type must be one of the following: Lecture, Lab, Tutorial, Other.'),
  
  query('session')
    .optional()
    .isString()
    .withMessage('Session must be a string.')
    .isLength({ min: 1, max: 50 })
    .withMessage('Session must be between 1 and 50 characters.'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer between 1 and 100.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array() 
      });
    }
    next();
  }
];

// Middleware to check if attendance record exists
exports.checkAttendanceExists = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found.' 
      });
    }
    
    // Attach attendance to request for use in subsequent middlewares/controllers
    req.attendance = attendance;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error checking attendance record', 
      error: error.message 
    });
  }
};

// Middleware to check if user owns the attendance record or has permission
exports.checkAttendancePermission = (req, res, next) => {
  try {
    const { attendance, user } = req;
    
    // Admin can access all records
    if (user.role === 'admin') {
      return next();
    }
    
    // Teacher can access their own records
    if (user.role === 'teacher' && attendance.teacherId.toString() === user._id.toString()) {
      return next();
    }
    
    // Student can access records they're part of
    if (user.role === 'student') {
      const isStudentInRecord = attendance.students.some(
        student => student.studentId.toString() === user._id.toString()
      );
      if (isStudentInRecord) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this attendance record.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error checking attendance permissions', 
      error: error.message 
    });
  }
};

// Middleware to validate bulk attendance operations
exports.validateBulkAttendanceData = [
  body('attendanceRecords')
    .isArray({ min: 1 })
    .withMessage('Attendance records array is required and must contain at least one record.'),
  
  body('attendanceRecords.*.subject')
    .isMongoId()
    .withMessage('Each subject ID must be a valid MongoDB ObjectId.'),
  
  body('attendanceRecords.*.department')
    .isMongoId()
    .withMessage('Each department ID must be a valid MongoDB ObjectId.'),
  
  body('attendanceRecords.*.semester')
    .isMongoId()
    .withMessage('Each semester ID must be a valid MongoDB ObjectId.'),
  
  body('attendanceRecords.*.teacherId')
    .isMongoId()
    .withMessage('Each teacher ID must be a valid MongoDB ObjectId.'),
  
  body('attendanceRecords.*.students')
    .isArray()
    .withMessage('Students must be an array for each record.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Bulk validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

// Middleware to handle rate limiting for attendance operations
exports.rateLimitAttendance = (req, res, next) => {
  // Simple rate limiting implementation
  const userKey = req.user._id.toString();
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max 100 requests per 15 minutes
  
  if (!global.attendanceRateLimit) {
    global.attendanceRateLimit = new Map();
  }
  
  const userRequests = global.attendanceRateLimit.get(userKey) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
    });
  }
  
  recentRequests.push(now);
  global.attendanceRateLimit.set(userKey, recentRequests);
  
  next();
};

// Middleware to log attendance operations
exports.logAttendanceOperation = (operation) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log the operation
    console.log(`[${new Date().toISOString()}] ${operation} - User: ${req.user.name} (${req.user.role}) - IP: ${req.ip}`);
    
    // Continue with the request
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] ${operation} completed in ${duration}ms - Status: ${res.statusCode}`);
      originalSend.call(this, data);
    };
    
    next();
  };
};
