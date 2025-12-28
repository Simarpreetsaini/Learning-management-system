/**
 * Academic Marks Constants
 * Centralized constants for academic marks validation and business logic
 */

// Exam Type Definitions
const EXAM_TYPES = {
  MST: {
    code: 'MST',
    name: 'Mid-Semester Test',
    description: 'Major evaluation test',
    maxInstances: 4,
    icon: '📝',
    color: 'blue'
  },
  CLASS_TEST: {
    code: 'ClassTest',
    name: 'Class Test',
    description: 'Regular assessment',
    maxInstances: 5,
    icon: '📋',
    color: 'green'
  },
  ASSIGNMENT: {
    code: 'Assignment',
    name: 'Assignment',
    description: 'Project submission',
    maxInstances: 5,
    icon: '📄',
    color: 'purple'
  },
  QUIZ: {
    code: 'Quiz',
    name: 'Quiz',
    description: 'Quick assessment',
    maxInstances: 10,
    icon: '❓',
    color: 'yellow'
  },
  LAB: {
    code: 'Lab',
    name: 'Lab Work',
    description: 'Laboratory assessment',
    maxInstances: 8,
    icon: '🔬',
    color: 'teal'
  },
  PROJECT: {
    code: 'Project',
    name: 'Project',
    description: 'Major project work',
    maxInstances: 3,
    icon: '🚀',
    color: 'indigo'
  },
  VIVA: {
    code: 'Viva',
    name: 'Viva Voce',
    description: 'Oral examination',
    maxInstances: 3,
    icon: '🎤',
    color: 'pink'
  },
  FINAL: {
    code: 'Final',
    name: 'Final Examination',
    description: 'Final semester exam',
    maxInstances: 1,
    icon: '🎯',
    color: 'red'
  },
  MIDTERM: {
    code: 'Midterm',
    name: 'Midterm Examination',
    description: 'Mid-semester exam',
    maxInstances: 1,
    icon: '📊',
    color: 'orange'
  }
};

// Validation Limits
const VALIDATION_LIMITS = {
  MARKS: {
    MIN: 0,
    MAX: 1000,
    DECIMAL_PLACES: 2
  },
  MAX_MARKS: {
    MIN: 1,
    MAX: 1000,
    DEFAULT: 100
  },
  PASSING_MARKS: {
    MIN: 0,
    MAX: 1000,
    DEFAULT: 40
  },
  SECTION: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 5,
    PATTERN: /^[A-Z0-9]+$/
  },
  EXAM_DATE: {
    MIN_YEARS_AGO: 2,
    MAX_YEARS_AHEAD: 1
  },
  BULK_OPERATIONS: {
    MAX_RECORDS: 100,
    MIN_RECORDS: 1
  },
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1
  }
};

// Grade Definitions
const GRADE_SCALE = [
  { min: 90, max: 100, grade: 'A+', gpa: 4.0, color: 'green-600' },
  { min: 80, max: 89, grade: 'A', gpa: 3.7, color: 'green-500' },
  { min: 70, max: 79, grade: 'B+', gpa: 3.3, color: 'blue-500' },
  { min: 60, max: 69, grade: 'B', gpa: 3.0, color: 'blue-400' },
  { min: 50, max: 59, grade: 'C+', gpa: 2.3, color: 'yellow-500' },
  { min: 40, max: 49, grade: 'C', gpa: 2.0, color: 'yellow-400' },
  { min: 0, max: 39, grade: 'F', gpa: 0.0, color: 'red-500' }
];

// Error Codes
const ERROR_CODES = {
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_RANGE: 'INVALID_RANGE',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  MARKS_EXCEED_MAX: 'MARKS_EXCEED_MAX',
  PASSING_MARKS_EXCEED_MAX: 'PASSING_MARKS_EXCEED_MAX',
  INVALID_EXAM_DATE: 'INVALID_EXAM_DATE',
  INVALID_EXAM_TYPE: 'INVALID_EXAM_TYPE',
  
  // Database Errors
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  REFERENCE_NOT_FOUND: 'REFERENCE_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Permission Errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // System Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT'
};

// Success Messages
const SUCCESS_MESSAGES = {
  MARKS_CREATED: 'Academic marks created successfully',
  MARKS_UPDATED: 'Academic marks updated successfully',
  MARKS_DELETED: 'Academic marks deleted successfully',
  BULK_OPERATION_COMPLETED: 'Bulk operation completed successfully',
  VALIDATION_PASSED: 'All validations passed'
};

// Validation Messages
const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: (field) => `${field} is required`,
  INVALID_FORMAT: (field, format) => `${field} must be in ${format} format`,
  INVALID_RANGE: (field, min, max) => `${field} must be between ${min} and ${max}`,
  MARKS_EXCEED_MAX: (marks, maxMarks) => `Marks (${marks}) cannot exceed maximum marks (${maxMarks})`,
  PASSING_MARKS_EXCEED_MAX: (passingMarks, maxMarks) => `Passing marks (${passingMarks}) cannot exceed maximum marks (${maxMarks})`,
  INVALID_EXAM_TYPE: (examType) => `Invalid exam type: ${examType}`,
  DUPLICATE_RECORD: (examType) => `Marks for ${examType} already exist for this student-subject-semester combination`,
  REFERENCE_NOT_FOUND: (entity) => `Referenced ${entity} does not exist`,
  INVALID_DATE_RANGE: 'Exam date must be within the allowed date range',
  INVALID_SECTION_FORMAT: 'Section can only contain uppercase letters and numbers',
  BULK_LIMIT_EXCEEDED: (limit) => `Bulk operations are limited to ${limit} records`,
  INVALID_PAGINATION: 'Invalid pagination parameters'
};

// Allowed Roles
const ALLOWED_ROLES = {
  ACADEMIC_MARKS: ['Admin', 'Teacher'],
  VIEW_ALL_MARKS: ['Admin'],
  MANAGE_ALL_MARKS: ['Admin'],
  CREATE_MARKS: ['Admin', 'Teacher'],
  UPDATE_MARKS: ['Admin', 'Teacher'],
  DELETE_MARKS: ['Admin', 'Teacher'],
  VIEW_STATISTICS: ['Admin', 'Teacher']
};

// Rate Limiting Configuration
const RATE_LIMITS = {
  ACADEMIC_MARKS: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 50,
    MESSAGE: 'Too many academic marks requests. Please try again later.'
  },
  BULK_OPERATIONS: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10,
    MESSAGE: 'Too many bulk operations. Please try again later.'
  },
  STATISTICS: {
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    MAX_REQUESTS: 20,
    MESSAGE: 'Too many statistics requests. Please try again later.'
  }
};

// Audit Log Actions
const AUDIT_ACTIONS = {
  CREATE_MARKS: 'CREATE_MARKS',
  UPDATE_MARKS: 'UPDATE_MARKS',
  DELETE_MARKS: 'DELETE_MARKS',
  BULK_CREATE_MARKS: 'BULK_CREATE_MARKS',
  BULK_UPDATE_MARKS: 'BULK_UPDATE_MARKS',
  VIEW_MARKS: 'VIEW_MARKS',
  VIEW_STATISTICS: 'VIEW_STATISTICS',
  EXPORT_MARKS: 'EXPORT_MARKS'
};

// Database Indexes
const DATABASE_INDEXES = [
  { fields: { student: 1, subject: 1, semester: 1, examType: 1 }, options: { unique: true } },
  { fields: { student: 1, semester: 1 } },
  { fields: { subject: 1, semester: 1, section: 1 } },
  { fields: { department: 1, semester: 1, section: 1 } },
  { fields: { examDate: 1 } },
  { fields: { createdAt: 1 } },
  { fields: { updatedAt: 1 } }
];

// Utility Functions
const UTILITIES = {
  /**
   * Generate exam type pattern for validation
   */
  generateExamTypePattern: () => {
    const patterns = Object.values(EXAM_TYPES).map(type => {
      if (type.maxInstances === 1) {
        return `^${type.code}$`;
      } else {
        return `^${type.code}[1-${type.maxInstances}]$`;
      }
    });
    return new RegExp(`(${patterns.join('|')})`);
  },

  /**
   * Get exam type info by code
   */
  getExamTypeInfo: (examType) => {
    if (!examType) return null;
    
    const match = examType.match(/^([A-Za-z]+)(\d*)$/);
    if (!match) return null;
    
    const [, typeCode] = match;
    return Object.values(EXAM_TYPES).find(type => type.code === typeCode) || null;
  },

  /**
   * Calculate grade from percentage
   */
  calculateGrade: (percentage) => {
    return GRADE_SCALE.find(grade => percentage >= grade.min && percentage <= grade.max) || GRADE_SCALE[GRADE_SCALE.length - 1];
  },

  /**
   * Format exam type for display
   */
  formatExamType: (examType) => {
    if (!examType) return 'N/A';
    
    const match = examType.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
      const [, type, number] = match;
      const typeInfo = Object.values(EXAM_TYPES).find(t => t.code === type);
      if (typeInfo) {
        const ordinal = UTILITIES.getOrdinalSuffix(number);
        return `${number}${ordinal} ${typeInfo.name}`;
      }
    }
    return examType;
  },

  /**
   * Get ordinal suffix for numbers
   */
  getOrdinalSuffix: (number) => {
    const num = parseInt(number);
    if (num >= 11 && num <= 13) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  },

  /**
   * Validate date range
   */
  isValidExamDate: (date) => {
    const examDate = new Date(date);
    const now = new Date();
    const minDate = new Date(now.getFullYear() - VALIDATION_LIMITS.EXAM_DATE.MIN_YEARS_AGO, now.getMonth(), now.getDate());
    const maxDate = new Date(now.getFullYear() + VALIDATION_LIMITS.EXAM_DATE.MAX_YEARS_AHEAD, now.getMonth(), now.getDate());
    
    return examDate >= minDate && examDate <= maxDate;
  },

  /**
   * Sanitize section input
   */
  sanitizeSection: (section) => {
    if (typeof section !== 'string') return '';
    return section.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
  }
};

module.exports = {
  EXAM_TYPES,
  VALIDATION_LIMITS,
  GRADE_SCALE,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  VALIDATION_MESSAGES,
  ALLOWED_ROLES,
  RATE_LIMITS,
  AUDIT_ACTIONS,
  DATABASE_INDEXES,
  UTILITIES
};
