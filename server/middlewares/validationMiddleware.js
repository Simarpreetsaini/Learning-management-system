const Department = require('../models/departmentModel');
const Semester = require('../models/semesterModel');
const Subject = require('../models/subjectModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');

// Validate department data
const validateDepartmentData = (req, res, next) => {
    const { name, code } = req.body;

    if (!name || !code) {
        return res.status(400).json({
            success: false,
            message: 'Name and code are required'
        });
    }

    if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Department name must be between 2 and 100 characters'
        });
    }

    if (code.length < 2 || code.length > 10) {
        return res.status(400).json({
            success: false,
            message: 'Department code must be between 2 and 10 characters'
        });
    }

    // Check for valid characters in code (alphanumeric only)
    if (!/^[A-Za-z0-9]+$/.test(code)) {
        return res.status(400).json({
            success: false,
            message: 'Department code can only contain letters and numbers'
        });
    }

    next();
};

// Validate semester data
const validateSemesterData = (req, res, next) => {
    const { name, number } = req.body;

    if (!name || !number) {
        return res.status(400).json({
            success: false,
            message: 'Name and number are required'
        });
    }

    if (name.length < 2 || name.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Semester name must be between 2 and 50 characters'
        });
    }

    if (typeof number !== 'number' || number < 1 || number > 8) {
        return res.status(400).json({
            success: false,
            message: 'Semester number must be between 1 and 8'
        });
    }

    next();
};

// Validate subject data
const validateSubjectData = async (req, res, next) => {
    try {
        const { name, code, department, semester, credits } = req.body;

        if (!name || !department || !semester) {
            return res.status(400).json({
                success: false,
                message: 'Name, department, and semester are required'
            });
        }

        if (name.length < 2 || name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Subject name must be between 2 and 100 characters'
            });
        }

        // Validate code if provided
        if (code && code.trim() !== '') {
            if (code.length < 2 || code.length > 20) {
                return res.status(400).json({
                    success: false,
                    message: 'Subject code must be between 2 and 20 characters'
                });
            }

            // Check for valid characters in code
            if (!/^[A-Za-z0-9]+$/.test(code)) {
                return res.status(400).json({
                    success: false,
                    message: 'Subject code can only contain letters and numbers'
                });
            }
        }

        // Validate credits if provided
        if (credits !== undefined && credits !== null && credits !== '') {
            // Convert string to number if it's a string
            const creditsNum = typeof credits === 'string' ? Number(credits) : credits;
            
            // Check if conversion resulted in a valid number
            if (isNaN(creditsNum) || creditsNum < 1 || creditsNum > 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Credits must be a number between 1 and 10'
                });
            }
            
            // Update the credits in req.body to be the converted number
            req.body.credits = creditsNum;
        }

        // Check if department exists
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        // Check if semester exists
        const semesterExists = await Semester.findById(semester);
        if (!semesterExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid semester selected'
            });
        }

        next();
    } catch (error) {
        console.error('Error validating subject data:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating subject data',
            error: error.message
        });
    }
};

// Validate academic details data
const validateAcademicDetailsData = async (req, res, next) => {
    try {
        const {
            universityRollNo,
            classRollNo,
            fullname,
            fathername,
            mothername,
            dob,
            department,
            semester,
            section,
            phone,
            fatherphone,
            email,
            session
        } = req.body;

        // Required fields validation
        const requiredFields = [
            'universityRollNo', 'classRollNo', 'fullname', 'fathername', 
            'mothername', 'dob', 'department', 'semester', 'section', 
            'phone', 'fatherphone', 'email', 'session'
        ];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: `${field} is required`
                });
            }
        }

        // Photo validation is now handled by multer

        // Registration Number validation
        if (universityRollNo.length < 5 || universityRollNo.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'University roll number must be between 5 and 20 characters'
            });
        }

        // Class Roll Number validation
        if (classRollNo.length < 1 || classRollNo.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Class roll number must be between 1 and 10 characters'
            });
        }

        // Name validations
        if (fullname.length < 2 || fullname.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Full name must be between 2 and 100 characters'
            });
        }

        if (fathername.length < 2 || fathername.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Father name must be between 2 and 100 characters'
            });
        }

        if (mothername.length < 2 || mothername.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Mother name must be between 2 and 100 characters'
            });
        }

        // Date of birth validation
        const dobDate = new Date(dob);
        const currentDate = new Date();
        const age = currentDate.getFullYear() - dobDate.getFullYear();
        
        if (age < 16 || age > 50) {
            return res.status(400).json({
                success: false,
                message: 'Age must be between 16 and 50 years'
            });
        }

        // Section validation
        if (!/^[A-Z]$/.test(section.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Section must be a single letter (A-Z)'
            });
        }

        // Phone number validation
        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be exactly 10 digits'
            });
        }

        if (!/^[0-9]{10}$/.test(fatherphone)) {
            return res.status(400).json({
                success: false,
                message: 'Father phone number must be exactly 10 digits'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Session validation (format: YYYY-YYYY)
        if (!/^[0-9]{4}-[0-9]{4}$/.test(session)) {
            return res.status(400).json({
                success: false,
                message: 'Session must be in format YYYY-YYYY (e.g., 2021-2025)'
            });
        }

        // Check if department exists
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        // Check if semester exists
        const semesterExists = await Semester.findById(semester);
        if (!semesterExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid semester selected'
            });
        }

        next();
    } catch (error) {
        console.error('Error validating academic details data:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating academic details data',
            error: error.message
        });
    }
};

// Check if department exists
const checkDepartmentExists = async (req, res, next) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        req.department = department;
        next();
    } catch (error) {
        console.error('Error checking department:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking department',
            error: error.message
        });
    }
};

// Check if semester exists
const checkSemesterExists = async (req, res, next) => {
    try {
        const { id } = req.params;
        const semester = await Semester.findById(id);

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        req.semester = semester;
        next();
    } catch (error) {
        console.error('Error checking semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking semester',
            error: error.message
        });
    }
};

// Check if subject exists
const checkSubjectExists = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findById(id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        req.subject = subject;
        next();
    } catch (error) {
        console.error('Error checking subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking subject',
            error: error.message
        });
    }
};

// Check admin or teacher role
const isAdminOrTeacher = (req, res, next) => {
    if (!['Admin', 'Teacher'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Teacher role required.'
        });
    }
    next();
};

// Check admin role only
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Teacher') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }
    next();
};

// Check student role only
const isStudentOnly = (req, res, next) => {
    if (req.user.role !== 'Student' && req.user.role !== 'Teacher') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student role required.'
        });
    }
    next();
};

// Validate pagination parameters
const validatePagination = (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
            success: false,
            message: 'Page must be a positive number'
        });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
            success: false,
            message: 'Limit must be a number between 1 and 100'
        });
    }

    req.pagination = {
        page: pageNum,
        limit: limitNum
    };

    next();
};

// Validate ObjectId format
const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format`
            });
        }
        
        next();
    };
};

// Check if academic details exist for user
const checkAcademicDetailsExist = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const academicDetails = await StudentAcademicDetails.findOne({ userId });

        if (!academicDetails) {
            return res.status(404).json({
                success: false,
                message: 'Academic details not found. Please complete your profile first.'
            });
        }

        req.academicDetails = academicDetails;
        next();
    } catch (error) {
        console.error('Error checking academic details:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking academic details',
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

        // Validate ObjectId format
        if (!departmentId.match(/^[0-9a-fA-F]{24}$/) || !semesterId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department or semester ID format'
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

        req.department = department;
        req.semester = semester;
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

// Validate search query
const validateSearchQuery = (req, res, next) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required'
        });
    }

    if (query.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Search query must be at least 2 characters long'
        });
    }

    if (query.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Search query must not exceed 50 characters'
        });
    }

    next();
};

// Validate file upload (for photo)
const validateFileUpload = (req, res, next) => {
    const { photo } = req.body;

    if (photo) {
        // Check file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        const hasValidExtension = allowedExtensions.some(ext => 
            photo.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
            return res.status(400).json({
                success: false,
                message: 'Photo must be a valid image file (jpg, jpeg, png, gif)'
            });
        }

        // Check file name length
        if (photo.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Photo filename is too long'
            });
        }
    }

    next();
};

// Rate limiting middleware (basic implementation)
const rateLimitMiddleware = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        for (const [id, timestamps] of requests.entries()) {
            const validTimestamps = timestamps.filter(time => time > windowStart);
            if (validTimestamps.length === 0) {
                requests.delete(id);
            } else {
                requests.set(id, validTimestamps);
            }
        }

        // Check current client
        const clientRequests = requests.get(clientId) || [];
        const validRequests = clientRequests.filter(time => time > windowStart);

        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }

        // Add current request
        validRequests.push(now);
        requests.set(clientId, validRequests);

        next();
    };
};

// Sanitize input data
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str.trim().replace(/[<>]/g, '');
    };

    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeString(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) {
        sanitizeObject(req.body);
    }

    if (req.query) {
        sanitizeObject(req.query);
    }

    next();
};

// Validate update permissions for academic details
const validateAcademicUpdatePermissions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // If updating by ID (admin/teacher route)
        if (id) {
            if (!['Admin', 'Teacher'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin or Teacher role required.'
                });
            }
        } else {
            // If updating own details (student route)
            if (req.user.role !== 'Student') {
                return res.status(403).json({
                    success: false,
                    message: 'Students can only update their own academic details'
                });
            }
        }

        next();
    } catch (error) {
        console.error('Error validating update permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating permissions',
            error: error.message
        });
    }
};

module.exports = {
    validateDepartmentData,
    validateSemesterData,
    validateSubjectData,
    validateAcademicDetailsData,
    checkDepartmentExists,
    checkSemesterExists,
    checkSubjectExists,
    isAdminOrTeacher,
    isAdmin,
    isStudentOnly,
    validatePagination,
    validateObjectId,
    checkAcademicDetailsExist,
    validateDeptAndSemParams,
    validateSearchQuery,
    validateFileUpload,
    rateLimitMiddleware,
    sanitizeInput,
    validateAcademicUpdatePermissions
};
