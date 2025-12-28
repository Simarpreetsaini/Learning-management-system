const ImpDoc = require('../models/impDocModel');
const path = require('path');
const fs = require('fs');
const { uploadToS3, deleteFromS3, FILE_CATEGORIES, generateDownloadLink } = require('../services/fileservice');

// Create new important document
const createDocument = async (req, res) => {
    try {
        const { title, body } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Document file is required' });
        }

        // Upload file to S3
        let uploadResult;
        try {
            uploadResult = await uploadToS3(req.file, FILE_CATEGORIES.DOCUMENTS);
        } catch (uploadError) {
            console.error('Error uploading document to S3:', uploadError);
            return res.status(500).json({
                message: 'Error uploading document to cloud storage',
                error: uploadError.message
            });
        }

        const newDocument = new ImpDoc({
            title,
            body,
            impdocument: uploadResult.key
        });

        await newDocument.save();
        res.status(201).json({ 
            message: 'Important document created successfully', 
            document: newDocument 
        });
    } catch (error) {
        console.error('Error creating important document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all important documents
const getAllDocuments = async (req, res) => {
    try {
        const documents = await ImpDoc.find().sort({ timestamp: -1 });
        res.status(200).json({ documents });
    } catch (error) {
        console.error('Error fetching important documents:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get document by ID
const getDocumentById = async (req, res) => {
    try {
        const document = await ImpDoc.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.status(200).json({ document });
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Search documents
const searchDocuments = async (req, res) => {
    try {
        const { query } = req.query;
        const searchRegex = new RegExp(query, 'i');

        const documents = await ImpDoc.find({
            $or: [
                { title: searchRegex },
                { body: searchRegex }
            ]
        }).sort({ timestamp: -1 });

        res.status(200).json({ documents });
    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Download document
const downloadDocument = async (req, res) => {
    try {
        const document = await ImpDoc.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Check if document file exists
        if (!document.impdocument) {
            return res.status(404).json({ message: 'Document file not found' });
        }

        // Build the file path
        const filePath = path.join(process.cwd(), document.impdocument);
        
        // Check if file exists on disk
        if (!fs.existsSync(filePath)) {
            console.error(`File not found on disk: ${filePath}`);
            return res.status(404).json({ message: 'Document file not found on server' });
        }

        // Get file stats
        const stats = fs.statSync(filePath);
        const fileName = document.title || path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        // Set appropriate content type
        const contentTypeMap = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.zip': 'application/zip',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };
        
        const contentType = contentTypeMap[ext] || 'application/octet-stream';
        
        // Set headers for file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}${ext}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        console.log(`Starting download for document: ${fileName} (${stats.size} bytes)`);
        
        // Create read stream and pipe to response
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error reading file' });
            }
        });
        
        fileStream.on('end', () => {
            console.log(`Successfully downloaded document: ${fileName}`);
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
        console.error('Error downloading document:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
};

// Update document
const updateDocument = async (req, res) => {
    try {
        const { title, body } = req.body;
        
        const updateData = {
            title,
            body
        };

        if (req.file) {
            // Upload new file to S3
            try {
                const uploadResult = await uploadToS3(req.file, FILE_CATEGORIES.DOCUMENTS);
                updateData.impdocument = uploadResult.key;

                // Delete old file from S3 if exists
                const oldDocument = await ImpDoc.findById(req.params.id);
                if (oldDocument && oldDocument.impdocument) {
                    try {
                        await deleteFromS3(oldDocument.impdocument);
                    } catch (deleteError) {
                        console.log('Error deleting old file from S3:', deleteError);
                        // Continue with update even if old file deletion fails
                    }
                }
            } catch (uploadError) {
                console.error('Error uploading new document to S3:', uploadError);
                return res.status(500).json({
                    message: 'Error uploading new document to cloud storage',
                    error: uploadError.message
                });
            }
        }

        const updatedDocument = await ImpDoc.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedDocument) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.status(200).json({ 
            message: 'Document updated successfully', 
            document: updatedDocument 
        });
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete document
const deleteDocument = async (req, res) => {
    try {
        const document = await ImpDoc.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Delete file from S3
        if (document.impdocument) {
            try {
                await deleteFromS3(document.impdocument);
            } catch (deleteError) {
                console.log('Error deleting file from S3:', deleteError);
                // Continue with database deletion even if S3 deletion fails
            }
        }

        await ImpDoc.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get recent documents (last 10)
const getRecentDocuments = async (req, res) => {
    try {
        const documents = await ImpDoc.find()
            .sort({ timestamp: -1 })
            .limit(10);
        res.status(200).json({ documents });
    } catch (error) {
        console.error('Error fetching recent documents:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createDocument,
    getAllDocuments,
    getDocumentById,
    searchDocuments,
    downloadDocument,
    updateDocument,
    deleteDocument,
    getRecentDocuments
};
