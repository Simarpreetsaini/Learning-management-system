const Feedback = require('../models/feedbackModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
const { validationResult } = require('express-validator');

const submitFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, feedback, name, email, phone, category } = req.body;

    const feedbackData = {
      subject,
      feedback,
      name,
      email,
      phone,
      category: category || 'general',
    };

    // If user is authenticated, attach userId and verify details
    if (req.user) {
      feedbackData.userId = req.user._id;
      const academicDetails = await StudentAcademicDetails.findOne({ userId: req.user._id });
      if (academicDetails) {
        feedbackData.name = academicDetails.fullname;
        feedbackData.email = academicDetails.email;
        feedbackData.phone = academicDetails.phone;
      }
    }

    const newFeedback = new Feedback(feedbackData);
    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'Teacher') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const feedbacks = await Feedback.find()
      .populate('userId', 'username fullname role');
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const respondToFeedback = async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'Teacher') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.adminResponse = req.body.adminResponse;
    feedback.status = 'resolved';
    await feedback.save();

    res.status(200).json({ message: 'Response added successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  submitFeedback,
  getAllFeedback,
  respondToFeedback,
};