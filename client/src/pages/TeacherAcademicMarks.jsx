import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAllSubjects,
  getAllDepartments,
  getAllSemesters,
  getSubjectsByDepartmentAndSemester,
  getStudentsBySubject,
  createOrUpdateMarks,
  getAllMarksForTeacher,
  updateMarksRecord,
  deleteMarksRecord,
  getMarksStatistics
} from '../api/academicMarksApi';
import { toast } from '../utils/toast';

const TeacherAcademicMarks = () => {
  // Existing states for marks entry
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubjectInfo, setSelectedSubjectInfo] = useState(null);
  const [examType, setExamType] = useState('');
  const [examNumber, setExamNumber] = useState('');
  const [examDate, setExamDate] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkMarks, setBulkMarks] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // New states for marks management
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' or 'manage'
  const [allMarks, setAllMarks] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [editingMark, setEditingMark] = useState(null);
  const [deleteConfirmMark, setDeleteConfirmMark] = useState(null);
  const [marksFilters, setMarksFilters] = useState({
    departmentId: '',
    semesterId: '',
    subjectId: '',
    examType: '',
    examNumber: '',
    section: '',
    page: 1,
    limit: 20
  });
  const [marksPagination, setMarksPagination] = useState({});
  const [marksSearchTerm, setMarksSearchTerm] = useState('');
  const [statistics, setStatistics] = useState(null);

  // Mobile-specific states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Mobile detection effect
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Exam type options with enhanced styling
  const examTypes = [
    { 
      value: 'MST', 
      label: 'Mid-Semester Test', 
      icon: '📝',
      description: 'Major evaluation test',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    { 
      value: 'ClassTest', 
      label: 'Class Test', 
      icon: '📋',
      description: 'Regular assessment',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    { 
      value: 'Assignment', 
      label: 'Assignment', 
      icon: '📄',
      description: 'Project submission',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    }
  ];

  // Get exam numbers based on selected exam type
  const getExamNumbers = (type) => {
    const baseNumbers = {
      'MST': 4,
      'ClassTest': 5,
      'Assignment': 5
    };
    
    const count = baseNumbers[type] || 0;
    return Array.from({ length: count }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}${getOrdinalSuffix(i + 1)} ${type === 'MST' ? 'MST' : type === 'ClassTest' ? 'Class Test' : 'Assignment'}`
    }));
  };

  // New function to handle exam type change in marks management filters
  const handleMarksFilterExamTypeChange = (value) => {
    setMarksFilters(prev => ({
      ...prev,
      examType: value,
      examNumber: '', // Reset exam number when exam type changes
      page: 1
    }));
  };
  
  // New function to get exam numbers for marks management filter
  const getMarksFilterExamNumbers = () => {
    if (!marksFilters.examType) return [];
    return getExamNumbers(marksFilters.examType);
  };

  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Fetch functions with enhanced error handling
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllDepartments();
      if (response.success) {
        setDepartments(response.departments || []);
      } else {
        toast.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Error fetching departments');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSemesters = useCallback(async () => {
    try {
      const response = await getAllSemesters();
      if (response.success) {
        setSemesters(response.semesters || []);
      } else {
        toast.error('Failed to fetch semesters');
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Error fetching semesters');
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    if (!departmentId || !semesterId) return;
    
    try {
      setLoading(true);
      const response = await getSubjectsByDepartmentAndSemester(departmentId, semesterId);
      if (response.success) {
        setSubjects(response.subjects || []);
      } else {
        toast.error('Failed to fetch subjects');
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error fetching subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId, semesterId]);

  // Fetch subjects for manage tab when filters change
  const fetchSubjectsForManageTab = useCallback(async () => {
    if (!marksFilters.departmentId || !marksFilters.semesterId) {
      setSubjects([]);
      return;
    }
    
    try {
      const response = await getSubjectsByDepartmentAndSemester(marksFilters.departmentId, marksFilters.semesterId);
      if (response.success) {
        setSubjects(response.subjects || []);
      } else {
        console.error('Failed to fetch subjects for manage tab');
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects for manage tab:', error);
      setSubjects([]);
    }
  }, [marksFilters.departmentId, marksFilters.semesterId]);

  const fetchStudentsBySubject = useCallback(async () => {
    if (!selectedSubject) return;
    
    try {
      setLoading(true);
      const response = await getStudentsBySubject(selectedSubject);
      if (response.success) {
        setStudents(response.students || []);
        setSelectedSubjectInfo(response.subject);
        // Initialize marksData for each student
        const initialMarks = {};
        (response.students || []).forEach(student => {
          initialMarks[student._id] = '';
        });
        setMarksData(initialMarks);
      } else {
        toast.error(response.message || 'Failed to fetch students');
        setStudents([]);
        setSelectedSubjectInfo(null);
        setMarksData({});
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error fetching students');
      setStudents([]);
      setSelectedSubjectInfo(null);
      setMarksData({});
    } finally {
      setLoading(false);
    }
  }, [selectedSubject]);

  // Effects
  useEffect(() => {
    fetchDepartments();
    fetchSemesters();
  }, [fetchDepartments, fetchSemesters]);

  useEffect(() => {
    if (departmentId && semesterId) {
      fetchSubjects();
    } else {
      setSubjects([]);
      setSelectedSubject('');
      setSelectedSubjectInfo(null);
      setStudents([]);
      setMarksData({});
    }
  }, [departmentId, semesterId, fetchSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      fetchStudentsBySubject();
    } else {
      setSelectedSubjectInfo(null);
      setStudents([]);
      setMarksData({});
    }
  }, [selectedSubject, fetchStudentsBySubject]);

  useEffect(() => {
    if (examType) {
      setExamNumber('');
    }
  }, [examType]);

  // Helper functions
  const getCurrentStep = () => {
    if (!departmentId || !semesterId) return 1;
    if (!selectedSubject) return 2;
    if (!examType) return 3;
    if (!examNumber) return 4;
    if (!examDate || !maxMarks || !passingMarks) return 5;
    if (students.length > 0) return 6;
    return 1;
  };

  const handleMarkChange = (studentId, value) => {
    if (value !== '' && (isNaN(value) || value < 0 || value > maxMarks)) {
      toast.error(`Marks must be between 0 and ${maxMarks}`);
      return;
    }

    setMarksData(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleBulkMarkUpdate = () => {
    if (!bulkMarks || isNaN(bulkMarks) || bulkMarks < 0 || bulkMarks > maxMarks) {
      toast.error(`Please enter valid marks between 0 and ${maxMarks}`);
      return;
    }

    const updatedMarks = {};
    students.forEach(student => {
      updatedMarks[student._id] = bulkMarks;
    });
    setMarksData(updatedMarks);
    setBulkMarks('');
    setShowBulkActions(false);
    toast.success('Bulk marks applied successfully');
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validate required fields
      if (!examDate) {
        toast.error('Please select exam date');
        return;
      }
      
      if (!maxMarks || maxMarks <= 0) {
        toast.error('Please enter valid maximum marks');
        return;
      }
      
      if (!passingMarks || passingMarks < 0 || passingMarks > maxMarks) {
        toast.error('Please enter valid passing marks');
        return;
      }
      
      // Prepare marks array for API
      const marksArray = [];
      for (const studentId in marksData) {
        const markValue = marksData[studentId];
        const student = students.find(s => s._id === studentId);
        
        if (student && markValue !== undefined && markValue !== '') {
          marksArray.push({
            student: studentId,
            subject: selectedSubject,
            marks: Number(markValue),
            maxMarks: Number(maxMarks),
            passingMarks: Number(passingMarks),
            examType: `${examType}${examNumber}`,
            examDate: examDate,
            department: student.department._id,
            semester: student.semester._id,
            section: 'A'
          });
        }
      }

      if (marksArray.length === 0) {
        toast.error('No marks to submit');
        return;
      }

      const response = await createOrUpdateMarks(marksArray);
      if (response.success) {
        toast.success(`Successfully saved ${response.results?.length || marksArray.length} marks`);
        if (response.errors && response.errors.length > 0) {
          toast.error(`${response.errors.length} marks failed to save`);
        }
      } else {
        toast.error(response.message || 'Failed to save marks');
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      toast.error('Error saving marks');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDepartmentId('');
    setSemesterId('');
    setSelectedSubject('');
    setSelectedSubjectInfo(null);
    setSubjects([]);
    setStudents([]);
    setMarksData({});
    setExamType('');
    setExamNumber('');
    setExamDate('');
    setMaxMarks(100);
    setPassingMarks(40);
    setSearchTerm('');
    setBulkMarks('');
    setShowBulkActions(false);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.classRollNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const getStatistics = () => {
    const enteredMarks = Object.values(marksData).filter(mark => mark !== '' && !isNaN(mark));
    const total = enteredMarks.length;
    const average = total > 0 ? (enteredMarks.reduce((sum, mark) => sum + Number(mark), 0) / total).toFixed(2) : 0;
    const passed = enteredMarks.filter(mark => Number(mark) >= passingMarks).length;
    const failed = enteredMarks.filter(mark => Number(mark) < passingMarks).length;
    
    return { total, average, passed, failed, remaining: students.length - total };
  };

  const stats = getStatistics();
  const currentStepNumber = getCurrentStep();

  // Enhanced Step Indicator Component
  const StepIndicator = ({ step, title, isActive, isCompleted, isMobile = false }) => (
    <div className={`flex items-center ${isActive ? 'text-primary-600' : isCompleted ? 'text-success-600' : 'text-secondary-400'} ${isMobile ? 'mb-2' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
        isActive ? 'bg-primary-100 border-primary-600 scale-110' : 
        isCompleted ? 'bg-success-100 border-success-600' : 
        'bg-secondary-100 border-secondary-300'
      }`}>
        {isCompleted ? '✓' : step}
      </div>
      <span className={`ml-3 text-sm font-medium ${isMobile ? 'block' : 'hidden sm:block'}`}>{title}</span>
    </div>
  );

  // Mobile Step Navigation
  const MobileStepNavigation = () => (
    <div className="lg:hidden">
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-soft border border-secondary-200 mb-4"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
            {currentStepNumber}
          </div>
          <span className="font-medium text-secondary-900">
            Step {currentStepNumber} of 6
          </span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isMobileMenuOpen && (
        <div className="bg-white rounded-xl shadow-soft border border-secondary-200 p-4 mb-4 space-y-3">
          <StepIndicator step={1} title="Department & Semester" isActive={currentStepNumber === 1} isCompleted={currentStepNumber > 1} isMobile />
          <StepIndicator step={2} title="Subject Selection" isActive={currentStepNumber === 2} isCompleted={currentStepNumber > 2} isMobile />
          <StepIndicator step={3} title="Exam Type" isActive={currentStepNumber === 3} isCompleted={currentStepNumber > 3} isMobile />
          <StepIndicator step={4} title="Exam Number" isActive={currentStepNumber === 4} isCompleted={currentStepNumber > 4} isMobile />
          <StepIndicator step={5} title="Exam Details" isActive={currentStepNumber === 5} isCompleted={currentStepNumber > 5} isMobile />
          <StepIndicator step={6} title="Enter Marks" isActive={currentStepNumber === 6} isCompleted={false} isMobile />
        </div>
      )}
    </div>
  );

  // Desktop Step Progress
  const DesktopStepProgress = () => (
    <div className="hidden lg:block bg-white rounded-xl shadow-soft p-6 mb-6">
      <div className="flex justify-between items-center">
        <StepIndicator step={1} title="Department & Semester" isActive={currentStepNumber === 1} isCompleted={currentStepNumber > 1} />
        <div className="flex-1 h-0.5 bg-secondary-200 mx-4">
          <div className={`h-full bg-primary-600 transition-all duration-500 ${currentStepNumber > 1 ? 'w-full' : 'w-0'}`}></div>
        </div>
        <StepIndicator step={2} title="Subject Selection" isActive={currentStepNumber === 2} isCompleted={currentStepNumber > 2} />
        <div className="flex-1 h-0.5 bg-secondary-200 mx-4">
          <div className={`h-full bg-primary-600 transition-all duration-500 ${currentStepNumber > 2 ? 'w-full' : 'w-0'}`}></div>
        </div>
        <StepIndicator step={3} title="Exam Type" isActive={currentStepNumber === 3} isCompleted={currentStepNumber > 3} />
        <div className="flex-1 h-0.5 bg-secondary-200 mx-4">
          <div className={`h-full bg-primary-600 transition-all duration-500 ${currentStepNumber > 3 ? 'w-full' : 'w-0'}`}></div>
        </div>
        <StepIndicator step={4} title="Exam Number" isActive={currentStepNumber === 4} isCompleted={currentStepNumber > 4} />
        <div className="flex-1 h-0.5 bg-secondary-200 mx-4">
          <div className={`h-full bg-primary-600 transition-all duration-500 ${currentStepNumber > 4 ? 'w-full' : 'w-0'}`}></div>
        </div>
        <StepIndicator step={5} title="Exam Details" isActive={currentStepNumber === 5} isCompleted={currentStepNumber > 5} />
        <div className="flex-1 h-0.5 bg-secondary-200 mx-4">
          <div className={`h-full bg-primary-600 transition-all duration-500 ${currentStepNumber > 5 ? 'w-full' : 'w-0'}`}></div>
        </div>
        <StepIndicator step={6} title="Enter Marks" isActive={currentStepNumber === 6} isCompleted={false} />
      </div>
    </div>
  );

  // New functions for marks management
  const fetchAllMarks = useCallback(async () => {
    try {
      setMarksLoading(true);
      const response = await getAllMarksForTeacher(marksFilters);
      if (response.success) {
        setAllMarks(response.marks || []);
        setMarksPagination(response.pagination || {});
      } else {
        toast.error('Failed to fetch marks records');
      }
    } catch (error) {
      console.error('Error fetching marks:', error);
      toast.error('Error fetching marks records');
    } finally {
      setMarksLoading(false);
    }
  }, [marksFilters]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await getMarksStatistics({
        departmentId: marksFilters.departmentId,
        semesterId: marksFilters.semesterId,
        subjectId: marksFilters.subjectId
      });
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, [marksFilters.departmentId, marksFilters.semesterId, marksFilters.subjectId]);

  const handleEditMark = (mark) => {
    setEditingMark({
      ...mark,
      marks: mark.marks,
      maxMarks: mark.maxMarks,
      passingMarks: mark.passingMarks,
      examDate: mark.examDate ? new Date(mark.examDate).toISOString().split('T')[0] : '',
      section: mark.section
    });
  };

  const handleUpdateMark = async () => {
    try {
      const updateData = {
        marks: Number(editingMark.marks),
        maxMarks: Number(editingMark.maxMarks),
        passingMarks: Number(editingMark.passingMarks),
        examDate: editingMark.examDate,
        section: editingMark.section
      };

      const response = await updateMarksRecord(editingMark._id, updateData);
      if (response.success) {
        toast.success('Marks updated successfully');
        setEditingMark(null);
        fetchAllMarks();
      } else {
        toast.error(response.message || 'Failed to update marks');
      }
    } catch (error) {
      console.error('Error updating marks:', error);
      toast.error('Error updating marks');
    }
  };

  const handleDeleteMark = async (markId) => {
    try {
      const response = await deleteMarksRecord(markId);
      if (response.success) {
        toast.success('Marks deleted successfully');
        setDeleteConfirmMark(null);
        fetchAllMarks();
      } else {
        toast.error(response.message || 'Failed to delete marks');
      }
    } catch (error) {
      console.error('Error deleting marks:', error);
      toast.error('Error deleting marks');
    }
  };

  // Effects for marks management with debouncing
  useEffect(() => {
    if (activeTab === 'manage') {
      const timer = setTimeout(() => {
        fetchAllMarks();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, marksFilters]);

  useEffect(() => {
    if (activeTab === 'manage') {
      const timer = setTimeout(() => {
        fetchStatistics();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, marksFilters.departmentId, marksFilters.semesterId, marksFilters.subjectId]);

  // Effect to fetch subjects for manage tab when department/semester filters change
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchSubjectsForManageTab();
      // Reset subject filter when department or semester changes
      if (marksFilters.subjectId) {
        setMarksFilters(prev => ({ ...prev, subjectId: '', page: 1 }));
      }
    }
  }, [activeTab, marksFilters.departmentId, marksFilters.semesterId, fetchSubjectsForManageTab]);

  // Filter marks based on search term
  const filteredMarks = allMarks.filter(mark =>
    mark.student?.fullname?.toLowerCase().includes(marksSearchTerm.toLowerCase()) ||
    mark.student?.classRollNo?.toLowerCase().includes(marksSearchTerm.toLowerCase()) ||
    mark.subject?.name?.toLowerCase().includes(marksSearchTerm.toLowerCase()) ||
    mark.examType?.toLowerCase().includes(marksSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900 mb-2">
            Academic Marks Management
          </h1>
          <p className="text-secondary-600 text-lg max-w-2xl mx-auto">
            Comprehensive interface for entering and managing student marks
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-soft border border-secondary-200 mb-6">
          <div className="flex flex-col sm:flex-row">
            <button
              onClick={() => setActiveTab('entry')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
                activeTab === 'entry'
                  ? 'bg-primary-600 text-white rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
              }`}
            >
              <span className="text-xl mr-2">✏️</span>
              Enter New Marks
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
                activeTab === 'manage'
                  ? 'bg-primary-600 text-white rounded-b-xl sm:rounded-r-xl sm:rounded-bl-none'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
              }`}
            >
              <span className="text-xl mr-2">📋</span>
              View & Manage Marks
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'entry' ? (
          <>
            {/* Step Progress Indicators */}
            <MobileStepNavigation />
            <DesktopStepProgress />
          </>
        ) : (
          /* Marks Management Section */
          <div className="space-y-6">
            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-6 shadow-soft border border-secondary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary-600">Total Records</p>
                      <p className="text-2xl font-bold text-secondary-900">{statistics.totalRecords}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-soft border border-secondary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary-600">Average Marks</p>
                      <p className="text-2xl font-bold text-secondary-900">{statistics.averageMarks?.toFixed(1) || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📈</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-soft border border-secondary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary-600">Pass Rate</p>
                      <p className="text-2xl font-bold text-success-600">{statistics.passPercentage}%</p>
                    </div>
                    <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-soft border border-secondary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary-600">Highest Score</p>
                      <p className="text-2xl font-bold text-warning-600">{statistics.highestMarks || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🏆</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-soft border border-secondary-200">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden p-4 border-b border-secondary-200">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="w-full flex items-center justify-between p-3 bg-secondary-50 rounded-lg touch-manipulation"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔍</span>
                    <span className="font-medium text-secondary-900">Filters & Search</span>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block p-6 pb-4">
                <h3 className="text-lg font-semibold text-secondary-900">Filter & Search</h3>
              </div>

              {/* Filter Content */}
              <div className={`${showMobileFilters || !isMobileView ? 'block' : 'hidden'} p-4 lg:px-6 lg:pb-6`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                  <select
                    value={marksFilters.departmentId}
                    onChange={e => setMarksFilters(prev => ({ ...prev, departmentId: e.target.value, page: 1 }))}
                    className="input touch-manipulation"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={marksFilters.semesterId}
                    onChange={e => setMarksFilters(prev => ({ ...prev, semesterId: e.target.value, page: 1 }))}
                    className="input touch-manipulation"
                  >
                    <option value="">All Semesters</option>
                    {semesters.map(sem => (
                      <option key={sem._id} value={sem._id}>
                        {sem.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={marksFilters.subjectId}
                    onChange={e => setMarksFilters(prev => ({ ...prev, subjectId: e.target.value, page: 1 }))}
                    className="input touch-manipulation"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={marksFilters.examType}
                    onChange={e => handleMarksFilterExamTypeChange(e.target.value)}
                    className="input touch-manipulation"
                  >
                    <option value="">Select Exam Type</option>
                    {examTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={marksFilters.examNumber || ''}
                    onChange={e => setMarksFilters(prev => ({ ...prev, examNumber: e.target.value, page: 1 }))}
                    className="input touch-manipulation"
                    disabled={!marksFilters.examType}
                  >
                    <option value="">Select Exam Number</option>
                    {marksFilters.examType && getMarksFilterExamNumbers().map(num => (
                      <option key={num.value} value={num.value}>
                        {num.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Search students, subjects..."
                    value={marksSearchTerm}
                    onChange={e => setMarksSearchTerm(e.target.value)}
                    className="input touch-manipulation"
                  />
                </div>
                
                {/* Clear Filters Button */}
                <button
                  onClick={() => {
                    setMarksFilters({
                      departmentId: '',
                      semesterId: '',
                      subjectId: '',
                      examType: '',
                      examNumber: '',
                      section: '',
                      page: 1,
                      limit: 20
                    });
                    setMarksSearchTerm('');
                  }}
                  className="btn-secondary btn-sm touch-manipulation"
                >
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Marks Table */}
            <div className="bg-white rounded-xl shadow-soft border border-secondary-200">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-secondary-900">Marks Records</h3>
                  <div className="text-sm text-secondary-600">
                    {filteredMarks.length} of {allMarks.length} records
                  </div>
                </div>
              </div>

              {marksLoading ? (
                <div className="p-8 text-center">
                  <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                  <p className="text-secondary-600">Loading marks records...</p>
                </div>
              ) : filteredMarks.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-secondary-600 text-lg">No marks records found</p>
                  <p className="text-secondary-500">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-header-cell">Student</th>
                          <th className="table-header-cell">Subject</th>
                          <th className="table-header-cell">Exam</th>
                          <th className="table-header-cell">Marks</th>
                          <th className="table-header-cell">Grade</th>
                          <th className="table-header-cell">Status</th>
                          <th className="table-header-cell">Date</th>
                          <th className="table-header-cell">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="table-body">
                        {filteredMarks.map(mark => (
                          <tr key={mark._id} className="hover:bg-secondary-50 transition-colors">
                            <td className="table-cell">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-primary-600 font-semibold">
                                    {mark.student?.fullname?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-secondary-900">{mark.student?.fullname}</div>
                                  <div className="text-xs text-secondary-500">Roll: {mark.student?.classRollNo}</div>
                                </div>
                              </div>
                            </td>
                            <td className="table-cell">
                              <div>
                                <div className="font-medium text-secondary-900">{mark.subject?.name}</div>
                                <div className="text-xs text-secondary-500">{mark.subject?.code}</div>
                              </div>
                            </td>
                            <td className="table-cell">
                              <span className="badge badge-primary">{mark.examType}</span>
                            </td>
                            <td className="table-cell">
                              <div className="text-center">
                                <div className="font-bold text-lg">{mark.marks}/{mark.maxMarks}</div>
                                <div className="text-xs text-secondary-500">{mark.percentage}%</div>
                              </div>
                            </td>
                            <td className="table-cell">
                              <span className={`badge ${
                                mark.grade === 'A+' || mark.grade === 'A' ? 'badge-success' :
                                mark.grade === 'B+' || mark.grade === 'B' ? 'badge-warning' :
                                mark.grade === 'C+' || mark.grade === 'C' ? 'badge-secondary' :
                                'badge-error'
                              }`}>
                                {mark.grade}
                              </span>
                            </td>
                            <td className="table-cell">
                              <span className={`badge ${mark.isPassed ? 'badge-success' : 'badge-error'}`}>
                                {mark.isPassed ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                            <td className="table-cell">
                              <div className="text-sm text-secondary-600">
                                {new Date(mark.examDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="table-cell">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditMark(mark)}
                                  className="btn-sm btn-secondary"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmMark(mark)}
                                  className="btn-sm btn-error"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4 p-4">
                    {filteredMarks.map(mark => (
                      <div key={mark._id} className="bg-secondary-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-primary-600 font-semibold">
                                {mark.student?.fullname?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-secondary-900">{mark.student?.fullname}</div>
                              <div className="text-xs text-secondary-500">Roll: {mark.student?.classRollNo}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditMark(mark)}
                              className="btn-sm btn-secondary"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setDeleteConfirmMark(mark)}
                              className="btn-sm btn-error"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-secondary-500">Subject:</span>
                            <div className="font-medium">{mark.subject?.name}</div>
                          </div>
                          <div>
                            <span className="text-secondary-500">Exam:</span>
                            <div className="font-medium">{mark.examType}</div>
                          </div>
                          <div>
                            <span className="text-secondary-500">Marks:</span>
                            <div className="font-medium">{mark.marks}/{mark.maxMarks} ({mark.percentage}%)</div>
                          </div>
                          <div>
                            <span className="text-secondary-500">Grade:</span>
                            <div className="font-medium">{mark.grade}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`badge ${mark.isPassed ? 'badge-success' : 'badge-error'}`}>
                            {mark.isPassed ? 'Pass' : 'Fail'}
                          </span>
                          <span className="text-xs text-secondary-500">
                            {new Date(mark.examDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Entry Tab Content */}
        {activeTab === 'entry' && (
          <div className="space-y-6">
          {/* Step 1: Department and Semester Selection */}
          <div className={`card transition-all duration-300 ${currentStepNumber === 1 ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}>
            <div className="card-body">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mr-4">1</div>
                <div>
                  <h2 className="text-xl font-semibold text-secondary-900">Department & Semester Selection</h2>
                  <p className="text-secondary-600 text-sm">Choose the department and semester for marks entry</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary-700">
                    🏢 Department <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="input text-base"
                    disabled={loading}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary-700">
                    📚 Semester <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={semesterId}
                    onChange={e => setSemesterId(e.target.value)}
                    className="input text-base"
                    disabled={loading}
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem._id} value={sem._id}>
                        {sem.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={resetForm}
                    className="btn-secondary w-full text-base py-3"
                    disabled={loading}
                  >
                    🔄 Reset Form
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Subject Selection */}
          {departmentId && semesterId && (
            <div className={`card transition-all duration-300 ${currentStepNumber === 2 ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}>
              <div className="card-body">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mr-4">2</div>
                  <div>
                    <h2 className="text-xl font-semibold text-secondary-900">Subject Selection</h2>
                    <p className="text-secondary-600 text-sm">Choose the subject for which you want to enter marks</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-secondary-700">
                      📖 Subject <span className="text-error-500">*</span>
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="input text-base"
                      disabled={loading}
                    >
                      <option value="">Choose a subject</option>
                      {subjects.map(subject => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {subjects.length === 0 && !loading && (
                  <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-warning-800">⚠️ No subjects found for the selected department and semester.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Exam Type Selection */}
          {selectedSubject && (
            <div className={`card transition-all duration-300 ${currentStepNumber === 3 ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}>
              <div className="card-body">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mr-4">3</div>
                  <div>
                    <h2 className="text-xl font-semibold text-secondary-900">Exam Type Selection</h2>
                    <p className="text-secondary-600 text-sm">Select the type of examination or assessment</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {examTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setExamType(type.value)}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        examType === type.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-medium'
                          : 'border-secondary-200 hover:border-secondary-300 text-secondary-700 hover:bg-secondary-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-3">{type.icon}</div>
                        <div className="font-semibold text-lg mb-1">{type.label}</div>
                        <div className="text-sm text-secondary-500">{type.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Exam Number Selection */}
          {examType && (
            <div className={`card transition-all duration-300 ${currentStepNumber === 4 ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}>
              <div className="card-body">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mr-4">4</div>
                  <div>
                    <h2 className="text-xl font-semibold text-secondary-900">Exam Number Selection</h2>
                    <p className="text-secondary-600 text-sm">Choose which number of {examType.toLowerCase()} this is</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {getExamNumbers(examType).map(num => (
                    <button
                      key={num.value}
                      onClick={() => setExamNumber(num.value)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-center hover:scale-105 ${
                        examNumber === num.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-medium'
                          : 'border-secondary-200 hover:border-secondary-300 text-secondary-700 hover:bg-secondary-50'
                      }`}
                    >
                      <div className="font-medium text-sm">{num.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Exam Details */}
          {examType && examNumber && (
            <div className={`card transition-all duration-300 ${currentStepNumber === 5 ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}>
              <div className="card-body">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mr-4">5</div>
                  <div>
                    <h2 className="text-xl font-semibold text-secondary-900">Exam Details</h2>
                    <p className="text-secondary-600 text-sm">Configure the exam parameters and marking scheme</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-secondary-700">
                      📅 Exam Date <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={e => setExamDate(e.target.value)}
                      className="input text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-secondary-700">
                      🎯 Maximum Marks <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={maxMarks}
                      onChange={e => setMaxMarks(Number(e.target.value))}
                      className="input text-base"
                      placeholder="e.g., 100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-secondary-700">
                      ✅ Passing Marks <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxMarks}
                      value={passingMarks}
                      onChange={e => setPassingMarks(Number(e.target.value))}
                      className="input text-base"
                      placeholder="e.g., 40"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Enter Marks */}
          {examDate && maxMarks && passingMarks && students.length > 0 && (
            <div className={`card transition-all duration-300 ${currentStepNumber === 6 ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}>
              <div className="card-body">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mr-4">6</div>
                  <div>
                    <h2 className="text-xl font-semibold text-secondary-900">Enter Student Marks</h2>
                    <p className="text-secondary-600 text-sm">
                      Enter marks for {examType} {examNumber} - {selectedSubjectInfo?.name} ({selectedSubjectInfo?.code})
                    </p>
                  </div>
                </div>

                {/* Exam Summary */}
                <div className="bg-secondary-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary-600">{maxMarks}</div>
                      <div className="text-sm text-secondary-600">Max Marks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success-600">{passingMarks}</div>
                      <div className="text-sm text-secondary-600">Passing Marks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-secondary-600">{students.length}</div>
                      <div className="text-sm text-secondary-600">Total Students</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-warning-600">{new Date(examDate).toLocaleDateString()}</div>
                      <div className="text-sm text-secondary-600">Exam Date</div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                {stats.total > 0 && (
                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-secondary-900 mb-3">📊 Current Statistics</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-primary-600">{stats.total}</div>
                        <div className="text-xs text-secondary-600">Entered</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-warning-600">{stats.remaining}</div>
                        <div className="text-xs text-secondary-600">Remaining</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-secondary-600">{stats.average}</div>
                        <div className="text-xs text-secondary-600">Average</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-success-600">{stats.passed}</div>
                        <div className="text-xs text-secondary-600">Passed</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-error-600">{stats.failed}</div>
                        <div className="text-xs text-secondary-600">Failed</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search and Bulk Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search students by name or roll number..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="input pl-10 text-base"
                      />
                      <svg className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="btn-secondary px-6"
                  >
                    ⚡ Bulk Actions
                  </button>
                </div>

                {/* Bulk Actions Panel */}
                {showBulkActions && (
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-warning-800 mb-3">Bulk Mark Entry</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        value={bulkMarks}
                        onChange={e => setBulkMarks(e.target.value)}
                        placeholder={`Enter marks (0-${maxMarks})`}
                        className="input flex-1"
                      />
                      <button
                        onClick={handleBulkMarkUpdate}
                        className="btn-warning px-6"
                        disabled={!bulkMarks}
                      >
                        Apply to All
                      </button>
                      <button
                        onClick={() => setShowBulkActions(false)}
                        className="btn-secondary px-4"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Students Marks Entry */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                      <p className="text-secondary-600">Loading students...</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">👥</div>
                      <p className="text-secondary-600 text-lg">
                        {searchTerm ? 'No students found matching your search.' : 'No students found for this subject.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="table">
                          <thead className="table-header">
                            <tr>
                              <th className="table-header-cell">Student Details</th>
                              <th className="table-header-cell">Roll Number</th>
                              <th className="table-header-cell">Department</th>
                              <th className="table-header-cell">Marks</th>
                              <th className="table-header-cell">Status</th>
                            </tr>
                          </thead>
                          <tbody className="table-body">
                            {filteredStudents.map(student => {
                              const marks = marksData[student._id];
                              const isPass = marks !== '' && !isNaN(marks) && Number(marks) >= passingMarks;
                              const isFail = marks !== '' && !isNaN(marks) && Number(marks) < passingMarks;
                              
                              return (
                                <tr key={student._id} className="hover:bg-secondary-50 transition-colors">
                                  <td className="table-cell">
                                    <div className="flex items-center">
                                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-primary-600 font-semibold">
                                          {student.fullname?.charAt(0)?.toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-medium text-secondary-900">{student.fullname}</div>
                                        <div className="text-xs text-secondary-400">
                                          Class: {student.semester?.name} | Section: {student.section || 'A'}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="table-cell">
                                    <div className="text-center">
                                      <span className="font-mono text-sm bg-secondary-100 px-2 py-1 rounded block mb-1">
                                        {student.classRollNo}
                                      </span>
                                      <span className="text-xs text-secondary-500">Class Roll No</span>
                                    </div>
                                  </td>
                                  <td className="table-cell">
                                    <span className="text-sm text-secondary-600">
                                      {student.department?.name}
                                    </span>
                                  </td>
                                  <td className="table-cell">
                                    <input
                                      type="number"
                                      min="0"
                                      max={maxMarks}
                                      value={marks}
                                      onChange={e => handleMarkChange(student._id, e.target.value)}
                                      className="w-20 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="table-cell">
                                    {marks === '' || isNaN(marks) ? (
                                      <span className="badge badge-secondary">Pending</span>
                                    ) : isPass ? (
                                      <span className="badge badge-success">Pass</span>
                                    ) : isFail ? (
                                      <span className="badge badge-error">Fail</span>
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {filteredStudents.map(student => {
                          const marks = marksData[student._id];
                          const isPass = marks !== '' && !isNaN(marks) && Number(marks) >= passingMarks;
                          const isFail = marks !== '' && !isNaN(marks) && Number(marks) < passingMarks;
                          
                          return (
                            <div key={student._id} className="card">
                              <div className="card-body">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                      <span className="text-primary-600 font-semibold text-lg">
                                        {student.fullname?.charAt(0)?.toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-secondary-900">{student.fullname || 'N/A'}</div>
                                      <div className="text-sm text-secondary-500">Roll: {student.classRollNo || 'N/A'}</div>
                                      <div className="text-xs text-secondary-400">
                                        {student.semester?.name || 'N/A'} | Sec: {student.section || 'A'}
                                      </div>
                                    </div>
                                  </div>
                                  {marks === '' || isNaN(marks) ? (
                                    <span className="badge badge-secondary">Pending</span>
                                  ) : isPass ? (
                                    <span className="badge badge-success">Pass</span>
                                  ) : isFail ? (
                                    <span className="badge badge-error">Fail</span>
                                  ) : null}
                                </div>
                                
                                <div className="mb-4 text-sm">
                                  <div>
                                    <span className="text-secondary-500">Department:</span>
                                    <div className="font-medium">{student.department?.name || 'N/A'}</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium text-secondary-700">
                                    Marks (out of {maxMarks}):
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxMarks}
                                    value={marks}
                                    onChange={e => handleMarkChange(student._id, e.target.value)}
                                    className="w-24 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Submit Button */}
                {students.length > 0 && (
                  <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                      onClick={resetForm}
                      className="btn-secondary px-8 py-3"
                      disabled={submitting}
                    >
                      🔄 Reset All
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || Object.values(marksData).every(mark => mark === '')}
                      className="btn-primary px-8 py-3 text-lg"
                    >
                      {submitting ? (
                        <>
                          <div className="loading-spinner w-5 h-5 mr-2"></div>
                          Saving Marks...
                        </>
                      ) : (
                        <>
                          💾 Save Marks ({Object.values(marksData).filter(mark => mark !== '').length})
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        )}

        {/* Edit Modal */}
        {editingMark && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Edit Marks</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Student: {editingMark.student?.fullname}
                    </label>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Subject: {editingMark.subject?.name}
                    </label>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Exam: {editingMark.examType}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Marks
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={editingMark.maxMarks}
                      value={editingMark.marks}
                      onChange={e => setEditingMark(prev => ({ ...prev, marks: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Maximum Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingMark.maxMarks}
                      onChange={e => setEditingMark(prev => ({ ...prev, maxMarks: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={editingMark.maxMarks}
                      value={editingMark.passingMarks}
                      onChange={e => setEditingMark(prev => ({ ...prev, passingMarks: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      value={editingMark.examDate}
                      onChange={e => setEditingMark(prev => ({ ...prev, examDate: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setEditingMark(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateMark}
                    className="btn-primary flex-1"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmMark && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Confirm Delete</h3>
                <p className="text-secondary-600 mb-6">
                  Are you sure you want to delete the marks for{' '}
                  <strong>{deleteConfirmMark.student?.fullname}</strong> in{' '}
                  <strong>{deleteConfirmMark.subject?.name}</strong> ({deleteConfirmMark.examType})?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmMark(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteMark(deleteConfirmMark._id)}
                    className="btn-error flex-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAcademicMarks;
