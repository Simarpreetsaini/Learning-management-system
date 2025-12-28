const express = require('express');
const router = express.Router();
const {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
} = require('../controllers/departmentController');

const authMiddleware = require('../middlewares/authMiddleware');
const {
    validateDepartmentData,
    checkDepartmentExists,
    isAdminOrTeacher,
    isAdmin,
    validateObjectId,
    sanitizeInput
} = require('../middlewares/validationMiddleware');

// PUBLIC ROUTES (No authentication required)
// Get all departments (Public access)
router.get('/public', getAllDepartments);

// Get department by ID (Public access)
router.get('/public/:id', validateObjectId('id'), getDepartmentById);

// PROTECTED ROUTES (Authentication required)
// Apply auth middleware to protected routes
router.use(authMiddleware);
router.use(sanitizeInput);

// Create department (Admin only)
router.post('/', isAdmin, validateDepartmentData, createDepartment);

// Get all departments (All authenticated users)
router.get('/', getAllDepartments);

// Get department by ID (All authenticated users)
router.get('/:id', validateObjectId('id'), getDepartmentById);

// Update department (Admin only)
router.put('/:id', isAdmin, validateObjectId('id'), checkDepartmentExists, validateDepartmentData, updateDepartment);

// Delete department (Admin only)
router.delete('/:id', isAdmin, validateObjectId('id'), checkDepartmentExists, deleteDepartment);

module.exports = router;
