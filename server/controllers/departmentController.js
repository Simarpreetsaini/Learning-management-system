const Department = require('../models/departmentModel');

// Create department
const createDepartment = async (req, res) => {
    try {
        const { name, code, description } = req.body;

        // Check if department already exists
        const existingDepartment = await Department.findOne({ 
            $or: [{ name }, { code }] 
        });

        if (existingDepartment) {
            return res.status(400).json({
                success: false,
                message: 'Department with this name or code already exists'
            });
        }

        const department = new Department({
            name,
            code: code.toUpperCase(),
            description
        });

        await department.save();

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            department
        });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating department',
            error: error.message
        });
    }
};

// Get all departments
const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ isActive: true })
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            departments
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching departments',
            error: error.message
        });
    }
};

// Get department by ID
const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.status(200).json({
            success: true,
            department
        });
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching department',
            error: error.message
        });
    }
};

// Update department
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, description, isActive } = req.body;

        const department = await Department.findByIdAndUpdate(
            id,
            { 
                name, 
                code: code?.toUpperCase(), 
                description, 
                isActive 
            },
            { new: true, runValidators: true }
        );

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Department updated successfully',
            department
        });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating department',
            error: error.message
        });
    }
};

// Delete department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Department deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting department',
            error: error.message
        });
    }
};

module.exports = {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
};
