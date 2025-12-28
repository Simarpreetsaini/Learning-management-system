import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const PreviousYearQuestions = () => {
  const { user } = useContext(AuthContext);
  const [pyqs, setPyqs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [formFilteredSubjects, setFormFilteredSubjects] = useState([]);
  const [formData, setFormData] = useState({
    department: '',
    semester: '',
    subject: '',
    pyqfilename: '',
    pyqfile: null
  });

  useEffect(() => {
    fetchPYQs();
    fetchDepartments();
    fetchSemesters();
    fetchSubjects();
  }, []);

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
    if (filterDepartment && filterSemester) {
      fetchFilteredSubjects(filterDepartment, filterSemester, setFilteredSubjects);
    } else {
      setFilteredSubjects([]);
    }
  }, [filterDepartment, filterSemester]);

  const fetchPYQs = async () => {
    try {
      const response = await axiosInstance.get('/pyqs');
      setPyqs(response.data.pyqs || []);
    } catch (error) {
      toast.error('Failed to fetch previous year questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await axiosInstance.get('/semesters');
      setSemesters(response.data.semesters || []);
    } catch (error) {
      console.error('Failed to fetch semesters');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axiosInstance.get('/subjects');
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Failed to fetch subjects');
    }
  };

  const fetchFilteredSubjects = async (departmentId, semesterId, setSubjectsFunction) => {
    try {
      const response = await axiosInstance.get(`/study-materials/helpers/subjects-filtered?departmentId=${departmentId}&semesterId=${semesterId}`);
      setSubjectsFunction(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch filtered subjects');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to get name by ID
  const getDepartmentNameById = (id) => {
    const dept = departments.find(d => d._id === id);
    return dept ? dept.name : '';
  };

  const getSemesterNameById = (id) => {
    const sem = semesters.find(s => s._id === id);
    return sem ? sem.name : '';
  };

  const getSubjectNameById = (id) => {
    const subj = subjects.find(s => s._id === id);
    return subj ? subj.name : '';
  };

  const getFilteredSubjectNameById = (id) => {
    const subj = filteredSubjects.find(s => s._id === id);
    return subj ? subj.name : '';
  };

  const getFormFilteredSubjectNameById = (id) => {
    const subj = formFilteredSubjects.find(s => s._id === id);
    return subj ? subj.name : '';
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      pyqfile: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert IDs to names for backend storage
    const departmentName = getDepartmentNameById(formData.department);
    const semesterName = getSemesterNameById(formData.semester);
    const subjectName = formData.department && formData.semester 
      ? getFormFilteredSubjectNameById(formData.subject)
      : getSubjectNameById(formData.subject);
    
    const uploadData = new FormData();
    uploadData.append('department', departmentName);
    uploadData.append('semester', semesterName);
    uploadData.append('subject', subjectName);
    uploadData.append('pyqfilename', formData.pyqfilename);
    uploadData.append('pyqfile', formData.pyqfile);

    try {
      await axiosInstance.post('/pyqs', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('PYQ uploaded successfully');
      setShowUploadForm(false);
      setFormData({
        department: '',
        semester: '',
        subject: '',
        pyqfilename: '',
        pyqfile: null
      });
      fetchPYQs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload PYQ');
    }
  };

  const filterPYQs = () => {
    let filtered = pyqs;
    
    if (filterDepartment) {
      const departmentName = getDepartmentNameById(filterDepartment);
      filtered = filtered.filter(pyq => pyq.department === departmentName);
    }
    if (filterSemester) {
      const semesterName = getSemesterNameById(filterSemester);
      filtered = filtered.filter(pyq => pyq.semester === semesterName);
    }
    if (filterSubject) {
      const subjectName = filterDepartment && filterSemester 
        ? getFilteredSubjectNameById(filterSubject)
        : getSubjectNameById(filterSubject);
      filtered = filtered.filter(pyq => pyq.subject === subjectName);
    }
    
    return filtered;
  };

  const clearFilters = () => {
    setFilterDepartment('');
    setFilterSemester('');
    setFilterSubject('');
  };

  const downloadPYQ = async (pyqId, filename) => {
    try {
      const response = await axiosInstance.get(`/pyqs/${pyqId}/download`, {
        responseType: 'blob'
      });
      
      // Get the content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Create blob with proper MIME type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      // Ensure the link is added to DOM for Firefox compatibility
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  if (loading) return <LoadingSpinner />;

  const filteredPYQs = filterPYQs();

  return (
    <div className="container-padding py-4 sm:py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">PYQ Papers</h1>
        {(user?.role === 'Teacher' || user?.role === 'Admin') && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-auto"
          >
            Upload PYQ
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white p-4 sm:p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium mb-4">Filter Questions</h3>
        
        {/* Mobile-first responsive grid */}
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>

          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Semesters</option>
            {semesters.map(sem => (
              <option key={sem._id} value={sem._id}>{sem.name}</option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            {(filterDepartment && filterSemester ? filteredSubjects : subjects).map(subj => (
              <option key={subj._id} value={subj._id}>{subj.name}</option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="w-full sm:w-auto bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-md hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-auto"
          >
            Clear Filters
          </button>

          <div className="text-sm text-gray-600 flex items-center justify-center sm:justify-start py-2 sm:py-0 bg-gray-50 sm:bg-transparent rounded-md sm:rounded-none px-3 sm:px-0">
            Showing {filteredPYQs.length} of {pyqs.length} questions
          </div>
        </div>
      </div>

      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Upload PYQ Paper</h2>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
              {/* Department and Semester - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem._id} value={sem._id}>{sem.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Subject</option>
                  {(formData.department && formData.semester ? formFilteredSubjects : subjects).map(subj => (
                    <option key={subj._id} value={subj._id}>{subj.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Name</label>
                <input
                  type="text"
                  name="pyqfilename"
                  value={formData.pyqfilename}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Mid-Term 2023, Final Exam 2022"
                  className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG (Max size: 10MB)
                </p>
              </div>

              {/* Action buttons - Stack on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-auto"
                >
                  Upload PYQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PYQ Grid */}
      <div className="grid gap-4 sm:gap-6">
        {filteredPYQs.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="flex flex-col items-center">
              <svg
                className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No PYQs found</h3>
              <p className="text-gray-500 text-sm sm:text-base">Try adjusting your search or filter criteria.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPYQs.map(pyq => (
              <div key={pyq._id} className="bg-white p-4 sm:p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 break-words">{pyq.pyqfilename}</h3>
                    <p className="text-blue-600 font-medium text-sm sm:text-base truncate">{pyq.subject}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex-shrink-0 ml-2">
                    PYQ
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium text-gray-900 text-right truncate ml-2">{pyq.department}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Semester:</span>
                    <span className="font-medium text-gray-900 text-right truncate ml-2">{pyq.semester}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Question Paper
                  </div>
                  <button
                    onClick={() => downloadPYQ(pyq._id, pyq.pyqfilename)}
                    className="w-full sm:w-auto bg-green-600 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors min-h-[44px] sm:min-h-auto flex items-center justify-center"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviousYearQuestions;
