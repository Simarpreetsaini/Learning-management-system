import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const StudyMaterials = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMaterial, setExpandedMaterial] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    body: '',
    department: '',
    semester: '',
    subject: '',
    type: 'notes',
    tags: '',
    isPublic: true,
    file: null
  });
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [formFilteredSubjects, setFormFilteredSubjects] = useState([]);

  const materialTypes = ['notes', 'slides', 'reference', 'tutorial', 'assignment', 'other'];

  useEffect(() => {
    // Only fetch data if auth is not loading and user exists
    if (!authLoading && user) {
      fetchMaterials();
      fetchHelperData();
    }
  }, [user, authLoading]);

  // Fetch filtered subjects when department or semester changes in form
  useEffect(() => {
    if (formData.department && formData.semester) {
      fetchFilteredSubjects(formData.department, formData.semester, setFormFilteredSubjects);
    } else {
      setFormFilteredSubjects([]);
    }
  }, [formData.department, formData.semester]);

  // Fetch filtered subjects when department or semester changes in filter
  useEffect(() => {
    if (selectedDepartment && selectedSemester) {
      fetchFilteredSubjects(selectedDepartment, selectedSemester, setFilteredSubjects);
    } else {
      setFilteredSubjects([]);
    }
  }, [selectedDepartment, selectedSemester]);

  const fetchMaterials = async () => {
    try {
      const response = await axiosInstance.get('/study-materials');
      setMaterials(response.data.studyMaterials || []);
    } catch (error) {
      toast.error('Failed to fetch study materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchHelperData = async () => {
    try {
      const [deptRes, semRes, subjRes] = await Promise.all([
        axiosInstance.get('/study-materials/helpers/departments'),
        axiosInstance.get('/study-materials/helpers/semesters'),
        axiosInstance.get('/study-materials/helpers/subjects')
      ]);
      setDepartments(deptRes.data?.data || []);
      setSemesters(semRes.data?.data || []);
      setSubjects(subjRes.data?.data || []);
    } catch (error) {
      console.error('Helper data fetch error:', error);
      toast.error('Failed to fetch helper data. Please check if departments, semesters, and subjects are configured.');
    }
  };

  const fetchFilteredSubjects = async (departmentId, semesterId, setSubjectsFunction) => {
    try {
      const response = await axiosInstance.get(`/study-materials/helpers/subjects-filtered?departmentId=${departmentId}&semesterId=${semesterId}`);
      setSubjectsFunction(response.data.data || []);
    } catch (error) {
      console.error('Filtered subjects fetch error:', error);
      toast.error('Failed to fetch filtered subjects');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        file: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'tags') {
          formDataToSend.append(key, formData[key].split(',').map(tag => tag.trim()).filter(tag => tag));
        } else if (key === 'file' && formData[key]) {
          formDataToSend.append('studyfile', formData[key]);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      await axiosInstance.post('/study-materials', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Study material created successfully');
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        body: '',
        department: '',
        semester: '',
        subject: '',
        type: 'notes',
        tags: '',
        isPublic: true,
        file: null
      });
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create study material');
    }
  };

  const searchMaterials = async () => {
    if (!searchTerm.trim()) {
      fetchMaterials();
      return;
    }

    try {
      const response = await axiosInstance.get(`/study-materials/search?query=${encodeURIComponent(searchTerm)}`);
      setMaterials(response.data.studyMaterials || []);
    } catch (error) {
      toast.error('Failed to search materials');
    }
  };

  const filterMaterials = async () => {
    try {
      let url = '/study-materials/filter?';
      const params = [];
      
      if (selectedDepartment) params.push(`departmentIds=${selectedDepartment}`);
      if (selectedSemester) params.push(`semesterIds=${selectedSemester}`);
      if (selectedSubject) params.push(`subjectIds=${selectedSubject}`);
      
      if (params.length === 0) {
        fetchMaterials();
        return;
      }

      url += params.join('&');
      const response = await axiosInstance.get(url);
      setMaterials(response.data.studyMaterials || []);
    } catch (error) {
      console.error('Filter error:', error);
      toast.error('Failed to filter materials');
    }
  };

  const clearFilters = () => {
    setSelectedDepartment('');
    setSelectedSemester('');
    setSelectedSubject('');
    setSearchTerm('');
    fetchMaterials();
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'notes': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'slides': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reference': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'tutorial': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'assignment': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getFileName = (filePath) => {
    if (!filePath) return '';
    // Extract filename from path (handles both forward and backward slashes)
    const fileName = filePath.split(/[/\\]/).pop();
    // Remove timestamp prefix if present (e.g., "1752036002802-1751565954537-test.pdf" -> "test.pdf")
    return fileName.replace(/^\d+-/, '');
  };

  const toggleMaterialExpansion = (materialId) => {
    setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
  };

  // Show loading spinner while auth is loading
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to view study materials.</p>
      </div>
    );
  }

  return (
    <div className="container-padding py-4 sm:py-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile-Optimized Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            📚 Study Materials
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse and manage study resources
          </p>
        </div>
        {(user?.role === 'Teacher' || user?.role === 'Admin') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary w-full sm:w-auto text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Material</span>
              <span className="sm:hidden">Add</span>
            </span>
          </button>
        )}
      </div>

      {/* Mobile-Optimized Search and Filter */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchMaterials()}
                className="input w-full pl-10 pr-4 py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 transition-colors touch-manipulation"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={searchMaterials}
            className="btn-primary px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </span>
          </button>
        </div>

        {/* Filter Toggle Button (Mobile) */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation shadow-sm"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              <span className="font-medium">Filters</span>
              {(selectedDepartment || selectedSemester || selectedSubject) && (
                <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </span>
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Filter Section */}
        <div className={`space-y-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="input py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation"
            >
              <option value="">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem._id} value={sem._id}>{sem.name}</option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation"
            >
              <option value="">All Subjects</option>
              {(selectedDepartment && selectedSemester ? filteredSubjects : subjects).map(subj => (
                <option key={subj._id} value={subj._id}>{subj.name}</option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={filterMaterials}
                className="btn-success flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                  </svg>
                  Filter
                </span>
              </button>
              <button
                onClick={clearFilters}
                className="btn-secondary px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Materials Grid */}
      <div className="space-y-4 sm:space-y-6">
        {materials.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg">No study materials found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          materials.map(material => (
            <div key={material._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
              {/* Mobile-Optimized Card Header */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {material.title}
                    </h3>
                    {material.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-3 line-clamp-2">
                        {material.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Mobile-Optimized Status Badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {material.isPublic ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full font-medium">
                        Public
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded-full font-medium">
                        Private
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile-Optimized Metadata */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(material.type)}`}>
                    {material.type}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {material.department?.name}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {material.semester?.name}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {material.subject?.name}
                  </span>
                </div>

                {/* Mobile-Optimized Content Preview */}
                <div className="mb-4">
                  <div className={`text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed ${
                    expandedMaterial === material._id ? '' : 'line-clamp-3'
                  }`}>
                    {material.body}
                  </div>
                  {material.body && material.body.length > 150 && (
                    <button
                      onClick={() => toggleMaterialExpansion(material._id)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 touch-manipulation"
                    >
                      {expandedMaterial === material._id ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {/* Mobile-Optimized Tags */}
                {material.tags && material.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {material.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                    {material.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full">
                        +{material.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Mobile-Optimized File Attachment */}
                {material.studyfile && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {getFileName(material.studyfile)}
                        </span>
                      </div>
                      <button
                        className="btn-primary px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation flex items-center justify-center gap-2 w-full sm:w-auto"
                        onClick={async () => {
                          try {
                            // Fetch the signed URL from the backend
                            const response = await axiosInstance.get(`/study-materials/${material._id}/download`);
                            
                            if (response.data.success && response.data.data.downloadUrl) {
                              const downloadUrl = response.data.data.downloadUrl;
                              const fileName = getFileName(material.studyfile) || 'study-material';
                              
                              // Try to download using fetch and blob for better file handling
                              try {
                                const fileResponse = await fetch(downloadUrl);
                                if (!fileResponse.ok) {
                                  throw new Error(`HTTP error! status: ${fileResponse.status}`);
                                }
                                
                                const blob = await fileResponse.blob();
                                
                                // Create blob URL and download
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                link.download = fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                
                                // Clean up blob URL
                                window.URL.revokeObjectURL(blobUrl);
                                
                                toast.success('Download completed successfully');
                              } catch (fetchError) {
                                console.warn('Fetch download failed, falling back to direct link:', fetchError);
                                // Fallback to direct link method
                                window.open(downloadUrl, '_blank');
                                toast.success('Download started in new tab');
                              }
                              
                              // Update download count in the UI
                              setMaterials(prev => prev.map(m => 
                                m._id === material._id 
                                  ? { ...m, downloadCount: (m.downloadCount || 0) + 1 }
                                  : m
                              ));
                              
                            } else {
                              throw new Error('Failed to get download URL');
                            }
                          } catch (error) {
                            console.error('Failed to download file:', error);
                            toast.error('Failed to download file. Please try again.');
                          }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile-Optimized Stats */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {material.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {material.downloadCount || 0}
                    </span>
                    {material.studyfile && (
                      <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        File
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {new Date(material.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile-Optimized Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Add New Study Material</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="input w-full py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation"
                    placeholder="Enter material title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="input w-full py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 resize-none touch-manipulation"
                    placeholder="Brief description of the material"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content (Optional)</label>
                  <textarea
                    name="body"
                    value={formData.body}
                    onChange={handleInputChange}
                    rows="6"
                    className="input w-full py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 resize-none touch-manipulation"
                    placeholder="Enter the main content of the study material (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="input w-full py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      required
                      className="input w-full py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(sem => (
                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="input w-full py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation"
                    >
                      <option value="">Select Subject</option>
                      {(formData.department && formData.semester ? formFilteredSubjects : subjects).map(subj => (
                        <option key={subj._id} value={subj._id}>{subj.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="input w-full py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation"
                    >
                      {materialTypes.map(type => (
                        <option key={type} value={type} className="capitalize">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., important, chapter1, midterm"
                    className="input w-full py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Make this material public
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Study Material File (Optional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      name="file"
                      onChange={handleInputChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                      className="input w-full py-3 text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 touch-manipulation file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG (Max 10MB)
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium touch-manipulation"
                  >
                    Create Material
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterials;
