import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';
import AssignmentCard from '../components/assignments/AssignmentCard';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  Star,
  ChevronDown,
  X,
  Send,
  TrendingUp,
  Award,
  Target,
  Zap,
  Sparkles,
  GraduationCap,
  PenTool,
  Inbox,
  ArrowRight,
  MoreVertical,
  ExternalLink
} from 'lucide-react';

const Assignments = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State management
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  
  // UI State
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    subject: '',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('assignments');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

  // Selected items
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Form data
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [gradingData, setGradingData] = useState({ grade: '', feedback: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    semester: '',
    subject: '',
    dueDate: '',
    maxMarks: 100,
    instructions: '',
    files: [],
    status: 'active' // added status field for active toggle
  });

  // Handler for edit button click
  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title || '',
      description: assignment.description || '',
      department: assignment.department?._id || '',
      semester: assignment.semester?._id || '',
      subject: assignment.subject?._id || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0,16) : '',
      maxMarks: assignment.maxMarks || 100,
      instructions: assignment.instructions || '',
      files: assignment.attachments || [],
      status: assignment.status || 'active'
    });
    
    // Fetch subjects if department and semester are available
    if (assignment.department?._id && assignment.semester?._id) {
      fetchSubjects(assignment.department._id, assignment.semester._id);
    }
    
    setShowEditForm(true);
  };

  // Handler for delete button click
  const handleDelete = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
  };


  // Handle update assignment submit
  const handleUpdateAssignment = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.department || 
        !formData.semester || !formData.subject || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create FormData for file upload (similar to create assignment)
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('department', formData.department);
      submitData.append('semester', formData.semester);
      submitData.append('subject', formData.subject);
      submitData.append('dueDate', formData.dueDate);
      submitData.append('maxMarks', formData.maxMarks);
      submitData.append('instructions', formData.instructions);
      submitData.append('status', formData.status);
      
      // Append new files if any (this will replace existing files)
      selectedFiles.forEach((file) => {
        submitData.append('files', file);
      });

      const response = await axiosInstance.put(`/assignments/${editingAssignment._id}/update`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Assignment updated successfully');
        setShowEditForm(false);
        setEditingAssignment(null);
        setFormData({
          title: '',
          description: '',
          department: '',
          semester: '',
          subject: '',
          dueDate: '',
          maxMarks: 100,
          instructions: '',
          files: [],
          status: 'active'
        });
        setSelectedFiles([]);
        fetchAssignments();
      } else {
        throw new Error(response.data.message || 'Failed to update assignment');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update assignment';
      toast.error(errorMessage);
    }
  };

  // Handle delete assignment confirm
  const handleConfirmDelete = async () => {
    if (!selectedAssignment) return;
    setDeleteLoading(true);
    try {
      const response = await axiosInstance.delete(`/assignments/${selectedAssignment._id}/delete`);
      if (response.data.success) {
        toast.success('Assignment deleted successfully');
        setShowDeleteModal(false);
        setSelectedAssignment(null);
        fetchAssignments();
      } else {
        throw new Error(response.data.message || 'Failed to delete assignment');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete assignment';
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTimeUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600', urgent: true };
    if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600', urgent: true };
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-yellow-600', urgent: false };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-blue-600', urgent: false };
    return { text: `${diffDays} days left`, color: 'text-gray-600', urgent: false };
  };

  // Fetch data on component mount
  useEffect(() => {
    if (!authLoading && user) {
      fetchAssignments();
      if (user?.role === 'Teacher' || user?.role === 'Admin') {
        fetchMetadata();
      }
      if (user?.role === 'Student') {
        fetchMySubmissions();
      }
    }
  }, [user, authLoading]);

  // Data fetching functions
  const fetchAssignments = async () => {
    try {
      const response = await axiosInstance.get('/assignments');
      if (response.data.success) {
        setAssignments(response.data.assignments || []);
      } else {
        toast.error('Failed to fetch assignments');
      }
    } catch (error) {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const response = await axiosInstance.get('/assignments/metadata');
      if (response.data.success) {
        setDepartments(response.data.metadata.departments || []);
        setSemesters(response.data.metadata.semesters || []);
      } else {
        toast.error('Failed to fetch metadata');
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
      toast.error('Failed to fetch metadata');
    }
  };

  const fetchSubjects = async (departmentId, semesterId) => {
    if (!departmentId || !semesterId) return;
    try {
      const response = await axiosInstance.get(`/assignments/subjects/${departmentId}/${semesterId}`);
      if (response.data.success) {
        setSubjects(response.data.subjects || []);
      } else {
        toast.error('Failed to fetch subjects');
      }
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const response = await axiosInstance.get('/assignments/my/submissions');
      if (response.data.success) {
        setMySubmissions(response.data.submissions || []);
      } else {
        toast.error('Failed to fetch submissions');
      }
    } catch (error) {
      toast.error('Failed to fetch submissions');
    }
  };

  // Utility functions
  const getStudentSubmission = (assignment) => {
    if (assignment.hasSubmitted !== undefined) {
      return assignment.studentSubmission;
    }
    if (!assignment.submissions || !user) return null;
    return assignment.submissions.find(sub => sub.studentId.toString() === user.id);
  };

  const hasStudentSubmitted = (assignment) => {
    if (assignment.hasSubmitted !== undefined) {
      return assignment.hasSubmitted;
    }
    return !!getStudentSubmission(assignment);
  };

  const isSubmissionDeadlinePassed = (dueDate) => {
    return new Date() > new Date(dueDate);
  };

  // Helper function to extract filename from full path
  const getFileName = (filePath) => {
    if (!filePath) return 'Unknown File';
    // Extract filename from path (handles both forward and backward slashes)
    const fileName = filePath.split(/[/\\]/).pop();
    // Remove timestamp prefix if present (e.g., "1234567890-filename.pdf" -> "filename.pdf")
    return fileName.replace(/^\d+-/, '');
  };

// Enhanced download function with proper error handling and authenticated API calls
const handleDownloadFile = async (filename, assignmentId = null) => {
  if (!filename) {
    toast.error('No file available for download');
    return;
  }

  try {
    console.log('Starting download for filename:', filename, 'assignmentId:', assignmentId);
    
    // Clean the filename to remove any leading slashes and path separators
    const cleanFilename = filename.replace(/^[\\/]+/, '');
    
    // Determine the correct download endpoint
    let downloadUrl;
    if (assignmentId) {
      // Use assignment-specific download route for better access control
      downloadUrl = `/assignments/${assignmentId}/download/${encodeURIComponent(cleanFilename)}`;
    } else {
      // Use general assignment download route
      downloadUrl = `/assignments/download/${encodeURIComponent(cleanFilename)}`;
    }
    
    console.log('Download URL:', downloadUrl);
    
    const response = await axiosInstance.get(downloadUrl, {
      responseType: 'blob',
      timeout: 30000, // 30 second timeout for large files
    });
    
    console.log('Download response received:', {
      status: response.status,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length']
    });
    
    // Create blob link to download
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/octet-stream' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Extract just the filename for download attribute, removing any timestamp prefixes
    let actualFilename = cleanFilename.split('/').pop();
    // Remove timestamp prefix if present (e.g., "1234567890-filename.pdf" -> "filename.pdf")
    actualFilename = actualFilename.replace(/^\d+-/, '');
    
    link.setAttribute('download', actualFilename);
    link.style.display = 'none'; // Hide the link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('File downloaded successfully');
    console.log('Download completed successfully');
  } catch (error) {
    console.error('Download failed:', error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    // Provide more specific error messages
    if (error.response?.status === 404) {
      toast.error('File not found on server');
    } else if (error.response?.status === 403) {
      toast.error('Access denied - please check your permissions');
    } else if (error.response?.status === 401) {
      toast.error('Authentication required - please log in again');
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Network error - please check your connection');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Download timeout - file may be too large');
    } else {
      toast.error('Failed to download file');
    }
  }
};

  const getStatusBadge = (assignment) => {
    if (user?.role === 'Student') {
      const hasSubmitted = hasStudentSubmitted(assignment);
      const isOverdue = isSubmissionDeadlinePassed(assignment.dueDate);
      
      if (hasSubmitted) {
        const submission = getStudentSubmission(assignment);
        if (submission?.isGraded) {
          return { text: 'Graded', color: 'bg-green-100 text-green-800', icon: Award };
        }
        return { text: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
      }
      
      if (isOverdue) {
        return { text: 'Overdue', color: 'bg-red-100 text-red-800', icon: AlertCircle };
      }
      
      return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    
    return { text: assignment.status || 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  // Filter and sort assignments
  const filteredAndSortedAssignments = useMemo(() => {
    let filtered = assignments.filter(assignment => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!assignment.title.toLowerCase().includes(searchLower) &&
            !assignment.description.toLowerCase().includes(searchLower) &&
            !assignment.subject?.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all') {
        if (user?.role === 'Student') {
          const hasSubmitted = hasStudentSubmitted(assignment);
          const isOverdue = isSubmissionDeadlinePassed(assignment.dueDate);
          
          switch (filters.status) {
            case 'pending':
              if (hasSubmitted || isOverdue) return false;
              break;
            case 'submitted':
              if (!hasSubmitted) return false;
              break;
            case 'overdue':
              if (hasSubmitted || !isOverdue) return false;
              break;
          }
        }
      }

      return true;
    });

    // Sort assignments
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'subject':
          aValue = a.subject?.name.toLowerCase() || '';
          bValue = b.subject?.name.toLowerCase() || '';
          break;
        case 'maxMarks':
          aValue = a.maxMarks;
          bValue = b.maxMarks;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || a._id);
          bValue = new Date(b.createdAt || b._id);
          break;
        case 'dueDate':
        default:
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [assignments, searchTerm, filters, sortBy, sortOrder, user, hasStudentSubmitted, isSubmissionDeadlinePassed]);

  // Calculate assignment statistics
  const assignmentStats = useMemo(() => {
    if (user?.role === 'Student') {
      const now = new Date();
      const pending = assignments.filter(a => {
        const hasSubmitted = mySubmissions.some(sub => sub.assignment._id === a._id);
        return !hasSubmitted && new Date(a.dueDate) > now;
      }).length;
      
      const submitted = mySubmissions.length;
      
      const overdue = assignments.filter(a => {
        const hasSubmitted = mySubmissions.some(sub => sub.assignment._id === a._id);
        return !hasSubmitted && new Date(a.dueDate) <= now;
      }).length;
      
      const graded = mySubmissions.filter(sub => sub.submission.isGraded).length;
      
      const averageGrade = graded > 0 
        ? mySubmissions
            .filter(sub => sub.submission.isGraded)
            .reduce((sum, sub) => sum + (sub.submission.grade / sub.assignment.maxMarks) * 100, 0) / graded
        : 0;

      return {
        total: assignments.length,
        pending,
        submitted,
        overdue,
        graded,
        averageGrade: Math.round(averageGrade)
      };
    } else {
      const totalSubmissions = assignments.reduce((sum, a) => sum + (a.submissionCount || 0), 0);
      const needGrading = assignments.reduce((sum, a) => {
        return sum + (a.submissions?.filter(sub => !sub.isGraded).length || 0);
      }, 0);
      
      const activeAssignments = assignments.filter(a => {
        // Consider an assignment active if it's not overdue and doesn't have a specific inactive status
        const isNotOverdue = new Date(a.dueDate) > new Date();
        const hasActiveStatus = !a.status || a.status === 'active' || a.status === 'Active';
        return isNotOverdue && hasActiveStatus;
      }).length;
      
      return {
        total: assignments.length,
        active: activeAssignments,
        totalSubmissions,
        needGrading,
        averageSubmissions: assignments.length > 0 ? Math.round(totalSubmissions / assignments.length) : 0
      };
    }
  }, [assignments, mySubmissions, user]);

  // Handle submission
  const handleSubmitAssignment = async () => {
    if (!submissionFile) {
      toast.error('Please select a file to submit');
      return;
    }

    setSubmissionLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', submissionFile);

      const response = await axiosInstance.post(
        `/assignments/${selectedAssignment._id}/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Assignment submitted successfully');
        setShowSubmissionModal(false);
        setSubmissionFile(null);
        setSelectedAssignment(null);
        fetchAssignments();
      } else {
        throw new Error(response.data.message || 'Failed to submit assignment');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit assignment';
      toast.error(errorMessage);
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handleSubmissionFileChange = (e) => {
    const file = e.target.files[0];
    setSubmissionFile(null);
    
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should not exceed 10MB');
      e.target.value = '';
      return;
    }
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, TXT, or image files.');
      e.target.value = '';
      return;
    }
    
    setSubmissionFile(file);
    toast.success('File selected successfully');
  };

  // Handle assignment file selection for create/edit forms
  const handleAssignmentFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validate each file
    const validFiles = [];
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'text/plain',
      'image/jpeg',
      'image/png',
      'application/zip'
    ];
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File "${file.name}" has an invalid type. Please upload PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP, or image files.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) selected successfully`);
    }
    
    // Clear the input
    e.target.value = '';
  };

  // Remove selected file
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    toast.info('File removed');
  };

  // Reset form data including files
  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      department: '',
      semester: '',
      subject: '',
      dueDate: '',
      maxMarks: 100,
      instructions: '',
      files: [],
      status: 'active'
    });
    setSelectedFiles([]);
  };

  // Handle create assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.department || 
        !formData.semester || !formData.subject || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('department', formData.department);
      submitData.append('semester', formData.semester);
      submitData.append('subject', formData.subject);
      submitData.append('dueDate', formData.dueDate);
      submitData.append('maxMarks', formData.maxMarks);
      submitData.append('instructions', formData.instructions);
      
      // Append files if any
      selectedFiles.forEach((file) => {
        submitData.append('files', file);
      });

      const response = await axiosInstance.post('/assignments/create', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Assignment created successfully');
        setShowCreateForm(false);
        resetFormData();
        fetchAssignments(); // Refresh the assignments list
      } else {
        throw new Error(response.data.message || 'Failed to create assignment');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create assignment';
      toast.error(errorMessage);
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading assignments...</p>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800 px-4">
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-soft border border-secondary-200 dark:border-secondary-700 max-w-md w-full text-center p-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
              Welcome to Assignments
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400">
              Please log in to view and manage your assignments.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md w-full"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <PenTool className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              {user?.role === 'Student' ? 'My Assignments' : 'Assignment Management'}
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              {user?.role === 'Student' 
                ? 'Stay on top of your assignments and track your academic progress'
                : 'Create, manage, and track assignments for your students'
              }
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {user?.role === 'Student' ? (
                <>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{assignmentStats.total}</div>
                    <div className="text-primary-100 text-sm">Total</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{assignmentStats.pending}</div>
                    <div className="text-primary-100 text-sm">Pending</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{assignmentStats.submitted}</div>
                    <div className="text-primary-100 text-sm">Submitted</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{assignmentStats.averageGrade}%</div>
                    <div className="text-primary-100 text-sm">Avg Grade</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{assignmentStats.total}</div>
                    <div className="text-primary-100 text-sm">Assignments</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{assignmentStats.totalSubmissions}</div>
                    <div className="text-primary-100 text-sm">Submissions</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{assignmentStats.needGrading}</div>
                    <div className="text-primary-100 text-sm">Need Grading</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{assignmentStats.active}</div>
                    <div className="text-primary-100 text-sm">Active</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs for Students */}
        {user?.role === 'Student' && (
          <div className="mb-8">
            <div className="flex space-x-1 bg-secondary-100 dark:bg-secondary-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'assignments'
                    ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                All Assignments
              </button>
              <button
                onClick={() => {
                  setActiveTab('submissions');
                  // Refresh submissions data when switching to submissions tab
                  if (user?.role === 'Student') {
                    fetchMySubmissions();
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'submissions'
                    ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
                }`}
              >
                <CheckCircle className="h-4 w-4 inline mr-2" />
                My Submissions
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500 pl-10"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  showFilters 
                    ? 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md'
                    : 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-800 dark:text-secondary-100 dark:hover:bg-secondary-700'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-secondary-600 dark:text-secondary-400'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-secondary-600 dark:text-secondary-400'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Create Assignment Button */}
              {(user?.role === 'Teacher' || user?.role === 'Admin') && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Create Assignment</span>
                  <span className="sm:hidden">Create</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 animate-slide-down">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                  >
                    <option value="all">All Status</option>
                    {user?.role === 'Student' ? (
                      <>
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="overdue">Overdue</option>
                      </>
                    ) : (
                      <>
                        <option value="active">Active</option>
                        <option value="grading">Need Grading</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Subject
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                  >
                    <option value="">All Subjects</option>
                    {[...new Set(assignments.map(a => a.subject?.name).filter(Boolean))].map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Due Date
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Due Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                  >
                    <option value="dueDate">Due Date</option>
                    <option value="title">Title</option>
                    <option value="subject">Subject</option>
                    <option value="maxMarks">Max Marks</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assignment Content */}
        <div className="space-y-6">
          {/* Assignments Tab Content */}
          {activeTab === 'assignments' && (
            <>
              {filteredAndSortedAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-12 w-12 text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                    No assignments found
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    {searchTerm || filters.status !== 'all' || filters.subject || filters.dateRange !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No assignments have been created yet'
                    }
                  </p>
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredAndSortedAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment._id}
                        assignment={assignment}
                        userRole={user?.role}
                        onSubmit={(assignment) => {
                          setSelectedAssignment(assignment);
                          setShowSubmissionModal(true);
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewSubmissions={(assignmentId) => {
                          const assignment = assignments.find(a => a._id === assignmentId);
                          if (assignment) {
                            setSelectedAssignment(assignment);
                            setShowSubmissionsModal(true);
                          }
                        }}
                        onDownload={(filename) => handleDownloadFile(filename, assignment._id)}
                        getStudentSubmission={getStudentSubmission}
                        hasStudentSubmitted={hasStudentSubmitted}
                        isSubmissionDeadlinePassed={isSubmissionDeadlinePassed}
                      />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Submissions Tab Content */}
          {activeTab === 'submissions' && user?.role === 'Student' && (
            <div className="space-y-6">
              {mySubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-12 w-12 text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    You haven't submitted any assignments yet. Check the assignments tab to see available assignments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2 sm:mb-0">
                      My Submissions ({mySubmissions.length})
                    </h3>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      {assignmentStats.graded} graded • {assignmentStats.submitted - assignmentStats.graded} pending
                    </div>
                  </div>
  
                  <div className="space-y-4">
                    {mySubmissions.map((submissionData, index) => {
                      const { assignment, submission } = submissionData;
                      const isGraded = submission.isGraded;
                      const isLateSubmission = new Date(submission.submissionDate) > new Date(assignment.dueDate);
                      
                      return (
                        <div key={index} className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 p-4 sm:p-6 hover:shadow-md transition-shadow">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                                {assignment.title}
                              </h4>
                              <div className="flex flex-wrap items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400">
                                <div className="flex items-center space-x-1">
                                  <BookOpen className="h-4 w-4" />
                                  <span>{assignment.subject?.name || 'No Subject'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Target className="h-4 w-4" />
                                  <span>{assignment.maxMarks} points</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                              {/* Grade Status */}
                              {isGraded ? (
                                <div className="text-right">
                                  <div className="flex items-center space-x-2">
                                    <Award className="h-5 w-5 text-green-600" />
                                    <span className="text-lg font-bold text-green-600">
                                      {submission.grade}/{assignment.maxMarks}
                                    </span>
                                  </div>
                                  <div className="text-sm text-secondary-600 dark:text-secondary-400">
                                    {Math.round((submission.grade / assignment.maxMarks) * 100)}%
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 text-yellow-600">
                                  <Clock className="h-5 w-5" />
                                  <span className="text-sm font-medium">Pending Grade</span>
                                </div>
                              )}
  
                              {/* Late Submission Warning */}
                              {isLateSubmission && (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="text-xs font-medium">Late</span>
                                </div>
                              )}
                            </div>
                          </div>
  
                          {/* Submission Details */}
                          <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                  Submitted File
                                </p>
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-secondary-500" />
                                  <span className="text-sm text-secondary-900 dark:text-white truncate">
                                    {submission.submissionFile}
                                  </span>
                                  <button
                                    onClick={() => handleDownloadFile(submission.submissionFile, assignment._id)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title="Download submission"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                  Submission Date
                                </p>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-secondary-500" />
                                  <span className="text-sm text-secondary-900 dark:text-white">
                                    {new Date(submission.submissionDate).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
  
                          {/* Feedback Section */}
                          {isGraded && submission.feedback && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                    <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                                    Teacher Feedback
                                  </h5>
                                  <p className="text-sm text-blue-800 dark:text-blue-300">
                                    {submission.feedback}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
  
                          {/* Action Buttons */}
                          <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                            <button
                              onClick={() => {
                                const assignmentToShow = assignments.find(a => a._id === assignment._id);
                                if (assignmentToShow) {
                                  setSelectedAssignment(assignmentToShow);
                                  setShowAssignmentDetails(true);
                                }
                              }}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-600"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Assignment
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>



      {/* Assignment Details Modal */}
      {showAssignmentDetails && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
                  Assignment Details
                </h3>
                <button
                  onClick={() => {
                    setShowAssignmentDetails(false);
                    setSelectedAssignment(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Assignment Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                      {selectedAssignment.title}
                    </h4>
                    <p className="text-secondary-600 dark:text-secondary-400">
                      {selectedAssignment.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    {(() => {
                      const status = getStatusBadge(selectedAssignment);
                      const StatusIcon = status.icon;
                      return (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                          <StatusIcon className="h-4 w-4 mr-2" />
                          {status.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Assignment Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-secondary-400 mr-3" />
                    <div>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">Subject</p>
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {selectedAssignment.subject?.name || 'No Subject'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-secondary-400 mr-3" />
                    <div>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">Due Date</p>
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {new Date(selectedAssignment.dueDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-secondary-400 mr-3" />
                    <div>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">Max Marks</p>
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {selectedAssignment.maxMarks} points
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-secondary-400 mr-3" />
                    <div>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">Time Remaining</p>
                      <p className={`font-medium ${getTimeUntilDue(selectedAssignment.dueDate).color}`}>
                        {getTimeUntilDue(selectedAssignment.dueDate).text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {selectedAssignment.instructions && (
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">
                    Instructions
                  </h5>
                  <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4">
                    <p className="text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
                      {selectedAssignment.instructions}
                    </p>
                  </div>
                </div>
              )}

              {/* Student Submission Status */}
              {user?.role === 'Student' && (
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">
                    Your Submission
                  </h5>
                  {hasStudentSubmitted(selectedAssignment) ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Assignment Submitted
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            You have successfully submitted this assignment.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : isSubmissionDeadlinePassed(selectedAssignment.dueDate) ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                        <div>
                          <p className="font-medium text-red-800 dark:text-red-200">
                            Submission Deadline Passed
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            The deadline for this assignment has passed.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                          <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                              Pending Submission
                            </p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                              You haven't submitted this assignment yet.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowAssignmentDetails(false);
                            setShowSubmissionModal(true);
                          }}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <button
                  onClick={() => {
                    setShowAssignmentDetails(false);
                    setSelectedAssignment(null);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-600"
                >
                  Close
                </button>
                {user?.role === 'Student' && !hasStudentSubmitted(selectedAssignment) && !isSubmissionDeadlinePassed(selectedAssignment.dueDate) && (
                  <button
                    onClick={() => {
                      setShowAssignmentDetails(false);
                      setShowSubmissionModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500"
                  >
                    <Upload className="h-4 w-4 mr-2 inline" />
                    Submit Assignment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditForm && editingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
                  Edit Assignment
                </h3>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingAssignment(null);
                    setFormData({
                      title: '',
                      description: '',
                      department: '',
                      semester: '',
                      subject: '',
                      dueDate: '',
                      maxMarks: 100,
                      instructions: '',
                      files: [],
                      status: 'active'
                    });
                  }}
                  className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                    placeholder="Enter assignment title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                    placeholder="Enter assignment description"
                    required
                  />
                </div>

                {/* Department and Semester */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Department *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, department: e.target.value, subject: '' }));
                        if (e.target.value && formData.semester) {
                          fetchSubjects(e.target.value, formData.semester);
                        }
                      }}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Semester *
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, semester: e.target.value, subject: '' }));
                        if (formData.department && e.target.value) {
                          fetchSubjects(formData.department, e.target.value);
                        }
                      }}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                      required
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(sem => (
                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                    required
                    disabled={!formData.department || !formData.semester}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date and Max Marks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Max Marks *
                    </label>
                    <input
                      type="number"
                      value={formData.maxMarks}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxMarks: parseInt(e.target.value) || 0 }))}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={4}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                    placeholder="Enter detailed instructions for the assignment"
                  />
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingAssignment(null);
                      setFormData({
                        title: '',
                        description: '',
                        department: '',
                        semester: '',
                        subject: '',
                        dueDate: '',
                        maxMarks: 100,
                        instructions: '',
                        files: [],
                        status: 'active'
                      });
                      setSelectedFiles([]);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleUpdateAssignment}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500"
                  >
                    Update Assignment
                  </button>
                </div>
              </form>

              {/* Assignment Documents */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Assignment Documents (Optional)
                </label>
                <div className="space-y-3">
                  {/* File Upload Input */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-secondary-300 border-dashed rounded-lg cursor-pointer bg-secondary-50 dark:hover:bg-secondary-800 dark:bg-secondary-700 hover:bg-secondary-100 dark:border-secondary-600 dark:hover:border-secondary-500">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-secondary-500 dark:text-secondary-400" />
                        <p className="mb-2 text-sm text-secondary-500 dark:text-secondary-400">
                          <span className="font-semibold">Click to upload</span> assignment documents
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                          PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP, or images (Max 10MB each)
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        onChange={handleAssignmentFileChange}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Selected Files Display */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Selected Files ({selectedFiles.length}):
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-secondary-500" />
                              <span className="text-sm text-secondary-700 dark:text-secondary-300 truncate">
                                {file.name}
                              </span>
                              <span className="text-xs text-secondary-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Delete Assignment
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAssignment(null);
                }}
                className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-4">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-1">
                    Are you sure you want to delete this assignment?
                  </h4>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    "{selectedAssignment.title}"
                  </p>
                </div>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                This action cannot be undone. All submissions and related data will be permanently deleted.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAssignment(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
                  Create New Assignment
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      title: '',
                      description: '',
                      department: '',
                      semester: '',
                      subject: '',
                      dueDate: '',
                      maxMarks: 100,
                      instructions: '',
                      files: []
                    });
                  }}
                  className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                    placeholder="Enter assignment title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                    placeholder="Enter assignment description"
                    required
                  />
                </div>

                {/* Department and Semester */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Department *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, department: e.target.value, subject: '' }));
                        if (e.target.value && formData.semester) {
                          fetchSubjects(e.target.value, formData.semester);
                        }
                      }}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Semester *
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, semester: e.target.value, subject: '' }));
                        if (formData.department && e.target.value) {
                          fetchSubjects(formData.department, e.target.value);
                        }
                      }}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                      required
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(sem => (
                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                    required
                    disabled={!formData.department || !formData.semester}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date and Max Marks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Max Marks *
                    </label>
                    <input
                      type="number"
                      value={formData.maxMarks}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxMarks: parseInt(e.target.value) || 0 }))}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={4}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                    placeholder="Enter detailed instructions for the assignment"
                  />
                </div>

                {/* Assignment Documents */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Assignment Documents (Optional)
                  </label>
                  <div className="space-y-3">
                    {/* File Upload Input */}
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-secondary-300 border-dashed rounded-lg cursor-pointer bg-secondary-50 dark:hover:bg-secondary-800 dark:bg-secondary-700 hover:bg-secondary-100 dark:border-secondary-600 dark:hover:border-secondary-500">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-secondary-500 dark:text-secondary-400" />
                          <p className="mb-2 text-sm text-secondary-500 dark:text-secondary-400">
                            <span className="font-semibold">Click to upload</span> assignment documents
                          </p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP, or images (Max 10MB each)
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          onChange={handleAssignmentFileChange}
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Selected Files Display */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          Selected Files ({selectedFiles.length}):
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-secondary-500" />
                                <span className="text-sm text-secondary-700 dark:text-secondary-300 truncate">
                                  {file.name}
                                </span>
                                <span className="text-xs text-secondary-500">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSelectedFile(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({
                        title: '',
                        description: '',
                        department: '',
                        semester: '',
                        subject: '',
                        dueDate: '',
                        maxMarks: 100,
                        instructions: '',
                        files: []
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleCreateAssignment}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500"
                  >
                    Create Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Submit Assignment
              </h3>
              <button
                onClick={() => {
                  setShowSubmissionModal(false);
                  setSubmissionFile(null);
                  setSelectedAssignment(null);
                }}
                className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-secondary-900 dark:text-white mb-2">
                {selectedAssignment.title}
              </h4>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Upload File
              </label>
              <input
                type="file"
                onChange={handleSubmissionFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="block w-full text-sm text-secondary-500 dark:text-secondary-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300"
              />
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSubmissionModal(false);
                  setSubmissionFile(null);
                  setSelectedAssignment(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAssignment}
                disabled={!submissionFile || submissionLoading}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500"
              >
                {submissionLoading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
                    Assignment Submissions
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                    {selectedAssignment.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSubmissionsModal(false);
                    setSelectedAssignment(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Assignment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedAssignment.submissionCount || 0}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">Total Submissions</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {selectedAssignment.gradedCount || 0}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-200">Graded</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {selectedAssignment.ungradedCount || 0}
                  </div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">Pending</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedAssignment.maxMarks}
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-200">Max Marks</div>
                </div>
              </div>

              {/* Submissions List */}
              {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                    Student Submissions ({selectedAssignment.submissions.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedAssignment.submissions.map((submission, index) => (
                      <div key={index} className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 border border-secondary-200 dark:border-secondary-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <p className="font-medium text-secondary-900 dark:text-white">
                                {submission.studentDetails?.fullname || submission.studentId?.name || 'Unknown Student'}
                              </p>
                              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                                Roll No: {submission.studentDetails?.classRollNo || 'N/A'}
                              </p>
                              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                Submitted: {submission.submissionDate ? new Date(submission.submissionDate).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {submission.isGraded ? (
                              <div className="text-right">
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    {submission.grade}/{selectedAssignment.maxMarks}
                                  </span>
                                </div>
                                {submission.feedback && (
                                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                                    Feedback provided
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                <span className="text-sm text-yellow-600">Pending Grade</span>
                              </div>
                            )}
                            
                            <div className="flex space-x-2">
                              {submission.submissionFile && (
                                <button
                                  onClick={() => handleDownloadFile(submission.submissionFile)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Download submission"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setGradingData({
                                    grade: submission.grade || '',
                                    feedback: submission.feedback || ''
                                  });
                                  setShowGradingModal(true);
                                }}
                                className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                title="Grade submission"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {submission.feedback && (
                          <div className="mt-3 p-3 bg-white dark:bg-secondary-600 rounded-lg">
                            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                              Feedback:
                            </p>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              {submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-12 w-12 text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    Students haven't submitted their assignments yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Grading Modal */}
        {showGradingModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
              <div className="sticky top-0 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 p-4 sm:p-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                  Grade Submission
                </h3>
                <button
                  onClick={() => {
                    setShowGradingModal(false);
                    setSelectedSubmission(null);
                    setGradingData({ grade: '', feedback: '' });
                  }}
                  className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-2">
                    {selectedSubmission.studentDetails?.fullname || selectedSubmission.studentId?.name || 'Unknown Student'}
                  </h4>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Roll No: {selectedSubmission.studentDetails?.classRollNo || 'N/A'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Grade (out of {selectedAssignment.maxMarks})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedAssignment.maxMarks}
                      value={gradingData.grade}
                      onChange={(e) => setGradingData(prev => ({ ...prev, grade: e.target.value }))}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white"
                      placeholder="Enter grade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Feedback (Optional)
                    </label>
                    <textarea
                      value={gradingData.feedback}
                      onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                      rows={4}
                      className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:border-secondary-600 dark:text-white dark:placeholder-secondary-500"
                      placeholder="Enter feedback for the student"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <button
                    onClick={() => {
                      setShowGradingModal(false);
                      setSelectedSubmission(null);
                      setGradingData({ grade: '', feedback: '' });
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!gradingData.grade) {
                        toast.error('Please enter a grade');
                        return;
                      }

                      try {
                        const response = await axiosInstance.put(
                          `/assignments/${selectedAssignment._id}/submissions/${selectedSubmission._id}/grade`,
                          {
                            grade: parseFloat(gradingData.grade),
                            feedback: gradingData.feedback
                          }
                        );

                        if (response.data.success) {
                          toast.success('Submission graded successfully');
                          setShowGradingModal(false);
                          setSelectedSubmission(null);
                          setGradingData({ grade: '', feedback: '' });
                          fetchAssignments(); // Refresh assignments to update submission data
                        } else {
                          throw new Error(response.data.message || 'Failed to grade submission');
                        }
                      } catch (error) {
                        const errorMessage = error.response?.data?.message || error.message || 'Failed to grade submission';
                        toast.error(errorMessage);
                      }
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500"
                  >
                    Save Grade
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Assignments;
