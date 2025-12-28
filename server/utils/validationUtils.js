/**
 * Validation Utilities
 * Comprehensive validation utilities for academic marks system
 */

const mongoose = require('mongoose');
const DOMPurify = require('isomorphic-dompurify');
const { 
  ERROR_CODES, 
  VALIDATION_MESSAGES, 
  UTILITIES,
  VALIDATION_LIMITS 
} = require('../constants/academicMarksConstants');

/**
 * Input Sanitization Utilities
 */
class InputSanitizer {
  /**
   * Sanitize string input to prevent XSS attacks
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return input;
    
    // Remove HTML tags and potentially dangerous characters
    const cleaned = DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
    
    return cleaned.trim();
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input, options = {}) {
    const { min = -Infinity, max = Infinity, precision = null } = options;
    
    if (input === null || input === undefined || input === '') {
      return null;
    }
    
    const num = parseFloat(input);
    
    if (isNaN(num)) {
      throw new ValidationError('Invalid numeric value', ERROR_CODES.INVALID_INPUT);
    }
    
    if (num < min || num > max) {
      throw new ValidationError(
        VALIDATION_MESSAGES.INVALID_RANGE('Value', min, max),
        ERROR_CODES.INVALID_RANGE
      );
    }
    
    if (precision !== null) {
      return parseFloat(num.toFixed(precision));
    }
    
    return num;
  }

  /**
   * Sanitize ObjectId input
   */
  static sanitizeObjectId(input) {
    if (!input) return null;
    
    const id = this.sanitizeString(input);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid ObjectId format', ERROR_CODES.INVALID_FORMAT);
    }
    
    return new mongoose.Types.ObjectId(id);
  }

  /**
   * Sanitize date input
   */
  static sanitizeDate(input) {
    if (!input) return null;
    
    const date = new Date(input);
    
    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid date format', ERROR_CODES.INVALID_FORMAT);
    }
    
    return date;
  }

  /**
   * Sanitize section input
   */
  static sanitizeSection(input) {
    if (!input) return null;
    
    const section = this.sanitizeString(input).toUpperCase();
    
    if (!VALIDATION_LIMITS.SECTION.PATTERN.test(section)) {
      throw new ValidationError(
        VALIDATION_MESSAGES.INVALID_SECTION_FORMAT,
        ERROR_CODES.INVALID_FORMAT
      );
    }
    
    return section;
  }

  /**
   * Sanitize exam type input
   */
  static sanitizeExamType(input) {
    if (!input) return null;
    
    const examType = this.sanitizeString(input);
    const pattern = UTILITIES.generateExamTypePattern();
    
    if (!pattern.test(examType)) {
      throw new ValidationError(
        VALIDATION_MESSAGES.INVALID_EXAM_TYPE(examType),
        ERROR_CODES.INVALID_EXAM_TYPE
      );
    }
    
    return examType;
  }

  /**
   * Sanitize academic marks data
   */
  static sanitizeAcademicMarksData(data) {
    const sanitized = {};
    
    try {
      // Required fields
      if (data.student) {
        sanitized.student = this.sanitizeObjectId(data.student);
      }
      
      if (data.subject) {
        sanitized.subject = this.sanitizeObjectId(data.subject);
      }
      
      if (data.marks !== undefined) {
        sanitized.marks = this.sanitizeNumber(data.marks, {
          min: VALIDATION_LIMITS.MARKS.MIN,
          max: VALIDATION_LIMITS.MARKS.MAX,
          precision: VALIDATION_LIMITS.MARKS.DECIMAL_PLACES
        });
      }
      
      if (data.maxMarks !== undefined) {
        sanitized.maxMarks = this.sanitizeNumber(data.maxMarks, {
          min: VALIDATION_LIMITS.MAX_MARKS.MIN,
          max: VALIDATION_LIMITS.MAX_MARKS.MAX
        });
      }
      
      if (data.passingMarks !== undefined) {
        sanitized.passingMarks = this.sanitizeNumber(data.passingMarks, {
          min: VALIDATION_LIMITS.PASSING_MARKS.MIN,
          max: VALIDATION_LIMITS.PASSING_MARKS.MAX,
          precision: VALIDATION_LIMITS.MARKS.DECIMAL_PLACES
        });
      }
      
      if (data.examType) {
        sanitized.examType = this.sanitizeExamType(data.examType);
      }
      
      if (data.examDate) {
        sanitized.examDate = this.sanitizeDate(data.examDate);
      }
      
      if (data.semester) {
        sanitized.semester = this.sanitizeObjectId(data.semester);
      }
      
      if (data.department) {
        sanitized.department = this.sanitizeObjectId(data.department);
      }
      
      if (data.section) {
        sanitized.section = this.sanitizeSection(data.section);
      }
      
      // Optional metadata
      if (data.metadata) {
        sanitized.metadata = {};
        
        if (data.metadata.source) {
          sanitized.metadata.source = this.sanitizeString(data.metadata.source);
        }
        
        if (data.metadata.importBatch) {
          sanitized.metadata.importBatch = this.sanitizeString(data.metadata.importBatch);
        }
        
        if (data.metadata.notes) {
          sanitized.metadata.notes = this.sanitizeString(data.metadata.notes);
        }
        
        if (data.metadata.isActive !== undefined) {
          sanitized.metadata.isActive = Boolean(data.metadata.isActive);
        }
      }
      
      return sanitized;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new ValidationError(
        'Data sanitization failed',
        ERROR_CODES.VALIDATION_ERROR,
        { originalError: error.message }
      );
    }
  }
}

/**
 * Business Logic Validators
 */
class BusinessValidator {
  /**
   * Validate marks relationships
   */
  static validateMarksRelationships(data, existingData = {}) {
    const mergedData = { ...existingData, ...data };
    const errors = [];
    
    const { marks, maxMarks, passingMarks } = mergedData;
    
    // Validate marks against maxMarks
    if (marks !== undefined && maxMarks !== undefined) {
      if (marks > maxMarks) {
        errors.push({
          field: 'marks',
          message: VALIDATION_MESSAGES.MARKS_EXCEED_MAX(marks, maxMarks),
          code: ERROR_CODES.MARKS_EXCEED_MAX,
          value: marks,
          maxMarks
        });
      }
    }
    
    // Validate passingMarks against maxMarks
    if (passingMarks !== undefined && maxMarks !== undefined) {
      if (passingMarks > maxMarks) {
        errors.push({
          field: 'passingMarks',
          message: VALIDATION_MESSAGES.PASSING_MARKS_EXCEED_MAX(passingMarks, maxMarks),
          code: ERROR_CODES.PASSING_MARKS_EXCEED_MAX,
          value: passingMarks,
          maxMarks
        });
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError(
        'Marks relationship validation failed',
        ERROR_CODES.BUSINESS_RULE_VIOLATION,
        { errors }
      );
    }
    
    return true;
  }

  /**
   * Validate exam date
   */
  static validateExamDate(examDate) {
    if (!examDate) return true;
    
    const date = new Date(examDate);
    
    if (!UTILITIES.isValidExamDate(date)) {
      throw new ValidationError(
        VALIDATION_MESSAGES.INVALID_DATE_RANGE,
        ERROR_CODES.INVALID_EXAM_DATE,
        { examDate }
      );
    }
    
    return true;
  }

  /**
   * Validate exam type format and constraints
   */
  static validateExamType(examType, subjectId = null) {
    if (!examType) return true;
    
    const typeInfo = UTILITIES.getExamTypeInfo(examType);
    
    if (!typeInfo) {
      throw new ValidationError(
        VALIDATION_MESSAGES.INVALID_EXAM_TYPE(examType),
        ERROR_CODES.INVALID_EXAM_TYPE,
        { examType }
      );
    }
    
    // Extract number from exam type (e.g., "1" from "MST1")
    const match = examType.match(/(\d+)$/);
    if (match) {
      const number = parseInt(match[1]);
      if (number > typeInfo.maxInstances) {
        throw new ValidationError(
          `${typeInfo.name} can only have up to ${typeInfo.maxInstances} instances`,
          ERROR_CODES.INVALID_EXAM_TYPE,
          { examType, maxInstances: typeInfo.maxInstances }
        );
      }
    }
    
    return true;
  }

  /**
   * Validate academic calendar constraints
   */
  static validateAcademicCalendar(examDate, semesterId = null) {
    // This can be extended to check against academic calendar
    // For now, just validate the date range
    return this.validateExamDate(examDate);
  }

  /**
   * Validate bulk operation constraints
   */
  static validateBulkOperation(data) {
    if (!Array.isArray(data)) {
      throw new ValidationError(
        'Bulk data must be an array',
        ERROR_CODES.INVALID_INPUT
      );
    }
    
    if (data.length < VALIDATION_LIMITS.BULK_OPERATIONS.MIN_RECORDS) {
      throw new ValidationError(
        VALIDATION_MESSAGES.BULK_LIMIT_EXCEEDED(VALIDATION_LIMITS.BULK_OPERATIONS.MIN_RECORDS),
        ERROR_CODES.INVALID_RANGE
      );
    }
    
    if (data.length > VALIDATION_LIMITS.BULK_OPERATIONS.MAX_RECORDS) {
      throw new ValidationError(
        VALIDATION_MESSAGES.BULK_LIMIT_EXCEEDED(VALIDATION_LIMITS.BULK_OPERATIONS.MAX_RECORDS),
        ERROR_CODES.INVALID_RANGE
      );
    }
    
    return true;
  }
}

/**
 * Performance Validators
 */
class PerformanceValidator {
  /**
   * Validate query performance constraints
   */
  static validateQueryConstraints(query) {
    const errors = [];
    
    // Check for potentially expensive queries
    if (!query.department && !query.semester && !query.student && !query.subject) {
      errors.push({
        field: 'query',
        message: 'At least one filter (department, semester, student, or subject) is required for performance',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    
    // Validate date range queries
    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);
      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      
      if (diffDays > 365) {
        errors.push({
          field: 'dateRange',
          message: 'Date range cannot exceed 365 days for performance reasons',
          code: ERROR_CODES.INVALID_RANGE
        });
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError(
        'Query performance validation failed',
        ERROR_CODES.VALIDATION_ERROR,
        { errors }
      );
    }
    
    return true;
  }
}

/**
 * Custom Validation Error Class
 */
class ValidationError extends Error {
  constructor(message, code = ERROR_CODES.VALIDATION_ERROR, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.details = details;
    this.isValidationError = true;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Validation Cache for Performance
 */
class ValidationCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached validation result
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Set cached validation result
   */
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Generate cache key for validation
   */
  generateKey(type, data) {
    return `${type}:${JSON.stringify(data)}`;
  }
}

// Create global validation cache instance
const validationCache = new ValidationCache();

/**
 * Validation Decorators
 */
const validationDecorators = {
  /**
   * Cache validation results
   */
  cached: (validationFn) => {
    return function(data, ...args) {
      const cacheKey = validationCache.generateKey(validationFn.name, data);
      const cached = validationCache.get(cacheKey);
      
      if (cached !== null) {
        return cached;
      }
      
      const result = validationFn.call(this, data, ...args);
      validationCache.set(cacheKey, result);
      
      return result;
    };
  },

  /**
   * Log validation performance
   */
  timed: (validationFn) => {
    return function(data, ...args) {
      const startTime = Date.now();
      const result = validationFn.call(this, data, ...args);
      const endTime = Date.now();
      
      console.log(`[VALIDATION_PERFORMANCE] ${validationFn.name}: ${endTime - startTime}ms`);
      
      return result;
    };
  },

  /**
   * Retry validation on transient failures
   */
  retry: (maxRetries = 3) => (validationFn) => {
    return function(data, ...args) {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return validationFn.call(this, data, ...args);
        } catch (error) {
          lastError = error;
          
          // Only retry on specific error types
          if (error.code === ERROR_CODES.TIMEOUT || error.code === ERROR_CODES.DATABASE_ERROR) {
            if (attempt < maxRetries) {
              console.log(`[VALIDATION_RETRY] Attempt ${attempt} failed, retrying...`);
              continue;
            }
          }
          
          throw error;
        }
      }
      
      throw lastError;
    };
  }
};

module.exports = {
  InputSanitizer,
  BusinessValidator,
  PerformanceValidator,
  ValidationError,
  ValidationCache,
  validationCache,
  validationDecorators
};
