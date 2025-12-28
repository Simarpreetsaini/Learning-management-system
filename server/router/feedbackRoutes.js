const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback, respondToFeedback } = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateFeedback, validateFeedbackResponse, guestFeedbackLimiter } = require('../middlewares/feedbackMiddleware');

// Submit feedback (accessible to both guests and authenticated users)
router.post('/submit', guestFeedbackLimiter, validateFeedback, submitFeedback);

// Get all feedback (admin only)
router.get('/', authMiddleware, getAllFeedback);

// Respond to feedback (admin only)
router.put('/:id/respond', authMiddleware, validateFeedbackResponse, respondToFeedback);

module.exports = router;