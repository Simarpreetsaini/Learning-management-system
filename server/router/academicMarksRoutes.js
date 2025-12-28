const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {
    createOrUpdateMarks,
    getMarksForStudent,
    getMarksByDeptSemSection,
    getStudentsByDeptAndSem,
    getStudentsBySubject,
    getAllMarksForTeacher,
    updateMarksRecord,
    deleteMarksRecord
} = require('../controllers/academicMarksController');

const AcademicMarks = require('../models/academicMarksModel');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateObjectId, sanitizeInput } = require('../middlewares/validationMiddleware');
const {
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
    ERROR_CODES
} = require('../middlewares/academicMarksValidationMiddleware');

// Helper function for error handling (defined locally since it's not exported from controller)
const handleDatabaseError = (error, operation, context = {}) => {
    const errorResponse = {
        success: false,
        operation,
        timestamp: new Date().toISOString(),
        context
    };

    // Handle specific MongoDB errors
    if (error.code === 11000) {
        errorResponse.message = 'Duplicate record detected';
        errorResponse.code = ERROR_CODES.DUPLICATE_RECORD;
        errorResponse.details = 'A record with this combination already exists';
        return errorResponse;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
        errorResponse.message = 'Data validation failed';
        errorResponse.code = ERROR_CODES.VALIDATION_ERROR;
        errorResponse.details = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message,
            value: err.value
        }));
        return errorResponse;
    }

    // Generic error handling
    errorResponse.message = 'Database operation failed';
    errorResponse.code = 'DATABASE_ERROR';
    errorResponse.details = error.message;
    
    return errorResponse;
};

/**
 * Enhanced Academic Marks Routes
 * Provides comprehensive routing with enhanced validation, rate limiting, and audit logging
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

// Apply rate limiting specifically for academic marks operations
router.use(academicMarksRateLimit(50, 15 * 60 * 1000)); // 50 requests per 15 minutes

// Apply input sanitization to all routes
router.use(sanitizeInput);
router.use(sanitizeAcademicMarksInput);

// Route for teacher/admin to create or update marks (single or bulk)
router.post('/',
    auditLogger('CREATE_OR_UPDATE_MARKS'),
    validatePermissions,
    // Apply appropriate validation based on request body type
    (req, res, next) => {
        console.log('[POST /academic-marks] Request received');
        console.log('[POST /academic-marks] Request body type:', Array.isArray(req.body) ? 'array' : typeof req.body);
        console.log('[POST /academic-marks] Request body length:', Array.isArray(req.body) ? req.body.length : 'N/A');
        
        // Apply validation rules based on request type
        if (Array.isArray(req.body)) {
            // Bulk validation
            validateBulkAcademicMarksData().forEach(rule => rule(req, res, () => {}));
        } else {
            // Single validation
            validateAcademicMarksData().forEach(rule => rule(req, res, () => {}));
        }
        next();
    },
    handleValidationErrors,
    validateBusinessRules,
    createOrUpdateMarks
);

// Route for student to get their marks
router.get('/my-marks',
    auditLogger('GET_STUDENT_MARKS'),
    validateQueryParams(),
    handleValidationErrors,
    getMarksForStudent
);

// Route for teacher/admin to get students by department and semester
router.get('/department/:departmentId/semester/:semesterId',
    auditLogger('GET_STUDENTS_BY_DEPT_SEM'),
    validatePermissions,
    validateObjectId('departmentId'),
    validateObjectId('semesterId'),
    validateQueryParams(),
    handleValidationErrors,
    getStudentsByDeptAndSem
);

// Route for teacher/admin to get marks by department, semester, section
router.get('/department/:departmentId/semester/:semesterId/section/:section',
    auditLogger('GET_MARKS_BY_DEPT_SEM_SECTION'),
    validatePermissions,
    validateObjectId('departmentId'),
    validateObjectId('semesterId'),
    validateQueryParams(),
    handleValidationErrors,
    getMarksByDeptSemSection
);

// Route for teacher/admin to get students by subject
router.get('/subject/:subjectId/students',
    auditLogger('GET_STUDENTS_BY_SUBJECT'),
    validatePermissions,
    validateObjectId('subjectId'),
    validateQueryParams(),
    handleValidationErrors,
    getStudentsBySubject
);

// Route for teacher/admin to get all marks records
router.get('/teacher/all-marks',
    auditLogger('GET_ALL_MARKS_FOR_TEACHER'),
    validatePermissions,
    validateQueryParams(),
    handleValidationErrors,
    getAllMarksForTeacher
);

// Route for teacher/admin to update specific marks record
router.put('/:markId',
    auditLogger('UPDATE_SPECIFIC_MARKS'),
    validatePermissions,
    validateObjectId('markId'),
    validateAcademicMarksUpdateData(),
    handleValidationErrors,
    validateUpdateBusinessRules,
    updateMarksRecord
);

// Route for teacher/admin to delete specific marks record
router.delete('/:markId',
    auditLogger('DELETE_MARKS'),
    validatePermissions,
    validateObjectId('markId'),
    handleValidationErrors,
    deleteMarksRecord
);

// Route for getting marks statistics (teacher/admin only)
router.get('/statistics/summary',
    auditLogger('GET_MARKS_STATISTICS'),
    validatePermissions,
    validateQueryParams(),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { departmentId, semesterId, subjectId } = req.query;
            
            console.log('[GET_MARKS_STATISTICS] Query params:', { departmentId, semesterId, subjectId });
            
            // Build match conditions with proper ObjectId validation and conversion
            const matchConditions = {};
            
            // Validate and convert departmentId
            if (departmentId) {
                if (!mongoose.Types.ObjectId.isValid(departmentId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid department ID format',
                        operation: 'getMarksStatistics',
                        timestamp: new Date().toISOString()
                    });
                }
                matchConditions.department = new mongoose.Types.ObjectId(departmentId);
            }
            
            // Validate and convert semesterId
            if (semesterId) {
                if (!mongoose.Types.ObjectId.isValid(semesterId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid semester ID format',
                        operation: 'getMarksStatistics',
                        timestamp: new Date().toISOString()
                    });
                }
                matchConditions.semester = new mongoose.Types.ObjectId(semesterId);
            }
            
            // Validate and convert subjectId
            if (subjectId) {
                if (!mongoose.Types.ObjectId.isValid(subjectId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid subject ID format',
                        operation: 'getMarksStatistics',
                        timestamp: new Date().toISOString()
                    });
                }
                matchConditions.subject = new mongoose.Types.ObjectId(subjectId);
            }

            console.log('[GET_MARKS_STATISTICS] Match conditions:', matchConditions);

            // Execute aggregation pipeline with enhanced error handling
            const statistics = await AcademicMarks.aggregate([
                { $match: matchConditions },
                {
                    $group: {
                        _id: null,
                        totalRecords: { $sum: 1 },
                        averageMarks: { $avg: '$marks' },
                        averagePercentage: { 
                            $avg: { 
                                $cond: [
                                    { $gt: ['$maxMarks', 0] },
                                    { $multiply: [{ $divide: ['$marks', '$maxMarks'] }, 100] },
                                    0
                                ]
                            }
                        },
                        passedCount: {
                            $sum: {
                                $cond: [{ $gte: ['$marks', '$passingMarks'] }, 1, 0]
                            }
                        },
                        failedCount: {
                            $sum: {
                                $cond: [{ $lt: ['$marks', '$passingMarks'] }, 1, 0]
                            }
                        },
                        highestMarks: { $max: '$marks' },
                        lowestMarks: { $min: '$marks' }
                    }
                }
            ]);

            console.log('[GET_MARKS_STATISTICS] Aggregation result:', statistics);

            // Process results with safe defaults
            const stats = statistics[0] || {
                totalRecords: 0,
                averageMarks: 0,
                averagePercentage: 0,
                passedCount: 0,
                failedCount: 0,
                highestMarks: 0,
                lowestMarks: 0
            };

            // Ensure numeric values and handle edge cases
            stats.totalRecords = stats.totalRecords || 0;
            stats.averageMarks = Number((stats.averageMarks || 0).toFixed(2));
            stats.averagePercentage = Number((stats.averagePercentage || 0).toFixed(2));
            stats.passedCount = stats.passedCount || 0;
            stats.failedCount = stats.failedCount || 0;
            stats.highestMarks = stats.highestMarks || 0;
            stats.lowestMarks = stats.lowestMarks || 0;

            // Calculate pass percentage with safe division
            stats.passPercentage = stats.totalRecords > 0 
                ? Number(((stats.passedCount / stats.totalRecords) * 100).toFixed(2))
                : 0;

            console.log('[GET_MARKS_STATISTICS] Final stats:', stats);

            res.status(200).json({
                success: true,
                message: 'Marks statistics retrieved successfully',
                data: stats,
                filters: { departmentId, semesterId, subjectId },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('[GET_MARKS_STATISTICS] Error:', error);
            console.error('[GET_MARKS_STATISTICS] Error stack:', error.stack);
            
            // Enhanced error handling with more specific error types
            let errorResponse = {
                success: false,
                operation: 'getMarksStatistics',
                timestamp: new Date().toISOString(),
                context: req.query
            };

            // Handle specific error types
            if (error.name === 'CastError') {
                errorResponse.message = 'Invalid ID format provided';
                errorResponse.code = 'INVALID_ID_FORMAT';
                errorResponse.details = `Invalid ObjectId: ${error.value}`;
                return res.status(400).json(errorResponse);
            }

            if (error.name === 'ValidationError') {
                errorResponse.message = 'Data validation failed';
                errorResponse.code = 'VALIDATION_ERROR';
                errorResponse.details = Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message,
                    value: err.value
                }));
                return res.status(400).json(errorResponse);
            }

            if (error.code === 11000) {
                errorResponse.message = 'Duplicate record detected';
                errorResponse.code = 'DUPLICATE_RECORD';
                errorResponse.details = 'A record with this combination already exists';
                return res.status(409).json(errorResponse);
            }

            // Generic database error
            errorResponse.message = 'Database operation failed';
            errorResponse.code = 'DATABASE_ERROR';
            errorResponse.details = error.message;
            
            res.status(500).json(errorResponse);
        }
    }
);

module.exports = router;
