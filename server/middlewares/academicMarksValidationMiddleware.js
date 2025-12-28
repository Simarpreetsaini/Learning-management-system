const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const AcademicMarks = require('../models/academicMarksModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
const Subject = require('../models/subjectModel');
const Semester = require('../models/semesterModel');
const Department = require('../models/departmentModel');

/**
 * Academic Marks Validation Middleware
 * Provides comprehensive validation for academic marks operations
 */

// Error codes for better error handling
const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DUPLICATE_RECORD: 'DUPLICATE_RECORD',
    INVALID_REFERENCE: 'INVALID_REFERENCE',
    BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND'
};

// Exam type patterns and validation
const EXAM_TYPE_PATTERNS = {
    MST: /^MST[1-9]$/,
    CLASS_TEST: /^ClassTest[1-9]$/,
    ASSIGNMENT: /^Assignment[1-9]$/,
    QUIZ: /^Quiz[1-9]$/,
    LAB: /^Lab[1-9]$/,
    PROJECT: /^Project[1-9]$/,
    VIVA: /^Viva[1-9]$/,
    FINAL: /^Final$/,
    MIDTERM: /^Midterm$/
};

const VALID_EXAM_TYPES = Object.values(EXAM_TYPE_PATTERNS).map(pattern => pattern.source);

// Helper function to validate exam type format
const isValidExamType = (examType) => {
    return Object.values(EXAM_TYPE_PATTERNS).some(pattern => pattern.test(examType));
};

// Helper function to sanitize and validate numeric inputs
const sanitizeNumericInput = (value, fieldName, min = 0, max = null) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
        throw new Error(`${fieldName} must be a valid number`);
    }
    if (num < min) {
        throw new Error(`${fieldName} cannot be less than ${min}`);
    }
    if (max !== null && num > max) {
        throw new Error(`${fieldName} cannot be greater than ${max}`);
    }
    return num;
};

// Helper function to validate date inputs
const validateDateInput = (dateValue, fieldName) => {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
        throw new Error(`${fieldName} must be a valid date`);
    }
    
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (date < oneYearAgo || date > oneYearFromNow) {
        throw new Error(`${fieldName} must be within the last year or next year`);
    }
    
    return date;
};

// Validation rules for creating/updating academic marks
const validateAcademicMarksData = () => {
    return [
        // Student validation
        body('student')
            .notEmpty()
            .withMessage('Student ID is required')
            .isMongoId()
            .withMessage('Student ID must be a valid MongoDB ObjectId'),

        // Subject validation
        body('subject')
            .notEmpty()
            .withMessage('Subject ID is required')
            .isMongoId()
            .withMessage('Subject ID must be a valid MongoDB ObjectId'),

        // Marks validation
        body('marks')
            .notEmpty()
            .withMessage('Marks are required')
            .isFloat({ min: 0 })
            .withMessage('Marks must be a non-negative number'),

        // Max marks validation
        body('maxMarks')
            .notEmpty()
            .withMessage('Maximum marks are required')
            .isFloat({ min: 1, max: 1000 })
            .withMessage('Maximum marks must be between 1 and 1000'),

        // Passing marks validation
        body('passingMarks')
            .notEmpty()
            .withMessage('Passing marks are required')
            .isFloat({ min: 0 })
            .withMessage('Passing marks must be non-negative'),

        // Exam type validation
        body('examType')
            .notEmpty()
            .withMessage('Exam type is required')
            .trim()
            .custom((value) => {
                if (!isValidExamType(value)) {
                    throw new Error('Invalid exam type format');
                }
                return true;
            }),

        // Exam date validation
        body('examDate')
            .notEmpty()
            .withMessage('Exam date is required')
            .isISO8601()
            .withMessage('Exam date must be a valid ISO 8601 date'),

        // Semester validation
        body('semester')
            .notEmpty()
            .withMessage('Semester ID is required')
            .isMongoId()
            .withMessage('Semester ID must be a valid MongoDB ObjectId'),

        // Department validation
        body('department')
            .notEmpty()
            .withMessage('Department ID is required')
            .isMongoId()
            .withMessage('Department ID must be a valid MongoDB ObjectId'),

        // Section validation
        body('section')
            .notEmpty()
            .withMessage('Section is required')
            .trim()
            .isLength({ min: 1, max: 5 })
            .withMessage('Section must be between 1 and 5 characters')
            .matches(/^[A-Z0-9]+$/i)
            .withMessage('Section can only contain letters and numbers')
    ];
};

// Validation rules for bulk academic marks operations
const validateBulkAcademicMarksData = () => {
    return [
        body()
            .isArray({ min: 1, max: 100 })
            .withMessage('Request body must be an array with 1-100 items'),
        
        body('*.student')
            .notEmpty()
            .withMessage('Student ID is required for each entry')
            .isMongoId()
            .withMessage('Student ID must be a valid MongoDB ObjectId'),
        
        body('*.subject')
            .notEmpty()
            .withMessage('Subject ID is required for each entry')
            .isMongoId()
            .withMessage('Subject ID must be a valid MongoDB ObjectId'),
        
        body('*.marks')
            .notEmpty()
            .withMessage('Marks are required for each entry')
            .isFloat({ min: 0 })
            .withMessage('Marks must be a non-negative number'),
        
        body('*.maxMarks')
            .notEmpty()
            .withMessage('Maximum marks are required for each entry')
            .isFloat({ min: 1, max: 1000 })
            .withMessage('Maximum marks must be between 1 and 1000'),
        
        body('*.passingMarks')
            .notEmpty()
            .withMessage('Passing marks are required for each entry')
            .isFloat({ min: 0 })
            .withMessage('Passing marks must be non-negative'),
        
        body('*.examType')
            .notEmpty()
            .withMessage('Exam type is required for each entry')
            .trim()
            .custom((value) => {
                if (!isValidExamType(value)) {
                    throw new Error(`Invalid exam type: ${value}`);
                }
                return true;
            }),
        
        body('*.examDate')
            .notEmpty()
            .withMessage('Exam date is required for each entry')
            .isISO8601()
            .withMessage('Exam date must be a valid ISO 8601 date'),
        
        body('*.semester')
            .notEmpty()
            .withMessage('Semester ID is required for each entry')
            .isMongoId()
            .withMessage('Semester ID must be a valid MongoDB ObjectId'),
        
        body('*.department')
            .notEmpty()
            .withMessage('Department ID is required for each entry')
            .isMongoId()
            .withMessage('Department ID must be a valid MongoDB ObjectId'),
        
        body('*.section')
            .notEmpty()
            .withMessage('Section is required for each entry')
            .trim()
            .isLength({ min: 1, max: 5 })
            .withMessage('Section must be between 1 and 5 characters')
    ];
};

// Validation rules for updating academic marks (optional fields)
const validateAcademicMarksUpdateData = () => {
    return [
        // Student validation (optional for updates)
        body('student')
            .optional()
            .isMongoId()
            .withMessage('Student ID must be a valid MongoDB ObjectId'),

        // Subject validation (optional for updates)
        body('subject')
            .optional()
            .isMongoId()
            .withMessage('Subject ID must be a valid MongoDB ObjectId'),

        // Marks validation (optional for updates) - basic validation only
        body('marks')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Marks must be a non-negative number'),

        // Max marks validation (optional for updates) - basic validation only
        body('maxMarks')
            .optional()
            .isFloat({ min: 1, max: 1000 })
            .withMessage('Maximum marks must be between 1 and 1000'),

        // Passing marks validation (optional for updates) - basic validation only
        body('passingMarks')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Passing marks must be non-negative'),

        // Exam type validation (optional for updates)
        body('examType')
            .optional()
            .trim()
            .custom((value) => {
                if (value && !isValidExamType(value)) {
                    throw new Error('Invalid exam type format');
                }
                return true;
            }),

        // Exam date validation (optional for updates)
        body('examDate')
            .optional()
            .isISO8601()
            .withMessage('Exam date must be a valid ISO 8601 date'),

        // Semester validation (optional for updates)
        body('semester')
            .optional()
            .isMongoId()
            .withMessage('Semester ID must be a valid MongoDB ObjectId'),

        // Department validation (optional for updates)
        body('department')
            .optional()
            .isMongoId()
            .withMessage('Department ID must be a valid MongoDB ObjectId'),

        // Section validation (optional for updates)
        body('section')
            .optional()
            .trim()
            .isLength({ min: 1, max: 5 })
            .withMessage('Section must be between 1 and 5 characters')
            .matches(/^[A-Z0-9]+$/i)
            .withMessage('Section can only contain letters and numbers')
    ];
};

// Validation for query parameters
const validateQueryParams = () => {
    return [
        param('departmentId')
            .optional()
            .isMongoId()
            .withMessage('Department ID must be a valid MongoDB ObjectId'),
        
        param('semesterId')
            .optional()
            .isMongoId()
            .withMessage('Semester ID must be a valid MongoDB ObjectId'),
        
        param('subjectId')
            .optional()
            .isMongoId()
            .withMessage('Subject ID must be a valid MongoDB ObjectId'),
        
        param('section')
            .optional()
            .trim()
            .isLength({ min: 1, max: 5 })
            .withMessage('Section must be between 1 and 5 characters'),
        
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        
        query('sortBy')
            .optional()
            .isIn(['marks', 'examDate', 'examType', 'student', 'subject'])
            .withMessage('Invalid sort field'),
        
        query('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Sort order must be asc or desc')
    ];
};

// Business rule validation middleware for creation
const validateBusinessRules = async (req, res, next) => {
    try {
        console.log('[validateBusinessRules] Starting business rule validation');
        const marksData = Array.isArray(req.body) ? req.body : [req.body];
        const errors = [];

        for (const [index, markData] of marksData.entries()) {
            try {
                const { student, subject, semester, examType, marks, maxMarks, passingMarks } = markData;

                console.log(`[validateBusinessRules] Validating entry ${index + 1}:`, {
                    student, subject, semester, examType, marks, maxMarks, passingMarks
                });

                // Validate marks relationships
                if (marks !== undefined && maxMarks !== undefined) {
                    const marksNum = parseFloat(marks);
                    const maxMarksNum = parseFloat(maxMarks);
                    
                    if (!isNaN(marksNum) && !isNaN(maxMarksNum) && marksNum > maxMarksNum) {
                        errors.push({
                            index,
                            field: 'marks',
                            message: 'Marks cannot exceed maximum marks',
                            code: ERROR_CODES.BUSINESS_RULE_VIOLATION
                        });
                    }
                }

                if (passingMarks !== undefined && maxMarks !== undefined) {
                    const passingMarksNum = parseFloat(passingMarks);
                    const maxMarksNum = parseFloat(maxMarks);
                    
                    if (!isNaN(passingMarksNum) && !isNaN(maxMarksNum) && passingMarksNum > maxMarksNum) {
                        errors.push({
                            index,
                            field: 'passingMarks',
                            message: 'Passing marks cannot exceed maximum marks',
                            code: ERROR_CODES.BUSINESS_RULE_VIOLATION
                        });
                    }
                }

                // Check for duplicate records (same student, subject, semester, examType) - with timeout
                if (student && subject && semester && examType) {
                    try {
                        const existingRecord = await Promise.race([
                            AcademicMarks.findOne({
                                student,
                                subject,
                                semester,
                                examType
                            }).lean(),
                            new Promise((_, reject) => {
                                setTimeout(() => reject(new Error('Database query timeout')), 5000);
                            })
                        ]);

                        if (existingRecord && req.method === 'POST') {
                            errors.push({
                                index,
                                field: 'duplicate',
                                message: `Marks for ${examType} already exist for this student-subject-semester combination`,
                                code: ERROR_CODES.DUPLICATE_RECORD,
                                existingRecordId: existingRecord._id
                            });
                        }
                    } catch (dbError) {
                        console.warn(`[validateBusinessRules] Database error checking duplicates for entry ${index + 1}:`, dbError.message);
                        // Continue validation instead of failing completely
                    }
                }

                // Validate student-subject-semester relationship - with timeout and error handling
                if (student && subject && semester) {
                    try {
                        const [studentDetails, subjectDetails] = await Promise.race([
                            Promise.all([
                                StudentAcademicDetails.findById(student).lean(),
                                Subject.findById(subject).lean()
                            ]),
                            new Promise((_, reject) => {
                                setTimeout(() => reject(new Error('Database query timeout')), 5000);
                            })
                        ]);

                        if (studentDetails && subjectDetails) {
                            // Check if student's semester matches the subject's semester
                            if (studentDetails.semester && studentDetails.semester.toString() !== semester.toString()) {
                                errors.push({
                                    index,
                                    field: 'semester',
                                    message: 'Student semester does not match the provided semester',
                                    code: ERROR_CODES.BUSINESS_RULE_VIOLATION
                                });
                            }

                            // Check if student's department matches the subject's department
                            if (studentDetails.department && subjectDetails.department && 
                                studentDetails.department.toString() !== subjectDetails.department.toString()) {
                                errors.push({
                                    index,
                                    field: 'department',
                                    message: 'Student department does not match subject department',
                                    code: ERROR_CODES.BUSINESS_RULE_VIOLATION
                                });
                            }
                        }
                    } catch (dbError) {
                        console.warn(`[validateBusinessRules] Database error validating relationships for entry ${index + 1}:`, dbError.message);
                        // Continue validation instead of failing completely
                    }
                }
            } catch (entryError) {
                console.error(`[validateBusinessRules] Error validating entry ${index + 1}:`, entryError);
                errors.push({
                    index,
                    field: 'general',
                    message: 'Error validating this entry',
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }
        }

        console.log(`[validateBusinessRules] Validation complete. Found ${errors.length} errors`);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Business rule validation failed',
                errors,
                code: ERROR_CODES.BUSINESS_RULE_VIOLATION
            });
        }

        next();
    } catch (error) {
        console.error('[validateBusinessRules] Critical error in business rule validation:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating business rules',
            error: error.message,
            code: ERROR_CODES.VALIDATION_ERROR
        });
    }
};

// Business rule validation middleware for updates (simplified)
const validateUpdateBusinessRules = async (req, res, next) => {
    try {
        console.log('[validateUpdateBusinessRules] Starting update business rule validation');
        const markData = req.body;
        const errors = [];

        let marksNum, maxMarksNum, passingMarksNum;

        // Parse and validate numeric inputs
        if (markData.marks !== undefined) {
            marksNum = parseFloat(markData.marks);
            if (isNaN(marksNum)) {
                errors.push({
                    field: 'marks',
                    message: 'Marks must be a valid number',
                    value: markData.marks,
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }
        }
        if (markData.maxMarks !== undefined) {
            maxMarksNum = parseFloat(markData.maxMarks);
            if (isNaN(maxMarksNum)) {
                errors.push({
                    field: 'maxMarks',
                    message: 'Maximum marks must be a valid number',
                    value: markData.maxMarks,
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }
        }
        if (markData.passingMarks !== undefined) {
            passingMarksNum = parseFloat(markData.passingMarks);
            if (isNaN(passingMarksNum)) {
                errors.push({
                    field: 'passingMarks',
                    message: 'Passing marks must be a valid number',
                    value: markData.passingMarks,
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }
        }

        // If we have parsing errors, return early
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Data validation failed',
                details: errors,
                code: ERROR_CODES.VALIDATION_ERROR,
                operation: 'updateMarksRecord',
                timestamp: new Date().toISOString(),
                context: {
                    markId: req.params.markId
                }
            });
        }

        console.log(`[validateUpdateBusinessRules] Validating update data:`, {
            marks: marksNum, maxMarks: maxMarksNum, passingMarks: passingMarksNum
        });

        // Determine the effective maxMarks for validation
        let effectiveMaxMarks = null;
        
        // Priority 1: If new maxMarks is provided, use it
        if (maxMarksNum !== undefined && !isNaN(maxMarksNum)) {
            effectiveMaxMarks = maxMarksNum;
            console.log(`[validateUpdateBusinessRules] Using new maxMarks: ${effectiveMaxMarks}`);
        } 
        // Priority 2: If marks or passingMarks need validation but no new maxMarks, get existing maxMarks
        else if ((marksNum !== undefined && !isNaN(marksNum)) || (passingMarksNum !== undefined && !isNaN(passingMarksNum))) {
            try {
                const markId = req.params.markId;
                
                // Validate markId format first
                if (!markId || !mongoose.Types.ObjectId.isValid(markId)) {
                    console.warn(`[validateUpdateBusinessRules] Invalid markId format: ${markId}`);
                    // Skip validation against existing record if markId is invalid
                    // Let the controller handle the invalid ID error
                } else {
                    // Use Promise.race with timeout to prevent hanging
                    const existingRecord = await Promise.race([
                        AcademicMarks.findById(markId).lean().select('maxMarks'),
                        new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Database query timeout')), 2000);
                        })
                    ]);
                    
                    if (existingRecord && existingRecord.maxMarks !== undefined && !isNaN(existingRecord.maxMarks)) {
                        effectiveMaxMarks = existingRecord.maxMarks;
                        console.log(`[validateUpdateBusinessRules] Using existing maxMarks: ${effectiveMaxMarks}`);
                    } else {
                        console.warn(`[validateUpdateBusinessRules] Existing record not found or invalid maxMarks for markId: ${markId}`);
                        // Continue validation without this check - let controller handle missing record
                    }
                }
            } catch (dbError) {
                console.warn(`[validateUpdateBusinessRules] Database error checking existing record:`, dbError.message);
                // Continue validation without this check - don't fail the entire validation
                // The controller will handle database issues appropriately
            }
        }

        console.log(`[validateUpdateBusinessRules] Effective maxMarks for validation: ${effectiveMaxMarks}`);

        // Only perform cross-field validation if we have valid numbers
        if (effectiveMaxMarks !== null && !isNaN(effectiveMaxMarks)) {
            // Validate marks against effective maxMarks
            if (marksNum !== undefined && !isNaN(marksNum)) {
                if (marksNum > effectiveMaxMarks) {
                    errors.push({
                        field: 'marks',
                        message: `Marks (${marksNum}) cannot exceed maximum marks (${effectiveMaxMarks})`,
                        value: marksNum,
                        maxMarks: effectiveMaxMarks,
                        code: ERROR_CODES.BUSINESS_RULE_VIOLATION
                    });
                }
            }

            // Validate passingMarks against effective maxMarks
            if (passingMarksNum !== undefined && !isNaN(passingMarksNum)) {
                if (passingMarksNum > effectiveMaxMarks) {
                    errors.push({
                        field: 'passingMarks',
                        message: `Passing marks (${passingMarksNum}) cannot exceed maximum marks (${effectiveMaxMarks})`,
                        value: passingMarksNum,
                        maxMarks: effectiveMaxMarks,
                        code: ERROR_CODES.BUSINESS_RULE_VIOLATION
                    });
                }
            }
        }

        // Additional validation: if both marks and maxMarks are being updated together
        if (marksNum !== undefined && maxMarksNum !== undefined && !isNaN(marksNum) && !isNaN(maxMarksNum)) {
            if (marksNum > maxMarksNum) {
                errors.push({
                    field: 'marks',
                    message: `Marks (${marksNum}) cannot exceed the new maximum marks (${maxMarksNum})`,
                    value: marksNum,
                    maxMarks: maxMarksNum,
                    code: ERROR_CODES.BUSINESS_RULE_VIOLATION
                });
            }
        }

        // Additional validation: if both passingMarks and maxMarks are being updated together
        if (passingMarksNum !== undefined && maxMarksNum !== undefined && !isNaN(passingMarksNum) && !isNaN(maxMarksNum)) {
            if (passingMarksNum > maxMarksNum) {
                errors.push({
                    field: 'passingMarks',
                    message: `Passing marks (${passingMarksNum}) cannot exceed the new maximum marks (${maxMarksNum})`,
                    value: passingMarksNum,
                    maxMarks: maxMarksNum,
                    code: ERROR_CODES.BUSINESS_RULE_VIOLATION
                });
            }
        }

        console.log(`[validateUpdateBusinessRules] Validation complete. Found ${errors.length} errors`);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Data validation failed',
                details: errors,
                code: ERROR_CODES.VALIDATION_ERROR,
                operation: 'updateMarksRecord',
                timestamp: new Date().toISOString(),
                context: {
                    markId: req.params.markId
                }
            });
        }

        next();
    } catch (error) {
        console.error('[validateUpdateBusinessRules] Critical error in update business rule validation:', error);
        res.status(500).json({
            success: false,
            message: 'Data validation failed',
            details: [{
                field: 'general',
                message: 'Internal validation error occurred',
                code: ERROR_CODES.VALIDATION_ERROR
            }],
            code: ERROR_CODES.VALIDATION_ERROR,
            operation: 'updateMarksRecord',
            timestamp: new Date().toISOString(),
            context: {
                markId: req.params.markId
            }
        });
    }
};

// Permission validation middleware
const validatePermissions = (req, res, next) => {
    const { role } = req.user;
    const allowedRoles = ['Admin', 'Teacher'];

    if (!allowedRoles.includes(role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Teacher role required.',
            code: ERROR_CODES.PERMISSION_DENIED
        });
    }

    next();
};

// Input sanitization middleware
const sanitizeAcademicMarksInput = (req, res, next) => {
    try {
        const sanitizeString = (str) => {
            if (typeof str !== 'string') return str;
            return str.trim().replace(/[<>]/g, '');
        };

        const sanitizeMarkData = (data) => {
            try {
                if (typeof data.section === 'string') {
                    data.section = data.section.toUpperCase().trim();
                }
                if (typeof data.examType === 'string') {
                    data.examType = data.examType.trim();
                }
                
                // Safe numeric validation without throwing errors
                if (data.marks !== undefined) {
                    const marks = parseFloat(data.marks);
                    if (!isNaN(marks) && marks >= 0) {
                        data.marks = marks;
                    }
                }
                if (data.maxMarks !== undefined) {
                    const maxMarks = parseFloat(data.maxMarks);
                    if (!isNaN(maxMarks) && maxMarks >= 1 && maxMarks <= 1000) {
                        data.maxMarks = maxMarks;
                    }
                }
                if (data.passingMarks !== undefined) {
                    const passingMarks = parseFloat(data.passingMarks);
                    if (!isNaN(passingMarks) && passingMarks >= 0) {
                        data.passingMarks = passingMarks;
                    }
                }
                
                // Safe date validation without throwing errors
                if (data.examDate) {
                    const date = new Date(data.examDate);
                    if (!isNaN(date.getTime())) {
                        data.examDate = date;
                    }
                }
                
                return data;
            } catch (error) {
                console.error('Error sanitizing individual mark data:', error);
                return data; // Return original data if sanitization fails
            }
        };

        if (Array.isArray(req.body)) {
            req.body = req.body.map(sanitizeMarkData);
        } else if (req.body) {
            req.body = sanitizeMarkData(req.body);
        }

        next();
    } catch (error) {
        console.error('Error in sanitizeAcademicMarksInput middleware:', error);
        res.status(400).json({
            success: false,
            message: 'Input sanitization failed',
            error: error.message,
            code: ERROR_CODES.VALIDATION_ERROR
        });
    }
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value,
            location: error.location
        }));

        return res.status(400).json({
            success: false,
            message: 'Data validation failed',
            details: formattedErrors,
            code: ERROR_CODES.VALIDATION_ERROR,
            operation: 'updateMarksRecord',
            timestamp: new Date().toISOString(),
            context: {
                markId: req.params.markId
            }
        });
    }

    next();
};

// Rate limiting for academic marks operations
const academicMarksRateLimit = (maxRequests = 200, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        const clientId = `${req.ip}-${req.user?.id || 'anonymous'}`;
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
                message: 'Too many academic marks requests. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000),
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        // Add current request
        validRequests.push(now);
        requests.set(clientId, validRequests);

        next();
    };
};

// Audit logging middleware
const auditLogger = (action) => {
    return (req, res, next) => {
        const startTime = Date.now();
        
        // Store original json method
        const originalJson = res.json;
        
        // Override json method to capture response
        res.json = function(data) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Log audit information
            console.log(`[AUDIT] Academic Marks ${action}`, {
                timestamp: new Date().toISOString(),
                userId: req.user?.id,
                userRole: req.user?.role,
                action,
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                requestBody: req.method === 'POST' || req.method === 'PUT' ? 
                    (Array.isArray(req.body) ? `${req.body.length} records` : 'single record') : undefined,
                responseStatus: res.statusCode,
                success: data?.success,
                duration: `${duration}ms`,
                errorCode: data?.code
            });
            
            // Call original json method
            originalJson.call(this, data);
        };
        
        next();
    };
};

module.exports = {
    validateAcademicMarksData,
    validateBulkAcademicMarksData,
    validateAcademicMarksUpdateData,
    validateQueryParams,
    validateBusinessRules,
    validateUpdateBusinessRules,
    validatePermissions,
    sanitizeAcademicMarksInput,
    handleValidationErrors,
    academicMarksRateLimit,
    auditLogger,
    ERROR_CODES,
    EXAM_TYPE_PATTERNS,
    isValidExamType
};
