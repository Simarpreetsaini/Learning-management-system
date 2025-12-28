const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const validateFeedback = [
  body('subject').trim().isLength({ min: 3, max: 100 }).withMessage('Subject must be between 3 and 100 characters'),
  body('feedback').trim().isLength({ min: 10, max: 1000 }).withMessage('Feedback must be between 10 and 1000 characters'),
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
  body('category').optional().isIn(['course', 'platform', 'instructor', 'general']).withMessage('Invalid category'),
  body('adminResponse').optional().trim().isLength({ max: 1000 }).withMessage('Response must be less than 1000 characters'),
];

const validateFeedbackResponse = [
  body('adminResponse').trim().isLength({ min: 1, max: 1000 }).withMessage('Response must be between 1 and 1000 characters'),
];

const guestFeedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many feedback submissions from this IP, please try again later.',
  skip: (req) => req.user, // Skip rate limiting for authenticated users
});

module.exports = {
  validateFeedback,
  validateFeedbackResponse,
  guestFeedbackLimiter,
};