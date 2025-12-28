const User = require('../models/userModel');

// Strict admin-only middleware
const requireAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in admin verification',
            error: error.message
        });
    }
};

// Middleware to check if user exists and admin has permission to modify
const checkUserExistsForAdmin = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Validate ObjectId format
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from modifying other admins (optional security measure)
        if (user.role === 'Admin' && user._id.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify other admin accounts'
            });
        }

        req.targetUser = user;
        next();
    } catch (error) {
        console.error('Check user exists error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking user existence',
            error: error.message
        });
    }
};

// Validate admin user creation/update data
const validateAdminUserData = (req, res, next) => {
    try {
        const { username, fullname, password, role } = req.body;

        // For updates, not all fields are required
        const isUpdate = req.method === 'PUT';

        if (!isUpdate) {
            // For creation, all fields are required
            if (!username || !fullname || !password || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, fullname, password, and role are required'
                });
            }
        }

        // Validate username if provided
        if (username !== undefined) {
            if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Username must be between 3 and 50 characters'
                });
            }

            // Check for valid username characters
            if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Username can only contain letters, numbers, and underscores'
                });
            }
        }

        // Validate fullname if provided
        if (fullname !== undefined) {
            if (typeof fullname !== 'string' || fullname.trim().length < 2 || fullname.trim().length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Full name must be between 2 and 100 characters'
                });
            }
        }

        // Validate password if provided
        if (password !== undefined) {
            if (typeof password !== 'string' || password.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 3 characters long'
                });
            }
        }

        // Validate role if provided
        if (role !== undefined) {
            const validRoles = ['Student', 'Teacher', 'Admin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Role must be one of: Student, Teacher, Admin'
                });
            }
        }

        next();
    } catch (error) {
        console.error('Validate admin user data error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating user data',
            error: error.message
        });
    }
};

// Log admin actions for audit trail
const logAdminAction = (action) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log the action after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`[ADMIN ACTION] ${new Date().toISOString()} - Admin ${req.user.userId} performed ${action} on user ${req.params.userId || 'N/A'}`);
            }
            originalSend.call(this, data);
        };
        
        next();
    };
};

module.exports = {
    requireAdmin,
    checkUserExistsForAdmin,
    validateAdminUserData,
    logAdminAction
};
