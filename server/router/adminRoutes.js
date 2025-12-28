const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin, checkUserExistsForAdmin, validateAdminUserData, logAdminAction } = require('../middlewares/adminMiddleware');

// Apply authentication and admin middleware to all routes
router.use(authMiddleware);
router.use(requireAdmin);

// User management routes

// GET /api/admin/users - Get all users with pagination, search, and filters
router.get('/users', adminController.getAllUsersForAdmin);

// GET /api/admin/users/statistics - Get user statistics for dashboard
router.get('/users/statistics', adminController.getUserStatistics);

// GET /api/admin/users/:userId - Get single user by ID
router.get('/users/:userId', 
    checkUserExistsForAdmin,
    logAdminAction('VIEW_USER'),
    adminController.getUserByIdForAdmin
);

// GET /api/admin/users/:userId/password - Get user's password (hashed)
router.get('/users/:userId/password',
    checkUserExistsForAdmin,
    logAdminAction('VIEW_PASSWORD'),
    adminController.getUserPassword
);

// POST /api/admin/users - Create new user
router.post('/users',
    validateAdminUserData,
    logAdminAction('CREATE_USER'),
    adminController.createUserByAdmin
);

// PUT /api/admin/users/:userId - Update user
router.put('/users/:userId',
    checkUserExistsForAdmin,
    validateAdminUserData,
    logAdminAction('UPDATE_USER'),
    adminController.updateUserByAdmin
);

// PUT /api/admin/users/:userId/reset-password - Reset user password
router.put('/users/:userId/reset-password',
    checkUserExistsForAdmin,
    logAdminAction('RESET_PASSWORD'),
    adminController.resetUserPassword
);

// DELETE /api/admin/users/:userId - Delete single user
router.delete('/users/:userId',
    checkUserExistsForAdmin,
    logAdminAction('DELETE_USER'),
    adminController.deleteUserByAdmin
);

// DELETE /api/admin/users - Bulk delete users
router.delete('/users',
    logAdminAction('BULK_DELETE_USERS'),
    adminController.bulkDeleteUsers
);

module.exports = router;
