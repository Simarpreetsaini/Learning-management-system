const express = require('express')
const router = express.Router()
const { documentUpload } = require('../middlewares/multerConfig')

const {
    createStudyMaterial,
    getAllStudyMaterials,
    getStudyMaterialById,
    updateStudyMaterial,
    deleteStudyMaterial,
    downloadStudyMaterial,
    getStudyMaterialsByDepartment,
    getStudyMaterialsBySubject,
    getStudyMaterialsBySemester,
    getStudyMaterialsWithFilters,
    searchStudyMaterials,
    getStudyMaterialsPaginated,
    getStudyMaterialStats,
    getAllDepartments,
    getAllSubjects,
    getAllSemesters,
    getSubjectsByDepartmentAndSemester,
    trackDownload,
    trackView
} = require('../controllers/studyMaterialController')

// Basic CRUD Routes
router.post('/', documentUpload.single('studyfile'), createStudyMaterial)  // Create new study material with file upload
router.get('/', getAllStudyMaterials)                    // Get all study materials with populated refs
router.get('/paginated', getStudyMaterialsPaginated)     // Get paginated study materials
router.get('/search', searchStudyMaterials)              // Search in title and body
router.get('/filter', getStudyMaterialsWithFilters)      // Get with multiple filter IDs
router.get('/stats', getStudyMaterialStats)              // Get statistics with populated data
router.get('/:id', getStudyMaterialById)                 // Get study material by ID with populated refs
router.get('/:id/download', downloadStudyMaterial)       // Download study material file
router.put('/:id', updateStudyMaterial)                  // Update study material by ID
router.delete('/:id', deleteStudyMaterial)               // Delete study material by ID

// Filter Routes by ObjectId
router.get('/department/:departmentId', getStudyMaterialsByDepartment)  // Get by department ID
router.get('/subject/:subjectId', getStudyMaterialsBySubject)           // Get by subject ID
router.get('/semester/:semesterId', getStudyMaterialsBySemester)        // Get by semester ID

// Helper Routes to get your existing model data
router.get('/helpers/departments', getAllDepartments)     // Get all departments from your department model
router.get('/helpers/subjects', getAllSubjects)           // Get all subjects from your subject model
router.get('/helpers/semesters', getAllSemesters)         // Get all semesters from your semester model
router.get('/helpers/subjects-filtered', getSubjectsByDepartmentAndSemester) // Get subjects filtered by department and semester

// Tracking Routes
router.post('/:id/track-download', trackDownload)         // Track download count
router.post('/:id/track-view', trackView)                 // Track view count

module.exports = router
