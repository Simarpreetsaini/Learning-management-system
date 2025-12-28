const Semester = require('../models/semesterModel');

// Create semester
const createSemester = async (req, res) => {
    try {
        const { name, number } = req.body;

        // Check if active semester already exists with same name or number
        const existingSemester = await Semester.findOne({ 
            $or: [{ name }, { number }],
            isActive: true
        });

        if (existingSemester) {
            return res.status(400).json({
                success: false,
                message: 'Semester with this name or number already exists'
            });
        }

        const semester = new Semester({
            name,
            number
        });

        await semester.save();

        res.status(201).json({
            success: true,
            message: 'Semester created successfully',
            semester
        });
    } catch (error) {
        console.error('Error creating semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating semester',
            error: error.message
        });
    }
};

// Get all semesters
const getAllSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find({ isActive: true })
            .sort({ number: 1 });

        res.status(200).json({
            success: true,
            semesters
        });
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching semesters',
            error: error.message
        });
    }
};

// Get semester by ID
const getSemesterById = async (req, res) => {
    try {
        const { id } = req.params;
        const semester = await Semester.findById(id);

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        res.status(200).json({
            success: true,
            semester
        });
    } catch (error) {
        console.error('Error fetching semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching semester',
            error: error.message
        });
    }
};

// Update semester
const updateSemester = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, number, isActive } = req.body;

        const semester = await Semester.findByIdAndUpdate(
            id,
            { name, number, isActive },
            { new: true, runValidators: true }
        );

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Semester updated successfully',
            semester
        });
    } catch (error) {
        console.error('Error updating semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating semester',
            error: error.message
        });
    }
};

// Delete semester
const deleteSemester = async (req, res) => {
    try {
        const { id } = req.params;

        const semester = await Semester.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Semester deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting semester:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting semester',
            error: error.message
        });
    }
};

module.exports = {
    createSemester,
    getAllSemesters,
    getSemesterById,
    updateSemester,
    deleteSemester
};
