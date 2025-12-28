const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const AcademicMarks = require('../models/academicMarksModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
const Subject = require('../models/subjectModel');
const Semester = require('../models/semesterModel');
const Department = require('../models/departmentModel');

/**
 * Enhanced Validation Service
 * Provides comprehensive validation for various entities including academic marks
 */

// Existing validation rules for paid notes
const noteValidationRules = () => {
  return [
    check('title').notEmpty().withMessage('Title is required')
      .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    check('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    check('category').isIn(['Notes', 'Ebook', 'Question Paper', 'Study Guide', 'Other'])
      .withMessage('Invalid category'),
    check('description').optional().isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ];
};

const purchaseValidationRules = () => {
  return [
    check('buyerEmail').isEmail().normalizeEmail().withMessage('Valid email is required')
  ];
};

// Academic Marks Validation Rules
const academicMarksValidationRules = () => {
  return [
    check('student')
      .notEmpty().withMessage('Student ID is required')
      .isMongoId().withMessage('Student ID must be a valid MongoDB ObjectId'),
    
    check('subject')
      .notEmpty().withMessage('Subject ID is required')
      .isMongoId().withMessage('Subject ID must be a valid MongoDB ObjectId'),
    
    check('marks')
      .notEmpty().withMessage('Marks are required')
      .isFloat({ min: 0, max: 1000 }).withMessage('Marks must be between 0 and 1000'),
    
    check('maxMarks')
      .notEmpty().withMessage('Maximum marks are required')
      .isFloat({ min: 1, max: 1000 }).withMessage('Maximum marks must be between 1 and 1000'),
    
    check('passingMarks')
      .notEmpty().withMessage('Passing marks are required')
      .isFloat({ min: 0, max: 1000 }).withMessage('Passing marks must be between 0 and 1000'),
    
    check('examType')
      .notEmpty().withMessage('Exam type is required')
      .trim()
      .matches(/^(MST[1-9]|ClassTest[1-9]|Assignment[1-9]|Quiz[1-9]|Lab[1-9]|Project[1-9]|Viva[1-9]|Final|Midterm|MST|ClassTest|Assignment)$/)
      .withMessage('Invalid exam type format'),
    
    check('examDate')
      .notEmpty().withMessage('Exam date is required')
      .isISO8601().withMessage('Exam date must be a valid date'),
    
    check('semester')
      .notEmpty().withMessage('Semester ID is required')
      .isMongoId().withMessage('Semester ID must be a valid MongoDB ObjectId'),
    
    check('department')
      .notEmpty().withMessage('Department ID is required')
      .isMongoId().withMessage('Department ID must be a valid MongoDB ObjectId'),
    
    check('section')
      .notEmpty().withMessage('Section is required')
      .trim()
      .isLength({ min: 1, max: 5 }).withMessage('Section must be between 1 and 5 characters')
      .matches(/^[A-Z0-9]+$/i).withMessage('Section can only contain letters and numbers')
  ];
};

// Cross-field validation for academic marks
const validateAcademicMarksConsistency = async (marksData, existingData = null) => {
  const errors = [];

  // Parse numeric values safely
  const parseNumericValue = (value, fieldName) => {
    if (value === undefined || value === null) return null;
    const num = parseFloat(value);
    if (isNaN(num)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be a valid number`,
        code: 'INVALID_NUMERIC_VALUE',
        value: value
      });
      return null;
    }
    return num;
  };

  const marks = parseNumericValue(marksData.marks, 'marks');
  const maxMarks = parseNumericValue(marksData.maxMarks, 'maxMarks');
  const passingMarks = parseNumericValue(marksData.passingMarks, 'passingMarks');

  // Determine effective maxMarks for validation
  let effectiveMaxMarks = null;
  
  // Priority 1: If maxMarks is provided in the update, use it
  if (maxMarks !== null) {
    effectiveMaxMarks = maxMarks;
  }
  // Priority 2: If no maxMarks in update but we have existing data, use existing maxMarks
  else if (existingData && existingData.maxMarks !== undefined && existingData.maxMarks !== null) {
    const existingMaxMarks = parseFloat(existingData.maxMarks);
    if (!isNaN(existingMaxMarks)) {
      effectiveMaxMarks = existingMaxMarks;
    }
  }

  // Only validate marks relationships if we have effective maxMarks and valid numbers
  if (effectiveMaxMarks !== null && !isNaN(effectiveMaxMarks)) {
    // Validate marks against effective maxMarks
    if (marks !== null && !isNaN(marks)) {
      if (marks > effectiveMaxMarks) {
        errors.push({
          field: 'marks',
          message: `Marks (${marks}) cannot exceed maximum marks (${effectiveMaxMarks})`,
          code: 'MARKS_EXCEED_MAX',
          value: marks,
          maxMarks: effectiveMaxMarks
        });
      }
      if (marks < 0) {
        errors.push({
          field: 'marks',
          message: 'Marks cannot be negative',
          code: 'MARKS_NEGATIVE',
          value: marks
        });
      }
    }

    // Validate passingMarks against effective maxMarks
    if (passingMarks !== null && !isNaN(passingMarks)) {
      if (passingMarks > effectiveMaxMarks) {
        errors.push({
          field: 'passingMarks',
          message: `Passing marks (${passingMarks}) cannot exceed maximum marks (${effectiveMaxMarks})`,
          code: 'PASSING_MARKS_EXCEED_MAX',
          value: passingMarks,
          maxMarks: effectiveMaxMarks
        });
      }
      if (passingMarks < 0) {
        errors.push({
          field: 'passingMarks',
          message: 'Passing marks cannot be negative',
          code: 'PASSING_MARKS_NEGATIVE',
          value: passingMarks
        });
      }
    }
  }

  // Additional validation: if both marks and maxMarks are being updated together
  if (marks !== null && maxMarks !== null && !isNaN(marks) && !isNaN(maxMarks)) {
    if (marks > maxMarks) {
      errors.push({
        field: 'marks',
        message: `Marks (${marks}) cannot exceed the new maximum marks (${maxMarks})`,
        code: 'MARKS_EXCEED_NEW_MAX',
        value: marks,
        maxMarks: maxMarks
      });
    }
  }

  // Additional validation: if both passingMarks and maxMarks are being updated together
  if (passingMarks !== null && maxMarks !== null && !isNaN(passingMarks) && !isNaN(maxMarks)) {
    if (passingMarks > maxMarks) {
      errors.push({
        field: 'passingMarks',
        message: `Passing marks (${passingMarks}) cannot exceed the new maximum marks (${maxMarks})`,
        code: 'PASSING_MARKS_EXCEED_NEW_MAX',
        value: passingMarks,
        maxMarks: maxMarks
      });
    }
  }

  // Validate maxMarks range
  if (maxMarks !== null && !isNaN(maxMarks)) {
    if (maxMarks <= 0) {
      errors.push({
        field: 'maxMarks',
        message: 'Maximum marks must be greater than 0',
        code: 'MAX_MARKS_INVALID',
        value: maxMarks
      });
    }
    if (maxMarks > 1000) {
      errors.push({
        field: 'maxMarks',
        message: 'Maximum marks cannot exceed 1000',
        code: 'MAX_MARKS_TOO_HIGH',
        value: maxMarks
      });
    }
  }

  // Validate exam date range (only if examDate is provided)
  if (marksData.examDate) {
    const examDate = new Date(marksData.examDate);
    if (isNaN(examDate.getTime())) {
      errors.push({
        field: 'examDate',
        message: 'Exam date must be a valid date',
        code: 'INVALID_EXAM_DATE',
        value: marksData.examDate
      });
    } else {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      if (examDate < oneYearAgo || examDate > oneYearFromNow) {
        errors.push({
          field: 'examDate',
          message: 'Exam date must be within the last year or next year',
          code: 'INVALID_EXAM_DATE_RANGE',
          value: marksData.examDate
        });
      }
    }
  }

  return errors;
};

// Validate student-subject-semester relationship
const validateStudentSubjectRelationship = async (studentId, subjectId, semesterId, departmentId) => {
  const errors = [];

  try {
    // Check if student exists and get details
    const student = await StudentAcademicDetails.findById(studentId);
    if (!student) {
      errors.push({
        field: 'student',
        message: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
      return errors;
    }

    // Check if subject exists and get details
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      errors.push({
        field: 'subject',
        message: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
      return errors;
    }

    // Check if semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      errors.push({
        field: 'semester',
        message: 'Semester not found',
        code: 'SEMESTER_NOT_FOUND'
      });
      return errors;
    }

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      errors.push({
        field: 'department',
        message: 'Department not found',
        code: 'DEPARTMENT_NOT_FOUND'
      });
      return errors;
    }

    // Validate student's semester matches the provided semester
    if (student.semester.toString() !== semesterId.toString()) {
      errors.push({
        field: 'semester',
        message: 'Student semester does not match the provided semester',
        code: 'SEMESTER_MISMATCH'
      });
    }

    // Validate student's department matches the subject's department
    if (student.department.toString() !== subject.department.toString()) {
      errors.push({
        field: 'department',
        message: 'Student department does not match subject department',
        code: 'DEPARTMENT_MISMATCH'
      });
    }

    // Validate provided department matches student's department
    if (student.department.toString() !== departmentId.toString()) {
      errors.push({
        field: 'department',
        message: 'Provided department does not match student department',
        code: 'DEPARTMENT_STUDENT_MISMATCH'
      });
    }

  } catch (error) {
    errors.push({
      field: 'validation',
      message: 'Error validating student-subject relationship',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }

  return errors;
};

// Check for duplicate academic marks
const checkDuplicateAcademicMarks = async (studentId, subjectId, semesterId, examType, excludeId = null) => {
  try {
    const query = {
      student: studentId,
      subject: subjectId,
      semester: semesterId,
      examType: examType
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingRecord = await AcademicMarks.findOne(query);
    
    if (existingRecord) {
      return {
        isDuplicate: true,
        existingRecordId: existingRecord._id,
        message: `Marks for ${examType} already exist for this student-subject-semester combination`
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    throw new Error(`Error checking duplicate marks: ${error.message}`);
  }
};

// Bulk validation for academic marks
const validateBulkAcademicMarks = async (marksArray) => {
  const results = [];
  const errors = [];

  for (const [index, markData] of marksArray.entries()) {
    try {
      // Basic consistency validation
      const consistencyErrors = await validateAcademicMarksConsistency(markData);
      if (consistencyErrors.length > 0) {
        errors.push({
          index,
          errors: consistencyErrors
        });
        continue;
      }

      // Relationship validation
      const relationshipErrors = await validateStudentSubjectRelationship(
        markData.student,
        markData.subject,
        markData.semester,
        markData.department
      );
      if (relationshipErrors.length > 0) {
        errors.push({
          index,
          errors: relationshipErrors
        });
        continue;
      }

      // Duplicate check
      const duplicateCheck = await checkDuplicateAcademicMarks(
        markData.student,
        markData.subject,
        markData.semester,
        markData.examType
      );
      if (duplicateCheck.isDuplicate) {
        errors.push({
          index,
          errors: [{
            field: 'duplicate',
            message: duplicateCheck.message,
            code: 'DUPLICATE_RECORD',
            existingRecordId: duplicateCheck.existingRecordId
          }]
        });
        continue;
      }

      results.push({
        index,
        valid: true,
        data: markData
      });

    } catch (error) {
      errors.push({
        index,
        errors: [{
          field: 'validation',
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.message
        }]
      });
    }
  }

  return {
    validRecords: results,
    errors: errors,
    totalRecords: marksArray.length,
    validCount: results.length,
    errorCount: errors.length
  };
};

// Business rule validation
const validateBusinessRules = {
  // Check if marks entry is within academic calendar
  isWithinAcademicCalendar: (examDate) => {
    const date = new Date(examDate);
    const currentYear = new Date().getFullYear();
    const academicYearStart = new Date(currentYear, 6, 1); // July 1st
    const academicYearEnd = new Date(currentYear + 1, 5, 30); // June 30th next year
    
    return date >= academicYearStart && date <= academicYearEnd;
  },

  // Check if exam type is appropriate for semester
  isValidExamTypeForSemester: (examType, semesterNumber) => {
    // Business rule: Final exams only in even semesters (2, 4, 6, 8)
    if (examType === 'Final' && semesterNumber % 2 !== 0) {
      return false;
    }
    return true;
  },

  // Check if marks are reasonable (not too high percentage)
  isReasonableMarks: (marks, maxMarks) => {
    const percentage = (marks / maxMarks) * 100;
    return percentage <= 100; // Basic check, can be enhanced
  }
};

// Generic validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = errors.array().map(err => ({ 
    field: err.param,
    message: err.msg,
    value: err.value,
    location: err.location
  }));
  
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: extractedErrors,
    code: 'VALIDATION_ERROR'
  });
};

// Utility functions
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

const validateNumericRange = (value, min, max, fieldName) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (num < min || num > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return num;
};

module.exports = {
  // Existing exports
  noteValidationRules,
  purchaseValidationRules,
  validate,
  isValidObjectId,
  
  // New academic marks validation exports
  academicMarksValidationRules,
  validateAcademicMarksConsistency,
  validateStudentSubjectRelationship,
  checkDuplicateAcademicMarks,
  validateBulkAcademicMarks,
  validateBusinessRules,
  
  // Utility exports
  sanitizeInput,
  validateNumericRange
};
