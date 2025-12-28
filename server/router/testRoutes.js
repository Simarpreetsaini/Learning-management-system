const express = require('express');
const router = express.Router();

// Import controllers
const testController = require('../controllers/testController');
const testSubmissionController = require('../controllers/testSubmissionController');

// Import middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const {
    validateTestCreationData,
    validateTestSubmissionData,
    validateObjectId,
    isTeacher,
    isStudent,
    isAdminOrTeacher,
    checkTestOwnership,
    checkTestAccess,
    checkTestAvailability,
    checkTestNotSubmitted,
    checkTestNotGraded,
    checkActiveTestSession,
    checkSubmissionOwnership,
    validateDeptAndSemParams,
    rateLimitTest
} = require('../middlewares/testMiddleware');

// ======================
// UTILITY ROUTES (Must come before parameterized routes)
// ======================

// Get subjects by department and semester (for test creation)
router.get('/metadata/subjects/:departmentId/:semesterId',
    authMiddleware,
    isAdminOrTeacher,
    validateDeptAndSemParams,
    testController.getSubjectsByDeptAndSem
);

// Get test metadata (departments, semesters for dropdowns)
router.get('/metadata',
    authMiddleware,
    isAdminOrTeacher,
    testController.getTestMetadata
);

// ======================
// TEACHER ROUTES
// ======================

// Create a new test
router.post('/tests',
    authMiddleware,
    isTeacher,
    rateLimitTest,
    validateTestCreationData,
    testController.createTest
);

// Get all tests (for admin) or teacher's tests
router.get('/tests',
    authMiddleware,
    isAdminOrTeacher,
    testController.getAllTests
);

// Get tests created by current teacher
router.get('/tests/my',
    authMiddleware,
    isTeacher,
    testController.getMyTests
);

// Get test by ID
router.get('/tests/:id',
    authMiddleware,
    isAdminOrTeacher,
    validateObjectId('id'),
    testController.getTestById
);

// Update test
router.put('/tests/:id',
    authMiddleware,
    isTeacher,
    validateObjectId('id'),
    checkTestOwnership,
    checkTestNotGraded,
    validateTestCreationData,
    testController.updateTest
);

// Delete test (soft delete)
router.delete('/tests/:id',
    authMiddleware,
    isTeacher,
    validateObjectId('id'),
    checkTestOwnership,
    checkTestNotGraded,
    testController.deleteTest
);

// Toggle test activation status
router.patch('/tests/:id/toggle-status',
    authMiddleware,
    isTeacher,
    validateObjectId('id'),
    checkTestOwnership,
    testController.toggleTestStatus
);

// Get test submissions for a specific test
router.get('/tests/:id/submissions',
    authMiddleware,
    isTeacher,
    validateObjectId('id'),
    checkTestOwnership,
    testController.getTestSubmissions
);

// Get test analytics
router.get('/tests/:id/analytics',
    authMiddleware,
    isTeacher,
    validateObjectId('id'),
    checkTestOwnership,
    testController.getTestAnalytics
);

// Get detailed submission by ID (for teachers)
router.get('/submissions/:submissionId',
    authMiddleware,
    isAdminOrTeacher,
    validateObjectId('submissionId'),
    checkSubmissionOwnership,
    testController.getSubmissionById
);

// ======================
// STUDENT ROUTES
// ======================

// Get available tests for student
router.get('/student/tests/available',
    authMiddleware,
    isStudent,
    testSubmissionController.getAvailableTests
);

// Get student's test records
router.get('/student/tests/my-records',
    authMiddleware,
    isStudent,
    testSubmissionController.getMyTestRecords
);

// Get student performance
router.get('/student/performance',
    authMiddleware,
    isStudent,
    testSubmissionController.getStudentPerformance
);

// Get test details for student (without answers)
router.get('/student/tests/:id',
    authMiddleware,
    isStudent,
    validateObjectId('id'),
    checkTestAccess,
    checkTestAvailability,
    testSubmissionController.getTestForStudent
);


// Start a test
router.post('/student/tests/:id/start',
    authMiddleware,
    isStudent,
    rateLimitTest,
    validateObjectId('id'),
    checkTestAccess,
    checkTestAvailability,
    checkTestNotSubmitted,
    testSubmissionController.startTest
);

// Submit a test
router.post('/student/tests/:id/submit',
    authMiddleware,
    isStudent,
    validateObjectId('id'),
    checkTestAccess,
    checkActiveTestSession,
    validateTestSubmissionData,
    testSubmissionController.submitTest
);

// Get student's submission result
router.get('/student/submissions/:submissionId/result',
    authMiddleware,
    isStudent,
    validateObjectId('submissionId'),
    checkSubmissionOwnership,
    testSubmissionController.getSubmissionById
);

// Get test review (if allowed by teacher)
router.get('/student/tests/:id/review',
    authMiddleware,
    isStudent,
    validateObjectId('id'),
    checkTestAccess,
    testSubmissionController.getTestReview
);


// ======================
// ANALYTICS ROUTES (Additional)
// ======================

// Get overall test statistics for teacher
router.get('/teacher/statistics',
    authMiddleware,
    isTeacher,
    testController.getTeacherStatistics
);

// Get question-wise performance for a test
router.get('/tests/:id/question-performance',
    authMiddleware,
    isTeacher,
    validateObjectId('id'),
    checkTestOwnership,
    testController.getQuestionPerformance
);

// Add missing route for student performance
router.get('/student/performance',
    authMiddleware,
    isStudent,
    testSubmissionController.getStudentPerformance
);

// Export the router
module.exports = router;
