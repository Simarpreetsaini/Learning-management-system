const bulkUserService = require('../services/bulkUserService');
const path = require('path');

/**
 * Upload and parse Excel file for bulk user registration
 */
const uploadAndParseExcel = async (req, res) => {
    let filePath = null;
    
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No Excel file uploaded. Please select a valid Excel file (.xlsx or .xls)'
            });
        }

        filePath = req.file.path;
        console.log(`Processing Excel file: ${req.file.originalname} (${req.file.size} bytes)`);

        // Validate file extension
        const allowedExtensions = ['.xlsx', '.xls'];
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            await bulkUserService.cleanupFile(filePath);
            return res.status(400).json({
                success: false,
                message: `Invalid file type. Only Excel files (${allowedExtensions.join(', ')}) are allowed.`
            });
        }

        try {
            // Parse the Excel file with enhanced error handling
            console.log('Starting Excel file parsing...');
            const parseResult = await bulkUserService.parseExcelFile(filePath);
            console.log(`Parsing completed: ${parseResult.validRows} valid, ${parseResult.errorRows} errors`);

            // Check for existing users in database
            let existingUsersResult = { conflicts: [], validUsers: [] };
            if (parseResult.users.length > 0) {
                console.log('Checking for existing users in database...');
                existingUsersResult = await bulkUserService.checkExistingUsers(parseResult.users);
                console.log(`Database check completed: ${existingUsersResult.conflicts.length} conflicts, ${existingUsersResult.validUsers.length} ready to import`);
            }

            // Cleanup the uploaded file
            await bulkUserService.cleanupFile(filePath);

            // Enhanced response with detailed information
            const response = {
                success: true,
                data: {
                    parseResult,
                    existingUsersResult,
                    summary: {
                        totalRows: parseResult.totalRows,
                        validRows: parseResult.validRows,
                        errorRows: parseResult.errorRows,
                        conflictRows: existingUsersResult.conflicts.length,
                        readyToImport: existingUsersResult.validUsers.length
                    },
                    fileInfo: parseResult.fileInfo
                },
                message: `File processed successfully. ${existingUsersResult.validUsers.length} users ready for import.`
            };

            // Add warnings if there are issues
            const warnings = [];
            if (parseResult.errorRows > 0) {
                warnings.push(`${parseResult.errorRows} rows have validation errors`);
            }
            if (existingUsersResult.conflicts.length > 0) {
                warnings.push(`${existingUsersResult.conflicts.length} users already exist in database`);
            }
            if (warnings.length > 0) {
                response.warnings = warnings;
            }

            res.json(response);

        } catch (parseError) {
            // Cleanup file on error
            await bulkUserService.cleanupFile(filePath);
            
            // Enhanced error handling with specific error types
            console.error('Excel parsing error:', parseError);
            
            let statusCode = 400;
            let errorMessage = parseError.message;
            
            if (parseError.message.includes('file format') || parseError.message.includes('corrupted')) {
                statusCode = 400;
                errorMessage = 'Invalid or corrupted Excel file. Please ensure the file is a valid Excel format.';
            } else if (parseError.message.includes('Missing required columns')) {
                statusCode = 400;
                errorMessage = parseError.message;
            } else if (parseError.message.includes('File size') || parseError.message.includes('Too many rows')) {
                statusCode = 413;
                errorMessage = parseError.message;
            } else if (parseError.message.includes('Permission denied') || parseError.message.includes('EACCES')) {
                statusCode = 500;
                errorMessage = 'Server permission error. Please try again or contact administrator.';
            }
            
            return res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? parseError.stack : undefined
            });
        }

    } catch (error) {
        // Cleanup file on any error
        if (filePath) {
            await bulkUserService.cleanupFile(filePath);
        }
        
        console.error('Upload and parse error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process Excel file',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Bulk create users from validated data
 */
const bulkCreateUsers = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const { users } = req.body;

        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid users provided for creation'
            });
        }

        // Validate each user object
        const validationErrors = [];
        users.forEach((user, index) => {
            if (!user.username || !user.fullname) {
                validationErrors.push(`User at index ${index}: username and fullname are required`);
            }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: validationErrors
            });
        }

        // Double-check for existing users before creation
        const existingUsersResult = await bulkUserService.checkExistingUsers(users);
        
        if (existingUsersResult.conflicts.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some users already exist in the database',
                conflicts: existingUsersResult.conflicts
            });
        }

        // Create users
        const createResult = await bulkUserService.bulkCreateUsers(existingUsersResult.validUsers);

        res.json({
            success: true,
            data: createResult,
            message: `Successfully created ${createResult.created.length} users. ${createResult.failed.length} failed.`
        });

    } catch (error) {
        console.error('Bulk create users error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create users'
        });
    }
};

/**
 * Download sample Excel template
 */
const downloadTemplate = async (req, res) => {
    try {
        console.log('Download template request received');
        console.log('User:', req.user ? { id: req.user._id, role: req.user.role } : 'No user');

        // Check if user is admin
        if (!req.user) {
            console.log('No user found in request');
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (req.user.role !== 'Admin') {
            console.log('User role check failed:', req.user.role);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        console.log('Generating template...');
        const templateBuffer = await bulkUserService.generateSampleTemplate();
        console.log('Template generated successfully, size:', templateBuffer.length);

        // Set headers for Excel file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="student_registration_template.xlsx"');
        res.setHeader('Content-Length', templateBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');

        console.log('Sending template file...');
        res.send(templateBuffer);

    } catch (error) {
        console.error('Download template error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate template',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Get bulk import statistics (for admin dashboard)
 */
const getBulkImportStats = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const User = require('../models/userModel');

        // Get statistics
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'Student' });
        const totalTeachers = await User.countDocuments({ role: 'Teacher' });
        const totalAdmins = await User.countDocuments({ role: 'Admin' });

        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRegistrations = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        res.json({
            success: true,
            data: {
                totalUsers,
                totalStudents,
                totalTeachers,
                totalAdmins,
                recentRegistrations
            }
        });

    } catch (error) {
        console.error('Get bulk import stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get statistics'
        });
    }
};

/**
 * Validate Excel file before processing
 */
const validateExcelFile = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No Excel file uploaded'
            });
        }

        const filePath = req.file.path;

        try {
            // Just parse and validate, don't check database
            const parseResult = await bulkUserService.parseExcelFile(filePath);

            // Cleanup the uploaded file
            await bulkUserService.cleanupFile(filePath);

            res.json({
                success: true,
                data: {
                    isValid: parseResult.errors.length === 0,
                    summary: {
                        totalRows: parseResult.totalRows,
                        validRows: parseResult.validRows,
                        errorRows: parseResult.errorRows
                    },
                    errors: parseResult.errors
                }
            });

        } catch (parseError) {
            // Cleanup file on error
            await bulkUserService.cleanupFile(filePath);
            throw parseError;
        }

    } catch (error) {
        console.error('Validate Excel file error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to validate Excel file'
        });
    }
};

module.exports = {
    uploadAndParseExcel,
    bulkCreateUsers,
    downloadTemplate,
    getBulkImportStats,
    validateExcelFile
};
