const Noticeboard = require('../models/noticeBoardModel');
const User = require('../models/userModel');
const path = require('path');
const fs = require('fs');
const { notifyStudentsOnTeacherUpload } = require('../services/notificationService');
const { uploadToS3, generateDownloadLink, deleteFromS3, FILE_CATEGORIES } = require('../services/fileservice');

// Create a new notice
const createNotice = async (req, res) => {
    try {
        const {
            title,
            body,
            visibility = 'all',
            priority = 'medium',
            category = 'general',
            expiryDate,
            tags
        } = req.body;

        const userId = req.userID;
        
        // Get user details (your middleware already provides req.user)
        const user = req.user;
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Check if user has permission to create notices (only teachers/admin)
        if (user.role === 'Student') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Only teachers and administrators can create notices.' 
            });
        }

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Notice title is required'
            });
        }

        if (!body || !body.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Notice content is required'
            });
        }

        // Validate title length
        if (title.length < 5 || title.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'Notice title must be between 5 and 200 characters'
            });
        }

        // Validate body length
        if (body.length < 10 || body.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Notice content must be between 10 and 5000 characters'
            });
        }

        // Validate category
        const validCategories = ['general', 'academic', 'events', 'event', 'exam', 'holiday', 'maintenance', 'urgent'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
            });
        }

        // Validate priority
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
            });
        }

        // Validate visibility
        const validVisibilities = ['public', 'students', 'all'];
        if (!validVisibilities.includes(visibility)) {
            return res.status(400).json({
                success: false,
                message: `Invalid visibility. Must be one of: ${validVisibilities.join(', ')}`
            });
        }

        // Validate expiry date
        if (expiryDate) {
            const expiry = new Date(expiryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (expiry < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Expiry date cannot be in the past'
                });
            }
        }

        // Handle file upload to S3
        let noticedocument = null;
        let fileUrl = null;
        
        if (req.file) {
            try {
                const uploadResult = await uploadToS3(req.file, FILE_CATEGORIES.NOTICES);
                fileUrl = uploadResult.location;
                noticedocument = uploadResult.key;
                console.log('Notice document uploaded to S3:', noticedocument);
            } catch (uploadError) {
                console.error('Error uploading notice document to S3:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Error uploading file to cloud storage",
                    error: uploadError.message
                });
            }
        }

        // Parse tags if they come as JSON string
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
            }
            
            // Validate tags
            if (parsedTags.length > 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 10 tags allowed'
                });
            }
            
            if (parsedTags.some(tag => tag.length > 20)) {
                return res.status(400).json({
                    success: false,
                    message: 'Each tag must be less than 20 characters'
                });
            }
        }

        const notice = await Noticeboard.create({
            title: title.trim(),
            body: body.trim(),
            noticedocument,
            fileUrl: fileUrl, // Store full S3 URL for easy access
            visibility,
            author: userId,
            authorName: user.fullname,
            priority,
            category,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            tags: parsedTags
        });

        console.log('Notice created successfully:', notice._id);

        // Notify students about the new notice if user is a teacher
        if (user.role === 'Teacher') {
            try {
                await notifyStudentsOnTeacherUpload(userId, 'notice', {
                    _id: notice._id,
                    title: notice.title,
                    visibility: notice.visibility,
                    priority: notice.priority
                });
            } catch (notificationError) {
                console.error('Error creating notifications for notice:', notificationError);
                // Don't fail the main operation if notification fails
            }
        }

        res.status(201).json({
            success: true,
            message: 'Notice created successfully',
            notice
        });
    } catch (error) {
        console.error('Create notice error:', error);
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A notice with similar details already exists'
            });
        }

        res.status(500).json({ 
            success: false,
            message: 'Internal server error while creating notice',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

// Get all notices with filtering
const getAllNotices = async (req, res) => {
    try {
        const {
            visibility,
            category,
            priority,
            status = 'active',
            page = 1,
            limit = 10,
            search,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = { status };

        // Handle visibility based on user role
        const userId = req.userID;
        const user = req.user; // Use user from middleware
        
        // Build visibility conditions
        let visibilityConditions = [];
        
        if (visibility) {
            if (visibility === 'students' || visibility === 'public') {
                visibilityConditions = [
                    { visibility: visibility },
                    { visibility: 'all' }
                ];
            } else {
                visibilityConditions = [{ visibility: visibility }];
            }
        } else {
            // Default visibility logic based on user role
            if (!user) {
                // Unauthenticated users see only public notices (NOT student-only notices)
                visibilityConditions = [
                    { visibility: 'public' },
                    { visibility: 'all' }
                ];
            } else if (user.role === 'Student') {
                // Students see public, student-specific, and all notices
                visibilityConditions = [
                    { visibility: 'students' },
                    { visibility: 'all' }
                ];
            } else {
                // Teachers/Admins see public, student-specific, and all notices
                visibilityConditions = [
                    { visibility: 'public' },
                    { visibility: 'students' },
                    { visibility: 'all' }
                ];
            }
        }

        // Build the final query with all conditions
        const finalQuery = {
            status,
            $and: [
                {
                    $or: visibilityConditions
                },
                {
                    $or: [
                        { expiryDate: { $gt: new Date() } },
                        { expiryDate: null }
                    ]
                }
            ]
        };

        // Add other filters
        if (category) finalQuery.category = category;
        if (priority) finalQuery.priority = priority;

        // Add search functionality to finalQuery
        if (search) {
            finalQuery.$text = { $search: search };
        }

        console.log('Final query for getAllNotices:', JSON.stringify(finalQuery, null, 2));
        console.log('User role:', user?.role);
        console.log('Visibility conditions:', JSON.stringify(visibilityConditions, null, 2));

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        if (sortBy === 'priority') {
            // Custom priority sorting
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            sortOptions.priority = sortOrder === 'desc' ? -1 : 1;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notices = await Noticeboard.find(finalQuery)
            .populate('author', 'fullname username role')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalNotices = await Noticeboard.countDocuments(finalQuery);
        const totalPages = Math.ceil(totalNotices / parseInt(limit));

        res.status(200).json({
            notices,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalNotices,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching notices', 
            error: error.message 
        });
    }
};

// Get active notices (authenticated method)
const getActiveNotices = async (req, res) => {
    try {
        const { visibility } = req.query;
        const user = req.user; // This should now always be available due to auth middleware
        
        // Build visibility conditions based on user role
        let visibilityConditions = [];
        
        if (visibility) {
            // Specific visibility requested
            if (visibility === 'students' || visibility === 'public') {
                visibilityConditions = [
                    { visibility: visibility },
                    { visibility: 'all' }
                ];
            } else {
                visibilityConditions = [{ visibility: visibility }];
            }
        } else {
            // Default visibility logic based on user role
            if (user.role === 'Student') {
                // Students see public, student-specific, and all notices
                visibilityConditions = [
                    { visibility: 'students' },
                    { visibility: 'all' }
                ];
            } else {
                // Teachers/Admins see public, student-specific, and all notices
                visibilityConditions = [
                    { visibility: 'public' },
                    { visibility: 'students' },
                    { visibility: 'all' }
                ];
            }
        }
        
        const query = {
            status: 'active',
            $and: [
                {
                    $or: visibilityConditions
                },
                {
                    $or: [
                        { expiryDate: { $gt: new Date() } },
                        { expiryDate: null }
                    ]
                }
            ]
        };

        console.log('Final query for getActiveNotices:', JSON.stringify(query, null, 2));
        console.log('User role:', user?.role);
        console.log('Visibility conditions:', JSON.stringify(visibilityConditions, null, 2));

        const notices = await Noticeboard.find(query)
            .populate('author', 'fullname username role')
            .sort({ priority: -1, timestamp: -1 })
            .limit(50); // Limit to recent 50 notices

        console.log('Found notices count:', notices.length);
        console.log('Notice visibilities:', notices.map(n => ({ id: n._id, title: n.title, visibility: n.visibility })));

        res.status(200).json({ notices });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching active notices', 
            error: error.message 
        });
    }
};

// Get single notice by ID
const getNoticeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notice = await Noticeboard.findById(id)
            .populate('author', 'fullname username role');

        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        // Increment view count
        notice.viewCount += 1;
        await notice.save();

        res.status(200).json({ notice });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching notice', 
            error: error.message 
        });
    }
};

// Update notice
const updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userID;
        
        const notice = await Noticeboard.findById(id);
        
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        // Check if user is the author or has admin rights
        const user = req.user; // Use user from middleware
        
        console.log('Update permission check:', {
            noticeAuthor: notice.author.toString(),
            userId: userId.toString(),
            userRole: user.role,
            match: notice.author.toString() === userId.toString()
        });
        
        if (notice.author.toString() !== userId.toString() && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. You can only update your own notices.' });
        }

        // Handle file upload for update
        let updateData = { ...req.body, updatedAt: new Date() };
        
        // Parse tags if they come as JSON string
        if (updateData.tags) {
            try {
                updateData.tags = typeof updateData.tags === 'string' ? JSON.parse(updateData.tags) : updateData.tags;
            } catch (e) {
                updateData.tags = typeof updateData.tags === 'string' ? updateData.tags.split(',').map(tag => tag.trim()) : updateData.tags;
            }
        }
        
        // Handle file upload if new file is provided
        if (req.file) {
            try {
                // Upload new file to S3
                const uploadResult = await uploadToS3(req.file, FILE_CATEGORIES.NOTICES);
                updateData.fileUrl = uploadResult.location;
                updateData.noticedocument = uploadResult.key;
                
                // Delete old file from S3 if it exists
                if (notice.noticedocument) {
                    await deleteFromS3(notice.noticedocument);
                    console.log('Deleted old notice document from S3:', notice.noticedocument);
                }
                
                console.log('Updated notice document in S3:', uploadResult.key);
            } catch (uploadError) {
                console.error('Error updating notice document in S3:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Error updating file in cloud storage",
                    error: uploadError.message
                });
            }
        }

        const updatedNotice = await Noticeboard.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('author', 'fullname username role');

        res.status(200).json({
            message: 'Notice updated successfully',
            notice: updatedNotice
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating notice', 
            error: error.message 
        });
    }
};

// Delete notice
const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userID;
        
        const notice = await Noticeboard.findById(id);
        
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        // Check if user is the author or has admin rights
        const user = req.user; // Use user from middleware
        
        console.log('Delete permission check:', {
            noticeAuthor: notice.author.toString(),
            userId: userId.toString(),
            userRole: user.role,
            match: notice.author.toString() === userId.toString()
        });
        
        if (notice.author.toString() !== userId.toString() && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. You can only delete your own notices.' });
        }

        await Noticeboard.findByIdAndDelete(id);

        res.status(200).json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting notice', 
            error: error.message 
        });
    }
};

// Get notices by author
const getNoticesByAuthor = async (req, res) => {
    try {
        const { authorId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const user = req.user; // Get current user from middleware

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query based on user role and visibility
        let query = { author: authorId };
        
        // Teachers/Admins can view all notice types including student-specific notices

        const notices = await Noticeboard.find(query)
            .populate('author', 'fullname username role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalNotices = await Noticeboard.countDocuments(query);

        res.status(200).json({
            notices,
            totalNotices,
            totalPages: Math.ceil(totalNotices / parseInt(limit)),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching notices by author', 
            error: error.message 
        });
    }
};

// Get notices by category
const getNoticesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notices = await Noticeboard.find({ 
            category, 
            status: 'active',
            $or: [
                { expiryDate: { $gt: new Date() } },
                { expiryDate: null }
            ]
        })
            .populate('author', 'fullname username role')
            .sort({ priority: -1, timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalNotices = await Noticeboard.countDocuments({ 
            category, 
            status: 'active' 
        });

        res.status(200).json({
            notices,
            totalNotices,
            totalPages: Math.ceil(totalNotices / parseInt(limit)),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching notices by category', 
            error: error.message 
        });
    }
};

// Update notice status
const updateNoticeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.userID;

        if (!['active', 'inactive', 'expired'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const notice = await Noticeboard.findById(id);
        
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        // Check permissions
        const user = req.user; // Use user from middleware
        
        if (notice.author.toString() !== userId.toString() && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        notice.status = status;
        notice.updatedAt = new Date();
        await notice.save();

        res.status(200).json({
            message: 'Notice status updated successfully',
            notice
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating notice status', 
            error: error.message 
        });
    }
};

// Search notices
const searchNotices = async (req, res) => {
    try {
        const { q, category, priority, visibility } = req.query;
        
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        let query = {
            status: 'active',
            $or: [
                { expiryDate: { $gt: new Date() } },
                { expiryDate: null }
            ],
            $and: [
                {
                    $or: [
                        { title: { $regex: q, $options: 'i' } },
                        { body: { $regex: q, $options: 'i' } },
                        { tags: { $in: [new RegExp(q, 'i')] } }
                    ]
                }
            ]
        };

        if (category) query.category = category;
        if (priority) query.priority = priority;
        if (visibility) query.visibility = visibility;

        const notices = await Noticeboard.find(query)
            .populate('author', 'fullname username role')
            .sort({ priority: -1, timestamp: -1 })
            .limit(20);

        res.status(200).json({ notices });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error searching notices', 
            error: error.message 
        });
    }
};

// Get dashboard statistics
const getNoticeStats = async (req, res) => {
    try {
        const userId = req.userID;
        const user = req.user; // Use user from middleware

        let stats = {};

        if (user.role !== 'Student') {
            // Statistics for teachers/admin
            stats.totalNotices = await Noticeboard.countDocuments({ author: userId });
            stats.activeNotices = await Noticeboard.countDocuments({ 
                author: userId, 
                status: 'active' 
            });
            stats.expiredNotices = await Noticeboard.countDocuments({ 
                author: userId, 
                status: 'expired' 
            });
            stats.totalViews = await Noticeboard.aggregate([
                { $match: { author: userId } },
                { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
            ]);
            stats.totalViews = stats.totalViews[0]?.totalViews || 0;

            // Category breakdown
            stats.categoryBreakdown = await Noticeboard.aggregate([
                { $match: { author: userId } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]);
        } else {
            // Statistics for students (system-wide)
            stats.totalActiveNotices = await Noticeboard.countDocuments({ 
                status: 'active',
                $or: [
                    { visibility: 'all' },
                    { visibility: 'public' },
                    { visibility: 'students' }
                ]
            });
        }

        res.status(200).json({ stats });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching notice statistics', 
            error: error.message 
        });
    }
};

// Download notice document
const downloadNoticeDocument = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Download request for notice ID:', id);
        
        const notice = await Noticeboard.findById(id);
        
        if (!notice) {
            console.log('Notice not found for ID:', id);
            return res.status(404).json({ 
                success: false,
                message: 'Notice not found' 
            });
        }

        console.log('Notice found, document:', notice.noticedocument);

        if (!notice.noticedocument && !notice.fileUrl) {
            console.log('No document attached to notice:', id);
            return res.status(404).json({ 
                success: false,
                message: 'No document attached to this notice' 
            });
        }

        // Determine the file path
        let filePath = notice.noticedocument;
        
        // Handle different file path formats
        if (!filePath) {
            // Fallback to fileUrl if noticedocument is not available
            if (notice.fileUrl && notice.fileUrl.startsWith('/api/files/')) {
                filePath = notice.fileUrl.replace('/api/files/', '');
            } else {
                return res.status(404).json({ 
                    success: false,
                    message: 'Document path not found' 
                });
            }
        }

        // Ensure the file path is properly formatted
        if (!filePath.startsWith('uploads/')) {
            filePath = `uploads/notices/${filePath}`;
        }

        const fullPath = path.join(process.cwd(), filePath);
        
        // Validate file exists and is accessible
        if (!fs.existsSync(fullPath)) {
            console.error(`Notice document does not exist: ${fullPath}`);
            return res.status(404).json({
                success: false,
                message: 'Document file not found on server'
            });
        }

        // Get file stats
        const stats = fs.statSync(fullPath);
        const fileName = path.basename(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        
        // Set appropriate headers for binary file download
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
        
        // Create a clean filename for download while preserving the original extension
        const originalName = path.basename(fileName, ext);
        const cleanTitle = notice.title.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50); // Limit title length
        const downloadFileName = `${cleanTitle}_${originalName}${ext}`;
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Accept-Ranges', 'bytes');

        // Stream the file directly with binary integrity
        const fileStream = fs.createReadStream(fullPath, {
            highWaterMark: 64 * 1024, // 64KB chunks
            encoding: null // Ensure binary mode
        });

        fileStream.on('error', (error) => {
            console.error('Notice document streaming error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error serving document'
                });
            }
        });

        fileStream.on('open', () => {
            console.log(`Started streaming notice document: ${fileName} (${stats.size} bytes) for notice: ${notice.title}`);
        });

        fileStream.on('end', () => {
            console.log(`Successfully streamed notice document: ${fileName} (${stats.size} bytes) for notice: ${notice.title}`);
        });

        // Handle client disconnect
        req.on('close', () => {
            if (!fileStream.destroyed) {
                fileStream.destroy();
                console.log(`Client disconnected during notice document streaming: ${fileName}`);
            }
        });

        fileStream.pipe(res);

    } catch (error) {
        console.error('Download document error:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false,
                message: 'Error downloading document', 
                error: error.message 
            });
        }
    }
};

module.exports = {
    createNotice,
    getAllNotices,
    getActiveNotices,
    getNoticeById,
    updateNotice,
    deleteNotice,
    getNoticesByAuthor,
    getNoticesByCategory,
    updateNoticeStatus,
    searchNotices,
    getNoticeStats,
    downloadNoticeDocument
};
