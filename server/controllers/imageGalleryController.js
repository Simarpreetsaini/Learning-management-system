const ImageGallery = require('../models/imageGalleryModel');
const fs = require('fs');
const path = require('path');
const { uploadToS3, deleteFromS3, FILE_CATEGORIES, generateDownloadLink } = require('../services/fileservice');

// Create a new image entry
const createImage = async (req, res) => {
    try {
        const { title, description, category, imageurl } = req.body;
        const userId = req.userID;
        const user = req.user;

        // Validate required fields
        if (!title || !category) {
            return res.status(400).json({ 
                message: 'Title and category are required' 
            });
        }

        // Check if user has permission to upload images (only teachers/admin)
        if (user.role === 'Student') {
            return res.status(403).json({ 
                message: 'Access denied. Only teachers can upload images.' 
            });
        }

        // Validate category
        const validCategories = ['event', 'campus', 'cultural', 'sports', 'academic', 'other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                message: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
            });
        }

        let imageData = {
            title,
            description: description || '',
            category,
            timestamp: new Date()
        };

        // Handle file upload or URL
        if (req.file) {
            try {
                // Upload file locally
                const uploadResult = await uploadToS3(req.file, FILE_CATEGORIES.IMAGES);
                imageData.imageFile = uploadResult.key;
                imageData.imageurl = uploadResult.location;
            } catch (uploadError) {
                console.error('Error uploading image locally:', uploadError);
                return res.status(500).json({
                    message: 'Error uploading image to local storage',
                    error: uploadError.message
                });
            }
        } else if (imageurl) {
            // URL was provided
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlPattern.test(imageurl)) {
                return res.status(400).json({ 
                    message: 'Please provide a valid image URL' 
                });
            }
            imageData.imageurl = imageurl;
        } else {
            return res.status(400).json({ 
                message: 'Either upload an image file or provide an image URL' 
            });
        }

        const image = await ImageGallery.create(imageData);

        res.status(201).json({
            message: 'Image uploaded successfully',
            image
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error uploading image', 
            error: error.message 
        });
    }
};

// Get all images
const getAllImages = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 12, 
            category, 
            search,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const images = await ImageGallery.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalImages = await ImageGallery.countDocuments(query);
        const totalPages = Math.ceil(totalImages / parseInt(limit));

        res.status(200).json({
            images,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalImages,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching images', 
            error: error.message 
        });
    }
};

// Get single image by ID
const getImageById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const image = await ImageGallery.findById(id);

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.status(200).json({ image });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching image', 
            error: error.message 
        });
    }
};

// Update image
const updateImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category } = req.body;
        const user = req.user;

        // Check if user has permission to update images (only teachers/admin)
        if (user.role === 'Student') {
            return res.status(403).json({ 
                message: 'Access denied. Only teachers can update images.' 
            });
        }

        const image = await ImageGallery.findById(id);
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Validate category if provided
        if (category) {
            const validCategories = ['event', 'campus', 'cultural', 'sports', 'academic', 'other'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({ 
                    message: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
                });
            }
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category) updateData.category = category;

        const updatedImage = await ImageGallery.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Image updated successfully',
            image: updatedImage
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating image', 
            error: error.message 
        });
    }
};

// Delete image
const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Check if user has permission to delete images (only teachers/admin)
        if (user.role === 'Student') {
            return res.status(403).json({ 
                message: 'Access denied. Only teachers can delete images.' 
            });
        }
        
        const image = await ImageGallery.findById(id);
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Delete the file locally if it exists
        if (image.imageFile) {
            try {
                await deleteFromS3(image.imageFile);
            } catch (fileError) {
                console.log('Error deleting file locally:', fileError);
                // Continue with database deletion even if local deletion fails
            }
        }

        await ImageGallery.findByIdAndDelete(id);

        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting image', 
            error: error.message 
        });
    }
};

// Get images by category
const getImagesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 12 } = req.query;

        // Validate category
        const validCategories = ['event', 'campus', 'cultural', 'sports', 'academic', 'other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                message: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const images = await ImageGallery.find({ category })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalImages = await ImageGallery.countDocuments({ category });
        const totalPages = Math.ceil(totalImages / parseInt(limit));

        res.status(200).json({
            images,
            category,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalImages,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching images by category', 
            error: error.message 
        });
    }
};

// Search images
const searchImages = async (req, res) => {
    try {
        const { q, category } = req.query;
        
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        let query = {
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        };

        if (category && category !== 'all') {
            query.category = category;
        }

        const images = await ImageGallery.find(query)
            .sort({ timestamp: -1 })
            .limit(20);

        res.status(200).json({ images });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error searching images', 
            error: error.message 
        });
    }
};

// Get image gallery statistics
const getImageStats = async (req, res) => {
    try {
        const totalImages = await ImageGallery.countDocuments();
        
        // Category breakdown
        const categoryStats = await ImageGallery.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Recent uploads (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentUploads = await ImageGallery.countDocuments({
            timestamp: { $gte: thirtyDaysAgo }
        });

        // Monthly upload trend (last 6 months)
        const monthlyTrend = await ImageGallery.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$timestamp' },
                        month: { $month: '$timestamp' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.status(200).json({
            stats: {
                totalImages,
                recentUploads,
                categoryBreakdown: categoryStats,
                monthlyTrend
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching image gallery statistics', 
            error: error.message 
        });
    }
};

// Serve image file (handles both S3 and local files)
const serveImage = async (req, res) => {
    try {
        const { id } = req.params;
        
        const image = await ImageGallery.findById(id);
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // If image has local URL, generate download URL
        if (image.imageurl) {
            try {
                const downloadUrl = await generateDownloadLink(image.imageurl, 3600); // 1 hour expiration
                return res.json({ 
                    success: true,
                    imageUrl: downloadUrl,
                    type: 'local'
                });
            } catch (localError) {
                console.error('Error generating local download URL:', localError);
                // Fall through to local file handling
            }
        }

        // If image has local file reference, try to serve from local uploads
        if (image.imageFile) {
            const localPath = path.join(__dirname, '../uploads', image.imageFile);
            
            if (fs.existsSync(localPath)) {
                return res.json({
                    success: true,
                    imageUrl: `/uploads/${image.imageFile}`,
                    type: 'local'
                });
            }
        }

        // If neither URL nor local file is available
        return res.status(404).json({ 
            message: 'Image file not found',
            error: 'Neither URL nor local file is accessible'
        });

    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ 
            message: 'Error serving image', 
            error: error.message 
        });
    }
};

module.exports = {
    createImage,
    getAllImages,
    getImageById,
    updateImage,
    deleteImage,
    getImagesByCategory,
    searchImages,
    getImageStats,
    serveImage
};
