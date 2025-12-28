const ELib = require('../models/eLibModel');
const path = require('path');
const fs = require('fs');

// Create new E-Library item
const createELibItem = async (req, res) => {
    try {
        const { title, description, category } = req.body;
        let fileurl = req.body.fileurl || '';

        const newItem = new ELib({
            title,
            description,
            category,
            fileurl
        });

        if (req.file) {
            newItem.impdocument = req.file.filename;
        } else if (!fileurl) {
            return res.status(400).json({ 
                message: 'Either a file upload or external URL is required' 
            });
        }

        await newItem.save();
        res.status(201).json({ 
            message: 'E-Library item created successfully', 
            item: newItem 
        });
    } catch (error) {
        console.error('Error creating E-Library item:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all E-Library items
const getAllItems = async (req, res) => {
    try {
        const items = await ELib.find().sort({ timestamp: -1 });
        res.status(200).json({ items });
    } catch (error) {
        console.error('Error fetching E-Library items:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get E-Library item by ID
const getItemById = async (req, res) => {
    try {
        const item = await ELib.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json({ item });
    } catch (error) {
        console.error('Error fetching E-Library item:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get items by category
const getItemsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const items = await ELib.find({ category }).sort({ timestamp: -1 });
        res.status(200).json({ items });
    } catch (error) {
        console.error('Error fetching items by category:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Search items
const searchItems = async (req, res) => {
    try {
        const { query } = req.query;
        const searchRegex = new RegExp(query, 'i');

        const items = await ELib.find({
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ]
        }).sort({ timestamp: -1 });

        res.status(200).json({ items });
    } catch (error) {
        console.error('Error searching E-Library items:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Download E-Library document
const downloadDocument = async (req, res) => {
    try {
        const item = await ELib.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (!item.impdocument) {
            return res.status(400).json({ message: 'No document available for download' });
        }

        const filePath = path.join(__dirname, '../uploads/e-library', item.impdocument);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.download(filePath, `${item.title}${path.extname(item.impdocument)}`);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update E-Library item
const updateItem = async (req, res) => {
    try {
        const { title, description, category, fileurl } = req.body;
        
        const updateData = {
            title,
            description,
            category,
            fileurl: fileurl || ''
        };

        if (req.file) {
            updateData.impdocument = req.file.filename;

            // Delete old file if exists
            const oldItem = await ELib.findById(req.params.id);
            if (oldItem && oldItem.impdocument) {
                const oldFilePath = path.join(__dirname, '../uploads/e-library', oldItem.impdocument);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
        }

        const updatedItem = await ELib.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ 
            message: 'E-Library item updated successfully', 
            item: updatedItem 
        });
    } catch (error) {
        console.error('Error updating E-Library item:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete E-Library item
const deleteItem = async (req, res) => {
    try {
        const item = await ELib.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Delete file if exists
        if (item.impdocument) {
            const filePath = path.join(__dirname, '../uploads/e-library', item.impdocument);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await ELib.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'E-Library item deleted successfully' });
    } catch (error) {
        console.error('Error deleting E-Library item:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createELibItem,
    getAllItems,
    getItemById,
    getItemsByCategory,
    searchItems,
    downloadDocument,
    updateItem,
    deleteItem
};
