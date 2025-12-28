import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { bulkUserApi, fileValidation } from '../api/bulkUserApi';
import { toast } from '../utils/toast';
import { 
    Upload, 
    Download, 
    FileText, 
    Users, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Eye,
    EyeOff,
    UserPlus,
    BarChart3,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Smartphone,
    Monitor
} from 'lucide-react';
import { Card, Button, PageHeader } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminBulkUserImport = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [parseResult, setParseResult] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [currentStep, setCurrentStep] = useState('upload'); // upload, preview, confirm, result
    const [importResult, setImportResult] = useState(null);
    const [showPasswords, setShowPasswords] = useState(false);

    // Check if user is admin
    useEffect(() => {
        if (user && user.role !== 'Admin') {
            toast.error('Access denied. Admin privileges required.');
            return;
        }
        loadStats();
    }, [user]);

    const loadStats = async () => {
        try {
            const response = await bulkUserApi.getStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            setLoading(true);
            await bulkUserApi.downloadTemplate();
            toast.success('Template downloaded successfully');
        } catch (error) {
            toast.error('Failed to download template');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const validation = fileValidation.validateFile(file);
        if (!validation.isValid) {
            toast.error(validation.errors.join(', '));
            return;
        }

        setSelectedFile(file);
        setParseResult(null);
        setSelectedUsers(new Set());
        setCurrentStep('upload');
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        try {
            setLoading(true);
            const response = await bulkUserApi.uploadAndParse(selectedFile);
            
            if (response.success) {
                setParseResult(response.data);
                
                // Auto-select all valid users
                const validUserIds = new Set();
                response.data.existingUsersResult.validUsers.forEach(user => {
                    validUserIds.add(user.row);
                });
                setSelectedUsers(validUserIds);
                
                setCurrentStep('preview');
                toast.success('File parsed successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to parse file');
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelection = (userRow, isSelected) => {
        const newSelection = new Set(selectedUsers);
        if (isSelected) {
            newSelection.add(userRow);
        } else {
            newSelection.delete(userRow);
        }
        setSelectedUsers(newSelection);
    };

    const handleSelectAll = () => {
        if (!parseResult) return;
        
        const allValidUsers = new Set();
        parseResult.existingUsersResult.validUsers.forEach(user => {
            allValidUsers.add(user.row);
        });
        setSelectedUsers(allValidUsers);
    };

    const handleDeselectAll = () => {
        setSelectedUsers(new Set());
    };

    const handleBulkImport = async () => {
        if (selectedUsers.size === 0) {
            toast.error('Please select at least one user to import');
            return;
        }

        const usersToImport = parseResult.existingUsersResult.validUsers.filter(user => 
            selectedUsers.has(user.row)
        );

        try {
            setLoading(true);
            setCurrentStep('confirm');
            
            const response = await bulkUserApi.bulkCreateUsers(usersToImport);
            
            if (response.success) {
                setImportResult(response.data);
                setCurrentStep('result');
                toast.success(response.message);
                loadStats(); // Refresh stats
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to import users');
            setCurrentStep('preview');
        } finally {
            setLoading(false);
        }
    };

    const resetImport = () => {
        setSelectedFile(null);
        setParseResult(null);
        setSelectedUsers(new Set());
        setCurrentStep('upload');
        setImportResult(null);
    };

    if (!user || user.role !== 'Admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-8 text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                    <p className="text-gray-600">Admin privileges required to access this page.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <PageHeader
                title="Bulk User Import"
                subtitle="Import multiple student accounts from Excel files"
                icon={<UserPlus className="w-6 h-6 sm:w-8 sm:h-8" />}
            />

            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {/* Statistics Cards - Mobile Optimized */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                        <Card className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2 sm:mb-0" />
                                <div className="sm:ml-3 lg:ml-4">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                                </div>
                            </div>
                        </Card>
                        
                        <Card className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-2 sm:mb-0" />
                                <div className="sm:ml-3 lg:ml-4">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Students</p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
                                </div>
                            </div>
                        </Card>
                        
                        <Card className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mb-2 sm:mb-0" />
                                <div className="sm:ml-3 lg:ml-4">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Teachers</p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTeachers}</p>
                                </div>
                            </div>
                        </Card>
                        
                        <Card className="p-3 sm:p-4 lg:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-2 sm:mb-0" />
                                <div className="sm:ml-3 lg:ml-4">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Recent (30d)</p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.recentRegistrations}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Main Content - Mobile Optimized Layout */}
                <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
                    {/* Template and Instructions - Mobile First */}
                    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                        <Card className="p-4 sm:p-6">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                                <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                Download Template
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                                Download the Excel template with the required format for bulk user import.
                            </p>
                            <Button
                                onClick={handleDownloadTemplate}
                                disabled={loading}
                                className="w-full min-h-[44px] touch-manipulation"
                                variant="outline"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                <span className="text-sm sm:text-base">Download Template</span>
                            </Button>
                        </Card>

                        <Card className="p-4 sm:p-6">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                Instructions
                            </h3>
                            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2 mt-0.5 flex-shrink-0">1</span>
                                    <span>Download the Excel template</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2 mt-0.5 flex-shrink-0">2</span>
                                    <span>Fill in student information (username, fullname, password optional)</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2 mt-0.5 flex-shrink-0">3</span>
                                    <span>Upload the completed file</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2 mt-0.5 flex-shrink-0">4</span>
                                    <span>Review and select users to import</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2 mt-0.5 flex-shrink-0">5</span>
                                    <span>Students will complete academic details after login</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Upload and Preview - Mobile Optimized */}
                    <div className="lg:col-span-2">
                        {currentStep === 'upload' && (
                            <Card className="p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    Upload Excel File
                                </h3>
                                
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center touch-manipulation">
                                    <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                    <div className="mb-3 sm:mb-4">
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <span className="text-blue-600 hover:text-blue-500 font-medium text-sm sm:text-base">
                                                Click to upload
                                            </span>
                                            <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base"> or drag and drop</span>
                                        </label>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500">Excel files only (.xlsx, .xls) up to 5MB</p>
                                </div>

                                {selectedFile && (
                                    <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex items-center min-w-0">
                                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-blue-900 dark:text-blue-100 text-sm sm:text-base truncate">
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300">
                                                        {fileValidation.formatFileSize(selectedFile.size)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleFileUpload}
                                                disabled={loading}
                                                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                                            >
                                                {loading ? (
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4 mr-2" />
                                                )}
                                                <span className="text-sm sm:text-base">Parse File</span>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}

                        {currentStep === 'preview' && parseResult && (
                            <Card className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                                    <h3 className="text-base sm:text-lg font-semibold flex items-center">
                                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        Preview Import Data
                                    </h3>
                                    <Button onClick={resetImport} variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px] touch-manipulation">
                                        Upload New File
                                    </Button>
                                </div>

                                {/* Summary - Mobile Optimized */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg text-center">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{parseResult.summary.totalRows}</p>
                                        <p className="text-xs sm:text-sm text-blue-600">Total Rows</p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg text-center">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{parseResult.summary.readyToImport}</p>
                                        <p className="text-xs sm:text-sm text-green-600">Ready to Import</p>
                                    </div>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-lg text-center">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{parseResult.summary.conflictRows}</p>
                                        <p className="text-xs sm:text-sm text-yellow-600">Conflicts</p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-lg text-center">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{parseResult.summary.errorRows}</p>
                                        <p className="text-xs sm:text-sm text-red-600">Errors</p>
                                    </div>
                                </div>

                                {/* Selection Controls - Mobile Optimized */}
                                {parseResult.existingUsersResult.validUsers.length > 0 && (
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button onClick={handleSelectAll} size="sm" variant="outline" className="min-h-[44px] touch-manipulation">
                                                <span className="text-xs sm:text-sm">Select All ({parseResult.existingUsersResult.validUsers.length})</span>
                                            </Button>
                                            <Button onClick={handleDeselectAll} size="sm" variant="outline" className="min-h-[44px] touch-manipulation">
                                                <span className="text-xs sm:text-sm">Deselect All</span>
                                            </Button>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-right">
                                            {selectedUsers.size} of {parseResult.existingUsersResult.validUsers.length} selected
                                        </p>
                                    </div>
                                )}

                                {/* Valid Users - Mobile Cards on Small Screens, Table on Large */}
                                {parseResult.existingUsersResult.validUsers.length > 0 && (
                                    <div className="mb-4 sm:mb-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                            <h4 className="font-medium text-green-600 flex items-center text-sm sm:text-base">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Valid Users ({parseResult.existingUsersResult.validUsers.length})
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                                className="flex items-center px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 min-h-[44px] touch-manipulation"
                                                aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                                            >
                                                {showPasswords ? (
                                                    <>
                                                        <EyeOff className="w-4 h-4 mr-1.5" />
                                                        <span className="hidden sm:inline">Hide Passwords</span>
                                                        <span className="sm:hidden">Hide</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-4 h-4 mr-1.5" />
                                                        <span className="hidden sm:inline">Show Passwords</span>
                                                        <span className="sm:hidden">Show</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        
                                        {/* Mobile Card View */}
                                        <div className="block lg:hidden space-y-3">
                                            {parseResult.existingUsersResult.validUsers.map((user) => (
                                                <div key={user.row} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 touch-manipulation">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.has(user.row)}
                                                                onChange={(e) => handleUserSelection(user.row, e.target.checked)}
                                                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded touch-manipulation"
                                                            />
                                                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                Row {user.row}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Username:</span>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Full Name:</span>
                                                            <p className="text-sm text-gray-900 dark:text-gray-100">{user.fullname}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Password:</span>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {showPasswords ? (
                                                                    <span className="font-mono">
                                                                        {user.password || 'student123'}
                                                                    </span>
                                                                ) : (
                                                                    user.password ? '••••••••' : 'Default (student123)'
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden lg:block overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Select
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Row
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Username
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Full Name
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Password
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {parseResult.existingUsersResult.validUsers.map((user) => (
                                                        <tr key={user.row} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedUsers.has(user.row)}
                                                                    onChange={(e) => handleUserSelection(user.row, e.target.checked)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {user.row}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {user.username}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {user.fullname}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                {showPasswords ? (
                                                                    <span className="font-mono">
                                                                        {user.password || 'student123'}
                                                                    </span>
                                                                ) : (
                                                                    user.password ? '••••••••' : 'Default (student123)'
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Conflicts - Mobile Optimized */}
                                {parseResult.existingUsersResult.conflicts.length > 0 && (
                                    <div className="mb-4 sm:mb-6">
                                        <h4 className="font-medium text-yellow-600 mb-3 flex items-center text-sm sm:text-base">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            Conflicts ({parseResult.existingUsersResult.conflicts.length})
                                        </h4>
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 sm:p-4">
                                            {parseResult.existingUsersResult.conflicts.map((conflict, index) => (
                                                <div key={index} className="mb-2 last:mb-0">
                                                    <p className="text-xs sm:text-sm">
                                                        <span className="font-medium">Row {conflict.row}:</span> {conflict.data.username} - {conflict.conflicts.join(', ')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Errors - Mobile Optimized */}
                                {parseResult.parseResult.errors.length > 0 && (
                                    <div className="mb-4 sm:mb-6">
                                        <h4 className="font-medium text-red-600 mb-3 flex items-center text-sm sm:text-base">
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Errors ({parseResult.parseResult.errors.length})
                                        </h4>
                                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4">
                                            {parseResult.parseResult.errors.map((error, index) => (
                                                <div key={index} className="mb-2 last:mb-0">
                                                    <p className="text-xs sm:text-sm">
                                                        <span className="font-medium">Row {error.row}:</span> {error.errors.join(', ')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Import Button - Mobile Optimized */}
                                {parseResult.existingUsersResult.validUsers.length > 0 && (
                                    <div className="flex justify-center sm:justify-end">
                                        <Button
                                            onClick={handleBulkImport}
                                            disabled={selectedUsers.size === 0 || loading}
                                            className="w-full sm:w-auto px-6 min-h-[44px] touch-manipulation"
                                        >
                                            {loading ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <UserPlus className="w-4 h-4 mr-2" />
                                            )}
                                            <span className="text-sm sm:text-base">Import {selectedUsers.size} Users</span>
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        )}

                        {currentStep === 'confirm' && (
                            <Card className="p-4 sm:p-6 text-center">
                                <RefreshCw className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mx-auto mb-3 sm:mb-4 animate-spin" />
                                <h3 className="text-base sm:text-lg font-semibold mb-2">Importing Users...</h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                    Please wait while we create the user accounts.
                                </p>
                            </Card>
                        )}

                        {currentStep === 'result' && importResult && (
                            <Card className="p-4 sm:p-6">
                                <div className="text-center mb-4 sm:mb-6">
                                    <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-base sm:text-lg font-semibold mb-2">Import Complete!</h3>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                        {importResult.created.length} users created successfully
                                    </p>
                                </div>

                                {/* Results Summary - Mobile Optimized */}
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg text-center">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{importResult.created.length}</p>
                                        <p className="text-xs sm:text-sm text-green-600">Successfully Created</p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-lg text-center">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{importResult.failed.length}</p>
                                        <p className="text-xs sm:text-sm text-red-600">Failed</p>
                                    </div>
                                </div>

                                {/* Created Users - Mobile Optimized */}
                                {importResult.created.length > 0 && (
                                    <div className="mb-4 sm:mb-6">
                                        <h4 className="font-medium text-green-600 mb-3 text-sm sm:text-base">Successfully Created Users</h4>
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 max-h-32 sm:max-h-40 overflow-y-auto">
                                            {importResult.created.map((user, index) => (
                                                <div key={index} className="text-xs sm:text-sm mb-1 last:mb-0">
                                                    Row {user.row}: {user.username} ({user.fullname})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Failed Users - Mobile Optimized */}
                                {importResult.failed.length > 0 && (
                                    <div className="mb-4 sm:mb-6">
                                        <h4 className="font-medium text-red-600 mb-3 text-sm sm:text-base">Failed to Create</h4>
                                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4 max-h-32 sm:max-h-40 overflow-y-auto">
                                            {importResult.failed.map((failure, index) => (
                                                <div key={index} className="text-xs sm:text-sm mb-1 last:mb-0">
                                                    Row {failure.row}: {failure.error}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center">
                                    <Button onClick={resetImport} className="w-full sm:w-auto min-h-[44px] touch-manipulation">
                                        <span className="text-sm sm:text-base">Import More Users</span>
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {loading && <LoadingSpinner />}
        </div>
    );
};

export default AdminBulkUserImport;
