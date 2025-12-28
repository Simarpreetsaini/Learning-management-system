const HotLink = require('../models/hotLinksModel');

// Create a new hot link
const createHotLink = async (req, res) => {
    try {
        const { linktext, linkaddress } = req.body;
        const userId = req.userID;
        const user = req.user;

        // Validate required fields
        if (!linktext || !linkaddress) {
            return res.status(400).json({ 
                message: 'Link text and link address are required' 
            });
        }

        // Check if user has permission to create hot links (only teachers/admin)
        if (user.role === 'Student') {
            return res.status(403).json({ 
                message: 'Access denied. Only teachers can create hot links.' 
            });
        }

        // Validate URL format
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlPattern.test(linkaddress)) {
            return res.status(400).json({ 
                message: 'Please provide a valid URL' 
            });
        }

        // Ensure URL has protocol
        let formattedUrl = linkaddress;
        if (!linkaddress.startsWith('http://') && !linkaddress.startsWith('https://')) {
            formattedUrl = 'https://' + linkaddress;
        }

        const hotLink = await HotLink.create({
            linktext,
            linkaddress: formattedUrl
        });

        res.status(201).json({
            message: 'Hot link created successfully',
            link: hotLink
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating hot link', 
            error: error.message 
        });
    }
};

// Get all hot links
const getAllHotLinks = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;

        let query = {};

        // Search functionality
        if (search) {
            query.$or = [
                { linktext: { $regex: search, $options: 'i' } },
                { linkaddress: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const links = await HotLink.find(query)
            .sort({ _id: -1 }) // Sort by newest first
            .skip(skip)
            .limit(parseInt(limit));

        const totalLinks = await HotLink.countDocuments(query);
        const totalPages = Math.ceil(totalLinks / parseInt(limit));

        res.status(200).json({
            links,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalLinks,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching hot links', 
            error: error.message 
        });
    }
};

// Get single hot link by ID
const getHotLinkById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const hotLink = await HotLink.findById(id);

        if (!hotLink) {
            return res.status(404).json({ message: 'Hot link not found' });
        }

        res.status(200).json({ link: hotLink });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching hot link', 
            error: error.message 
        });
    }
};

// Update hot link
const updateHotLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { linktext, linkaddress } = req.body;
        const user = req.user;

        // Check if user has permission to update hot links (only teachers/admin)
        if (user.role === 'Student') {
            return res.status(403).json({ 
                message: 'Access denied. Only teachers can update hot links.' 
            });
        }

        const hotLink = await HotLink.findById(id);
        
        if (!hotLink) {
            return res.status(404).json({ message: 'Hot link not found' });
        }

        // Validate URL format if linkaddress is being updated
        if (linkaddress) {
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlPattern.test(linkaddress)) {
                return res.status(400).json({ 
                    message: 'Please provide a valid URL' 
                });
            }

            // Ensure URL has protocol
            if (!linkaddress.startsWith('http://') && !linkaddress.startsWith('https://')) {
                req.body.linkaddress = 'https://' + linkaddress;
            }
        }

        const updatedHotLink = await HotLink.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Hot link updated successfully',
            link: updatedHotLink
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating hot link', 
            error: error.message 
        });
    }
};

// Delete hot link
const deleteHotLink = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Check if user has permission to delete hot links (only teachers/admin)
        if (user.role === 'Student') {
            return res.status(403).json({ 
                message: 'Access denied. Only teachers can delete hot links.' 
            });
        }
        
        const hotLink = await HotLink.findById(id);
        
        if (!hotLink) {
            return res.status(404).json({ message: 'Hot link not found' });
        }

        await HotLink.findByIdAndDelete(id);

        res.status(200).json({ message: 'Hot link deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting hot link', 
            error: error.message 
        });
    }
};

// Search hot links
const searchHotLinks = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const links = await HotLink.find({
            $or: [
                { linktext: { $regex: q, $options: 'i' } },
                { linkaddress: { $regex: q, $options: 'i' } }
            ]
        }).sort({ _id: -1 }).limit(20);

        res.status(200).json({ links });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error searching hot links', 
            error: error.message 
        });
    }
};

// Get hot links statistics
const getHotLinksStats = async (req, res) => {
    try {
        const totalLinks = await HotLink.countDocuments();
        
        // Get domain statistics
        const domainStats = await HotLink.aggregate([
            {
                $addFields: {
                    domain: {
                        $regexFind: {
                            input: "$linkaddress",
                            regex: /https?:\/\/(?:www\.)?([^\/]+)/
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$domain.captures",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.status(200).json({
            stats: {
                totalLinks,
                domainBreakdown: domainStats
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching hot links statistics', 
            error: error.message 
        });
    }
};

module.exports = {
    createHotLink,
    getAllHotLinks,
    getHotLinkById,
    updateHotLink,
    deleteHotLink,
    searchHotLinks,
    getHotLinksStats
};
