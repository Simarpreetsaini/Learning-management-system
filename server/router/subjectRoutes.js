const express = require('express');
const router = express.Router();
const {
    createSubject,
    getAllSubjects,
    getSubjectsByDeptAndSem,
    getSubjectById,
    updateSubject,
    deleteSubject
} = require('../controllers/subjectController');

const authMiddleware = require('../middlewares/authMiddleware');
const {
    validateSubjectData,
    checkSubjectExists,
    isAdminOrTeacher,
    isAdmin,
    validateObjectId,
    validateDeptAndSemParams,
    sanitizeInput
} = require('../middlewares/validationMiddleware');

// PUBLIC ROUTES (No authentication required)
// Get all subjects (Public access)
router.get('/public', getAllSubjects);

// Get subjects by department and semester (Public access)
router.get('/public/department/:departmentId/semester/:semesterId', 
    validateDeptAndSemParams, 
    getSubjectsByDeptAndSem
);

// Get subject by ID (Public access)
router.get('/public/:id', validateObjectId('id'), getSubjectById);

// PROTECTED ROUTES (Authentication required)
// Apply auth middleware to protected routes
router.use(authMiddleware);
router.use(sanitizeInput);

// Create subject (Admin only)
router.post('/', isAdmin, validateSubjectData, createSubject);

// Get all subjects (All authenticated users)
router.get('/', getAllSubjects);

// Get subjects by department and semester
router.get('/department/:departmentId/semester/:semesterId', 
    validateDeptAndSemParams, 
    getSubjectsByDeptAndSem
);

// Get subject by ID (All authenticated users)
router.get('/:id', validateObjectId('id'), getSubjectById);

// Update subject (Admin only)
router.put('/:id', isAdmin, validateObjectId('id'), checkSubjectExists, validateSubjectData, updateSubject);

// Delete subject (Admin only)
router.delete('/:id', isAdmin, validateObjectId('id'), checkSubjectExists, deleteSubject);

module.exports = router;
