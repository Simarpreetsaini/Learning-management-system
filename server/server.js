const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
// Enable CORS for web and Capacitor Android app access
const allowedOrigins = [
  'https://brslms.vercel.app',
  'capacitor://localhost',
  'https://localhost'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(...process.env.FRONTEND_URL.split(','));
}

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://brslms.vercel.app',
  ],
  credentials: true
}));

// Parse JSON bodies (except for webhook routes)
app.use(express.json());

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url.includes('/auth/login')) {
    console.log('Login request body keys:', Object.keys(req.body || {}));
    console.log('Content-Type:', req.headers['content-type']);
  }
  next();
});

// Parse raw bodies for Stripe webhooks
app.use('/api/paid-notes/webhook', express.raw({ type: 'application/json', limit: '10mb' }));

// Global rate limiting - DISABLED FOR TESTING
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: 'Too many requests from this IP, please try again later',
//   standardHeaders: true,
//   legacyHeaders: false
// });
// app.use(globalLimiter);

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from uploads directory (for legacy local files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from uploads/temp directory (for new uploads)
app.use('/uploads/temp', express.static(path.join(__dirname, 'uploads/temp')));

// Validate PDF file integrity
const validatePDFIntegrity = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath, { encoding: null });
    
    // Check PDF header
    if (fileBuffer.length < 4) {
      throw new Error('File too small to be a valid PDF');
    }
    
    const header = fileBuffer.toString('ascii', 0, 4);
    if (!header.includes('%PDF')) {
      throw new Error('Invalid PDF header');
    }
    
    // Check for PDF trailer
    const trailer = fileBuffer.toString('ascii', Math.max(0, fileBuffer.length - 1024));
    if (!trailer.includes('%%EOF')) {
      console.warn('PDF may be incomplete - no EOF marker found');
    }
    
    return true;
  } catch (error) {
    console.error('PDF validation error:', error);
    throw error;
  }
};

// Secure file serving route with access control and binary integrity
app.get('/api/files/*', (req, res) => {
  try {
    const filePath = req.params[0]; // Get the file path after /api/files/
    
    console.log(`File download request: ${filePath}`);
    
    // Construct the full path - ensure it starts with uploads/
    let fullPath;
    if (filePath.startsWith('uploads/')) {
      fullPath = path.join(__dirname, filePath);
    } else {
      fullPath = path.join(__dirname, 'uploads', filePath);
    }
    
    console.log(`Full path: ${fullPath}`);
    
    // Security check: ensure the file is within the uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      console.error(`Security violation: Path ${resolvedPath} is outside uploads directory`);
      console.error(`Resolved path: ${resolvedPath}`);
      console.error(`Uploads directory: ${resolvedUploadsDir}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      console.error(`File not found: ${resolvedPath}`);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Get file stats
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      console.error(`Path is not a file: ${resolvedPath}`);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    const ext = path.extname(resolvedPath).toLowerCase();
    const fileName = path.basename(resolvedPath);
    
    // Validate PDF integrity before serving
    if (ext === '.pdf') {
      try {
        validatePDFIntegrity(resolvedPath);
        console.log(`PDF validation passed for: ${fileName}`);
      } catch (validationError) {
        console.error(`PDF validation failed for ${fileName}:`, validationError);
        return res.status(500).json({
          success: false,
          message: 'File is corrupted or invalid'
        });
      }
    }
    
    // Set appropriate headers
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
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Set headers for proper binary file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Always use streaming for binary files to preserve integrity
    const fileStream = fs.createReadStream(resolvedPath, {
      highWaterMark: 64 * 1024, // 64KB chunks
      encoding: null // Ensure binary mode
    });
    
    fileStream.on('error', (error) => {
      console.error('File streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error serving file'
        });
      }
    });
    
    fileStream.on('open', () => {
      console.log(`Started streaming file: ${fileName} (${stats.size} bytes)`);
    });
    
    fileStream.on('end', () => {
      console.log(`Successfully streamed file: ${fileName} (${stats.size} bytes)`);
    });
    
    // Handle client disconnect
    req.on('close', () => {
      if (!fileStream.destroyed) {
        fileStream.destroy();
        console.log(`Client disconnected, stopped streaming: ${fileName}`);
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File serving error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error serving file'
      });
    }
  }
});

// Import Routes
const authRoutes = require('./router/authRoutes');
const departmentRoutes = require('./router/departmentRoutes');
const semesterRoutes = require('./router/semesterRoutes');
const subjectRoutes = require('./router/subjectRoutes');
const studentAcademicRoutes = require('./router/studentAcademicRoutes');
const attendanceRoutes = require('./router/attendanceRoutes');
const cumulativeAttendanceRoutes = require('./router/cumulativeAttendanceRoutes');
const assignmentRoutes = require('./router/assignmentRoutes');
const feedbackRoutes = require('./router/feedbackRoutes');
const noticeboardRoutes = require('./router/noticeboardRoutes');
const testRoutes = require('./router/testRoutes');
const studyMaterialRoutes = require('./router/studyMaterialRoutes');
const paidNotesRoutes = require('./router/paidNotesRoutes');
const hotLinksRoutes = require('./router/hotLinksRoutes');
const imageGalleryRoutes = require('./router/imageGalleryRoutes');
const impDocRoutes = require('./router/impDocRoutes');
const eLibRoutes = require('./router/eLibRoutes');
const pyqRoutes = require('./router/pyqRoutes');
const activitiesRoutes = require('./router/activitiesRoutes');
const academicMarksRoutes = require('./router/academicMarksRoutes');
const bulkUserRoutes = require('./router/bulkUserRoutes');
const notificationRoutes = require('./router/notificationRoutes');
const adminRoutes = require('./router/adminRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/academic-details', studentAcademicRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/cumulative-attendance', cumulativeAttendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notices', noticeboardRoutes);
app.use('/api', testRoutes);
app.use('/api/tests/submissions', testRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/paid-notes', paidNotesRoutes);
app.use('/api/hot-links', hotLinksRoutes);
app.use('/api/image-gallery', imageGalleryRoutes);
app.use('/api/important-documents', impDocRoutes);
app.use('/api/e-library', eLibRoutes);
app.use('/api/pyqs', pyqRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/academic-marks', academicMarksRoutes);
app.use('/api/bulk-users', bulkUserRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the University Management System API with Paid Notes Portal!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`
    });
  }
  res.status(500).json({
    success: false,
    error: 'Something went wrong on the server'
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process on connection failure
  });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.1.7:${PORT}`);
  console.log(`Frontend accessible at http://192.168.1.7:5173`);
  console.log(`Local access: http://localhost:${PORT}`);
});
