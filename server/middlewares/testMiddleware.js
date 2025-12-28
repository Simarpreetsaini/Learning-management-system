const { body, param, query, validationResult } = require('express-validator');
const Test = require('../models/testModel');
const TestSubmission = require('../models/testSubmissionModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
const Department = require('../models/departmentModel');
const Semester = require('../models/semesterModel');
const Subject = require('../models/subjectModel');
const mongoose = require('mongoose');

// Validate test creation data
const validateTestCreationData = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    
    body('department')
        .isMongoId()
        .withMessage('Department must be a valid MongoDB ObjectId'),
    
    body('semester')
        .isMongoId()
        .withMessage('Semester must be a valid MongoDB ObjectId'),
    
    body('subject')
        .isMongoId()
        .withMessage('Subject must be a valid MongoDB ObjectId'),
    
    body('questions')
        .isArray({ min: 1 })
        .withMessage('Test must have at least one question'),
    
    body('questions.*.questionText')
        .trim()
        .isLength({ min: 5, max: 1000 })
        .withMessage('Question text must be between 5 and 1000 characters'),
    
    body('questions.*.options')
        .isArray({ min: 2, max: 6 })
        .withMessage('Each question must have between 2 and 6 options'),
    
    body('questions.*.options.*')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Each option must be between 1 and 200 characters'),
    
    body('questions.*.correctAnswerIndex')
        .isInt({ min: 0 })
        .withMessage('Correct answer index must be a non-negative integer'),
    
    body('questions.*.marks')
        .isInt({ min: 1, max: 100 })
        .withMessage('Marks must be between 1 and 100'),
    
    body('duration')
        .optional()
        .isInt({ min: 1, max: 600 })
        .withMessage('Duration must be between 1 and 600 minutes'),
    
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date')
        .custom((value) => {
            if (value && new Date(value) <= new Date()) {
                throw new Error('Due date must be in the future');
            }
            return true;
        }),
    
    body('allowReview')
        .optional()
        .isBoolean()
        .withMessage('Allow review must be a boolean'),
    
    body('randomizeQuestions')
        .optional()
        .isBoolean()
        .withMessage('Randomize questions must be a boolean'),
    
    body('randomizeOptions')
        .optional()
        .isBoolean()
        .withMessage('Randomize options must be a boolean'),
    
    body('maxAttempts')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Max attempts must be between 1 and 5'),
    
    body('instructions')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Instructions must not exceed 2000 characters'),

    // Custom validation for correct answer index
    body('questions').custom((questions) => {
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (question.correctAnswerIndex >= question.options.length) {
                throw new Error(`Question ${i + 1}: Correct answer index is out of range`);
            }
        }
        return true;
    }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('Test validation errors:', errors.array());
            console.error('Request body:', JSON.stringify(req.body, null, 2));
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Validate test submission data
const validateTestSubmissionData = [
    body('submittedAnswers')
        .isArray({ min: 1 })
        .withMessage('Submitted answers must be a non-empty array'),
    
    body('submittedAnswers.*.questionIndex')
        .isInt({ min: 0 })
        .withMessage('Question index must be a non-negative integer'),
    
    body('submittedAnswers.*.selectedOptionIndex')
        .isInt({ min: 0 })
        .withMessage('Selected option index must be a non-negative integer'),

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

// Validate MongoDB ObjectId parameters
const validateObjectId = (paramName) => [
    param(paramName)
        .isMongoId()
        .withMessage(`${paramName} must be a valid MongoDB ObjectId`),
    
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

// Check if user is a teacher
const isTeacher = (req, res, next) => {
    if (req.user.role !== 'Teacher') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Teacher role required.'
        });
    }
    next();
};

// Check if user is a student
const isStudent = (req, res, next) => {
    if (req.user.role !== 'Student' && req.user.role !== 'Teacher') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student role required.'
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

// Check test ownership (for teachers)
const checkTestOwnership = async (req, res, next) => {
    try {
        const { id, testId } = req.params;
        const testIdToCheck = testId || id;

        const test = await Test.findById(testIdToCheck);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        if (test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own tests.'
            });
        }

        req.test = test; // Attach test to request for later use
        next();
    } catch (error) {
        console.error('Error checking test ownership:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking test ownership',
            error: error.message
        });
    }
};

// Check test access for students (department and semester match)
const checkTestAccess = async (req, res, next) => {
    try {
        const { id, testId } = req.params;
        const testIdToCheck = testId || id;

        const test = await Test.findById(testIdToCheck);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Get student's academic details
        const academicDetails = await StudentAcademicDetails.findOne({ userId: req.user.id });
        if (!academicDetails) {
            return res.status(404).json({
                success: false,
                message: 'Academic details not found. Please complete your profile first.'
            });
        }

        // Check if student's department and semester match test
        if (academicDetails.department.toString() !== test.department.toString() ||
            academicDetails.semester.toString() !== test.semester.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this test'
            });
        }

        req.test = test; // Attach test to request
        req.academicDetails = academicDetails; // Attach academic details
        next();
    } catch (error) {
        console.error('Error checking test access:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking test access',
            error: error.message
        });
    }
};

// Check if test is active and not expired
const checkTestAvailability = async (req, res, next) => {
    try {
        const test = req.test; // Should be set by previous middleware

        if (!test.isActive) {
            return res.status(400).json({
                success: false,
                message: 'This test is not currently active'
            });
        }

        if (test.dueDate && new Date() > test.dueDate) {
            return res.status(400).json({
                success: false,
                message: 'This test has expired'
            });
        }

        next();
    } catch (error) {
        console.error('Error checking test availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking test availability',
            error: error.message
        });
    }
};

// Check if student has already submitted the test
const checkTestNotSubmitted = async (req, res, next) => {
    try {
        const { id, testId } = req.params;
        const testIdToCheck = testId || id;

        const existingSubmission = await TestSubmission.findOne({
            testId: testIdToCheck,
            studentId: req.user.id,
            isCompleted: true
        });

        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'You have already completed this test'
            });
        }

        next();
    } catch (error) {
        console.error('Error checking test submission status:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking test submission status',
            error: error.message
        });
    }
};

// Check if test has submissions (prevents modification)
const checkTestNotGraded = async (req, res, next) => {
    try {
        const { id, testId } = req.params;
        const testIdToCheck = testId || id;

        const submissionCount = await TestSubmission.countDocuments({ testId: testIdToCheck });
        if (submissionCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify test that already has submissions'
            });
        }

        next();
    } catch (error) {
        console.error('Error checking test submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking test submissions',
            error: error.message
        });
    }
};

// Check if student has an active test session
const checkActiveTestSession = async (req, res, next) => {
    try {
        const { id, testId } = req.params;
        const testIdToCheck = testId || id;

        const activeSubmission = await TestSubmission.findOne({
            testId: testIdToCheck,
            studentId: req.user.id,
            isCompleted: false
        });

        if (!activeSubmission) {
            return res.status(400).json({
                success: false,
                message: 'No active test session found. Please start the test first.'
            });
        }

        req.submission = activeSubmission; // Attach submission to request
        next();
    } catch (error) {
        console.error('Error checking active test session:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking active test session',
            error: error.message
        });
    }
};

// Check submission ownership (for students viewing their own submissions)
const checkSubmissionOwnership = async (req, res, next) => {
    try {
        const { submissionId } = req.params;

        const submission = await TestSubmission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // For students, check if they own the submission
        if (req.user.role === 'Student' && submission.studentId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own submissions.'
            });
        }

        // For teachers, check if they own the test
        if (req.user.role === 'Teacher') {
            const test = await Test.findById(submission.testId);
            if (test.createdBy.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view submissions for your own tests.'
                });
            }
        }

        req.submission = submission; // Attach submission to request
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
        if (!mongoose.Types.ObjectId.isValid(departmentId) || 
            !mongoose.Types.ObjectId.isValid(semesterId)) {
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

    // Rate limiting middleware for test operations
    const rateLimitTest = (req, res, next) => {
    // Implement rate limiting logic here
    // For example, you can use a library like express-rate-limit
    // to limit the number of requests to certain endpoints.

    // Example: Allow only 5 requests per minute
    const rateLimit = 5; // Number of requests
    const timeWindow = 60 * 1000; // Time window in milliseconds (1 minute)

    // You can use a simple in-memory store or a more robust solution like Redis
    // Here, we will just use a simple in-memory object for demonstration
    const userRequests = req.app.locals.userRequests || {};
    const userId = req.user.id;

    if (!userRequests[userId]) {
        userRequests[userId] = [];
    }

    // Filter out requests that are older than the time window
    const currentTime = Date.now();
    userRequests[userId] = userRequests[userId].filter(timestamp => (currentTime - timestamp) < timeWindow);

    // Check if the user has exceeded the rate limit
    if (userRequests[userId].length >= rateLimit) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    }

    // Log the current request timestamp
    userRequests[userId].push(currentTime);
    req.app.locals.userRequests = userRequests; // Store back to app locals
    next();
};

// Export all middleware functions
module.exports = {
    validateTestCreationData,
    validateTestSubmissionData,
    validateObjectId,
    isTeacher,
    isStudent,
    isAdminOrTeacher,
    checkTestOwnership,
    checkTestAccess,
    checkTestAvailability,
    checkTestNotSubmitted,
    checkTestNotGraded,
    checkActiveTestSession,
    checkSubmissionOwnership,
    validateDeptAndSemParams,
    rateLimitTest
};
