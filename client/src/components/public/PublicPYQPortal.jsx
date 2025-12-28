import React, { useState, useEffect } from 'react';
import { publicPyqApi } from '../../api/publicPyqApi';
import { toast } from '../../utils/toast';
import LoadingSpinner from '../LoadingSpinner';

const PublicPYQPortal = () => {
  const [pyqs, setPyqs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch filtered subjects when department or semester changes
  useEffect(() => {
    if (filterDepartment && filterSemester) {
      fetchFilteredSubjects(filterDepartment, filterSemester);
    } else {
      setFilteredSubjects([]);
    }
  }, [filterDepartment, filterSemester]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [pyqsData, departmentsData, semestersData, subjectsData] = await Promise.all([
        publicPyqApi.getAllPyqs(),
        publicPyqApi.getDepartments(),
        publicPyqApi.getSemesters(),
        publicPyqApi.getSubjects()
      ]);

      setPyqs(pyqsData.pyqs || []);
      setDepartments(departmentsData.departments || []);
      setSemesters(semestersData.semesters || []);
      setSubjects(subjectsData.subjects || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load PYQ data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredSubjects = async (departmentId, semesterId) => {
    try {
      const response = await publicPyqApi.getFilteredSubjects(departmentId, semesterId);
      setFilteredSubjects(response.data || []);
    } catch (error) {
      console.error('Failed to fetch filtered subjects');
    }
  };

  // Helper functions to get names by ID
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

  const filterPYQs = () => {
    let filtered = pyqs;
    
    // Filter by department
    if (filterDepartment) {
      const departmentName = getDepartmentNameById(filterDepartment);
      filtered = filtered.filter(pyq => pyq.department === departmentName);
    }
    
    // Filter by semester
    if (filterSemester) {
      const semesterName = getSemesterNameById(filterSemester);
      filtered = filtered.filter(pyq => pyq.semester === semesterName);
    }
    
    // Filter by subject
    if (filterSubject) {
      const subjectName = filterDepartment && filterSemester 
        ? getFilteredSubjectNameById(filterSubject)
        : getSubjectNameById(filterSubject);
      filtered = filtered.filter(pyq => pyq.subject === subjectName);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(pyq => 
        pyq.pyqfilename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pyq.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pyq.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pyq.semester.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const clearFilters = () => {
    setFilterDepartment('');
    setFilterSemester('');
    setFilterSubject('');
    setSearchTerm('');
  };

  const downloadPYQ = async (pyqId, filename) => {
    try {
      await publicPyqApi.downloadPyq(pyqId, filename);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  if (loading) return <LoadingSpinner />;

  const filteredPYQs = filterPYQs();

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">
          Previous Year Questions
        </h2>
        <div className="text-sm text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-700 px-3 py-1 rounded-full text-center sm:text-left">
          {filteredPYQs.length} questions available
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by filename, subject, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white text-sm sm:text-base min-h-[44px] sm:min-h-auto"
          />
          <svg
            className="absolute left-3 top-3 sm:top-2.5 h-5 w-5 text-secondary-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters - Mobile-first responsive */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full border border-secondary-300 dark:border-secondary-600 rounded-lg px-3 py-3 sm:py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white text-sm sm:text-base min-h-[44px] sm:min-h-auto"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>

          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="w-full border border-secondary-300 dark:border-secondary-600 rounded-lg px-3 py-3 sm:py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white text-sm sm:text-base min-h-[44px] sm:min-h-auto"
          >
            <option value="">All Semesters</option>
            {semesters.map(sem => (
              <option key={sem._id} value={sem._id}>{sem.name}</option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full border border-secondary-300 dark:border-secondary-600 rounded-lg px-3 py-3 sm:py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white text-sm sm:text-base min-h-[44px] sm:min-h-auto"
          >
            <option value="">All Subjects</option>
            {(filterDepartment && filterSemester ? filteredSubjects : subjects).map(subj => (
              <option key={subj._id} value={subj._id}>{subj.name}</option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="w-full sm:w-auto bg-secondary-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-secondary-700 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-auto"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* PYQ Grid */}
      <div className="grid gap-4 sm:gap-6">
        {filteredPYQs.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="flex flex-col items-center">
              <svg
                className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-secondary-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg sm:text-xl font-medium text-secondary-900 dark:text-white mb-2">No PYQs found</h3>
              <p className="text-sm sm:text-base text-secondary-500 dark:text-secondary-400">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPYQs.map(pyq => (
              <div key={pyq._id} className="bg-secondary-50 dark:bg-secondary-700 p-4 sm:p-6 rounded-lg border border-secondary-200 dark:border-secondary-600 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white mb-2 line-clamp-2 break-words">
                      {pyq.pyqfilename}
                    </h3>
                    <p className="text-primary-600 dark:text-primary-400 font-medium text-sm sm:text-base truncate">
                      {pyq.subject}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded-full flex-shrink-0 ml-2">
                    PYQ
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-600 dark:text-secondary-400">Department:</span>
                    <span className="font-medium text-secondary-900 dark:text-white text-right truncate ml-2">{pyq.department}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-600 dark:text-secondary-400">Semester:</span>
                    <span className="font-medium text-secondary-900 dark:text-white text-right truncate ml-2">{pyq.semester}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-600">
                  <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-400">
                    <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Question Paper
                  </div>
                  <button
                    onClick={() => downloadPYQ(pyq._id, pyq.pyqfilename)}
                    className="w-full sm:w-auto bg-primary-600 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors min-h-[44px] sm:min-h-auto flex items-center justify-center"
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

export default PublicPYQPortal;
