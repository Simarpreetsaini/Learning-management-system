const Pyq = require('../models/pyqModel');
const path = require('path');
const fs = require('fs');
const { uploadToS3, generateDownloadLink, deleteFromS3, FILE_CATEGORIES } = require('../services/fileservice');

// Create new PYQ
const createPyq = async (req, res) => {
    try {
        const { department, semester, subject, pyqfilename } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'PYQ file is required' });
        }

        // Upload file locally
        let fileUrl = null;
        let s3Key = null;
        
        try {
            const uploadResult = await uploadToS3(req.file, FILE_CATEGORIES.PYQS);
            fileUrl = uploadResult.location;
            s3Key = uploadResult.key;
            console.log('PYQ file uploaded locally:', s3Key);
        } catch (uploadError) {
            console.error('Error uploading PYQ file locally:', uploadError);
            return res.status(500).json({
                message: "Error uploading file to local storage",
                error: uploadError.message
            });
        }

        const newPyq = new Pyq({
            department,
            semester,
            subject,
            pyqfilename: pyqfilename || req.file.originalname,
            pyqfile: s3Key, // Store local file path instead of filename
            fileUrl: fileUrl // Store local file URL for easy access
        });

        await newPyq.save();
        res.status(201).json({ 
            message: 'PYQ uploaded successfully', 
            pyq: newPyq 
        });
    } catch (error) {
        console.error('Error creating PYQ:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all PYQs
const getAllPyqs = async (req, res) => {
    try {
        const pyqs = await Pyq.find().sort({ _id: -1 });
        res.status(200).json({ pyqs });
    } catch (error) {
        console.error('Error fetching PYQs:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get PYQ by ID
const getPyqById = async (req, res) => {
    try {
        const pyq = await Pyq.findById(req.params.id);
        if (!pyq) {
            return res.status(404).json({ message: 'PYQ not found' });
        }
        res.status(200).json({ pyq });
    } catch (error) {
        console.error('Error fetching PYQ:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get PYQs by department
const getPyqsByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const pyqs = await Pyq.find({ department }).sort({ _id: -1 });
        res.status(200).json({ pyqs });
    } catch (error) {
        console.error('Error fetching PYQs by department:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get PYQs by semester
const getPyqsBySemester = async (req, res) => {
    try {
        const { semester } = req.params;
        const pyqs = await Pyq.find({ semester }).sort({ _id: -1 });
        res.status(200).json({ pyqs });
    } catch (error) {
        console.error('Error fetching PYQs by semester:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get PYQs by subject
const getPyqsBySubject = async (req, res) => {
    try {
        const { subject } = req.params;
        const pyqs = await Pyq.find({ subject }).sort({ _id: -1 });
        res.status(200).json({ pyqs });
    } catch (error) {
        console.error('Error fetching PYQs by subject:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Download PYQ file
const downloadPyq = async (req, res) => {
    try {
        const pyq = await Pyq.findById(req.params.id);
        if (!pyq) {
            return res.status(404).json({ message: 'PYQ not found' });
        }

        if (!pyq.pyqfile && !pyq.fileUrl) {
            return res.status(404).json({ message: 'No file attached to this PYQ' });
        }

        // Get the file path
        let filePath;
        if (pyq.pyqfile) {
            // Handle relative path from database
            filePath = pyq.pyqfile.startsWith('uploads/') ? pyq.pyqfile : `uploads/pyqs/${pyq.pyqfile}`;
        } else if (pyq.fileUrl) {
            // Extract path from URL
            filePath = pyq.fileUrl.replace('/api/files/', '');
        }

        const fullPath = path.join(process.cwd(), filePath);
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            console.error('File not found:', fullPath);
            return res.status(404).json({ message: 'File not found on server' });
        }

        // Get file stats for headers
        const stats = fs.statSync(fullPath);
        const fileExtension = path.extname(fullPath).toLowerCase();
        
        // Set appropriate content type based on file extension
        const contentTypeMap = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.rtf': 'application/rtf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.tiff': 'image/tiff',
            '.zip': 'application/zip',
            '.rar': 'application/x-rar-compressed',
            '.7z': 'application/x-7z-compressed'
        };
        
        const contentType = contentTypeMap[fileExtension] || 'application/octet-stream';
        
        // Properly encode filename for Content-Disposition header
        const encodedFilename = encodeURIComponent(pyq.pyqfilename || 'download' + fileExtension);
        const fallbackFilename = pyq.pyqfilename || 'download' + fileExtension;
        
        // Set headers for file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Add CORS headers for cross-origin requests
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
        
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
        console.error('Error downloading PYQ:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
};

// Update PYQ
const updatePyq = async (req, res) => {
    try {
        const { department, semester, subject, pyqfilename } = req.body;
        
        // Find existing PYQ first
        const existingPyq = await Pyq.findById(req.params.id);
        if (!existingPyq) {
            return res.status(404).json({ message: 'PYQ not found' });
        }

        const updateData = {
            department,
            semester,
            subject,
            pyqfilename
        };

        // Handle file upload if new file is provided
        if (req.file) {
            try {
                // Upload new file locally
                const uploadResult = await uploadToS3(req.file, FILE_CATEGORIES.PYQS);
                updateData.fileUrl = uploadResult.location;
                updateData.pyqfile = uploadResult.key;
                
                // Delete old file locally if it exists
                if (existingPyq.pyqfile) {
                    await deleteFromS3(existingPyq.pyqfile);
                    console.log('Deleted old PYQ file locally:', existingPyq.pyqfile);
                }
                
                console.log('Updated PYQ file locally:', uploadResult.key);
            } catch (uploadError) {
                console.error('Error updating PYQ file locally:', uploadError);
                return res.status(500).json({
                    message: "Error updating file in local storage",
                    error: uploadError.message
                });
            }
        }

        const updatedPyq = await Pyq.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.status(200).json({ 
            message: 'PYQ updated successfully', 
            pyq: updatedPyq 
        });
    } catch (error) {
        console.error('Error updating PYQ:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete PYQ
const deletePyq = async (req, res) => {
    try {
        const pyq = await Pyq.findById(req.params.id);
        if (!pyq) {
            return res.status(404).json({ message: 'PYQ not found' });
        }

        // Delete file locally if it exists
        if (pyq.pyqfile) {
            try {
                await deleteFromS3(pyq.pyqfile);
                console.log('Deleted PYQ file locally:', pyq.pyqfile);
            } catch (deleteError) {
                console.warn('Failed to delete file locally:', deleteError);
                // Continue with database deletion even if local deletion fails
            }
        }

        await Pyq.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'PYQ deleted successfully' });
    } catch (error) {
        console.error('Error deleting PYQ:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createPyq,
    getAllPyqs,
    getPyqById,
    getPyqsByDepartment,
    getPyqsBySemester,
    getPyqsBySubject,
    downloadPyq,
    updatePyq,
    deletePyq
};
