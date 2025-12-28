const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Middleware to authenticate users with teacher role
 * Verifies JWT token and ensures the user is a teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateTeacher = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided or invalid format'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Find user by ID
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check for teacher role (case-insensitive)
    if (user.role.toLowerCase() !== 'teacher') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Teacher role required'
      });
    }

    // Attach user data to request
    req.user = user;
    req.token = token;
    req.userID = user._id;

    next();
  } catch (error) {
    console.error('Teacher authentication error:', error.message);
    res.status(401).json({
      success: false,
      error: 'Invalid token or authentication failed'
    });
  }
};

module.exports = authenticateTeacher;