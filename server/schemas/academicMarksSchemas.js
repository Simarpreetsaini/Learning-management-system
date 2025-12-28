/**
 * Academic Marks Validation Schemas
 * Centralized validation schemas using Joi for consistent validation
 */

const Joi = require('joi');
const mongoose = require('mongoose');
const { 
  EXAM_TYPES, 
  VALIDATION_LIMITS, 
  ERROR_CODES, 
  VALIDATION_MESSAGES,
  UTILITIES 
} = require('../constants/academicMarksConstants');

// Custom Joi validators
const customValidators = {
  /**
   * MongoDB ObjectId validator
   */
  objectId: () => Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'MongoDB ObjectId validation'),

  /**
   * Exam type validator
   */
  examType: () => Joi.string().custom((value, helpers) => {
    const pattern = UTILITIES.generateExamTypePattern();
    if (!pattern.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'Exam type validation'),

  /**
   * Section validator
   */
  section: () => Joi.string().custom((value, helpers) => {
    const sanitized = UTILITIES.sanitizeSection(value);
    if (!VALIDATION_LIMITS.SECTION.PATTERN.test(sanitized)) {
      return helpers.error('any.invalid');
    }
    return sanitized;
  }, 'Section validation'),

  /**
   * Exam date validator
   */
  examDate: () => Joi.date().custom((value, helpers) => {
    if (!UTILITIES.isValidExamDate(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'Exam date validation'),

  /**
   * Marks relationship validator
   */
  marksRelationship: () => Joi.object().custom((value, helpers) => {
    const { marks, maxMarks, passingMarks } = value;
    
    // Check if marks exceed maxMarks
    if (marks !== undefined && maxMarks !== undefined && marks > maxMarks) {
      return helpers.error('marks.exceedMax', { marks, maxMarks });
    }
    
    // Check if passingMarks exceed maxMarks
    if (passingMarks !== undefined && maxMarks !== undefined && passingMarks > maxMarks) {
      return helpers.error('passingMarks.exceedMax', { passingMarks, maxMarks });
    }
    
    return value;
  }, 'Marks relationship validation')
};

// Base schemas
const baseSchemas = {
  /**
   * Student reference schema
   */
  student: customValidators.objectId()
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Student ID'),
      'any.invalid': 'Student ID must be a valid MongoDB ObjectId'
    }),

  /**
   * Subject reference schema
   */
  subject: customValidators.objectId()
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Subject ID'),
      'any.invalid': 'Subject ID must be a valid MongoDB ObjectId'
    }),

  /**
   * Marks schema
   */
  marks: Joi.number()
    .min(VALIDATION_LIMITS.MARKS.MIN)
    .max(VALIDATION_LIMITS.MARKS.MAX)
    .precision(VALIDATION_LIMITS.MARKS.DECIMAL_PLACES)
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Marks'),
      'number.base': 'Marks must be a number',
      'number.min': VALIDATION_MESSAGES.INVALID_RANGE('Marks', VALIDATION_LIMITS.MARKS.MIN, VALIDATION_LIMITS.MARKS.MAX),
      'number.max': VALIDATION_MESSAGES.INVALID_RANGE('Marks', VALIDATION_LIMITS.MARKS.MIN, VALIDATION_LIMITS.MARKS.MAX)
    }),

  /**
   * Maximum marks schema
   */
  maxMarks: Joi.number()
    .min(VALIDATION_LIMITS.MAX_MARKS.MIN)
    .max(VALIDATION_LIMITS.MAX_MARKS.MAX)
    .integer()
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Maximum marks'),
      'number.base': 'Maximum marks must be a number',
      'number.integer': 'Maximum marks must be an integer',
      'number.min': VALIDATION_MESSAGES.INVALID_RANGE('Maximum marks', VALIDATION_LIMITS.MAX_MARKS.MIN, VALIDATION_LIMITS.MAX_MARKS.MAX),
      'number.max': VALIDATION_MESSAGES.INVALID_RANGE('Maximum marks', VALIDATION_LIMITS.MAX_MARKS.MIN, VALIDATION_LIMITS.MAX_MARKS.MAX)
    }),

  /**
   * Passing marks schema
   */
  passingMarks: Joi.number()
    .min(VALIDATION_LIMITS.PASSING_MARKS.MIN)
    .max(VALIDATION_LIMITS.PASSING_MARKS.MAX)
    .precision(VALIDATION_LIMITS.MARKS.DECIMAL_PLACES)
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Passing marks'),
      'number.base': 'Passing marks must be a number',
      'number.min': VALIDATION_MESSAGES.INVALID_RANGE('Passing marks', VALIDATION_LIMITS.PASSING_MARKS.MIN, VALIDATION_LIMITS.PASSING_MARKS.MAX),
      'number.max': VALIDATION_MESSAGES.INVALID_RANGE('Passing marks', VALIDATION_LIMITS.PASSING_MARKS.MIN, VALIDATION_LIMITS.PASSING_MARKS.MAX)
    }),

  /**
   * Exam type schema
   */
  examType: customValidators.examType()
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Exam type'),
      'any.invalid': 'Invalid exam type format. Must be like MST1, ClassTest2, Assignment3, etc.'
    }),

  /**
   * Exam date schema
   */
  examDate: customValidators.examDate()
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Exam date'),
      'date.base': 'Exam date must be a valid date',
      'any.invalid': VALIDATION_MESSAGES.INVALID_DATE_RANGE
    }),

  /**
   * Semester reference schema
   */
  semester: customValidators.objectId()
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Semester ID'),
      'any.invalid': 'Semester ID must be a valid MongoDB ObjectId'
    }),

  /**
   * Department reference schema
   */
  department: customValidators.objectId()
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Department ID'),
      'any.invalid': 'Department ID must be a valid MongoDB ObjectId'
    }),

  /**
   * Section schema
   */
  section: customValidators.section()
    .min(VALIDATION_LIMITS.SECTION.MIN_LENGTH)
    .max(VALIDATION_LIMITS.SECTION.MAX_LENGTH)
    .required()
    .messages({
      'any.required': VALIDATION_MESSAGES.REQUIRED_FIELD('Section'),
      'string.min': VALIDATION_MESSAGES.INVALID_RANGE('Section length', VALIDATION_LIMITS.SECTION.MIN_LENGTH, VALIDATION_LIMITS.SECTION.MAX_LENGTH),
      'string.max': VALIDATION_MESSAGES.INVALID_RANGE('Section length', VALIDATION_LIMITS.SECTION.MIN_LENGTH, VALIDATION_LIMITS.SECTION.MAX_LENGTH),
      'any.invalid': VALIDATION_MESSAGES.INVALID_SECTION_FORMAT
    })
};

// Main validation schemas
const academicMarksSchemas = {
  /**
   * Create academic marks schema
   */
  createAcademicMarks: Joi.object({
    student: baseSchemas.student,
    subject: baseSchemas.subject,
    marks: baseSchemas.marks,
    maxMarks: baseSchemas.maxMarks,
    passingMarks: baseSchemas.passingMarks,
    examType: baseSchemas.examType,
    examDate: baseSchemas.examDate,
    semester: baseSchemas.semester,
    department: baseSchemas.department,
    section: baseSchemas.section,
    
    // Optional metadata
    metadata: Joi.object({
      source: Joi.string().valid('manual', 'import', 'api', 'migration').default('manual'),
      importBatch: Joi.string().optional(),
      notes: Joi.string().max(500).optional(),
      isActive: Joi.boolean().default(true)
    }).optional()
  })
  .custom(customValidators.marksRelationship(), 'Marks relationship validation')
  .messages({
    'marks.exceedMax': 'Marks ({#marks}) cannot exceed maximum marks ({#maxMarks})',
    'passingMarks.exceedMax': 'Passing marks ({#passingMarks}) cannot exceed maximum marks ({#maxMarks})'
  }),

  /**
   * Update academic marks schema
   */
  updateAcademicMarks: Joi.object({
    student: baseSchemas.student.optional(),
    subject: baseSchemas.subject.optional(),
    marks: baseSchemas.marks.optional(),
    maxMarks: baseSchemas.maxMarks.optional(),
    passingMarks: baseSchemas.passingMarks.optional(),
    examType: baseSchemas.examType.optional(),
    examDate: baseSchemas.examDate.optional(),
    semester: baseSchemas.semester.optional(),
    department: baseSchemas.department.optional(),
    section: baseSchemas.section.optional(),
    
    // Optional metadata
    metadata: Joi.object({
      source: Joi.string().valid('manual', 'import', 'api', 'migration'),
      importBatch: Joi.string(),
      notes: Joi.string().max(500),
      isActive: Joi.boolean()
    }).optional()
  })
  .min(1) // At least one field must be provided
  .custom(customValidators.marksRelationship(), 'Marks relationship validation')
  .messages({
    'object.min': 'At least one field must be provided for update',
    'marks.exceedMax': 'Marks ({#marks}) cannot exceed maximum marks ({#maxMarks})',
    'passingMarks.exceedMax': 'Passing marks ({#passingMarks}) cannot exceed maximum marks ({#maxMarks})'
  }),

  /**
   * Bulk create academic marks schema
   */
  bulkCreateAcademicMarks: Joi.array()
    .items(academicMarksSchemas.createAcademicMarks)
    .min(VALIDATION_LIMITS.BULK_OPERATIONS.MIN_RECORDS)
    .max(VALIDATION_LIMITS.BULK_OPERATIONS.MAX_RECORDS)
    .messages({
      'array.min': VALIDATION_MESSAGES.BULK_LIMIT_EXCEEDED(VALIDATION_LIMITS.BULK_OPERATIONS.MIN_RECORDS),
      'array.max': VALIDATION_MESSAGES.BULK_LIMIT_EXCEEDED(VALIDATION_LIMITS.BULK_OPERATIONS.MAX_RECORDS)
    }),

  /**
   * Query parameters schema
   */
  queryParams: Joi.object({
    // Pagination
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    
    limit: Joi.number()
      .integer()
      .min(VALIDATION_LIMITS.PAGINATION.MIN_LIMIT)
      .max(VALIDATION_LIMITS.PAGINATION.MAX_LIMIT)
      .default(VALIDATION_LIMITS.PAGINATION.DEFAULT_LIMIT)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': VALIDATION_MESSAGES.INVALID_RANGE('Limit', VALIDATION_LIMITS.PAGINATION.MIN_LIMIT, VALIDATION_LIMITS.PAGINATION.MAX_LIMIT),
        'number.max': VALIDATION_MESSAGES.INVALID_RANGE('Limit', VALIDATION_LIMITS.PAGINATION.MIN_LIMIT, VALIDATION_LIMITS.PAGINATION.MAX_LIMIT)
      }),
    
    // Sorting
    sortBy: Joi.string()
      .valid('marks', 'examDate', 'examType', 'student', 'subject', 'createdAt', 'updatedAt')
      .default('examDate')
      .messages({
        'any.only': 'Invalid sort field'
      }),
    
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be asc or desc'
      }),
    
    // Filters
    departmentId: customValidators.objectId().optional(),
    semesterId: customValidators.objectId().optional(),
    subjectId: customValidators.objectId().optional(),
    studentId: customValidators.objectId().optional(),
    examType: Joi.string().optional(),
    section: Joi.string().optional(),
    
    // Date range filters
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    
    // Search
    search: Joi.string().max(100).optional()
  }),

  /**
   * Route parameters schema
   */
  routeParams: Joi.object({
    markId: customValidators.objectId()
      .messages({
        'any.invalid': 'Mark ID must be a valid MongoDB ObjectId'
      }),
    
    departmentId: customValidators.objectId()
      .messages({
        'any.invalid': 'Department ID must be a valid MongoDB ObjectId'
      }),
    
    semesterId: customValidators.objectId()
      .messages({
        'any.invalid': 'Semester ID must be a valid MongoDB ObjectId'
      }),
    
    subjectId: customValidators.objectId()
      .messages({
        'any.invalid': 'Subject ID must be a valid MongoDB ObjectId'
      }),
    
    section: customValidators.section()
      .messages({
        'any.invalid': VALIDATION_MESSAGES.INVALID_SECTION_FORMAT
      })
  }),

  /**
   * Statistics query schema
   */
  statisticsQuery: Joi.object({
    departmentId: customValidators.objectId().optional(),
    semesterId: customValidators.objectId().optional(),
    subjectId: customValidators.objectId().optional(),
    examType: Joi.string().optional(),
    section: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
};

// Validation options
const validationOptions = {
  // Standard validation options
  standard: {
    abortEarly: false, // Return all validation errors
    allowUnknown: false, // Don't allow unknown fields
    stripUnknown: true, // Remove unknown fields
    convert: true, // Convert values to correct types
    presence: 'required' // All fields are required by default
  },
  
  // Lenient validation options (for updates)
  lenient: {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
    convert: true,
    presence: 'optional' // Fields are optional by default
  },
  
  // Query validation options
  query: {
    abortEarly: false,
    allowUnknown: true, // Allow additional query parameters
    stripUnknown: false, // Keep unknown fields for logging
    convert: true,
    presence: 'optional'
  }
};

// Validation helper functions
const validationHelpers = {
  /**
   * Validate and sanitize input data
   */
  validateAndSanitize: (schema, data, options = validationOptions.standard) => {
    const { error, value } = schema.validate(data, options);
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
        code: ERROR_CODES.VALIDATION_ERROR
      }));
      
      const validationError = new Error('Validation failed');
      validationError.code = ERROR_CODES.VALIDATION_ERROR;
      validationError.details = validationErrors;
      validationError.isValidationError = true;
      
      throw validationError;
    }
    
    return value;
  },

  /**
   * Validate marks consistency with existing data
   */
  validateMarksConsistency: (newData, existingData = {}) => {
    const mergedData = { ...existingData, ...newData };
    
    try {
      return validationHelpers.validateAndSanitize(
        customValidators.marksRelationship(),
        mergedData,
        validationOptions.lenient
      );
    } catch (error) {
      if (error.isValidationError) {
        throw error;
      }
      
      const consistencyError = new Error('Marks consistency validation failed');
      consistencyError.code = ERROR_CODES.BUSINESS_RULE_VIOLATION;
      consistencyError.details = [{ message: error.message }];
      throw consistencyError;
    }
  },

  /**
   * Format validation errors for API response
   */
  formatValidationErrors: (error) => {
    if (!error.isValidationError) {
      return {
        success: false,
        message: 'Validation failed',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: [{ message: error.message }]
      };
    }
    
    return {
      success: false,
      message: 'Data validation failed',
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  academicMarksSchemas,
  validationOptions,
  validationHelpers,
  customValidators,
  baseSchemas
};
