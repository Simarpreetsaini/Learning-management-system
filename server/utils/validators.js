const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const PaidNote = require('../models/paidNotesModel');
const Order = require('../models/orderModel');

/**
 * Validates email format
 * @param {string} email 
 * @returns {boolean}
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validates price is positive number
 * @param {number|string} price 
 * @returns {boolean}
 */
const validatePrice = (price) => {
  return !isNaN(price) && Number(price) > 0;
};

/**
 * Validates note content is not empty
 * @param {string} content 
 * @returns {boolean}
 */
const validateNoteContent = (content) => {
  return content && content.trim().length > 0;
};

/**
 * Validates MongoDB ObjectId
 * @param {string} id 
 * @returns {boolean}
 */
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validates note exists and is active
 * @param {string} noteId 
 * @returns {Promise<boolean>}
 */
const validateNoteExists = async (noteId) => {
  if (!validateObjectId(noteId)) return false;
  const note = await PaidNote.findOne({ _id: noteId, isActive: true });
  return !!note;
};

/**
 * Validates file extension is allowed
 * @param {string} filename 
 * @returns {boolean}
 */
const validateFileExtension = (filename) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.zip'];
  const ext = filename.toLowerCase().slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  return allowedExtensions.includes(`.${ext}`);
};

/**
 * Validates order exists and is valid for download
 * @param {string} orderId 
 * @param {string} accessKey 
 * @returns {Promise<boolean>}
 */
const validateOrderForDownload = async (orderId, accessKey) => {
  if (!validateObjectId(orderId) || !accessKey) return false;
  const order = await Order.findOne({
    _id: orderId,
    accessKey,
    paymentStatus: 'Completed',
    downloadExpiry: { $gt: new Date() }
  });
  return !!order && order.downloadCount < 3; // Assuming MAX_DOWNLOADS = 3 as per controller
};

/**
 * Express validator for note creation
 */
const noteCreationValidator = [
  check('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    
  check('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    
  check('price')
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number')
    .toFloat(),
    
  check('category')
    .isIn(['Notes', 'Ebook', 'Question Paper', 'Study Guide', 'Other'])
    .withMessage('Invalid category'),
    
  check('subject')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Subject cannot exceed 100 characters'),
    
  check('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('Note file is required');
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.file && !validateFileExtension(req.file.originalname)) {
        throw new Error('Invalid file extension');
      }
      return true;
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Express validator for note update
 */
const noteUpdateValidator = [
  check('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    
  check('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    
  check('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number')
    .toFloat(),
    
  check('category')
    .optional()
    .isIn(['Notes', 'Ebook', 'Question Paper', 'Study Guide', 'Other'])
    .withMessage('Invalid category'),
    
  check('subject')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Subject cannot exceed 100 characters'),
    
  check('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
    
  check('file')
    .optional()
    .custom((value, { req }) => {
      if (req.file && !validateFileExtension(req.file.originalname)) {
        throw new Error('Invalid file extension');
      }
      return true;
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Express validator for purchase initiation
 */
const purchaseValidator = [
  check('buyerEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
    
  check('id')
    .trim()
    .notEmpty().withMessage('Note ID is required')
    .custom(validateObjectId).withMessage('Invalid note ID format')
    .custom(validateNoteExists).withMessage('Note not found or unavailable'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Express validator for download access
 */
const downloadAccessValidator = [
  check('orderId')
    .trim()
    .notEmpty().withMessage('Order ID is required')
    .custom(validateObjectId).withMessage('Invalid order ID format'),
    
  check('accessKey')
    .trim()
    .notEmpty().withMessage('Access key is required')
    .isLength({ min: 36, max: 36 }).withMessage('Invalid access key format'),
    
  check('orderId')
    .custom(async (orderId, { req }) => {
      const isValid = await validateOrderForDownload(orderId, req.params.accessKey);
      if (!isValid) {
        throw new Error('Invalid or expired download request');
      }
      return true;
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Express validator for resend download link
 */
const resendLinkValidator = [
  check('buyerEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
    
  check('orderId')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !validateObjectId(value)) {
        throw new Error('Invalid order ID format');
      }
      return true;
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateEmail,
  validatePrice,
  validateNoteContent,
  validateObjectId,
  validateNoteExists,
  validateFileExtension,
  validateOrderForDownload,
  noteCreationValidator,
  noteUpdateValidator,
  purchaseValidator,
  downloadAccessValidator,
  resendLinkValidator
};