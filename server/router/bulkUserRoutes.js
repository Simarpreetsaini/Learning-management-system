const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import controllers and middlewares
const bulkUserController = require('../controllers/bulkUserController');
const authMiddleware = require('../middlewares/authMiddleware');
const { handleMulterError } = require('../middlewares/multerConfig');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/bulk-import');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Enhanced storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and sanitized original name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `bulk-import-${uniqueSuffix}-${sanitizedName}`);
    }
});

// Enhanced file filter for Excel files with better validation
const excelFileFilter = (req, file, cb) => {
    try {
        const allowedExtensions = ['.xlsx', '.xls'];
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/octet-stream' // Sometimes Excel files are detected as this
        ];
        
        const ext = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype.toLowerCase();
        
        // Check file extension
        if (!allowedExtensions.includes(ext)) {
            return cb(new Error(`Invalid file extension. Only Excel files (${allowedExtensions.join(', ')}) are allowed.`), false);
        }
        
        // Check MIME type (more flexible to handle different browsers)
        if (!allowedMimeTypes.includes(mimeType)) {
            console.warn(`Unexpected MIME type: ${mimeType} for file: ${file.originalname}`);
            // Don't reject based on MIME type alone as browsers can be inconsistent
        }
        
        // Check file name
        if (!file.originalname || file.originalname.trim() === '') {
            return cb(new Error('Invalid file name.'), false);
        }
        
        // Additional security check - ensure filename doesn't contain path traversal
        if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
            return cb(new Error('Invalid file name. File name contains illegal characters.'), false);
        }
        
        cb(null, true);
    } catch (error) {
        console.error('File filter error:', error);
        cb(new Error('File validation failed.'), false);
    }
};

// Enhanced multer configuration for Excel uploads
const excelUpload = multer({
    storage,
    fileFilter: excelFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // Increased to 10MB limit to handle larger files
        files: 1, // Only allow 1 file
        fieldSize: 1024 * 1024, // 1MB field size limit
        fieldNameSize: 100, // Field name size limit
        fields: 10 // Maximum number of fields
    }
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/bulk-users/template
 * @desc    Download Excel template for bulk user registration
 * @access  Admin only
 */
router.get('/template', bulkUserController.downloadTemplate);

/**
 * @route   GET /api/bulk-users/stats
 * @desc    Get bulk import statistics
 * @access  Admin only
 */
router.get('/stats', bulkUserController.getBulkImportStats);

/**
 * @route   POST /api/bulk-users/validate
 * @desc    Validate Excel file format and data
 * @access  Admin only
 */
router.post('/validate', 
    excelUpload.single('excelFile'),
    handleMulterError,
    bulkUserController.validateExcelFile
);

/**
 * @route   POST /api/bulk-users/upload
 * @desc    Upload and parse Excel file for bulk user registration
 * @access  Admin only
 */
router.post('/upload',
    excelUpload.single('excelFile'),
    handleMulterError,
    bulkUserController.uploadAndParseExcel
);

/**
 * @route   POST /api/bulk-users/create
 * @desc    Bulk create users from validated data
 * @access  Admin only
 */
router.post('/create', bulkUserController.bulkCreateUsers);

// Error handling middleware specific to this router
router.use((error, req, res, next) => {
    console.error('Bulk user routes error:', error);
    
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'File size too large. Maximum allowed size is 10MB.'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field. Please use "excelFile" as the field name.'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + error.message
                });
        }
    }
    
    res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

module.exports = router;
