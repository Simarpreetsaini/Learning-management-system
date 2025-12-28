
const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const departmentRoutes = require('./departmentRoutes');
const semesterRoutes = require('./semesterRoutes');
const subjectRoutes = require('./subjectRoutes');
const studentAcademicRoutes = require('./studentAcademicRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const cumulativeAttendanceRoutes = require('./cumulativeAttendanceRoutes');
const noticeboardRoutes = require('./noticeboardRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const testRoutes = require('./testRoutes');
const hotLinksRoutes = require('./hotLinksRoutes');
const imageGalleryRoutes = require('./imageGalleryRoutes');
const eLibRoutes = require('./eLibRoutes');
const pyqRoutes = require('./pyqRoutes');
const studyMaterialRoutes = require('./studyMaterialRoutes');
const paidNotesRoutes = require('./paidNotesRoutes');
const impDocRoutes = require('./impDocRoutes');
const academicMarksRoutes = require('./academicMarksRoutes');
const bulkUserRoutes = require('./bulkUserRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');

// Import assignment controller for generic file downloads
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isTeacherOrStudent } = require('../middlewares/assignmentMiddleware');

// Generic file download route to handle legacy URLs
router.get('/files/*', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Extract the full file path from the URL
    const filePath = req.params[0]; // This captures everything after /files/
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Get file stats
    const stats = fs.statSync(fullPath);
    const fileExtension = path.extname(fullPath).toLowerCase();
    
    // Set appropriate content type based on file extension
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.zip': 'application/zip',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.epub': 'application/epub+zip'
    };
    
    const contentType = contentTypeMap[fileExtension] || 'application/octet-stream';
    const fileName = path.basename(fullPath);
    
    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Protected file download route for assignments (requires authentication)
router.get('/files/assignments/*', authMiddleware, isTeacherOrStudent, (req, res) => {
  // Extract the full file path from the URL
  const filePath = req.params[0]; // This captures everything after /files/assignments/
  
  // Create a mock request object with the filename parameter
  const mockReq = {
    ...req,
    params: { filename: `assignments/${filePath}` }
  };
  
  // Use the existing downloadFile controller
  assignmentController.downloadFile(mockReq, res);
});

// Use routes
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/semesters', semesterRoutes);
router.use('/subjects', subjectRoutes);
router.use('/academic', studentAcademicRoutes);
router.use('/academic-details', studentAcademicRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/cumulative-attendance', cumulativeAttendanceRoutes);
router.use('/notices', noticeboardRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/tests', testRoutes);
router.use('/hot-links', hotLinksRoutes);
router.use('/image-gallery', imageGalleryRoutes);
router.use('/e-library', eLibRoutes);
router.use('/pyqs', pyqRoutes);
router.use('/study-materials', studyMaterialRoutes);
router.use('/paid-notes', paidNotesRoutes);
router.use('/important-documents', impDocRoutes);
router.use('/academic-marks', academicMarksRoutes);
router.use('/bulk-users', bulkUserRoutes);
router.use('/activities', require('./activitiesRoutes'));
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running successfully',
        timestamp: new Date().toISOString()
    });
});

// 404 handler for undefined routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

module.exports = router;
