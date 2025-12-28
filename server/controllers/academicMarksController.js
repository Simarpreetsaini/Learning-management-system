const mongoose = require('mongoose');
const AcademicMarks = require('../models/academicMarksModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
const Subject = require('../models/subjectModel');
const Semester = require('../models/semesterModel');
const Department = require('../models/departmentModel');
const DatabaseMigration = require('../utils/dbMigration');
const { 
    validateAcademicMarksConsistency,
    validateStudentSubjectRelationship,
    checkDuplicateAcademicMarks,
    validateBulkAcademicMarks
} = require('../services/validationService');
const { ERROR_CODES } = require('../middlewares/academicMarksValidationMiddleware');

/**
 * Enhanced Academic Marks Controller
 * Provides comprehensive CRUD operations with enhanced validation, error handling, and audit trails
 */

// Enhanced error handling with detailed error codes and context
const handleDatabaseError = (error, operation, context = {}) => {
    const errorResponse = {
        success: false,
        operation,
        timestamp: new Date().toISOString(),
        context
    };

    // Handle specific MongoDB errors
    if (error.code === 11000) {
        const duplicateField = error.message.match(/index: (\w+)/)?.[1] || 'unknown';
        
        if (duplicateField.includes('student_1_subject_1_semester_1')) {
            errorResponse.message = 'Duplicate academic marks record detected';
            errorResponse.code = ERROR_CODES.DUPLICATE_RECORD;
            errorResponse.details = `Marks for exam type "${context.examType}" already exist for this student-subject-semester combination`;
            errorResponse.suggestion = 'Use update operation instead of create, or check if this is a duplicate submission';
        } else {
            errorResponse.message = 'Database constraint violation';
            errorResponse.code = ERROR_CODES.DUPLICATE_RECORD;
            errorResponse.details = 'A record with this combination already exists';
        }
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

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
        errorResponse.message = 'Invalid data format';
        errorResponse.code = ERROR_CODES.VALIDATION_ERROR;
        errorResponse.details = `Invalid ${error.path}: ${error.value}`;
        return errorResponse;
    }

    // Handle reference errors
    if (error.message.includes('not found')) {
        errorResponse.message = 'Referenced resource not found';
        errorResponse.code = ERROR_CODES.INVALID_REFERENCE;
        errorResponse.details = error.message;
        return errorResponse;
    }

    // Generic error handling
    errorResponse.message = 'Database operation failed';
    errorResponse.code = 'DATABASE_ERROR';
    errorResponse.details = error.message;
    errorResponse.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    
    return errorResponse;
};

// Enhanced logging utility
const logOperation = (operation, details, userId, userRole) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        operation,
        userId,
        userRole,
        ...details
    };
    
    console.log(`[ACADEMIC_MARKS_CONTROLLER] ${operation}:`, JSON.stringify(logEntry, null, 2));
    return logEntry;
};

// Helper function to validate examType format with enhanced patterns
const validateExamType = (examType) => {
    const patterns = [
        /^MST[1-9]$/,           // MST1, MST2, etc.
        /^ClassTest[1-9]$/,     // ClassTest1, ClassTest2, etc.
        /^Assignment[1-9]$/,    // Assignment1, Assignment2, etc.
        /^Quiz[1-9]$/,          // Quiz1, Quiz2, etc.
        /^Lab[1-9]$/,           // Lab1, Lab2, etc.
        /^Project[1-9]$/,       // Project1, Project2, etc.
        /^Viva[1-9]$/,          // Viva1, Viva2, etc.
        /^Final$/,              // Final
        /^Midterm$/,            // Midterm
        /^(MST|ClassTest|Assignment)$/  // Backward compatibility
    ];
    return patterns.some(pattern => pattern.test(examType));
};

// Transaction wrapper for database operations
const withTransaction = async (operation) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const result = await operation(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// Retry mechanism for failed operations
const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Only retry on specific errors
            if (error.code === 11000 || error.name === 'MongoNetworkError') {
                console.log(`[RETRY] Attempt ${attempt} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error;
            }
        }
    }
};

// Create or update academic marks for a student or bulk marks
const createOrUpdateMarks = async (req, res) => {
    try {
        console.log(`[createOrUpdateMarks] Request received from user: ${req.user?.id} (${req.user?.role})`);
        
        // Check if user has permission (Teacher or Admin)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        // Handle both single mark and bulk marks submission
        const marksData = Array.isArray(req.body) ? req.body : [req.body];
        
        console.log(`[createOrUpdateMarks] Processing ${marksData.length} mark entries`);
        
        if (marksData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No marks data provided'
            });
        }

        const results = [];
        const errors = [];

        for (const [index, markData] of marksData.entries()) {
            try {
                console.log(`[createOrUpdateMarks] Processing entry ${index + 1}/${marksData.length}:`, {
                    student: markData.student,
                    subject: markData.subject,
                    examType: markData.examType,
                    marks: markData.marks
                });

                const { student, subject, marks, maxMarks, passingMarks, examType, examDate, semester, department, section } = markData;

                // Validate required fields for each mark entry
                if (!student || !subject || marks === undefined || !maxMarks || !passingMarks || !examType || !examDate || !semester || !department || !section) {
                    const missingFields = [];
                    if (!student) missingFields.push('student');
                    if (!subject) missingFields.push('subject');
                    if (marks === undefined) missingFields.push('marks');
                    if (!maxMarks) missingFields.push('maxMarks');
                    if (!passingMarks) missingFields.push('passingMarks');
                    if (!examType) missingFields.push('examType');
                    if (!examDate) missingFields.push('examDate');
                    if (!semester) missingFields.push('semester');
                    if (!department) missingFields.push('department');
                    if (!section) missingFields.push('section');

                    errors.push({
                        student,
                        subject,
                        error: `Missing required fields: ${missingFields.join(', ')}`
                    });
                    continue;
                }

                // Validate examType format
                if (!validateExamType(examType)) {
                    errors.push({
                        student,
                        subject,
                        error: 'Invalid examType format. Must be like MST1, ClassTest2, Assignment3, etc.'
                    });
                    continue;
                }

                // Validate maxMarks value first
                if (isNaN(maxMarks) || maxMarks <= 0) {
                    errors.push({
                        student,
                        subject,
                        error: 'Invalid maxMarks value. Must be greater than 0'
                    });
                    continue;
                }

                // Validate marks value
                if (isNaN(marks) || marks < 0 || marks > maxMarks) {
                    errors.push({
                        student,
                        subject,
                        error: `Invalid marks value. Must be between 0 and ${maxMarks}`
                    });
                    continue;
                }

                // Validate passingMarks value
                if (isNaN(passingMarks) || passingMarks < 0 || passingMarks > maxMarks) {
                    errors.push({
                        student,
                        subject,
                        error: `Invalid passingMarks value. Must be between 0 and ${maxMarks}`
                    });
                    continue;
                }

                // Validate examDate
                if (!examDate || isNaN(new Date(examDate).getTime())) {
                    errors.push({
                        student,
                        subject,
                        error: 'Invalid exam date'
                    });
                    continue;
                }

                // Check if student exists
                const studentExists = await StudentAcademicDetails.findById(student);
                if (!studentExists) {
                    errors.push({
                        student,
                        subject,
                        error: 'Student not found'
                    });
                    continue;
                }

                // Check if subject exists
                const subjectExists = await Subject.findById(subject);
                if (!subjectExists) {
                    errors.push({
                        student,
                        subject,
                        error: 'Subject not found'
                    });
                    continue;
                }

                // Check if semester exists
                const semesterExists = await Semester.findById(semester);
                if (!semesterExists) {
                    errors.push({
                        student,
                        subject,
                        error: 'Semester not found'
                    });
                    continue;
                }

                // Check if department exists
                const departmentExists = await Department.findById(department);
                if (!departmentExists) {
                    errors.push({
                        student,
                        subject,
                        error: 'Department not found'
                    });
                    continue;
                }

                // Check if record exists to handle update vs create scenarios
                const existingRecord = await AcademicMarks.findOne({ student, subject, semester, examType });
                
                let academicMark;
                if (existingRecord) {
                // Update existing record - ensure all fields are updated together to avoid validation conflicts
                console.log(`[createOrUpdateMarks] Updating existing record for entry ${index + 1}`);
                
                // Prepare update data with proper validation
                const updateData = {
                    marks: Number(marks),
                    maxMarks: Number(maxMarks),
                    passingMarks: Number(passingMarks),
                    examDate: new Date(examDate),
                    department, 
                    section: section.toUpperCase(), 
                    updatedAt: new Date()
                };

                // Validate the update data before applying
                if (updateData.marks > updateData.maxMarks) {
                    errors.push({
                        student,
                        subject,
                        error: `Marks (${updateData.marks}) cannot exceed maximum marks (${updateData.maxMarks})`
                    });
                    continue;
                }

                if (updateData.passingMarks > updateData.maxMarks) {
                    errors.push({
                        student,
                        subject,
                        error: `Passing marks (${updateData.passingMarks}) cannot exceed maximum marks (${updateData.maxMarks})`
                    });
                    continue;
                }

                academicMark = await AcademicMarks.findOneAndUpdate(
                    { student, subject, semester, examType },
                    updateData,
                    { 
                        new: true, 
                        runValidators: true
                    }
                );
                } else {
                    // Create new record
                    console.log(`[createOrUpdateMarks] Creating new record for entry ${index + 1}`);
                    academicMark = new AcademicMarks({
                        student,
                        subject,
                        marks: Number(marks),
                        maxMarks: Number(maxMarks),
                        passingMarks: Number(passingMarks),
                        examType,
                        examDate: new Date(examDate),
                        semester,
                        department,
                        section: section.toUpperCase()
                    });
                    await academicMark.save();
                }

                console.log(`[createOrUpdateMarks] Successfully processed entry ${index + 1}: ${academicMark._id}`);

                results.push({
                    student,
                    subject,
                    marks: Number(marks),
                    examType,
                    success: true,
                    academicMark: {
                        _id: academicMark._id,
                        marks: academicMark.marks,
                        maxMarks: academicMark.maxMarks,
                        examType: academicMark.examType,
                        percentage: academicMark.percentage,
                        grade: academicMark.grade,
                        isPassed: academicMark.isPassed
                    }
                });

            } catch (error) {
                console.error(`[createOrUpdateMarks] Error processing entry ${index + 1}:`, error);
                
                const errorResponse = handleDatabaseError(error, 'createOrUpdateMarks', {
                    examType: markData.examType,
                    student: markData.student,
                    subject: markData.subject
                });
                
                errors.push({
                    student: markData.student,
                    subject: markData.subject,
                    error: errorResponse.message || errorResponse.details || error.message,
                    code: errorResponse.code,
                    details: errorResponse.details
                });
            }
        }

        console.log(`[createOrUpdateMarks] Processing complete. Results: ${results.length}, Errors: ${errors.length}`);

        // Return response based on results
        if (results.length === 0 && errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Failed to save any marks',
                errors
            });
        }

        res.status(200).json({
            success: true,
            message: `Successfully saved ${results.length} marks${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
            results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('[createOrUpdateMarks] Unexpected error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving academic marks',
            error: error.message
        });
    }
};

// Get academic marks for a student (student panel)
const getMarksForStudent = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find student academic details for user
        const student = await StudentAcademicDetails.findOne({ userId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student academic details not found'
            });
        }

        // Get marks for student
        const marks = await AcademicMarks.find({ student: student._id })
            .populate('subject', 'name code')
            .populate('semester', 'name number')
            .populate('department', 'name code')
            .sort({ 'semester.number': 1 });

        res.status(200).json({
            success: true,
            marks
        });
    } catch (error) {
        console.error('Error fetching academic marks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching academic marks',
            error: error.message
        });
    }
};

// Get academic marks for students by department, semester, section (teacher panel)
const getMarksByDeptSemSection = async (req, res) => {
    try {
        const { departmentId, semesterId, section } = req.params;

        // Check if user has permission (Teacher or Admin)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        // Find marks matching filters
        const marks = await AcademicMarks.find({
            department: departmentId,
            semester: semesterId,
            section: section.toUpperCase()
        })
        .populate('student', 'fullname universityRollNo classRollNo')
        .populate('subject', 'name code')
        .sort({ 'student.classRollNo': 1 });

        res.status(200).json({
            success: true,
            marks
        });
    } catch (error) {
        console.error('Error fetching academic marks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching academic marks',
            error: error.message
        });
    }
};

// Get students by department and semester (Teacher/Admin access)
const getStudentsByDeptAndSem = async (req, res) => {
    try {
        const { departmentId, semesterId } = req.params;

        console.log(`[getStudentsByDeptAndSem] Request received - Department: ${departmentId}, Semester: ${semesterId}`);
        console.log(`[getStudentsByDeptAndSem] User role: ${req.user?.role}, User ID: ${req.user?.id}`);

        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            console.log(`[getStudentsByDeptAndSem] Access denied for user role: ${req.user.role}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        console.log(`[getStudentsByDeptAndSem] Searching for students with department: ${departmentId}, semester: ${semesterId}`);

        const students = await StudentAcademicDetails.find({
            department: departmentId,
            semester: semesterId
        })
        .populate('userId', 'username fullname')
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .sort({ classRollNo: 1 });

        console.log(`[getStudentsByDeptAndSem] Found ${students.length} students`);

        res.status(200).json({
            success: true,
            students
        });
    } catch (error) {
        console.error('[getStudentsByDeptAndSem] Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students',
            error: error.message
        });
    }
};

// Get students by subject (Teacher/Admin access) - NEW FUNCTION
const getStudentsBySubject = async (req, res) => {
    try {
        const { subjectId } = req.params;

        console.log(`[getStudentsBySubject] Request received - Subject: ${subjectId}`);
        console.log(`[getStudentsBySubject] User role: ${req.user?.role}, User ID: ${req.user?.id}`);

        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            console.log(`[getStudentsBySubject] Access denied for user role: ${req.user.role}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        // First, find the subject to get its department and semester
        const subject = await Subject.findById(subjectId)
            .populate('department', 'name code')
            .populate('semester', 'name number');

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        console.log(`[getStudentsBySubject] Subject found: ${subject.name}, Department: ${subject.department._id}, Semester: ${subject.semester._id}`);

        // Find all students who are in the same department and semester as this subject
        const students = await StudentAcademicDetails.find({
            department: subject.department._id,
            semester: subject.semester._id
        })
        .populate('userId', 'username fullname')
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .sort({ classRollNo: 1 });

        console.log(`[getStudentsBySubject] Found ${students.length} students for subject ${subject.name}`);

        res.status(200).json({
            success: true,
            students,
            subject: {
                _id: subject._id,
                name: subject.name,
                code: subject.code,
                department: subject.department,
                semester: subject.semester
            }
        });
    } catch (error) {
        console.error('[getStudentsBySubject] Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students by subject',
            error: error.message
        });
    }
};

// Get all marks records for teacher (Teacher/Admin access)
const getAllMarksForTeacher = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`[getAllMarksForTeacher] Request received from user: ${userId} (${userRole})`);

        // Check if user has permission (Teacher or Admin)
        if (!['Admin', 'Teacher'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        // Build query based on user role
        let query = {};
        
        // If teacher, only show marks they created (if createdBy field exists)
        // If admin, show all marks
        if (userRole === 'Teacher') {
            // For now, we'll show all marks since createdBy might not be set on existing records
            // In future, you can uncomment the line below to filter by createdBy
            // query.createdBy = userId;
        }

        // Get query parameters for filtering
        const { 
            departmentId, 
            semesterId, 
            subjectId, 
            examType, 
            examNumber,
            section,
            page = 1, 
            limit = 50,
            sortBy = 'examDate',
            sortOrder = 'desc'
        } = req.query;

        // Add filters to query with improved logic
        if (departmentId) query.department = departmentId;
        if (semesterId) query.semester = semesterId;
        if (subjectId) query.subject = subjectId;
        if (section) query.section = section.toUpperCase();

        // Handle examType and examNumber filtering properly
        if (examType && examNumber) {
            // If both examType and examNumber are provided, combine them
            query.examType = `${examType}${examNumber}`;
        } else if (examType) {
            // If only examType is provided, use regex to match all variations
            // This will match MST1, MST2, etc. when examType is "MST"
            query.examType = new RegExp(`^${examType}\\d*$`, 'i');
        }

        console.log(`[getAllMarksForTeacher] Query filters:`, query);
        console.log(`[getAllMarksForTeacher] Raw query params:`, { 
            departmentId, 
            semesterId, 
            subjectId, 
            examType, 
            examNumber,
            section 
        });

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get marks with population and pagination
        const marks = await AcademicMarks.find(query)
            .populate('student', 'fullname universityRollNo classRollNo userId')
            .populate('subject', 'name code')
            .populate('semester', 'name number')
            .populate('department', 'name code')
            .populate('createdBy', 'fullname username')
            .populate('updatedBy', 'fullname username')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalCount = await AcademicMarks.countDocuments(query);
        const totalPages = Math.ceil(totalCount / parseInt(limit));

        console.log(`[getAllMarksForTeacher] Found ${marks.length} marks out of ${totalCount} total`);

        res.status(200).json({
            success: true,
            marks,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            },
            filters: {
                departmentId,
                semesterId,
                subjectId,
                examType,
                examNumber,
                section
            }
        });
    } catch (error) {
        console.error('[getAllMarksForTeacher] Error fetching marks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching marks records',
            error: error.message
        });
    }
};

// Update specific marks record (Teacher/Admin access)
const updateMarksRecord = async (req, res) => {
    try {
        const { markId } = req.params;
        const updateData = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`[updateMarksRecord] Request received - Mark ID: ${markId}, User: ${userId} (${userRole})`);

        // Check if user has permission (Teacher or Admin)
        if (!['Admin', 'Teacher'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        // Find the existing record
        const existingMark = await AcademicMarks.findById(markId);
        if (!existingMark) {
            return res.status(404).json({
                success: false,
                message: 'Academic marks record not found'
            });
        }

        // For teachers, check if they created this record (optional security check)
        // Uncomment the following lines if you want to restrict teachers to only edit their own records
        /*
        if (userRole === 'Teacher' && existingMark.createdBy && existingMark.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only edit marks you created.'
            });
        }
        */

        // Validate the update data
        const allowedFields = ['marks', 'maxMarks', 'passingMarks', 'examType', 'examDate', 'section'];
        const filteredUpdateData = {};
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredUpdateData[field] = updateData[field];
            }
        }

        // Add audit fields
        filteredUpdateData.updatedBy = userId;
        filteredUpdateData.updatedAt = new Date();

        console.log(`[updateMarksRecord] Updating with data:`, filteredUpdateData);

        // Update the record
        const updatedMark = await AcademicMarks.findByIdAndUpdate(
            markId,
            filteredUpdateData,
            { 
              new: true, 
              runValidators: true,
              context: 'query'   // ✅ ADD THIS
            }
          )
        .populate('student', 'fullname universityRollNo classRollNo')
        .populate('subject', 'name code')
        .populate('semester', 'name number')
        .populate('department', 'name code')
        .populate('updatedBy', 'fullname username');

        console.log(`[updateMarksRecord] Successfully updated mark: ${updatedMark._id}`);

        res.status(200).json({
            success: true,
            message: 'Academic marks updated successfully',
            data: updatedMark
        });

    } catch (error) {
        console.error('[updateMarksRecord] Error updating marks:', error);
        const errorResponse = handleDatabaseError(error, 'updateMarksRecord', {
            markId: req.params.markId
        });
        res.status(500).json(errorResponse);
    }
};

// Delete specific marks record (Teacher/Admin access)
const deleteMarksRecord = async (req, res) => {
    try {
        const { markId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`[deleteMarksRecord] Request received - Mark ID: ${markId}, User: ${userId} (${userRole})`);

        // Check if user has permission (Teacher or Admin)
        if (!['Admin', 'Teacher'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        // Find the existing record
        const existingMark = await AcademicMarks.findById(markId)
            .populate('student', 'fullname classRollNo')
            .populate('subject', 'name code');

        if (!existingMark) {
            return res.status(404).json({
                success: false,
                message: 'Academic marks record not found'
            });
        }

        // For teachers, check if they created this record (optional security check)
        // Uncomment the following lines if you want to restrict teachers to only delete their own records
        /*
        if (userRole === 'Teacher' && existingMark.createdBy && existingMark.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete marks you created.'
            });
        }
        */

        console.log(`[deleteMarksRecord] Deleting mark for student: ${existingMark.student.fullname}, subject: ${existingMark.subject.name}`);

        // Delete the record
        await AcademicMarks.findByIdAndDelete(markId);

        console.log(`[deleteMarksRecord] Successfully deleted mark: ${markId}`);

        res.status(200).json({
            success: true,
            message: 'Academic marks deleted successfully',
            data: {
                deletedId: markId,
                deletedAt: new Date(),
                deletedBy: userId,
                studentName: existingMark.student.fullname,
                subjectName: existingMark.subject.name,
                examType: existingMark.examType
            }
        });

    } catch (error) {
        console.error('[deleteMarksRecord] Error deleting marks:', error);
        const errorResponse = handleDatabaseError(error, 'deleteMarksRecord', {
            markId: req.params.markId
        });
        res.status(500).json(errorResponse);
    }
};

module.exports = {
    createOrUpdateMarks,
    getMarksForStudent,
    getMarksByDeptSemSection,
    getStudentsByDeptAndSem,
    getStudentsBySubject,
    getAllMarksForTeacher,
    updateMarksRecord,
    deleteMarksRecord
};
