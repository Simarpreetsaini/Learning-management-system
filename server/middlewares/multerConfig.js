const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create disk storage configuration for local file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Default upload directory
    const uploadDir = 'uploads/temp';
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    cb(null, filename);
  }
});

// E-Library specific storage configuration
const eLibraryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // E-Library specific upload directory
    const uploadDir = 'uploads/e-library';
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    cb(null, filename);
  }
});

// Memory storage for better binary file handling (alternative)
const memoryStorage = multer.memoryStorage();

// File filter for different types
const createFileFilter = (allowedTypes = []) => {
  return (req, file, cb) => {
    if (allowedTypes.length === 0) {
      // Default allowed extensions
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.zip', '.epub'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    } else {
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
      }
    }
  };
};

// Image file filter
const imageFileFilter = createFileFilter(['.jpg', '.jpeg', '.png', '.gif']);

// Document file filter
const documentFileFilter = createFileFilter(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.epub']);

// General file filter
const generalFileFilter = createFileFilter();

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum allowed size is 10MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files uploaded.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed'
    });
  }
  next();
};

// Multer configurations
const imageUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
    files: 1 // Only allow 1 file
  }
});

const documentUpload = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
    files: 1 // Only allow 1 file
  }
});

const generalUpload = multer({
  storage,
  fileFilter: generalFileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file
  }
});

// E-Library specific upload configuration
const eLibraryUpload = multer({
  storage: eLibraryStorage,
  fileFilter: documentFileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit for e-library documents
    files: 1 // Only allow 1 file
  }
});

module.exports = {
  imageUpload,
  documentUpload,
  generalUpload,
  eLibraryUpload,
  storage,
  eLibraryStorage,
  createFileFilter,
  handleMulterError
};
