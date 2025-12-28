import axiosInstance from './axios';

/**
 * API service for bulk user operations
 */
export const bulkUserApi = {
    /**
     * Download Excel template for bulk user registration
     */
    downloadTemplate: async () => {
        try {
            console.log('Requesting template download...');
            
            const response = await axiosInstance.get('/bulk-users/template', {
                responseType: 'blob',
                timeout: 30000 // 30 second timeout
            });
            
            console.log('Template response received:', {
                status: response.status,
                contentType: response.headers['content-type'],
                size: response.data.size
            });
            
            // Validate response
            if (!response.data || response.data.size === 0) {
                throw new Error('Empty response received from server');
            }
            
            // Create blob URL for download
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            
            console.log('Created blob:', { size: blob.size, type: blob.type });
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'student_registration_template.xlsx';
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            console.log('Template download initiated successfully');
            return { success: true };
            
        } catch (error) {
            console.error('Download template error:', error);
            
            // Handle different error types
            if (error.response) {
                // Server responded with error status
                console.error('Server error response:', {
                    status: error.response.status,
                    data: error.response.data
                });
                
                if (error.response.status === 401) {
                    throw new Error('Authentication required. Please log in again.');
                } else if (error.response.status === 403) {
                    throw new Error('Access denied. Admin privileges required.');
                } else if (error.response.data && error.response.data.message) {
                    throw new Error(error.response.data.message);
                }
            } else if (error.request) {
                // Network error
                console.error('Network error:', error.request);
                throw new Error('Network error. Please check your connection and try again.');
            }
            
            throw new Error(error.message || 'Failed to download template');
        }
    },

    /**
     * Get bulk import statistics
     */
    getStats: async () => {
        try {
            const response = await axiosInstance.get('/bulk-users/stats');
            return response.data;
        } catch (error) {
            console.error('Get stats error:', error);
            throw error;
        }
    },

    /**
     * Validate Excel file format and data
     */
    validateFile: async (file) => {
        try {
            const formData = new FormData();
            formData.append('excelFile', file);

            const response = await axiosInstance.post('/bulk-users/validate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Validate file error:', error);
            throw error;
        }
    },

    /**
     * Upload and parse Excel file for bulk user registration
     */
    uploadAndParse: async (file) => {
        try {
            const formData = new FormData();
            formData.append('excelFile', file);

            const response = await axiosInstance.post('/bulk-users/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Upload and parse error:', error);
            throw error;
        }
    },

    /**
     * Bulk create users from validated data
     */
    bulkCreateUsers: async (users) => {
        try {
            const response = await axiosInstance.post('/bulk-users/create', {
                users
            });
            
            return response.data;
        } catch (error) {
            console.error('Bulk create users error:', error);
            throw error;
        }
    }
};

/**
 * Helper functions for file validation
 */
export const fileValidation = {
    /**
     * Validate if file is Excel format with enhanced checking
     */
    isExcelFile: (file) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/octet-stream' // Sometimes Excel files are detected as this
        ];
        
        const allowedExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        // Check both MIME type and file extension for better validation
        return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
    },

    /**
     * Validate file size (max 10MB)
     */
    isValidSize: (file, maxSizeMB = 10) => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    },

    /**
     * Get file size in human readable format
     */
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Enhanced file validation with better error messages
     */
    validateFile: (file) => {
        const errors = [];

        if (!file) {
            errors.push('No file selected');
            return { isValid: false, errors };
        }

        // Validate file name
        if (!file.name || file.name.trim() === '') {
            errors.push('Invalid file name');
        }

        // Check for potentially dangerous file names
        if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
            errors.push('Invalid file name. File name contains illegal characters');
        }

        // Validate file type
        if (!fileValidation.isExcelFile(file)) {
            errors.push('Invalid file type. Please select an Excel file (.xlsx or .xls)');
        }

        // Validate file size
        if (!fileValidation.isValidSize(file, 10)) {
            errors.push('File size too large. Maximum allowed size is 10MB');
        }

        // Check if file is empty
        if (file.size === 0) {
            errors.push('File is empty. Please select a valid Excel file with data');
        }

        return {
            isValid: errors.length === 0,
            errors,
            fileInfo: {
                name: file.name,
                size: fileValidation.formatFileSize(file.size),
                type: file.type,
                lastModified: file.lastModified ? new Date(file.lastModified).toLocaleString() : 'Unknown'
            }
        };
    },

    /**
     * Validate file extension specifically
     */
    hasValidExtension: (filename) => {
        const allowedExtensions = ['.xlsx', '.xls'];
        const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return allowedExtensions.includes(fileExtension);
    },

    /**
     * Get file extension
     */
    getFileExtension: (filename) => {
        return filename.toLowerCase().substring(filename.lastIndexOf('.'));
    }
};

export default bulkUserApi;
