const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// Get all users with full details (including passwords for admin)
const getAllUsersForAdmin = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            role = '', 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;

        // Build query
        let query = {};
        
        // Search functionality
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { fullname: { $regex: search, $options: 'i' } }
            ];
        }

        // Role filter
        if (role && ['Student', 'Teacher', 'Admin'].includes(role)) {
            query.role = role;
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Get users with pagination
        const users = await User.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean(); // Use lean() for better performance

        // Get total count for pagination
        const totalUsers = await User.countDocuments(query);

        // Calculate pagination info
        const totalPages = Math.ceil(totalUsers / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalUsers,
                    hasNextPage,
                    hasPrevPage,
                    limit: limitNum
                }
            }
        });
    } catch (error) {
        console.error('Get all users for admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Get single user by ID with full details
const getUserByIdForAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).lean();
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('Get user by ID for admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// Create new user (admin only)
const createUserByAdmin = async (req, res) => {
    try {
        const { username, fullname, password, role = 'Student' } = req.body;

        // Check if username already exists
        const existingUser = await User.findOne({ username: username.trim() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Check if fullname already exists
        const existingFullname = await User.findOne({ fullname: fullname.trim() });
        if (existingFullname) {
            return res.status(400).json({
                success: false,
                message: 'Full name already exists'
            });
        }

        // Create new user
        const newUser = await User.create({
            username: username.trim(),
            fullname: fullname.trim(),
            password,
            role
        });

        // Return user without password for response
        const userResponse = {
            _id: newUser._id,
            username: newUser.username,
            fullname: newUser.fullname,
            role: newUser.role,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user: userResponse }
        });
    } catch (error) {
        console.error('Create user by admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// Update user (admin only)
const updateUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = { ...req.body };

        // Remove undefined fields and empty strings
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === '') {
                delete updateData[key];
            }
        });

        // Get the current user to compare values
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If updating username, check for uniqueness only if it's different from current
        if (updateData.username && updateData.username.trim() !== currentUser.username) {
            const existingUser = await User.findOne({ 
                username: updateData.username.trim(),
                _id: { $ne: userId }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
            updateData.username = updateData.username.trim();
        } else if (updateData.username) {
            updateData.username = updateData.username.trim();
        }

        // If updating fullname, check for uniqueness only if it's different from current
        if (updateData.fullname && updateData.fullname.trim() !== currentUser.fullname) {
            const existingFullname = await User.findOne({ 
                fullname: updateData.fullname.trim(),
                _id: { $ne: userId }
            });
            if (existingFullname) {
                return res.status(400).json({
                    success: false,
                    message: 'Full name already exists'
                });
            }
            updateData.fullname = updateData.fullname.trim();
        } else if (updateData.fullname) {
            updateData.fullname = updateData.fullname.trim();
        }

        // If updating password, hash it manually since findByIdAndUpdate doesn't trigger pre-save middleware
        if (updateData.password) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(updateData.password, saltRounds);
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).lean();

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Update user by admin error:', error);
        
        // Handle MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }

        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// Delete user (admin only)
const deleteUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent admin from deleting themselves
        if (userId === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: { 
                deletedUser: {
                    _id: deletedUser._id,
                    username: deletedUser.username,
                    fullname: deletedUser.fullname,
                    role: deletedUser.role
                }
            }
        });
    } catch (error) {
        console.error('Delete user by admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// Bulk delete users (admin only)
const bulkDeleteUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        // Prevent admin from deleting themselves
        if (userIds.includes(req.user.userId)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Validate all user IDs
        const invalidIds = userIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format detected'
            });
        }

        const result = await User.deleteMany({ _id: { $in: userIds } });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} users deleted successfully`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        console.error('Bulk delete users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting users',
            error: error.message
        });
    }
};

// Get user statistics (admin dashboard)
const getUserStatistics = async (req, res) => {
    try {
        // Use aggregation pipeline for more accurate counting
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Initialize counts
        let totalUsers = 0;
        let totalStudents = 0;
        let totalTeachers = 0;
        let totalAdmins = 0;

        // Process aggregation results
        stats.forEach(stat => {
            totalUsers += stat.count;
            switch (stat._id) {
                case 'Student':
                    totalStudents = stat.count;
                    break;
                case 'Teacher':
                    totalTeachers = stat.count;
                    break;
                case 'Admin':
                    totalAdmins = stat.count;
                    break;
            }
        });

        // Get recent users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUsers = await User.countDocuments({ 
            createdAt: { $gte: thirtyDaysAgo } 
        });

        // Get users by role for chart data
        const roleDistribution = [
            { role: 'Student', count: totalStudents },
            { role: 'Teacher', count: totalTeachers },
            { role: 'Admin', count: totalAdmins }
        ];

        // Debug logging to help identify the issue
        console.log('User Statistics Debug:', {
            totalUsers,
            totalStudents,
            totalTeachers,
            totalAdmins,
            aggregationResults: stats
        });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalStudents,
                totalTeachers,
                totalAdmins,
                recentUsers,
                roleDistribution
            }
        });
    } catch (error) {
        console.error('Get user statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};

// Reset user password (admin only)
const resetUserPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 3 characters long'
            });
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { password: hashedPassword },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Reset user password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};

// Get user's plain text password (admin only) - SECURITY WARNING: This is for admin viewing only
const getUserPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).lean();
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Note: This returns the hashed password since we can't decrypt bcrypt hashes
        // In a real-world scenario, you might want to implement a different approach
        res.status(200).json({
            success: true,
            message: 'Password retrieved (hashed)',
            data: { 
                userId: user._id,
                username: user.username,
                hashedPassword: user.password,
                note: 'This is the hashed password. Original password cannot be retrieved due to security hashing.'
            }
        });
    } catch (error) {
        console.error('Get user password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving password',
            error: error.message
        });
    }
};

module.exports = {
    getAllUsersForAdmin,
    getUserByIdForAdmin,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin,
    bulkDeleteUsers,
    getUserStatistics,
    resetUserPassword,
    getUserPassword
};
