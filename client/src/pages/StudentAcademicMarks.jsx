import React, { useEffect, useState, useMemo } from 'react';
import { getMarksForStudent } from '../api/academicMarksApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from '../utils/toast';

const StudentAcademicMarks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    semester: 'all',
    subject: 'all',
    examType: 'all',
    search: ''
  });
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'compact'
  const [expandedSections, setExpandedSections] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        setLoading(true);
        const response = await getMarksForStudent();
        if (response.success) {
          setMarks(response.marks);
        } else {
          toast.error('Failed to fetch academic marks');
        }
      } catch (error) {
        toast.error('Error fetching academic marks');
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, []);

  // Helper function to format exam type
  const formatExamType = (examType) => {
    if (!examType) return 'N/A';
    
    const match = examType.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
      const [, type, number] = match;
      switch (type) {
        case 'MST':
          return `${number}${getOrdinalSuffix(number)} MST`;
        case 'ClassTest':
          return `${number}${getOrdinalSuffix(number)} Class Test`;
        case 'Assignment':
          return `${number}${getOrdinalSuffix(number)} Assignment`;
        case 'Quiz':
          return `${number}${getOrdinalSuffix(number)} Quiz`;
        case 'Lab':
          return `${number}${getOrdinalSuffix(number)} Lab`;
        case 'Project':
          return `${number}${getOrdinalSuffix(number)} Project`;
        case 'Viva':
          return `${number}${getOrdinalSuffix(number)} Viva`;
        default:
          return examType;
      }
    }
    return examType;
  };

  const getOrdinalSuffix = (number) => {
    const num = parseInt(number);
    if (num >= 11 && num <= 13) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getPassStatus = (marks, passingMarks) => {
    if (!marks || !passingMarks) return { status: 'N/A', color: 'text-gray-500' };
    
    const isPassed = parseFloat(marks) >= parseFloat(passingMarks);
    return {
      status: isPassed ? 'Pass' : 'Fail',
      color: isPassed ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
    };
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'bg-green-500' };
    if (percentage >= 80) return { grade: 'A', color: 'bg-green-400' };
    if (percentage >= 70) return { grade: 'B+', color: 'bg-blue-500' };
    if (percentage >= 60) return { grade: 'B', color: 'bg-blue-400' };
    if (percentage >= 50) return { grade: 'C+', color: 'bg-yellow-500' };
    if (percentage >= 40) return { grade: 'C', color: 'bg-yellow-400' };
    return { grade: 'F', color: 'bg-red-500' };
  };

  const getExamTypeIcon = (examType) => {
    if (!examType) return '📊';
    if (examType.includes('MST')) return '📝';
    if (examType.includes('ClassTest')) return '📋';
    if (examType.includes('Assignment')) return '📄';
    if (examType.includes('Quiz')) return '❓';
    if (examType.includes('Lab')) return '🔬';
    if (examType.includes('Project')) return '🚀';
    if (examType.includes('Viva')) return '🎤';
    if (examType.includes('Final')) return '🎯';
    return '📊';
  };

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const semesters = [...new Set(marks.map(mark => mark.semester?.name).filter(Boolean))];
    const subjects = [...new Set(marks.map(mark => mark.subject?.name).filter(Boolean))];
    const examTypes = [...new Set(marks.map(mark => {
      const match = mark.examType?.match(/^([A-Za-z]+)/);
      return match ? match[1] : mark.examType;
    }).filter(Boolean))];

    return { semesters, subjects, examTypes };
  }, [marks]);

  // Filter marks based on current filters
  const filteredMarks = useMemo(() => {
    return marks.filter(mark => {
      const semesterMatch = filters.semester === 'all' || mark.semester?.name === filters.semester;
      const subjectMatch = filters.subject === 'all' || mark.subject?.name === filters.subject;
      const examTypeMatch = filters.examType === 'all' || mark.examType?.includes(filters.examType);
      const searchMatch = filters.search === '' || 
        mark.subject?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        mark.examType?.toLowerCase().includes(filters.search.toLowerCase());

      return semesterMatch && subjectMatch && examTypeMatch && searchMatch;
    });
  }, [marks, filters]);

  // Group filtered marks
  const groupedMarks = useMemo(() => {
    return filteredMarks.reduce((acc, mark) => {
      const semesterName = mark.semester?.name || 'Unknown Semester';
      if (!acc[semesterName]) {
        acc[semesterName] = {};
      }
      
      const subjectName = mark.subject?.name || 'Unknown Subject';
      if (!acc[semesterName][subjectName]) {
        acc[semesterName][subjectName] = [];
      }
      
      acc[semesterName][subjectName].push(mark);
      return acc;
    }, {});
  }, [filteredMarks]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalExams = filteredMarks.length;
    const passedExams = filteredMarks.filter(mark => mark.marks >= mark.passingMarks).length;
    const failedExams = totalExams - passedExams;
    const averagePercentage = totalExams > 0 
      ? filteredMarks.reduce((sum, mark) => sum + (mark.maxMarks ? (mark.marks / mark.maxMarks) * 100 : 0), 0) / totalExams
      : 0;

    return { totalExams, passedExams, failedExams, averagePercentage };
  }, [filteredMarks]);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center safe-top safe-bottom">
        <div className="text-center px-4">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 animate-pulse text-sm sm:text-base">Loading your academic performance...</p>
        </div>
      </div>
    );
  }

  if (marks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 container-padding safe-top safe-bottom">
        <div className="max-w-4xl mx-auto pt-4 sm:pt-8">
          <div className="card text-center py-8 sm:py-16">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6 animate-bounce-soft">📊</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">Academic Performance</h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-2">No academic marks found</p>
            <p className="text-gray-500 text-sm sm:text-base">Your marks will appear here once teachers enter them</p>
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
              <p className="text-xs sm:text-sm text-gray-700">
                💡 <strong>Tip:</strong> Check back regularly to track your academic progress and performance trends
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container-padding safe-top safe-bottom">
        <div className="max-w-7xl mx-auto pt-4 sm:pt-6 pb-8 sm:pb-12">
          {/* Mobile-First Header */}
          <div className="mb-6 sm:mb-8">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Academic Performance
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Track your academic progress and performance</p>
            </div>
            
            {/* Mobile View Mode Toggle */}
            <div className="flex items-center justify-between mt-4 sm:mt-6">
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-soft">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                    viewMode === 'cards'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="hidden sm:inline">📱 Cards</span>
                  <span className="sm:hidden">📱</span>
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                    viewMode === 'compact'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="hidden sm:inline">📋 Compact</span>
                  <span className="sm:hidden">📋</span>
                </button>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="sm:hidden bg-white rounded-xl p-2 shadow-soft touch-manipulation"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile-Optimized Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm">Total Exams</p>
                    <p className="text-xl sm:text-3xl font-bold">{statistics.totalExams}</p>
                  </div>
                  <div className="text-2xl sm:text-4xl opacity-80">📊</div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs sm:text-sm">Passed</p>
                    <p className="text-xl sm:text-3xl font-bold">{statistics.passedExams}</p>
                  </div>
                  <div className="text-2xl sm:text-4xl opacity-80">✅</div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-xs sm:text-sm">Failed</p>
                    <p className="text-xl sm:text-3xl font-bold">{statistics.failedExams}</p>
                  </div>
                  <div className="text-2xl sm:text-4xl opacity-80">❌</div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white col-span-2 sm:col-span-1">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs sm:text-sm">Average</p>
                    <p className="text-xl sm:text-3xl font-bold">{statistics.averagePercentage.toFixed(1)}%</p>
                  </div>
                  <div className="text-2xl sm:text-4xl opacity-80">📈</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Filters */}
          <div className={`card mb-6 sm:mb-8 ${isMobile && !showMobileFilters ? 'hidden' : ''}`}>
            <div className="card-body p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  🔍 <span className="hidden sm:inline">Filters & Search</span><span className="sm:hidden">Filters</span>
                </h3>
                {isMobile && (
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-500 hover:text-gray-700 touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                {/* Search */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search subjects or exam types..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="input w-full text-sm sm:text-base"
                  />
                </div>

                {/* Semester Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <select
                    value={filters.semester}
                    onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                    className="input w-full text-sm sm:text-base"
                  >
                    <option value="all">All Semesters</option>
                    {filterOptions.semesters.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={filters.subject}
                    onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                    className="input w-full text-sm sm:text-base"
                  >
                    <option value="all">All Subjects</option>
                    {filterOptions.subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                {/* Exam Type Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Exam Type</label>
                  <select
                    value={filters.examType}
                    onChange={(e) => setFilters(prev => ({ ...prev, examType: e.target.value }))}
                    className="input w-full text-sm sm:text-base"
                  >
                    <option value="all">All Types</option>
                    {filterOptions.examTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button
                  onClick={() => setFilters({ semester: 'all', subject: 'all', examType: 'all', search: '' })}
                  className="btn-secondary btn-sm w-full sm:w-auto touch-manipulation"
                >
                  Clear All Filters
                </button>
                {isMobile && (
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="btn-primary btn-sm w-full sm:w-auto touch-manipulation"
                  >
                    Apply Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          {filteredMarks.length === 0 ? (
            <div className="card text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">🔍</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No results found</h3>
              <p className="text-gray-600 text-sm sm:text-base">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-8">
              {Object.entries(groupedMarks).map(([semester, subjects]) => (
                <div key={semester} className="card">
                  <div className="card-header p-4 sm:p-6">
                    <button
                      onClick={() => toggleSection(semester)}
                      className="w-full flex items-center justify-between text-left touch-manipulation"
                    >
                      <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        🎓 {semester}
                      </h2>
                      <div className="text-xl sm:text-2xl transition-transform duration-200" style={{
                        transform: expandedSections[semester] ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}>
                        ⌄
                      </div>
                    </button>
                  </div>

                  {(expandedSections[semester] !== false) && (
                    <div className="card-body p-4 sm:p-6">
                      {Object.entries(subjects).map(([subjectName, subjectMarks]) => (
                        <div key={subjectName} className="mb-6 sm:mb-8 last:mb-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="text-xl sm:text-2xl">📚</div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-1">{subjectName}</h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                          </div>

                          {viewMode === 'cards' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                              {subjectMarks.map((mark) => {
                                const percentage = mark.maxMarks ? ((mark.marks / mark.maxMarks) * 100) : 0;
                                const passStatus = getPassStatus(mark.marks, mark.passingMarks);
                                const grade = getGrade(percentage);

                                return (
                                  <div key={mark._id} className="card-hover border-l-4 border-l-primary-500 touch-manipulation">
                                    <div className="p-4 sm:p-6">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <span className="text-lg sm:text-2xl flex-shrink-0">{getExamTypeIcon(mark.examType)}</span>
                                          <span className="font-medium text-gray-800 text-sm sm:text-base line-clamp-1">
                                            {formatExamType(mark.examType)}
                                          </span>
                                        </div>
                                        <div className={`px-2 sm:px-3 py-1 rounded-full text-white text-xs font-bold ${grade.color} flex-shrink-0`}>
                                          {grade.grade}
                                        </div>
                                      </div>
                                      <div className="text-xs sm:text-sm text-gray-600 mb-3">
                                        {mark.examDate ? new Date(mark.examDate).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        }) : 'N/A'}
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
                                        <div className="text-center">
                                          <div className="text-sm sm:text-lg font-semibold text-gray-900">{mark.marks || 'N/A'}</div>
                                          <div className="text-xs text-gray-500">Obtained</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-sm sm:text-lg font-semibold text-gray-900">{mark.maxMarks || 'N/A'}</div>
                                          <div className="text-xs text-gray-500">Max</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-sm sm:text-lg font-semibold text-gray-900">{mark.passingMarks || 'N/A'}</div>
                                          <div className="text-xs text-gray-500">Passing</div>
                                        </div>
                                      </div>
                                      <div className="mt-3">
                                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                                          <div
                                            className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
                                              percentage >= (mark.passingMarks || 0) ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                          ></div>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                          <span className={`text-xs font-medium ${
                                            percentage >= (mark.passingMarks || 0) ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {passStatus.status}
                                          </span>
                                          <span className="text-xs text-gray-600">{percentage.toFixed(1)}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* Mobile-Optimized Table View */
                            <div className="space-y-3 sm:space-y-0 sm:block">
                              {/* Mobile Cards for Table Data */}
                              <div className="sm:hidden space-y-3">
                                {subjectMarks.map((mark) => {
                                  const passStatus = getPassStatus(mark.marks, mark.passingMarks);
                                  const percentage = mark.maxMarks ? ((mark.marks / mark.maxMarks) * 100).toFixed(1) : 'N/A';
                                  
                                  return (
                                    <div key={mark._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          {formatExamType(mark.examType)}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          passStatus.status === 'Pass' 
                                            ? 'bg-green-100 text-green-800' 
                                            : passStatus.status === 'Fail'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {passStatus.status}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-gray-500">Date:</span>
                                          <div className="font-medium">
                                            {mark.examDate ? new Date(mark.examDate).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            }) : 'N/A'}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Score:</span>
                                          <div className="font-medium text-lg">{mark.marks || 'N/A'}/{mark.maxMarks || 'N/A'}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Passing:</span>
                                          <div className="font-medium">{mark.passingMarks || 'N/A'}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Percentage:</span>
                                          <div className="font-medium">{percentage !== 'N/A' ? `${percentage}%` : 'N/A'}</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Desktop Table */}
                              <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300 rounded-lg">
                                  <thead>
                                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                                        Exam Type
                                      </th>
                                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                                        Date
                                      </th>
                                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 text-sm">
                                        Obtained
                                      </th>
                                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 text-sm">
                                        Max
                                      </th>
                                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 text-sm">
                                        Passing
                                      </th>
                                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 text-sm">
                                        %
                                      </th>
                                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 text-sm">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {subjectMarks.map((mark) => {
                                      const passStatus = getPassStatus(mark.marks, mark.passingMarks);
                                      const percentage = mark.maxMarks ? ((mark.marks / mark.maxMarks) * 100).toFixed(1) : 'N/A';
                                      
                                      return (
                                        <tr key={mark._id} className="hover:bg-gray-50 transition-colors">
                                          <td className="border border-gray-300 px-4 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              {formatExamType(mark.examType)}
                                            </span>
                                          </td>
                                          <td className="border border-gray-300 px-4 py-3 text-gray-600 text-sm">
                                            {mark.examDate ? new Date(mark.examDate).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            }) : 'N/A'}
                                          </td>
                                          <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-base">
                                            {mark.marks || 'N/A'}
                                          </td>
                                          <td className="border border-gray-300 px-4 py-3 text-center text-gray-600 text-sm">
                                            {mark.maxMarks || 'N/A'}
                                          </td>
                                          <td className="border border-gray-300 px-4 py-3 text-center text-gray-600 text-sm">
                                            {mark.passingMarks || 'N/A'}
                                          </td>
                                          <td className="border border-gray-300 px-4 py-3 text-center font-medium text-sm">
                                            {percentage !== 'N/A' ? `${percentage}%` : 'N/A'}
                                          </td>
                                          <td className="border border-gray-300 px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                              passStatus.status === 'Pass' 
                                                ? 'bg-green-100 text-green-800' 
                                                : passStatus.status === 'Fail'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                              {passStatus.status}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAcademicMarks;
