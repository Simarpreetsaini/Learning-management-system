const express = require('express');
const router = express.Router();
const {
    createSemester,
    getAllSemesters,
    getSemesterById,
    updateSemester,
    deleteSemester
} = require('../controllers/semesterController');

const authMiddleware = require('../middlewares/authMiddleware');
const {
    validateSemesterData,
    checkSemesterExists,
    isAdminOrTeacher,
    isAdmin,
    validateObjectId,
    sanitizeInput
} = require('../middlewares/validationMiddleware');

// PUBLIC ROUTES (No authentication required)
// Get all semesters (Public access)
router.get('/public', getAllSemesters);

// Get semester by ID (Public access)
router.get('/public/:id', validateObjectId('id'), getSemesterById);

// PROTECTED ROUTES (Authentication required)
// Apply auth middleware to protected routes
router.use(authMiddleware);
router.use(sanitizeInput);

// Create semester (Admin only)
router.post('/', isAdmin, validateSemesterData, createSemester);

// Get all semesters (All authenticated users)
router.get('/', getAllSemesters);

// Get semester by ID (All authenticated users)
router.get('/:id', validateObjectId('id'), getSemesterById);

// Update semester (Admin only)
router.put('/:id', isAdmin, validateObjectId('id'), checkSemesterExists, validateSemesterData, updateSemester);

// Delete semester (Admin only)
router.delete('/:id', isAdmin, validateObjectId('id'), checkSemesterExists, deleteSemester);

module.exports = router;

