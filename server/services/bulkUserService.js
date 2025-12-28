const ExcelJS = require('exceljs');
const User = require('../models/userModel');
const path = require('path');
const fs = require('fs');

class BulkUserService {
    constructor() {
        this.requiredColumns = ['username', 'fullname'];
        this.optionalColumns = ['password'];
        this.defaultPassword = 'student123'; // Default password for bulk imported users
        this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
        this.maxRows = 1000; // Maximum rows to process
    }

    /**
     * Enhanced cell value extraction with better type handling
     * @param {Object} cell - ExcelJS cell object
     * @returns {string} - Cleaned cell value
     */
    extractCellValue(cell) {
        try {
            let cellValue = cell.value;

            // Handle null, undefined, or empty values
            if (cellValue === null || cellValue === undefined) {
                return '';
            }

            // Handle different cell value types
            switch (typeof cellValue) {
                case 'string':
                    return cellValue.trim();
                
                case 'number':
                    // Handle numeric values (including dates stored as numbers)
                    if (cell.type === ExcelJS.ValueType.Date) {
                        return cellValue.toISOString().split('T')[0]; // Return date as YYYY-MM-DD
                    }
                    return cellValue.toString().trim();
                
                case 'boolean':
                    return cellValue.toString().trim();
                
                case 'object':
                    // Handle rich text objects
                    if (cellValue.richText && Array.isArray(cellValue.richText)) {
                        return cellValue.richText.map(rt => rt.text || '').join('').trim();
                    }
                    
                    // Handle hyperlink objects
                    if (cellValue.text !== undefined) {
                        return cellValue.text.toString().trim();
                    }
                    
                    // Handle formula results
                    if (cellValue.result !== undefined) {
                        return this.extractCellValue({ value: cellValue.result, type: cell.type });
                    }
                    
                    // Handle date objects
                    if (cellValue instanceof Date) {
                        return cellValue.toISOString().split('T')[0];
                    }
                    
                    // Fallback for other objects
                    return cellValue.toString().trim();
                
                default:
                    return cellValue.toString().trim();
            }
        } catch (error) {
            console.warn(`Error extracting cell value:`, error);
            return '';
        }
    }

    /**
     * Enhanced header normalization with better matching
     * @param {string} header - Raw header value
     * @returns {string} - Normalized header
     */
    normalizeHeader(header) {
        if (!header) return '';
        
        return header
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
            .replace(/[^\w\s]/g, '')        // Remove special characters except spaces
            .replace(/\s/g, '_');           // Replace spaces with underscores
    }

    /**
     * Find column index with flexible matching
     * @param {Array} headers - Array of normalized headers
     * @param {string} targetColumn - Target column name
     * @returns {number} - Column index or -1 if not found
     */
    findColumnIndex(headers, targetColumn) {
        const normalizedTarget = this.normalizeHeader(targetColumn);
        
        // Direct match
        let index = headers.findIndex(header => header && header === normalizedTarget);
        if (index !== -1) return index;
        
        // Partial match (for variations like "user_name" vs "username")
        index = headers.findIndex(header => 
            header && normalizedTarget && (
                header.includes(normalizedTarget) || normalizedTarget.includes(header)
            )
        );
        if (index !== -1) return index;
        
        // Alternative column names
        const alternatives = {
            'username': ['user_name', 'user', 'login', 'userid', 'user_id'],
            'fullname': ['full_name', 'name', 'student_name', 'display_name'],
            'password': ['pass', 'pwd', 'user_password']
        };
        
        if (alternatives[targetColumn]) {
            for (const alt of alternatives[targetColumn]) {
                const normalizedAlt = this.normalizeHeader(alt);
                index = headers.findIndex(header => header && header === normalizedAlt);
                if (index !== -1) return index;
            }
        }
        
        return -1;
    }

    /**
     * Enhanced empty row detection
     * @param {Object} userData - User data object
     * @param {Array} requiredFields - Required field names
     * @returns {boolean} - True if row has meaningful data
     */
    hasValidData(userData, requiredFields) {
        // Check if any required field has data
        const hasRequiredData = requiredFields.some(field => 
            userData[field] && userData[field].toString().trim() !== ''
        );
        
        // Check if any field has non-whitespace data
        const hasAnyData = Object.values(userData).some(value => 
            value && value.toString().trim() !== ''
        );
        
        return hasRequiredData || hasAnyData;
    }

    /**
     * Enhanced data validation with better error messages
     * @param {Object} userData - User data to validate
     * @param {Set} duplicateUsernames - Set of existing usernames
     * @param {Set} duplicateFullnames - Set of existing fullnames
     * @returns {Array} - Array of validation errors
     */
    validateUserData(userData, duplicateUsernames, duplicateFullnames) {
        const errors = [];

        // Validate required fields
        this.requiredColumns.forEach(col => {
            if (!userData[col] || userData[col].toString().trim() === '') {
                errors.push(`${col.charAt(0).toUpperCase() + col.slice(1)} is required`);
            }
        });

        // Validate username
        if (userData.username) {
            const username = userData.username.toString().trim();
            
            if (username.length < 3) {
                errors.push('Username must be at least 3 characters long');
            } else if (username.length > 50) {
                errors.push('Username must be less than 50 characters long');
            }
            
            // Fixed regex: Allow letters, numbers, underscores, dots, and hyphens
            if (!/^[a-zA-Z0-9_.@-]+$/.test(username)) {
                errors.push('Username can only contain letters, numbers, underscores, dots, @ symbol, and hyphens');
            }
            
            // Allow usernames starting with numbers (removed this restriction as it's too strict)
            // if (/^[0-9]/.test(username)) {
            //     errors.push('Username cannot start with a number');
            // }
            
            // Check for duplicates within the file
            const usernameLower = username.toLowerCase();
            if (duplicateUsernames.has(usernameLower)) {
                errors.push('Duplicate username found in file');
            } else {
                duplicateUsernames.add(usernameLower);
            }
        }

        // Validate fullname
        if (userData.fullname) {
            const fullname = userData.fullname.toString().trim();
            
            if (fullname.length < 2) {
                errors.push('Full name must be at least 2 characters long');
            } else if (fullname.length > 100) {
                errors.push('Full name must be less than 100 characters long');
            }
            
            // Fixed regex: Allow letters, spaces, dots, hyphens, and apostrophes for names like O'Connor
            if (!/^[a-zA-Z\s.'-]+$/.test(fullname)) {
                errors.push('Full name can only contain letters, spaces, dots, hyphens, and apostrophes');
            }
            
            // Check for duplicates within the file
            const fullnameLower = fullname.toLowerCase();
            // if (duplicateFullnames.has(fullnameLower)) {
            //     errors.push('Duplicate full name found in file');
            // } else {
            //     duplicateFullnames.add(fullnameLower);
            // }
        }

        // Validate password if provided
        if (userData.password) {
            const password = userData.password.toString().trim();
            
            if (password.length < 3) {
                errors.push('Password must be at least 3 characters long');
            } else if (password.length > 128) {
                errors.push('Password must be less than 128 characters long');
            }
        }

        return errors;
    }

    /**
     * Parse Excel file and extract user data with enhanced error handling
     * @param {string} filePath - Path to the uploaded Excel file
     * @returns {Object} - Parsed data with users array and validation errors
     */
    async parseExcelFile(filePath) {
        let workbook = null;
        
        try {
            // Check file size
            const stats = fs.statSync(filePath);
            if (stats.size > this.maxFileSize) {
                throw new Error(`File size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds maximum allowed size (${this.maxFileSize / 1024 / 1024}MB)`);
            }

            // Initialize workbook with error handling
            workbook = new ExcelJS.Workbook();
            
            try {
                await workbook.xlsx.readFile(filePath);
            } catch (readError) {
                // Try reading as CSV if Excel parsing fails
                if (readError.message.includes('Corrupt') || readError.message.includes('format')) {
                    throw new Error('Invalid Excel file format. Please ensure the file is a valid .xlsx or .xls file');
                }
                throw readError;
            }
            
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                throw new Error('No worksheet found in the Excel file. Please ensure the file contains at least one worksheet');
            }

            // Check if worksheet has data
            if (!worksheet.rowCount || worksheet.rowCount < 2) {
                throw new Error('Excel file appears to be empty or contains only headers. Please add data rows');
            }

            if (worksheet.rowCount > this.maxRows + 1) { // +1 for header
                throw new Error(`Too many rows (${worksheet.rowCount - 1}). Maximum allowed is ${this.maxRows} data rows`);
            }

            const users = [];
            const errors = [];
            const duplicateUsernames = new Set();
            const duplicateFullnames = new Set();

            // Enhanced header processing
            const headerRow = worksheet.getRow(1);
            const headers = [];
            const headerMap = new Map();

            headerRow.eachCell((cell, colNumber) => {
                const headerValue = this.extractCellValue(cell);
                const normalizedHeader = this.normalizeHeader(headerValue);
                headers[colNumber] = normalizedHeader;
                
                if (normalizedHeader) {
                    headerMap.set(colNumber, {
                        original: headerValue,
                        normalized: normalizedHeader
                    });
                }
            });

            // Find column indexes with enhanced matching
            const columnIndexes = {};
            const allColumns = [...this.requiredColumns, ...this.optionalColumns];
            
            for (const col of allColumns) {
                const index = this.findColumnIndex(headers, col);
                if (index !== -1) {
                    columnIndexes[col] = index;
                }
            }

            // Validate required columns exist
            const missingColumns = this.requiredColumns.filter(col => 
                columnIndexes[col] === undefined
            );
            
            if (missingColumns.length > 0) {
                const availableHeaders = Array.from(headerMap.values())
                    .map(h => h.original)
                    .filter(h => h)
                    .join(', ');
                    
                throw new Error(
                    `Missing required columns: ${missingColumns.join(', ')}. ` +
                    `Available headers: ${availableHeaders || 'None found'}`
                );
            }

            // Process data rows with enhanced error handling
            let processedRows = 0;
            
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header row

                try {
                    const userData = {};
                    let hasAnyData = false;

            // Extract data from each column
            Object.keys(columnIndexes).forEach(column => {
                const colIndex = columnIndexes[column];
                const cell = row.getCell(colIndex);  // Remove the +1 since colIndex is already 1-based
                const cellValue = this.extractCellValue(cell);

                if (cellValue !== '') {
                    userData[column] = cellValue;
                    hasAnyData = true;
                }
            });

                    // Enhanced empty row detection
                    if (!this.hasValidData(userData, this.requiredColumns)) {
                        return; // Skip truly empty rows
                    }

                    // Set default password if not provided
                    if (!userData.password || userData.password.trim() === '') {
                        userData.password = this.defaultPassword;
                    }

                    // Set default role
                    userData.role = 'Student';

                    // Enhanced validation
                    const rowErrors = this.validateUserData(userData, duplicateUsernames, duplicateFullnames);

                    if (rowErrors.length > 0) {
                        errors.push({
                            row: rowNumber,
                            data: userData,
                            errors: rowErrors
                        });
                    } else {
                        users.push({
                            row: rowNumber,
                            ...userData
                        });
                    }

                    processedRows++;
                    
                } catch (rowError) {
                    console.error(`Error processing row ${rowNumber}:`, rowError);
                    errors.push({
                        row: rowNumber,
                        data: {},
                        errors: [`Error processing row: ${rowError.message}`]
                    });
                }
            });

            console.log(`Processed ${processedRows} rows, found ${users.length} valid users, ${errors.length} errors`);

            return {
                users,
                errors,
                totalRows: processedRows,
                validRows: users.length,
                errorRows: errors.length,
                fileInfo: {
                    name: path.basename(filePath),
                    size: stats.size,
                    worksheetName: worksheet.name,
                    totalRowsInFile: worksheet.rowCount - 1
                }
            };

        } catch (error) {
            console.error('Excel parsing error:', error);
            
            // Enhanced error messages
            if (error.message.includes('ENOENT')) {
                throw new Error('Excel file not found. Please try uploading the file again');
            } else if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
                throw new Error('Too many files open. Please try again in a moment');
            } else if (error.message.includes('EACCES')) {
                throw new Error('Permission denied. Please check file permissions');
            } else if (error.message.includes('Corrupt')) {
                throw new Error('Excel file appears to be corrupted. Please try with a different file');
            }
            
            throw new Error(`Failed to parse Excel file: ${error.message}`);
        } finally {
            // Cleanup workbook resources
            if (workbook) {
                try {
                    workbook = null;
                } catch (cleanupError) {
                    console.warn('Error cleaning up workbook:', cleanupError);
                }
            }
        }
    }

    /**
     * Check for existing users in database
     * @param {Array} users - Array of user data to check
     * @returns {Object} - Object with existing users and conflicts
     */
    async checkExistingUsers(users) {
        try {
            const usernames = users.map(user => user.username.toLowerCase());
            const fullnames = users.map(user => user.fullname.toLowerCase());

            // Check for existing usernames
            const existingUsernames = await User.find({
                username: { $in: usernames }
            }).select('username');

            // Check for existing fullnames
            const existingFullnames = await User.find({
                fullname: { $in: fullnames }
            }).select('fullname');

            const conflicts = [];
            const existingUsernameSet = new Set(existingUsernames.map(u => u.username.toLowerCase()));
            const existingFullnameSet = new Set(existingFullnames.map(u => u.fullname.toLowerCase()));

            users.forEach(user => {
                const userConflicts = [];
                
                if (existingUsernameSet.has(user.username.toLowerCase())) {
                    userConflicts.push('Username already exists');
                }
                
                if (existingFullnameSet.has(user.fullname.toLowerCase())) {
                //     userConflicts.push('Full name already exists');
                 }

                if (userConflicts.length > 0) {
                    conflicts.push({
                        row: user.row,
                        data: user,
                        conflicts: userConflicts
                    });
                }
            });

            return {
                conflicts,
                validUsers: users.filter(user => 
                    !existingUsernameSet.has(user.username.toLowerCase())
                    // && !existingFullnameSet.has(user.fullname.toLowerCase())
                )
            };

        } catch (error) {
            throw new Error(`Failed to check existing users: ${error.message}`);
        }
    }

    /**
     * Bulk create users in database
     * @param {Array} users - Array of validated user data
     * @returns {Object} - Result with created users and any errors
     */
    async bulkCreateUsers(users) {
        const results = {
            created: [],
            failed: [],
            totalProcessed: users.length
        };

        try {
            // Process users in batches to avoid overwhelming the database
            const batchSize = 50;
            for (let i = 0; i < users.length; i += batchSize) {
                const batch = users.slice(i, i + batchSize);
                
                for (const userData of batch) {
                    try {
                        // Remove row number before creating user
                        const { row, ...userDataForCreation } = userData;
                        
                        const user = await User.create(userDataForCreation);
                        results.created.push({
                            row: userData.row,
                            userId: user._id,
                            username: user.username,
                            fullname: user.fullname
                        });
                    } catch (error) {
                        results.failed.push({
                            row: userData.row,
                            data: userData,
                            error: error.message
                        });
                    }
                }
            }

            return results;

        } catch (error) {
            throw new Error(`Failed to create users: ${error.message}`);
        }
    }

    /**
     * Generate sample Excel template
     * @returns {Buffer} - Excel file buffer
     */
    async generateSampleTemplate() {
        try {
            console.log('Starting template generation...');
            
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Student Registration Template');

            console.log('Workbook and worksheet created');

            // Add headers
            const headers = ['username', 'fullname', 'password'];
            const headerRow = worksheet.addRow(headers);
            console.log('Headers added:', headers);

            // Add sample data
            const sampleData = [
                ['john_doe', 'John Doe', 'password123'],
                ['jane_smith', 'Jane Smith', 'mypassword'],
                ['student001', 'Alice Johnson', ''], // Empty password will use default
                ['bob_wilson', 'Bob Wilson', 'securepass']
            ];

            sampleData.forEach((row, index) => {
                worksheet.addRow(row);
                console.log(`Sample row ${index + 1} added:`, row);
            });

            // Style the header row
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            console.log('Header row styled');

            // Auto-fit columns
            worksheet.columns.forEach((column, index) => {
                column.width = 20;
            });
            console.log('Column widths set');

            // Add instructions
            worksheet.addRow([]);
            worksheet.addRow(['Instructions:']);
            worksheet.addRow(['1. username: Must be unique, 3+ characters, letters/numbers/underscores only']);
            worksheet.addRow(['2. fullname: Can be same for multiple students, 2+ characters']);
            worksheet.addRow(['3. password: Optional, will use "student123" if empty']);
            worksheet.addRow(['4. All students will have role "Student" by default']);
            worksheet.addRow(['5. Students will fill academic details after first login']);
            console.log('Instructions added');

            console.log('Generating Excel buffer...');
            const buffer = await workbook.xlsx.writeBuffer();
            console.log('Excel buffer generated successfully, size:', buffer.length);

            if (!buffer || buffer.length === 0) {
                throw new Error('Generated buffer is empty');
            }

            return buffer;

        } catch (error) {
            console.error('Template generation error:', error);
            console.error('Error stack:', error.stack);
            throw new Error(`Failed to generate template: ${error.message}`);
        }
    }

    /**
     * Clean up uploaded file
     * @param {string} filePath - Path to the file to delete
     */
    async cleanupFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Failed to cleanup file:', error);
        }
    }
}

module.exports = new BulkUserService();
