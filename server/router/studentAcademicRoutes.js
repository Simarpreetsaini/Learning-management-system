const express = require('express');
const router = express.Router();
const {
    createStudentAcademicDetails,
    getAcademicDetails,
    getMyAcademicDetails,
    getAcademicDetailsById,
    getAllAcademicDetails,
    updateAcademicDetails,
    deleteAcademicDetails,
    getStudentsByDeptAndSem,
    getStudentsByDeptSemAndSection,
    searchStudents,
    exportStudentData,
    exportStudentById,
    getStudentStatistics
} = require('../controllers/studentAcademicController');

const authMiddleware = require('../middlewares/authMiddleware');
const { imageUpload } = require('../middlewares/multerConfig');
const {
    validateAcademicDetailsData,
    isAdminOrTeacher,
    isStudentOnly,
    validateObjectId,
    validateDeptAndSemParams,
    validateSearchQuery,
    validateFileUpload,
    validatePagination,
    sanitizeInput,
    validateAcademicUpdatePermissions
} = require('../middlewares/validationMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(sanitizeInput);

// Create academic details (Student only)
router.post('/', 
    isStudentOnly, 
    imageUpload.single('photo'),
    validateAcademicDetailsData, 
    createStudentAcademicDetails
);

router.get('/academic-details', authMiddleware, getAcademicDetails);
// Get my academic details (Student only)
router.get('/my-details', isStudentOnly, getMyAcademicDetails);

// Get student statistics (Admin/Teacher only) - Must be before other GET routes
router.get('/statistics', 
    isAdminOrTeacher, 
    getStudentStatistics
);

// Export routes (Admin/Teacher only) - Must be before /:id route
// Export student data with filters
router.get('/export', 
    isAdminOrTeacher, 
    exportStudentData
);

// Export individual student data
router.get('/export/:id', 
    isAdminOrTeacher, 
    validateObjectId('id'), 
    exportStudentById
);

// Search students (Admin/Teacher only)
router.get('/search', 
    isAdminOrTeacher, 
    validateSearchQuery, 
    searchStudents
);

// Get students by department and semester (Admin/Teacher only)
router.get('/department/:departmentId/semester/:semesterId', 
    isAdminOrTeacher,
    validateDeptAndSemParams, 
    getStudentsByDeptAndSem
);

// Get students by department, semester, and section (Admin/Teacher only)
router.get('/department/:departmentId/semester/:semesterId/section/:section', 
    isAdminOrTeacher,
    validateDeptAndSemParams, 
    getStudentsByDeptSemAndSection
);

// Get all academic details (Admin/Teacher only)
router.get('/', 
    isAdminOrTeacher, 
    validatePagination, 
    getAllAcademicDetails
);

// Get academic details by ID (Admin/Teacher only) - Must be last among GET routes
router.get('/:id', 
    isAdminOrTeacher, 
    validateObjectId('id'), 
    getAcademicDetailsById
);

// Update academic details (Student updates own, Admin/Teacher can update any)
router.put('/', 
    isStudentOnly, 
    imageUpload.single('photo'),
    validateAcademicDetailsData, 
    updateAcademicDetails
);

// Delete academic details (Student only - own details)
router.delete('/', isStudentOnly, deleteAcademicDetails);

module.exports = router;
