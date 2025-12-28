const fs = require('fs');
const path = require('path');

// File type categories for organized local storage
const FILE_CATEGORIES = {
  PAID_NOTES: 'paid-notes',
  STUDY_MATERIALS: 'study-materials',
  PYQS: 'pyqs',
  NOTICES: 'notices',
  ASSIGNMENTS: 'assignments',
  IMAGES: 'images',
  DOCUMENTS: 'documents',
  ELIB: 'e-library',
  BULK_IMPORT: 'bulk-import'
};

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  const fullPath = path.join(process.cwd(), dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
};

// Initialize all upload directories
const initializeDirectories = () => {
  // Ensure base uploads directory exists
  ensureDirectoryExists('uploads');
  
  // Create category subdirectories
  Object.values(FILE_CATEGORIES).forEach(category => {
    ensureDirectoryExists(`uploads/${category}`);
  });
};

/**
 * Upload file to local storage with organized folder structure
 * @param {Object} file - Multer file object
 * @param {string} category - File category from FILE_CATEGORIES
 * @param {string} customName - Optional custom filename
 * @returns {Promise<Object>} - Upload result with key and location
 */
const uploadToLocal = async (file, category = FILE_CATEGORIES.DOCUMENTS, customName = null) => {
  try {
    // Ensure the category directory exists
    const categoryPath = `uploads/${category}`;
    ensureDirectoryExists(categoryPath);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = customName || `${timestamp}-${sanitizedOriginalName}`;
    const relativePath = `${categoryPath}/${filename}`;
    const fullPath = path.join(process.cwd(), relativePath);

    // Handle both disk storage and memory storage
    if (file.buffer) {
      // Memory storage - write buffer directly
      fs.writeFileSync(fullPath, file.buffer);
      console.log(`File saved from buffer: ${relativePath}`);
    } else if (file.path) {
      // Disk storage - use fs.copyFileSync to preserve binary integrity
      if (file.path !== fullPath) {
        fs.copyFileSync(file.path, fullPath);
        console.log(`File copied from disk: ${file.path} -> ${relativePath}`);
        
        // Clean up temporary file after successful copy
        try {
          fs.unlinkSync(file.path);
          console.log(`Cleaned up temporary file: ${file.path}`);
        } catch (cleanupError) {
          console.warn(`Failed to cleanup temporary file: ${file.path}`, cleanupError);
        }
      } else {
        console.log(`File already in correct location: ${relativePath}`);
      }
    } else {
      throw new Error('Invalid file object - no buffer or path found');
    }

    // Verify file was written successfully
    if (!fs.existsSync(fullPath)) {
      throw new Error('File was not written successfully');
    }

    // Get file stats for verification
    const stats = fs.statSync(fullPath);
    const expectedSize = file.size || (file.buffer ? file.buffer.length : 0);
    
    if (expectedSize > 0 && stats.size !== expectedSize) {
      console.warn(`File size mismatch: expected ${expectedSize}, got ${stats.size}`);
    }

    return {
      key: relativePath,
      location: `/api/files/${relativePath}`,
      filename: filename,
      originalName: file.originalname,
      size: stats.size,
      mimetype: file.mimetype
    };
  } catch (error) {
    console.error('Local upload error:', error);
    throw new Error(`Failed to upload file locally: ${error.message}`);
  }
};

/**
 * Legacy function for paid notes (maintains backward compatibility)
 */
const uploadToCloudStorage = async (file) => {
  try {
    const result = await uploadToLocal(file, FILE_CATEGORIES.PAID_NOTES);
    return result.location;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Generate download URL for local file
 * @param {string} fileKey - File path or full URL
 * @param {number} expiresIn - Not used for local files (kept for compatibility)
 * @returns {Promise<string>} - Download URL
 */
const generateDownloadLink = async (fileKey, expiresIn = 3600) => {
  try {
    let filePath;
    
    // Handle different input formats
    if (typeof fileKey === 'string') {
      if (fileKey.startsWith('/api/files/')) {
        // Already a proper API URL
        return fileKey;
      } else if (fileKey.startsWith('http')) {
        // Extract path from full URL
        const url = new URL(fileKey);
        filePath = url.pathname.replace('/api/files/', '');
      } else {
        // Direct file path
        filePath = fileKey;
      }
    } else if (typeof fileKey === 'object' && fileKey.fileUrl) {
      // Handle note object (backward compatibility)
      return generateDownloadLink(fileKey.fileUrl);
    } else {
      throw new Error('Invalid file key format');
    }

    // Ensure file exists
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }

    const downloadUrl = `/api/files/${filePath}`;
    console.log(`Generated download link for: ${filePath}`);
    return downloadUrl;
  } catch (error) {
    console.error('Download link error:', error);
    console.error('File key:', fileKey);
    throw new Error('Failed to generate download link');
  }
};

/**
 * Delete file from local storage
 * @param {string} fileKey - File path or full URL
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromLocal = async (fileKey) => {
  try {
    let filePath;
    
    // Handle different input formats
    if (fileKey.startsWith('/api/files/')) {
      filePath = fileKey.replace('/api/files/', '');
    } else if (fileKey.startsWith('http')) {
      const url = new URL(fileKey);
      filePath = url.pathname.replace('/api/files/', '');
    } else {
      filePath = fileKey;
    }

    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted local file: ${filePath}`);
      return true;
    } else {
      console.warn(`File not found for deletion: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error('Local delete error:', error);
    console.error('File key:', fileKey);
    return false;
  }
};

/**
 * Check if file exists locally
 * @param {string} fileKey - File path
 * @returns {Promise<boolean>} - File existence status
 */
const fileExistsLocally = async (fileKey) => {
  try {
    const fullPath = path.join(process.cwd(), fileKey);
    return fs.existsSync(fullPath);
  } catch (error) {
    console.error('File existence check error:', error);
    return false;
  }
};

/**
 * Get file metadata from local storage
 * @param {string} fileKey - File path
 * @returns {Promise<Object>} - File metadata
 */
const getFileMetadata = async (fileKey) => {
  try {
    const fullPath = path.join(process.cwd(), fileKey);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }

    const stats = fs.statSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    
    // Determine content type based on extension
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

    return {
      size: stats.size,
      lastModified: stats.mtime,
      contentType: contentTypeMap[ext] || 'application/octet-stream',
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    console.error('File metadata error:', error);
    throw new Error('Failed to get file metadata');
  }
};

/**
 * Copy file within local storage
 * @param {string} sourceKey - Source file path
 * @param {string} destinationKey - Destination file path
 * @returns {Promise<Object>} - Copy result
 */
const copyFileLocally = async (sourceKey, destinationKey) => {
  try {
    const sourcePath = path.join(process.cwd(), sourceKey);
    const destPath = path.join(process.cwd(), destinationKey);
    
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied file locally: ${sourceKey} -> ${destinationKey}`);
    
    return {
      source: sourceKey,
      destination: destinationKey,
      success: true
    };
  } catch (error) {
    console.error('Local copy error:', error);
    throw new Error('Failed to copy file locally');
  }
};

/**
 * List files in local directory with prefix
 * @param {string} prefix - Directory prefix
 * @param {number} maxFiles - Maximum number of files to return
 * @returns {Promise<Array>} - List of files
 */
const listFilesLocally = async (prefix = 'uploads/', maxFiles = 1000) => {
  try {
    const fullPath = path.join(process.cwd(), prefix);
    
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const files = [];
    const readDirectory = (dirPath, currentPrefix = '') => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        if (files.length >= maxFiles) break;
        
        const itemPath = path.join(dirPath, item);
        const relativePath = path.join(currentPrefix, item).replace(/\\/g, '/');
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile()) {
          files.push({
            key: path.join(prefix, relativePath).replace(/\\/g, '/'),
            size: stats.size,
            lastModified: stats.mtime,
            isFile: true
          });
        } else if (stats.isDirectory()) {
          readDirectory(itemPath, relativePath);
        }
      }
    };

    readDirectory(fullPath);
    return files;
  } catch (error) {
    console.error('List files error:', error);
    throw new Error('Failed to list files locally');
  }
};

/**
 * Move local file to organized structure
 * @param {string} localFilePath - Current local file path
 * @param {string} targetKey - Target organized path
 * @returns {Promise<Object>} - Move result
 */
const moveLocalFile = async (localFilePath, targetKey) => {
  try {
    const sourcePath = path.join(process.cwd(), localFilePath);
    const targetPath = path.join(process.cwd(), targetKey);
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file not found: ${localFilePath}`);
    }

    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Move file
    fs.renameSync(sourcePath, targetPath);
    console.log(`Moved local file: ${localFilePath} -> ${targetKey}`);
    
    const stats = fs.statSync(targetPath);
    
    return {
      key: targetKey,
      location: `/api/files/${targetKey}`,
      originalPath: localFilePath,
      size: stats.size
    };
  } catch (error) {
    console.error('Move file error:', error);
    throw new Error(`Failed to move file: ${error.message}`);
  }
};

// Initialize directories on module load
initializeDirectories();

module.exports = {
  // Main functions (replacing AWS equivalents)
  uploadToS3: uploadToLocal,
  generateDownloadLink,
  deleteFromS3: deleteFromLocal,
  fileExistsInS3: fileExistsLocally,
  
  // New local-specific functions
  uploadToLocal,
  deleteFromLocal,
  fileExistsLocally,
  getFileMetadata,
  copyFileInS3: copyFileLocally,
  copyFileLocally,
  listFilesInS3: listFilesLocally,
  listFilesLocally,
  migrateLocalFileToS3: moveLocalFile,
  moveLocalFile,
  
  // Legacy functions for backward compatibility
  uploadToCloudStorage,
  
  // Constants
  FILE_CATEGORIES,
  
  // Utility functions
  ensureDirectoryExists,
  initializeDirectories
};
