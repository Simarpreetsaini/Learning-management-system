const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    createPyq,
    getAllPyqs,
    getPyqById,
    getPyqsByDepartment,
    getPyqsBySemester,
    getPyqsBySubject,
    downloadPyq,
    updatePyq,
    deletePyq
} = require('../controllers/pyqController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pyq-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX, JPG, and PNG files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// PUBLIC ROUTES (No authentication required)
router.get('/public', getAllPyqs);
router.get('/public/:id', getPyqById);
router.get('/public/department/:department', getPyqsByDepartment);
router.get('/public/semester/:semester', getPyqsBySemester);
router.get('/public/subject/:subject', getPyqsBySubject);
router.get('/public/:id/download', downloadPyq);

// PROTECTED ROUTES (Authentication required)
// Apply auth middleware to protected routes
router.use(authMiddleware);

// Routes for authenticated users (admin/teacher management)
router.post('/', upload.single('pyqfile'), createPyq);
router.get('/', getAllPyqs);
router.get('/:id', getPyqById);
router.get('/department/:department', getPyqsByDepartment);
router.get('/semester/:semester', getPyqsBySemester);
router.get('/subject/:subject', getPyqsBySubject);
router.get('/:id/download', downloadPyq);
router.put('/:id', upload.single('pyqfile'), updatePyq);
router.delete('/:id', deletePyq);

module.exports = router;
