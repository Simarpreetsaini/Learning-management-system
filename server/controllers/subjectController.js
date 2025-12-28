const Subject = require('../models/subjectModel');
const Department = require('../models/departmentModel');
const Semester = require('../models/semesterModel');

// Create subject
const createSubject = async (req, res) => {
    try {
        const { name, code, department, semester, credits, description } = req.body;

        // Check if subject already exists (only if code is provided)
        if (code && code.trim() !== '') {
            const existingSubject = await Subject.findOne({ code: code.toUpperCase() });

            if (existingSubject) {
                return res.status(400).json({
                    success: false,
                    message: 'Subject with this code already exists'
                });
            }
        }

        // Verify department exists
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        // Verify semester exists
        const semesterExists = await Semester.findById(semester);
        if (!semesterExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid semester selected'
            });
        }

        const subject = new Subject({
            name,
            code: code && code.trim() !== '' ? code.toUpperCase() : undefined,
            department,
            semester,
            credits,
            description
        });

        await subject.save();

        const populatedSubject = await Subject.findById(subject._id)
            .populate('department', 'name code')
            .populate('semester', 'name number');

        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            subject: populatedSubject
        });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating subject',
            error: error.message
        });
    }
};

// Get all subjects
const getAllSubjects = async (req, res) => {
    try {
        const { department, semester } = req.query;
        let query = { isActive: true };

        if (department) query.department = department;
        if (semester) query.semester = semester;

        const subjects = await Subject.find(query)
            .populate('department', 'name code')
            .populate('semester', 'name number')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            subjects
        });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subjects',
            error: error.message
        });
    }
};

// Get subjects by department and semester
const getSubjectsByDeptAndSem = async (req, res) => {
    try {
        const { departmentId, semesterId } = req.params;

        const subjects = await Subject.find({
            department: departmentId,
            semester: semesterId,
            isActive: true
        })
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .sort({ name: 1 });

        res.status(200).json({
            success: true,
            subjects
        });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subjects',
            error: error.message
        });
    }
};

// Get subject by ID
const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findById(id)
            .populate('department', 'name code')
            .populate('semester', 'name number');

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.status(200).json({
            success: true,
            subject
        });
    } catch (error) {
        console.error('Error fetching subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subject',
            error: error.message
        });
    }
};

// Update subject
const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, department, semester, credits, description, isActive } = req.body;

        const subject = await Subject.findByIdAndUpdate(
            id,
            { 
                name, 
                code: code && code.trim() !== '' ? code.toUpperCase() : undefined, 
                department, 
                semester, 
                credits, 
                description, 
                isActive 
            },
            { new: true, runValidators: true }
        ).populate('department', 'name code')
         .populate('semester', 'name number');

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subject updated successfully',
            subject
        });
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating subject',
            error: error.message
        });
    }
};

// Delete subject
const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const subject = await Subject.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subject deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting subject',
            error: error.message
        });
    }
};

module.exports = {
    createSubject,
    getAllSubjects,
    getSubjectsByDeptAndSem,
    getSubjectById,
    updateSubject,
    deleteSubject
};
