const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { documentUpload } = require('../middlewares/multerConfig');
const {
    isAdminOrTeacher,
    isTeacher,
    isStudent,
    isTeacherOrStudent,
    checkAssignmentAccess,
    checkAssignmentOwnership,
    validateAssignmentData,
    validateSubmissionData,
    checkSubmissionDeadline,
    checkExistingSubmission,
    validateGradeData,
    checkSubmissionOwnership,
    checkSubmissionUpdatePermission,
    validateDeptAndSemParams
} = require('../middlewares/assignmentMiddleware');

// Metadata Routes

// Get metadata (departments, semesters) for dropdowns
router
    .route('/metadata')
    .get(
        authMiddleware,
        // isAdminOrTeacher,
        // isTeacherOrStudent,
        assignmentController.getAssignmentMetadata
    );

// Get subjects by department and semester
router
    .route('/subjects/:departmentId/:semesterId')
    .get(
        authMiddleware,
        isAdminOrTeacher,
        isTeacherOrStudent,
        validateDeptAndSemParams,
        assignmentController.getSubjectsByDeptAndSem
    );

// Assignment CRUD Routes

// Create assignment (Teachers only)
router
    .route('/create')
    .post(
        authMiddleware,
        isTeacher,
        isAdminOrTeacher,
        documentUpload.array('files', 5), // Allow up to 5 files
        validateAssignmentData,
        assignmentController.createAssignment
    );

// Download assignment file
router
    .route('/download/:filename')
    .get(
        authMiddleware,
        isTeacherOrStudent,
        assignmentController.downloadFile
    );

// Download assignment attachment by assignment ID and filename
router
    .route('/:id/download/:filename')
    .get(
        authMiddleware,
        isTeacherOrStudent,
        checkAssignmentAccess,
        assignmentController.downloadAssignmentFile
    );

// Get all assignments (All authenticated users - filtered by role)
router
    .route('/')
    .get(
        authMiddleware,
        isTeacherOrStudent,
        assignmentController.getAllAssignments
    );

// Get assignments grouped by subject (Students only)
router
    .route('/by-subject')
    .get(
        authMiddleware,
        isAdminOrTeacher,
        isStudent,
        assignmentController.getAssignmentsBySubject
    );

// Get assignment by ID (All authenticated users with access check)
router
    .route('/:id')
    .get(
        authMiddleware,
        isAdminOrTeacher,
        isTeacherOrStudent,
        checkAssignmentAccess,
        assignmentController.getAssignmentById
    );

// Get assignments created by current teacher
router
    .route('/my/created')
    .get(
        authMiddleware,
        isAdminOrTeacher,
        isTeacher,
        assignmentController.getMyAssignments
    );

// Update assignment (Teachers - their own only)
router
    .route('/:id/update')
    .put(
        authMiddleware,
        isAdminOrTeacher,
        isTeacher,
        documentUpload.array('files', 5), // Allow up to 5 files for update
        validateAssignmentData,
        checkAssignmentOwnership,
        assignmentController.updateAssignment
    );

// Delete assignment (Teachers - their own only)
router
    .route('/:id/delete')
    .delete(
        authMiddleware,
        isAdminOrTeacher,
        isTeacher,
        checkAssignmentOwnership,
        assignmentController.deleteAssignment
    );

// Submission Routes

// Submit assignment (Students only)
router
    .route('/:id/submit')
    .post(
        authMiddleware,
        isStudent,
        documentUpload.single('file'),
        checkSubmissionDeadline,
        checkExistingSubmission,
        assignmentController.submitAssignment
    );

// Update submission (Students - their own only, before grading)
router
    .route('/:assignmentId/submissions/:submissionId/update')
    .put(
        authMiddleware,
        isStudent,
        validateSubmissionData,
        checkSubmissionOwnership,
        checkSubmissionUpdatePermission,
        assignmentController.updateSubmission
    );

// Grade submission (Teachers - their assignments only)
router
    .route('/:assignmentId/submissions/:submissionId/grade')
    .put(
        authMiddleware,
        isAdminOrTeacher,
        isTeacher,
        validateGradeData,
        checkAssignmentOwnership,
        assignmentController.gradeSubmission
    );

// Get student's own submissions
router
    .route('/my/submissions')
    .get(
        authMiddleware,
        isStudent,
        assignmentController.getMySubmissions
    );

// Get assignment statistics (Teachers - their assignments only)
router
    .route('/:id/stats')
    .get(
        authMiddleware,
        isAdminOrTeacher,
        isTeacher,
        checkAssignmentOwnership,
        assignmentController.getAssignmentStats
    );

module.exports = router;