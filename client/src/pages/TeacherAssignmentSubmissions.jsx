import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import { toast } from '../utils/toast';

const TeacherAssignmentSubmissions = () => {
  const { id } = useParams(); // assignment id from route param
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingData, setGradingData] = useState({ grade: '', feedback: '' });
  const [gradingLoading, setGradingLoading] = useState(false);

  const fetchAssignmentSubmissions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/assignments/${id}`);
      if (res.data.success) {
        setAssignment(res.data.assignment);
        setSubmissions(res.data.assignment.submissions || []);
      } else {
        setError('Failed to load assignment submissions');
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignment submissions');
      setLoading(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      console.log('Starting download for filename:', filename);
      
      // Use the backend file serving route - note: this goes to /api/files/ not /files/
      const downloadUrl = `/files/uploads/assignments/${filename}`;
      console.log('Download URL:', downloadUrl);
      
      const response = await axios.get(downloadUrl, {
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
      link.setAttribute('download', filename);
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
        toast.error('Access denied to file');
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Network error - please check your connection');
      } else {
        toast.error('Failed to download file');
      }
    }
  };

  const openGradingModal = (submission) => {
    setSelectedSubmission(submission);
    setGradingData({
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
    setShowGradingModal(true);
  };

  const closeGradingModal = () => {
    setShowGradingModal(false);
    setSelectedSubmission(null);
    setGradingData({ grade: '', feedback: '' });
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !assignment) return;

    // Validate grade
    const gradeNum = parseFloat(gradingData.grade);
    if (isNaN(gradeNum)) {
      toast.error('Please enter a valid number for grade');
      return;
    }
    if (gradeNum < 0) {
      toast.error('Grade cannot be negative');
      return;
    }
    if (gradeNum > assignment.maxMarks) {
      toast.error(`Grade cannot exceed maximum marks (${assignment.maxMarks})`);
      return;
    }

    setGradingLoading(true);
    try {
      const response = await axios.put(
        `/assignments/${assignment._id}/submissions/${selectedSubmission._id}/grade`,
        gradingData
      );

      if (response.data.success) {
        toast.success('Submission graded successfully');
        closeGradingModal();
        // Refresh the submissions data
        fetchAssignmentSubmissions();
      } else {
        throw new Error(response.data.message || 'Failed to grade submission');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to grade submission';
      toast.error(errorMessage);
    } finally {
      setGradingLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      navigate('/assignments');
      return;
    }
    fetchAssignmentSubmissions();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assignment Submissions</h1>
                <p className="mt-1 text-sm text-gray-600">{assignment?.title || 'Loading...'}</p>
              </div>
              <Link to="/assignments">
                <Button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  ← Back to Assignments
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Graded</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {submissions.filter(sub => sub.isGraded).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {submissions.filter(sub => !sub.isGraded).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Max Marks</p>
                    <p className="text-2xl font-bold text-gray-900">{assignment?.maxMarks || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        {assignment && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Assignment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Subject:</span>
                  <p className="text-gray-600">{assignment.subject?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Due Date:</span>
                  <p className="text-gray-600">
                    {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {assignment.description && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="text-gray-600 mt-1">{assignment.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submissions Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Student Submissions</h2>
            <p className="mt-1 text-sm text-gray-600">
              {submissions.length === 0 ? 'No submissions yet' : `${submissions.length} student${submissions.length !== 1 ? 's' : ''} submitted this assignment`}
            </p>
          </div>
          
          <div className="overflow-hidden">
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
                <p className="mt-1 text-sm text-gray-500">No students have submitted this assignment yet.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View - Hidden on mobile */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sr. No.
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submission File
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submission Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {submissions.map((submission, index) => {
                        const studentName = submission.studentDetails?.fullname || submission.studentId?.name || 'N/A';
                        const classRollNo = submission.studentDetails?.classRollNo || 'N/A';
                        const percentage = submission.grade && assignment?.maxMarks ? 
                          ((submission.grade / assignment.maxMarks) * 100).toFixed(1) : null;
                        
                        return (
                          <tr key={submission._id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-gray-900">{studentName}</div>
                                <div className="text-sm text-gray-500">Roll No: {classRollNo}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="text-sm text-gray-900 truncate max-w-xs">
                                  {submission.submissionFile}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {submission.isGraded ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {submission.grade} / {assignment?.maxMarks || 0}
                                  </span>
                                  {percentage && (
                                    <span className={`text-xs ${
                                      percentage >= 80 ? 'text-green-600' :
                                      percentage >= 60 ? 'text-yellow-600' :
                                      percentage >= 40 ? 'text-orange-600' :
                                      'text-red-600'
                                    }`}>
                                      ({percentage}%)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">Not graded</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                submission.isGraded 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {submission.isGraded ? 'Graded' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(submission.submissionDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleDownload(submission.submissionFile)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                  title="Download submission"
                                >
                                  Download
                                </button>
                                {!submission.isGraded ? (
                                  <button
                                    onClick={() => openGradingModal(submission)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                    title="Grade submission"
                                  >
                                    Grade
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openGradingModal(submission)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                    title="Edit grade"
                                  >
                                    Edit Grade
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - Visible on mobile and tablet */}
                <div className="lg:hidden space-y-4 p-4">
                  {submissions.map((submission, index) => {
                    const studentName = submission.studentDetails?.fullname || submission.studentId?.name || 'N/A';
                    const classRollNo = submission.studentDetails?.classRollNo || 'N/A';
                    const percentage = submission.grade && assignment?.maxMarks ? 
                      ((submission.grade / assignment.maxMarks) * 100).toFixed(1) : null;
                    
                    return (
                      <div key={submission._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                        {/* Header with student info and status */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                #{index + 1}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                submission.isGraded 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {submission.isGraded ? 'Graded' : 'Pending'}
                              </span>
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 truncate">{studentName}</h3>
                            <p className="text-xs text-gray-500">Roll No: {classRollNo}</p>
                          </div>
                        </div>

                        {/* Submission details */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-sm text-gray-700 truncate flex-1">
                              {submission.submissionFile}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Submitted:</span>
                            <span className="text-gray-700">
                              {new Date(submission.submissionDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {submission.isGraded && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Grade:</span>
                              <div className="text-right">
                                <span className="font-semibold text-gray-900">
                                  {submission.grade} / {assignment?.maxMarks || 0}
                                </span>
                                {percentage && (
                                  <span className={`block text-xs ${
                                    percentage >= 80 ? 'text-green-600' :
                                    percentage >= 60 ? 'text-yellow-600' :
                                    percentage >= 40 ? 'text-orange-600' :
                                    'text-red-600'
                                  }`}>
                                    ({percentage}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons - Mobile optimized */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => handleDownload(submission.submissionFile)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download
                          </button>
                          
                          {!submission.isGraded ? (
                            <button
                              onClick={() => openGradingModal(submission)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Grade
                            </button>
                          ) : (
                            <button
                              onClick={() => openGradingModal(submission)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit Grade
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Grading Modal */}
        {showGradingModal && selectedSubmission && assignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">
                {selectedSubmission.isGraded ? 'Edit Grade' : 'Grade Submission'}
              </h2>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Student: {selectedSubmission.studentDetails?.fullname || selectedSubmission.studentId?.name || 'Unknown Student'}
                </p>
                <p className="text-sm text-gray-600">
                  Roll No: {selectedSubmission.studentDetails?.classRollNo || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  File: {selectedSubmission.submissionFile}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade (out of {assignment.maxMarks})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={assignment.maxMarks}
                    step="0.5"
                    value={gradingData.grade}
                    onChange={(e) => setGradingData(prev => ({ ...prev, grade: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter grade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={gradingData.feedback}
                    onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                    rows="4"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter feedback for the student..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The student will be able to see the grade and feedback you provide.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeGradingModal}
                  disabled={gradingLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGradeSubmission}
                  disabled={!gradingData.grade || gradingLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {gradingLoading ? 'Saving...' : selectedSubmission.isGraded ? 'Update Grade' : 'Save Grade'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignmentSubmissions;
