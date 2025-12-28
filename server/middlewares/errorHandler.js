/**
 * Unified Error Handling Middleware
 * Centralized error handling for consistent API responses
 */

const { ERROR_CODES, VALIDATION_MESSAGES } = require('../constants/academicMarksConstants');
const { ValidationError } = require('../utils/validationUtils');

/**
 * Error Response Formatter
 */
class ErrorFormatter {
  /**
   * Format validation errors
   */
  static formatValidationError(error, req) {
    return {
      success: false,
      message: 'Data validation failed',
      code: error.code || ERROR_CODES.VALIDATION_ERROR,
      details: error.details || [{ message: error.message }],
      operation: req.route?.path || req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.id || req.headers['x-request-id'],
      context: {
        userId: req.user?.id,
        userRole: req.user?.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    };
  }

  /**
   * Format database errors
   */
  static formatDatabaseError(error, req) {
    let message = 'Database operation failed';
    let code = ERROR_CODES.DATABASE_ERROR;
    let details = [];

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      const field = error.message.match(/index: (\w+)/)?.[1] || 'unknown';
      
      if (field.includes('student_1_subject_1_semester_1_examType_1')) {
        message = 'Duplicate academic marks record';
        code = ERROR_CODES.DUPLICATE_RECORD;
        details = [{
          field: 'duplicate',
          message: 'Marks for this exam type already exist for this student-subject-semester combination',
          code: ERROR_CODES.DUPLICATE_RECORD
        }];
      } else {
        message = 'Duplicate record detected';
        code = ERROR_CODES.DUPLICATE_RECORD;
        details = [{
          field: field,
          message: 'A record with this combination already exists',
          code: ERROR_CODES.DUPLICATE_RECORD
        }];
      }
    } else if (error.name === 'ValidationError') {
      // Mongoose validation error
      message = 'Data validation failed';
      code = ERROR_CODES.VALIDATION_ERROR;
      details = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value,
        code: ERROR_CODES.VALIDATION_ERROR
      }));
    } else if (error.name === 'CastError') {
      // Invalid ObjectId or type casting error
      message = 'Invalid data format';
      code = ERROR_CODES.INVALID_FORMAT;
      details = [{
        field: error.path,
        message: `Invalid ${error.path}: ${error.value}`,
        value: error.value,
        code: ERROR_CODES.INVALID_FORMAT
      }];
    } else if (error.name === 'DocumentNotFoundError') {
      message = 'Resource not found';
      code = ERROR_CODES.RECORD_NOT_FOUND;
      details = [{
        message: 'The requested resource was not found',
        code: ERROR_CODES.RECORD_NOT_FOUND
      }];
    }

    return {
      success: false,
      message,
      code,
      details,
      operation: req.route?.path || req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.id || req.headers['x-request-id'],
      context: {
        userId: req.user?.id,
        userRole: req.user?.role,
        ip: req.ip
      }
    };
  }

  /**
   * Format permission errors
   */
  static formatPermissionError(error, req) {
    return {
      success: false,
      message: error.message || 'Access denied',
      code: error.code || ERROR_CODES.PERMISSION_DENIED,
      details: [{
        message: error.message || 'Insufficient permissions to perform this operation',
        code: error.code || ERROR_CODES.PERMISSION_DENIED,
        requiredRole: error.requiredRole,
        userRole: req.user?.role
      }],
      operation: req.route?.path || req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.id || req.headers['x-request-id'],
      context: {
        userId: req.user?.id,
        userRole: req.user?.role,
        ip: req.ip
      }
    };
  }

  /**
   * Format rate limit errors
   */
  static formatRateLimitError(error, req) {
    return {
      success: false,
      message: error.message || 'Rate limit exceeded',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      details: [{
        message: error.message || 'Too many requests. Please try again later.',
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        retryAfter: error.retryAfter
      }],
      operation: req.route?.path || req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.id || req.headers['x-request-id'],
      retryAfter: error.retryAfter
    };
  }

  /**
   * Format generic errors
   */
  static formatGenericError(error, req) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      success: false,
      message: error.message || 'Internal server error',
      code: error.code || ERROR_CODES.INTERNAL_ERROR,
      details: [{
        message: error.message || 'An unexpected error occurred',
        code: error.code || ERROR_CODES.INTERNAL_ERROR
      }],
      operation: req.route?.path || req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.id || req.headers['x-request-id'],
      ...(isDevelopment && { stack: error.stack })
    };
  }
}

/**
 * Error Logger
 */
class ErrorLogger {
  /**
   * Log error with context
   */
  static logError(error, req, errorResponse) {
    const logLevel = this.getLogLevel(error);
    const logData = {
      level: logLevel,
      message: error.message,
      error: {
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        path: req.route?.path,
        params: req.params,
        query: req.query,
        body: this.sanitizeRequestBody(req.body),
        headers: this.sanitizeHeaders(req.headers),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      user: {
        id: req.user?.id,
        role: req.user?.role,
        email: req.user?.email
      },
      response: {
        statusCode: errorResponse.statusCode,
        code: errorResponse.code
      },
      timestamp: new Date().toISOString(),
      requestId: req.id || req.headers['x-request-id']
    };

    // Log based on severity
    switch (logLevel) {
      case 'error':
        console.error('[ERROR]', JSON.stringify(logData, null, 2));
        break;
      case 'warn':
        console.warn('[WARN]', JSON.stringify(logData, null, 2));
        break;
      case 'info':
        console.info('[INFO]', JSON.stringify(logData, null, 2));
        break;
      default:
        console.log('[LOG]', JSON.stringify(logData, null, 2));
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logData);
    }
  }

  /**
   * Determine log level based on error type
   */
  static getLogLevel(error) {
    if (error.isValidationError || error.code === ERROR_CODES.VALIDATION_ERROR) {
      return 'info';
    }
    
    if (error.code === ERROR_CODES.PERMISSION_DENIED || error.code === ERROR_CODES.UNAUTHORIZED) {
      return 'warn';
    }
    
    if (error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
      return 'warn';
    }
    
    if (error.code === ERROR_CODES.DUPLICATE_RECORD || error.code === ERROR_CODES.RECORD_NOT_FOUND) {
      return 'info';
    }
    
    return 'error';
  }

  /**
   * Sanitize request body for logging
   */
  static sanitizeRequestBody(body) {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize headers for logging
   */
  static sanitizeHeaders(headers) {
    if (!headers) return headers;
    
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Send logs to external service (placeholder)
   */
  static sendToExternalLogger(logData) {
    // Implement external logging service integration
    // e.g., Winston, Loggly, Datadog, etc.
    console.log('[EXTERNAL_LOG]', 'Would send to external logging service:', logData.requestId);
  }
}

/**
 * Error Metrics Collector
 */
class ErrorMetrics {
  constructor() {
    this.metrics = {
      totalErrors: 0,
      errorsByCode: new Map(),
      errorsByEndpoint: new Map(),
      errorsByUser: new Map(),
      recentErrors: []
    };
  }

  /**
   * Record error metrics
   */
  recordError(error, req) {
    this.metrics.totalErrors++;
    
    // Count by error code
    const code = error.code || ERROR_CODES.INTERNAL_ERROR;
    this.metrics.errorsByCode.set(code, (this.metrics.errorsByCode.get(code) || 0) + 1);
    
    // Count by endpoint
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    this.metrics.errorsByEndpoint.set(endpoint, (this.metrics.errorsByEndpoint.get(endpoint) || 0) + 1);
    
    // Count by user
    if (req.user?.id) {
      this.metrics.errorsByUser.set(req.user.id, (this.metrics.errorsByUser.get(req.user.id) || 0) + 1);
    }
    
    // Keep recent errors (last 100)
    this.metrics.recentErrors.push({
      timestamp: new Date().toISOString(),
      code,
      endpoint,
      userId: req.user?.id,
      message: error.message
    });
    
    if (this.metrics.recentErrors.length > 100) {
      this.metrics.recentErrors.shift();
    }
  }

  /**
   * Get error metrics
   */
  getMetrics() {
    return {
      totalErrors: this.metrics.totalErrors,
      errorsByCode: Object.fromEntries(this.metrics.errorsByCode),
      errorsByEndpoint: Object.fromEntries(this.metrics.errorsByEndpoint),
      errorsByUser: Object.fromEntries(this.metrics.errorsByUser),
      recentErrors: this.metrics.recentErrors.slice(-10) // Last 10 errors
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      totalErrors: 0,
      errorsByCode: new Map(),
      errorsByEndpoint: new Map(),
      errorsByUser: new Map(),
      recentErrors: []
    };
  }
}

// Global error metrics instance
const errorMetrics = new ErrorMetrics();

/**
 * Main Error Handler Middleware
 */
const errorHandler = (error, req, res, next) => {
  // Record error metrics
  errorMetrics.recordError(error, req);
  
  let statusCode = 500;
  let errorResponse;
  
  // Handle different error types
  if (error instanceof ValidationError || error.isValidationError) {
    statusCode = 400;
    errorResponse = ErrorFormatter.formatValidationError(error, req);
  } else if (error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError') {
    statusCode = error.code === 11000 ? 409 : 400;
    errorResponse = ErrorFormatter.formatDatabaseError(error, req);
  } else if (error.code === ERROR_CODES.PERMISSION_DENIED || error.code === ERROR_CODES.UNAUTHORIZED) {
    statusCode = error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 403;
    errorResponse = ErrorFormatter.formatPermissionError(error, req);
  } else if (error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
    statusCode = 429;
    errorResponse = ErrorFormatter.formatRateLimitError(error, req);
  } else if (error.code === ERROR_CODES.RECORD_NOT_FOUND) {
    statusCode = 404;
    errorResponse = ErrorFormatter.formatGenericError(error, req);
  } else {
    // Generic error
    statusCode = 500;
    errorResponse = ErrorFormatter.formatGenericError(error, req);
  }
  
  // Add status code to response
  errorResponse.statusCode = statusCode;
  
  // Log error
  ErrorLogger.logError(error, req, errorResponse);
  
  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res) => {
  const errorResponse = {
    success: false,
    message: 'Resource not found',
    code: ERROR_CODES.RECORD_NOT_FOUND,
    details: [{
      message: `The requested resource ${req.method} ${req.originalUrl} was not found`,
      code: ERROR_CODES.RECORD_NOT_FOUND
    }],
    operation: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId: req.id || req.headers['x-request-id']
  };
  
  res.status(404).json(errorResponse);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error Metrics Endpoint
 */
const getErrorMetrics = (req, res) => {
  // Only allow admin access
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
      code: ERROR_CODES.PERMISSION_DENIED
    });
  }
  
  res.json({
    success: true,
    data: errorMetrics.getMetrics(),
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  getErrorMetrics,
  ErrorFormatter,
  ErrorLogger,
  ErrorMetrics,
  errorMetrics
};
