import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import cumulativeAttendanceApi from '../api/cumulativeAttendanceApi';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentCumulativeAttendanceView from '../components/StudentCumulativeAttendanceView';
import { toast } from '../utils/toast';

const Attendance = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('individual'); // 'individual' or 'cumulative'
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [cumulativeRecords, setCumulativeRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCumulativeForm, setShowCumulativeForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showCumulativeDetailsModal, setShowCumulativeDetailsModal] = useState(false);
  const [selectedCumulativeRecord, setSelectedCumulativeRecord] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [cumulativeStats, setCumulativeStats] = useState(null);
  const [formData, setFormData] = useState({
    department: '',
    semester: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    classType: 'lecture',
    section: '',
    topic: '',
    studentAttendance: []
  });
  const [cumulativeFormData, setCumulativeFormData] = useState({
    department: '',
    semester: '',
    dateUpTo: new Date().toISOString().split('T')[0],
    totalLecturesHeld: '',
    session: '',
    students: []
  });

  const classTypes = ['lecture', 'practical', 'tutorial', 'seminar'];
  const sections = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    if (authLoading || !user) return;

    const isTeacherOrAdmin = user.role === 'Teacher' || user.role === 'Admin';

    // Fetch data based on user role and active tab
    if (activeTab === 'individual') {
      fetchAttendanceRecords();
      if (isTeacherOrAdmin) {
        fetchStats();
      }
    } else if (activeTab === 'cumulative') {
      fetchCumulativeRecords();
      if (isTeacherOrAdmin) {
        fetchCumulativeStats();
      }
    }

    // Fetch common data for teachers/admins
    if (isTeacherOrAdmin) {
      fetchDepartments();
    }
  }, [user, authLoading, activeTab]);

  const fetchAttendanceRecords = async () => {
    try {
      let response;
      if (user?.role === 'Student') {
        // Fetch student's own attendance records with analytics
        response = await axiosInstance.get('/attendance/student/my-attendance');
        setAttendanceRecords(response.data.data.records || []);
        setStats({
          ...response.data.data.overallAnalytics,
          subjectWiseAnalytics: response.data.data.subjectWiseAnalytics || []
        });
      } else {
        // Fetch all attendance records for teachers/admins
        response = await axiosInstance.get('/attendance');
        const sortedRecords = (response.data.attendanceRecords || []).sort((a, b) => 
          new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt)
        );
        setAttendanceRecords(sortedRecords);
      }
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceDetails = async (recordId) => {
    try {
      const response = await axiosInstance.get(`/attendance/${recordId}`);
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch attendance details');
      return null;
    }
  };

  const handleViewDetails = async (record) => {
    const detailedRecord = await fetchAttendanceDetails(record._id);
    if (detailedRecord) {
      setSelectedRecord(detailedRecord);
      setShowDetailsModal(true);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRecord(null);
  };

  const fetchCumulativeAttendanceDetails = async (recordId) => {
    try {
      const response = await cumulativeAttendanceApi.getCumulativeAttendanceById(recordId);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch cumulative attendance details');
      return null;
    }
  };

  const handleViewCumulativeDetails = async (record) => {
    const detailedRecord = await fetchCumulativeAttendanceDetails(record._id);
    if (detailedRecord) {
      setSelectedCumulativeRecord(detailedRecord);
      setShowCumulativeDetailsModal(true);
    }
  };

  const closeCumulativeDetailsModal = () => {
    setShowCumulativeDetailsModal(false);
    setSelectedCumulativeRecord(null);
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/attendance/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  // Cumulative attendance functions
  const fetchCumulativeRecords = async () => {
    try {
      setLoading(true);
      if (user?.role === 'Student') {
        const response = await cumulativeAttendanceApi.getStudentCumulativeAttendance();
        setCumulativeRecords(response.data || []);
      } else {
        const response = await cumulativeAttendanceApi.getCumulativeAttendanceByFilters();
        setCumulativeRecords(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch cumulative attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchCumulativeStats = async () => {
    try {
      const response = await cumulativeAttendanceApi.getCumulativeAttendanceStats();
      setCumulativeStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch cumulative stats');
    }
  };

  const fetchStudentsForCumulative = async (departmentId, semesterId) => {
    if (!departmentId || !semesterId) return;
    try {
      const url = `/academic-details/department/${departmentId}/semester/${semesterId}`;
      const response = await axiosInstance.get(url);
      const studentList = response.data.students || [];
      setStudents(studentList);
      
      // Initialize cumulative attendance for all students
      setCumulativeFormData(prev => ({
        ...prev,
        students: studentList.map(student => ({
          studentId: student.userId._id,
          studentName: student.fullname,
          rollNo: student.universityRollNo,
          lecturesAttended: 0
        }))
      }));
    } catch (error) {
      console.error('Error fetching students for cumulative:', error);
      toast.error('Failed to fetch students');
      setStudents([]);
      setCumulativeFormData(prev => ({
        ...prev,
        students: []
      }));
    }
  };

  const handleCumulativeInputChange = async (e) => {
    const { name, value } = e.target;
    setCumulativeFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'department') {
      await fetchSemesters();
      setCumulativeFormData(prev => ({ ...prev, semester: '', students: [] }));
    }

    if (name === 'semester' && cumulativeFormData.department) {
      fetchStudentsForCumulative(cumulativeFormData.department, value);
    }
  };

  const handleCumulativeAttendanceChange = (studentId, lecturesAttended) => {
    setCumulativeFormData(prev => ({
      ...prev,
      students: prev.students.map(student =>
        student.studentId === studentId
          ? { ...student, lecturesAttended: parseInt(lecturesAttended) || 0 }
          : student
      )
    }));
  };

  const handleCumulativeSubmit = async (e) => {
    e.preventDefault();
    
    if (!cumulativeFormData.students || cumulativeFormData.students.length === 0) {
      toast.error('Please select students first by choosing department and semester');
      return;
    }

    if (!cumulativeFormData.totalLecturesHeld || cumulativeFormData.totalLecturesHeld <= 0) {
      toast.error('Please enter a valid number of total lectures held');
      return;
    }

    try {
      const cumulativeData = {
        department: cumulativeFormData.department,
        semester: cumulativeFormData.semester,
        dateUpTo: cumulativeFormData.dateUpTo,
        totalLecturesHeld: parseInt(cumulativeFormData.totalLecturesHeld),
        session: cumulativeFormData.session || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        students: cumulativeFormData.students.map(student => ({
          studentId: student.studentId,
          lecturesAttended: student.lecturesAttended
        }))
      };

      await cumulativeAttendanceApi.createOrUpdateCumulativeAttendance(cumulativeData);
      toast.success('Cumulative attendance saved successfully');
      setShowCumulativeForm(false);
      setCumulativeFormData({
        department: '',
        semester: '',
        dateUpTo: new Date().toISOString().split('T')[0],
        totalLecturesHeld: '',
        session: '',
        students: []
      });
      fetchCumulativeRecords();
      fetchCumulativeStats();
    } catch (error) {
      console.error('Cumulative attendance submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to save cumulative attendance');
    }
  };

  // Handle edit cumulative record
  const handleEditCumulativeRecord = async (record) => {
    try {
      // Fetch students for the department and semester
      await fetchStudentsForCumulative(record.department._id, record.semester._id);
      
      // Pre-populate the form with existing data
      setCumulativeFormData({
        department: record.department._id,
        semester: record.semester._id,
        dateUpTo: new Date(record.dateUpTo).toISOString().split('T')[0],
        totalLecturesHeld: record.totalLecturesHeld.toString(),
        session: record.session,
        students: record.students.map(student => ({
          studentId: student.studentId._id || student.studentId,
          studentName: student.studentId?.academicDetails?.fullname || student.studentId?.fullname || 'N/A',
          rollNo: student.studentId?.academicDetails?.universityRollNo || 'N/A',
          lecturesAttended: student.lecturesAttended
        }))
      });
      
      setShowCumulativeForm(true);
      toast.info('Editing cumulative attendance record');
    } catch (error) {
      console.error('Error loading record for edit:', error);
      toast.error('Failed to load record for editing');
    }
  };

  // Handle delete cumulative record
  const handleDeleteCumulativeRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this cumulative attendance record? This action cannot be undone.')) {
      return;
    }

    try {
      await cumulativeAttendanceApi.deleteCumulativeAttendance(recordId);
      toast.success('Cumulative attendance record deleted successfully');
      fetchCumulativeRecords();
      fetchCumulativeStats();
    } catch (error) {
      console.error('Error deleting cumulative record:', error);
      toast.error(error.response?.data?.message || 'Failed to delete cumulative attendance record');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      toast.error('Failed to fetch departments');
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await axiosInstance.get('/semesters');
      setSemesters(response.data.semesters || []);
    } catch (error) {
      toast.error('Failed to fetch semesters');
    }
  };

  const fetchSubjects = async (departmentId, semesterId) => {
    if (!departmentId || !semesterId) return;
    try {
      const response = await axiosInstance.get(`/subjects/department/${departmentId}/semester/${semesterId}`);
      setSubjects(response.data.subjects || []);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchStudents = async (departmentId, semesterId, section = null) => {
    if (!departmentId || !semesterId) return;
    try {
      let url = `/academic-details/department/${departmentId}/semester/${semesterId}`;
      
      // If section is provided (for practical classes), use section-specific endpoint
      if (section) {
        url = `/academic-details/department/${departmentId}/semester/${semesterId}/section/${section}`;
      }
      
      const response = await axiosInstance.get(url);
      const studentList = response.data.students || [];
      setStudents(studentList);
      
      // Initialize attendance for all students
      setFormData(prev => ({
        ...prev,
        studentAttendance: studentList.map(student => ({
          studentId: student.userId._id,
          studentName: student.fullname,
          rollNo: student.universityRollNo,
          isPresent: false
        }))
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setStudents([]);
      setFormData(prev => ({
        ...prev,
        studentAttendance: []
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'department') {
      fetchSemesters();
      setFormData(prev => ({ ...prev, semester: '', subject: '', section: '' }));
    }

    if (name === 'semester' && formData.department) {
      fetchSubjects(formData.department, value);
      // For lecture, fetch all students; for practical, wait for section selection
      if (formData.classType === 'lecture') {
        fetchStudents(formData.department, value);
      }
      setFormData(prev => ({ ...prev, subject: '', section: '' }));
    }

    if (name === 'classType') {
      // When class type changes, refetch students based on the new type
      if (formData.department && formData.semester) {
        if (value === 'lecture') {
          // For lecture, fetch all students (no section filtering)
          fetchStudents(formData.department, formData.semester);
          setFormData(prev => ({ ...prev, section: '' }));
        } else if (value === 'practical') {
          // For practical, clear students until section is selected
          setStudents([]);
          setFormData(prev => ({ 
            ...prev, 
            studentAttendance: [],
            section: '' 
          }));
        }
      }
    }

    if (name === 'section' && formData.classType === 'practical' && formData.department && formData.semester) {
      // For practical classes, fetch students by section
      fetchStudents(formData.department, formData.semester, value);
    }
  };

  const handleAttendanceChange = (studentId, isPresent) => {
    setFormData(prev => ({
      ...prev,
      studentAttendance: prev.studentAttendance.map(student =>
        student.studentId === studentId
          ? { ...student, isPresent }
          : student
      )
    }));
  };

  const markAllPresent = () => {
    if (!formData.studentAttendance || formData.studentAttendance.length === 0) {
      return;
    }
    
    setFormData(prevFormData => ({
      ...prevFormData,
      studentAttendance: prevFormData.studentAttendance.map(student => ({
        ...student,
        isPresent: true
      }))
    }));
    
    // Force re-render by updating a timestamp
    setTimeout(() => {
      setFormData(prev => ({ ...prev }));
    }, 10);
  };

  const markAllAbsent = () => {
    if (!formData.studentAttendance || formData.studentAttendance.length === 0) {
      return;
    }
    
    setFormData(prevFormData => ({
      ...prevFormData,
      studentAttendance: prevFormData.studentAttendance.map(student => ({
        ...student,
        isPresent: false
      }))
    }));
    
    // Force re-render by updating a timestamp
    setTimeout(() => {
      setFormData(prev => ({ ...prev }));
    }, 10);
  };

  const clearAllAttendance = () => {
    if (!formData.studentAttendance || formData.studentAttendance.length === 0) {
      return;
    }
    
    setFormData(prevFormData => ({
      ...prevFormData,
      studentAttendance: prevFormData.studentAttendance.map(student => ({
        ...student,
        isPresent: null // Reset to unselected state
      }))
    }));
    
    // Force re-render
    setTimeout(() => {
      setFormData(prev => ({ ...prev }));
    }, 10);
  };

  const getAttendanceStats = () => {
    if (!formData.studentAttendance || formData.studentAttendance.length === 0) {
      return { total: 0, present: 0, absent: 0, unselected: 0 };
    }
    
    const total = formData.studentAttendance.length;
    const present = formData.studentAttendance.filter(s => s.isPresent === true).length;
    const absent = formData.studentAttendance.filter(s => s.isPresent === false).length;
    const unselected = formData.studentAttendance.filter(s => s.isPresent === null || s.isPresent === undefined).length;
    
    return { total, present, absent, unselected };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that students are selected
    if (!formData.studentAttendance || formData.studentAttendance.length === 0) {
      toast.error('Please select students first by choosing department and semester');
      return;
    }

    try {
      // Transform frontend data to match backend expectations
      const attendanceData = {
        subject: formData.subject,
        department: formData.department,
        semester: formData.semester,
        date: formData.date,
        classType: formData.classType,
        session: formData.topic || 'Regular Class',
        teacherId: user._id,
        students: formData.studentAttendance.map(student => ({
          studentId: student.studentId,
          status: student.isPresent ? 'Present' : 'Absent'
        }))
      };

      // Add section only for practical classes
      if (formData.classType === 'practical' && formData.section) {
        attendanceData.section = formData.section;
      }

      console.log('Submitting attendance data:', attendanceData);
      console.log('Students data:', attendanceData.students);

      await axiosInstance.post('/attendance', attendanceData);
      toast.success('Attendance recorded successfully');
      setShowCreateForm(false);
      setFormData({
        department: '',
        semester: '',
        subject: '',
        date: new Date().toISOString().split('T')[0],
        classType: 'lecture',
        section: '',
        topic: '',
        studentAttendance: []
      });
      fetchAttendanceRecords();
      fetchStats();
    } catch (error) {
      console.error('Attendance submission error:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        error.response.data.errors.forEach(err => {
          console.error(`Field: ${err.path || err.param}, Message: ${err.msg}`);
        });
      }
      toast.error(error.response?.data?.message || 'Failed to record attendance');
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to view attendance.</p>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 lg:mb-6 space-y-2 sm:space-y-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 leading-tight">
          {user?.role === 'Student' ? 'My Attendance Analytics' : 'Attendance Management'}
        </h1>
        {(user?.role === 'Teacher' || user?.role === 'Admin') && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {activeTab === 'individual' ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-3 py-3 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 font-medium text-sm sm:text-base transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px]"
              >
                📝 Mark Attendance
              </button>
            ) : (
              <button
                onClick={() => setShowCumulativeForm(true)}
                className="w-full sm:w-auto bg-green-600 text-white px-3 py-3 sm:px-4 sm:py-2 rounded-lg hover:bg-green-700 active:bg-green-800 font-medium text-sm sm:text-base transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px]"
              >
                📊 Manage Cumulative Attendance
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile-optimized tabs */}
      <div className="mb-3 sm:mb-4 lg:mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('individual')}
                className={`flex-1 sm:flex-none py-3 sm:py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors touch-manipulation min-h-[44px] sm:min-h-auto ${
                  activeTab === 'individual'
                    ? 'border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 Individual
              </button>
              <button
                onClick={() => setActiveTab('cumulative')}
                className={`flex-1 sm:flex-none py-3 sm:py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors touch-manipulation min-h-[44px] sm:min-h-auto ${
                  activeTab === 'cumulative'
                    ? 'border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Cumulative
              </button>
            </nav>
          </div>
        </div>

      {/* Content based on active tab */}
      {activeTab === 'individual' && (
        <>
          {/* Statistics */}
          {stats && (
            <>
              {user?.role === 'Student' ? (
                // Student-specific analytics - Mobile optimized
                <>
                  {/* Subject-wise Analytics - Mobile optimized */}
                  {stats.subjectWiseAnalytics && stats.subjectWiseAnalytics.length > 0 && (
                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow border mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Subject-wise Attendance</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {stats.subjectWiseAnalytics.map((subjectStat) => (
                          <div key={subjectStat._id} className="border rounded-lg p-3 sm:p-4">
                            <h3 className="font-semibold text-sm sm:text-lg text-blue-600 mb-2 truncate">
                              {subjectStat.subject?.name || 'Unknown Subject'}
                            </h3>
                            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Classes:</span>
                                <span className="font-medium">{subjectStat.totalClasses}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Present:</span>
                                <span className="font-medium text-green-600">{subjectStat.presentCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Attendance:</span>
                                <span className={`font-bold ${
                                  subjectStat.attendancePercentage >= 75 ? 'text-green-600' : 
                                  subjectStat.attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {Math.round(subjectStat.attendancePercentage)}%
                                </span>
                              </div>
                              {subjectStat.lastAttendance && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Last Class:</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(subjectStat.lastAttendance).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Teacher/Admin statistics - Mobile optimized
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
                  <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.totalClasses || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Classes</div>
                  </div>
                  <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.averageAttendance || 0}%</div>
                    <div className="text-xs sm:text-sm text-gray-600">Average Attendance</div>
                  </div>
                  <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
                    <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.totalStudents || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
                    <div className="text-lg sm:text-2xl font-bold text-purple-600">{stats.classesToday || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Classes Today</div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'cumulative' && user?.role === 'Student' && (
        <StudentCumulativeAttendanceView records={cumulativeRecords} />
      )}

      {activeTab === 'cumulative' && (user?.role === 'Teacher' || user?.role === 'Admin') && (
        <>
          {/* Cumulative Statistics for Teacher/Admin - Mobile optimized */}
          {cumulativeStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
              <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{cumulativeStats.totalRecords || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Records</div>
              </div>
              <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{cumulativeStats.adequatePercentage || 0}%</div>
                <div className="text-xs sm:text-sm text-gray-600">Adequate Attendance</div>
              </div>
              <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">{cumulativeStats.totalStudents || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Students Tracked</div>
              </div>
              <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">{Math.round(cumulativeStats.averageAttendance || 0)}%</div>
                <div className="text-xs sm:text-sm text-gray-600">Average Attendance</div>
              </div>
            </div>
          )}
        </>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Mark Attendance</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 p-1 sm:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mobile-optimized form layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem._id} value={sem._id}>{sem.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subj => (
                      <option key={subj._id} value={subj._id}>{subj.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Type</label>
                  <select
                    name="classType"
                    value={formData.classType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  >
                    {classTypes.map(type => (
                      <option key={type} value={type} className="capitalize">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section dropdown - only show for practical classes */}
              {formData.classType === 'practical' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    required={formData.classType === 'practical'}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  >
                    <option value="">Select Section</option>
                    {sections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Topic</label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="Class topic or description"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                />
              </div>

              {formData.studentAttendance.length > 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                    <div>
                      <h3 className="text-base sm:text-lg font-medium">Student Attendance</h3>
                      {(() => {
                        const stats = getAttendanceStats();
                        return (
                          <div className="text-xs sm:text-sm text-gray-600 mt-1">
                            Total: {stats.total} | Present: <span className="text-green-600 font-medium">{stats.present}</span> | 
                            Absent: <span className="text-red-600 font-medium">{stats.absent}</span>
                            {stats.unselected > 0 && (
                              <span> | Unselected: <span className="text-gray-500 font-medium">{stats.unselected}</span></span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                      <button
                        type="button"
                        onClick={markAllPresent}
                        className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 touch-manipulation"
                      >
                        ✅ Mark All Present
                      </button>
                      <button
                        type="button"
                        onClick={markAllAbsent}
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 touch-manipulation"
                      >
                        ❌ Mark All Absent
                      </button>
                      <button
                        type="button"
                        onClick={clearAllAttendance}
                        className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 touch-manipulation"
                      >
                        🔄 Clear All
                      </button>
                    </div>
                  </div>

                  {/* Mobile-friendly student list */}
                  <div className="max-h-60 sm:max-h-80 overflow-y-auto border rounded-md">
                    {/* Desktop table view */}
                    <div className="hidden sm:block">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Roll No</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Student Name</th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Present</th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Absent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {formData.studentAttendance.map((student, index) => (
                            <tr key={student.studentId} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">{student.rollNo}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{student.studentName}</td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="radio"
                                  name={`attendance-${student.studentId}`}
                                  checked={student.isPresent === true}
                                  onChange={() => handleAttendanceChange(student.studentId, true)}
                                  className="text-green-600 w-4 h-4"
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="radio"
                                  name={`attendance-${student.studentId}`}
                                  checked={student.isPresent === false}
                                  onChange={() => handleAttendanceChange(student.studentId, false)}
                                  className="text-red-600 w-4 h-4"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile card view */}
                    <div className="sm:hidden space-y-2 p-2">
                      {formData.studentAttendance.map((student, index) => (
                        <div key={student.studentId} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-sm text-gray-900">{student.studentName}</div>
                              <div className="text-xs text-gray-500">Roll: {student.rollNo}</div>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`attendance-${student.studentId}`}
                                checked={student.isPresent === true}
                                onChange={() => handleAttendanceChange(student.studentId, true)}
                                className="text-green-600 w-5 h-5"
                              />
                              <span className="text-sm text-green-700 font-medium">Present</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`attendance-${student.studentId}`}
                                checked={student.isPresent === false}
                                onChange={() => handleAttendanceChange(student.studentId, false)}
                                className="text-red-600 w-5 h-5"
                              />
                              <span className="text-sm text-red-700 font-medium">Absent</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  💾 Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cumulative Attendance Form - Mobile optimized */}
      {showCumulativeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Manage Cumulative Attendance</h2>
              <button
                onClick={() => setShowCumulativeForm(false)}
                className="text-gray-500 hover:text-gray-700 p-1 sm:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCumulativeSubmit} className="space-y-4">
              {/* Mobile-optimized form layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    name="department"
                    value={cumulativeFormData.department}
                    onChange={handleCumulativeInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <select
                    name="semester"
                    value={cumulativeFormData.semester}
                    onChange={handleCumulativeInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem._id} value={sem._id}>{sem.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data Up To Date</label>
                  <input
                    type="date"
                    name="dateUpTo"
                    value={cumulativeFormData.dateUpTo}
                    onChange={handleCumulativeInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Lectures Held</label>
                  <input
                    type="number"
                    name="totalLecturesHeld"
                    value={cumulativeFormData.totalLecturesHeld}
                    onChange={handleCumulativeInputChange}
                    required
                    min="1"
                    placeholder="All subjects combined"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Session</label>
                  <input
                    type="text"
                    name="session"
                    value={cumulativeFormData.session}
                    onChange={handleCumulativeInputChange}
                    placeholder="e.g., 2023-2024"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm"
                  />
                </div>
              </div>

              {/* Mobile-optimized calculations display */}
              {cumulativeFormData.totalLecturesHeld && (
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-base sm:text-lg font-medium text-blue-900 mb-2">Attendance Calculations</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Total Lectures:</span>
                      <span className="ml-2 text-blue-900">{cumulativeFormData.totalLecturesHeld}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Permissible (75%):</span>
                      <span className="ml-2 text-blue-900">{Math.ceil(cumulativeFormData.totalLecturesHeld * 0.75)}</span>
                    </div>
                  </div>
                </div>
              )}

              {cumulativeFormData.students.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-4">Student Attendance Data</h3>
                  
                  {/* Desktop table view */}
                  <div className="hidden sm:block max-h-96 overflow-y-auto border rounded-md">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Roll No</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Student Name</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Lectures Attended</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Percentage</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {cumulativeFormData.students.map((student) => {
                          const percentage = cumulativeFormData.totalLecturesHeld 
                            ? Math.round((student.lecturesAttended / cumulativeFormData.totalLecturesHeld) * 100)
                            : 0;
                          const status = percentage >= 75 ? 'Adequate' : 'Short';
                          
                          return (
                            <tr key={student.studentId} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">{student.rollNo}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{student.studentName}</td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="number"
                                  value={student.lecturesAttended}
                                  onChange={(e) => handleCumulativeAttendanceChange(student.studentId, e.target.value)}
                                  min="0"
                                  max={cumulativeFormData.totalLecturesHeld}
                                  className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className={`font-medium ${
                                  percentage >= 75 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {percentage}%
                                </span>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  status === 'Adequate' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card view */}
                  <div className="sm:hidden max-h-80 overflow-y-auto space-y-3">
                    {cumulativeFormData.students.map((student) => {
                      const percentage = cumulativeFormData.totalLecturesHeld 
                        ? Math.round((student.lecturesAttended / cumulativeFormData.totalLecturesHeld) * 100)
                        : 0;
                      const status = percentage >= 75 ? 'Adequate' : 'Short';
                      
                      return (
                        <div key={student.studentId} className="bg-gray-50 p-3 rounded-lg border">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-medium text-sm text-gray-900">{student.studentName}</div>
                              <div className="text-xs text-gray-500">Roll: {student.rollNo}</div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              status === 'Adequate' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Lectures Attended</label>
                              <input
                                type="number"
                                value={student.lecturesAttended}
                                onChange={(e) => handleCumulativeAttendanceChange(student.studentId, e.target.value)}
                                min="0"
                                max={cumulativeFormData.totalLecturesHeld}
                                className="w-full text-center border border-gray-300 rounded px-2 py-2 text-base"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Percentage</label>
                              <div className={`text-center py-2 px-2 rounded font-medium text-base ${
                                percentage >= 75 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                              }`}>
                                {percentage}%
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCumulativeForm(false)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                >
                  💾 Save Cumulative Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records Display - Mobile optimized */}
      <div className="space-y-4 sm:space-y-6">
        {activeTab === 'individual' ? (
          // Individual Attendance Records
          attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No attendance records found</p>
            </div>
          ) : (
            attendanceRecords.map(record => (
              <div key={record._id} className="bg-white p-4 sm:p-6 rounded-lg shadow border">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-blue-600 truncate">
                        {record.subject?.name}
                      </h3>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {record.classType}
                        </span>
                        {/* Show section for practical/lab classes */}
                        {record.section && (record.classType === 'practical' || record.classType === 'Lab') && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            Section {record.section}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{record.topic || 'Regular Class'}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                  </div>
                </div>
                
                {user?.role === 'Student' ? (
                  // Student view - show their personal status
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                    <div className="text-sm text-gray-500">
                      Teacher: {record.teacherId?.fullname || record.teacher?.fullname || 'N/A'}
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        record.studentStatus === 'Present' 
                          ? 'bg-green-100 text-green-800' 
                          : record.studentStatus === 'Absent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {record.studentStatus || 'Not Marked'}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Teacher/Admin view - show class statistics
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Department:</span>
                        <p className="truncate">{record.department?.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Semester:</span>
                        <p>{record.semester?.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Total Students:</span>
                        <p>{record.totalStudents}</p>
                      </div>
                      <div>
                        <span className="font-medium">Present:</span>
                        <p className="text-green-600 font-medium">
                          {record.presentCount} ({((record.presentCount / record.totalStudents) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                      <div className="text-sm text-gray-500">
                        Recorded by: {record.teacher?.fullname}
                      </div>
                      <button 
                        onClick={() => handleViewDetails(record)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium w-fit touch-manipulation"
                      >
                        👁️ View Details
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )
        ) : (
          // Cumulative Attendance Records - Only show for Teachers/Admins
          // Students see the dedicated StudentCumulativeAttendanceView component above
          (user?.role === 'Teacher' || user?.role === 'Admin') && (
            cumulativeRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No cumulative attendance records found</p>
              </div>
            ) : (
              cumulativeRecords.map(record => (
                <div key={record._id} className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow border">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-green-600">
                          Combined Subjects Attendance
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Cumulative
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">Session: {record.session}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-semibold text-gray-900">
                        Data up to: {new Date(record.dateUpTo).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Lectures: {record.totalLecturesHeld}
                      </div>
                    </div>
                  </div>

                  {/* Teacher/Admin view - show summary statistics - Mobile optimized */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm text-gray-600 mb-3 sm:mb-4">
                    <div>
                      <span className="font-medium">Department:</span>
                      <p className="truncate">{record.department?.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Semester:</span>
                      <p>{record.semester?.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Students:</span>
                      <p>{record.students?.length || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium">Adequate Attendance:</span>
                      <p className="text-green-600 font-medium">
                        {record.students?.filter(s => s.status === 'Adequate').length || 0} / {record.students?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                    <div className="text-sm text-gray-500">
                      Permissible Lectures (75%): {record.permissibleLectures}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                      <button 
                        onClick={() => handleViewCumulativeDetails(record)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium w-fit touch-manipulation"
                      >
                        👁️ View Details
                      </button>
                      <button 
                        onClick={() => handleEditCumulativeRecord(record)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium w-fit touch-manipulation"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCumulativeRecord(record._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium w-fit touch-manipulation"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          )
        )}
      </div>

      {/* Details Modal - Mobile optimized */}
      {showDetailsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-6">
          <div className="bg-white p-3 sm:p-6 rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex-1 pr-2">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
                  {selectedRecord.subject?.name} - {selectedRecord.classType}
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">{selectedRecord.topic || 'Regular Class'}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  {new Date(selectedRecord.date).toLocaleDateString()} • {selectedRecord.department?.name} • {selectedRecord.semester?.name}
                </p>
              </div>
              <button
                onClick={closeDetailsModal}
                className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium">Student Attendance Details</h3>
                <div className="text-xs sm:text-sm text-gray-500">
                  Present: {selectedRecord.students?.filter(s => s.status === 'Present').length || 0} / {selectedRecord.students?.length || 0}
                  ({((selectedRecord.students?.filter(s => s.status === 'Present').length || 0) / (selectedRecord.students?.length || 1) * 100).toFixed(1)}%)
                </div>
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedRecord.students?.map((student) => (
                      <tr key={student.studentId?._id || student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentId?.academicDetails?.universityRollNo || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentId?.academicDetails?.fullname || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${student.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="sm:hidden space-y-2 max-h-80 overflow-y-auto">
                {selectedRecord.students?.map((student) => (
                  <div key={student.studentId?._id || student.studentId} className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {student.studentId?.academicDetails?.fullname || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Roll: {student.studentId?.academicDetails?.universityRollNo || 'N/A'}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2
                        ${student.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {student.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium touch-manipulation"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cumulative Details Modal - Mobile optimized */}
      {showCumulativeDetailsModal && selectedCumulativeRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-6">
          <div className="bg-white p-3 sm:p-6 rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex-1 pr-2">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
                  Cumulative Attendance Details
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Session: {selectedCumulativeRecord.session}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  Data up to: {new Date(selectedCumulativeRecord.dateUpTo).toLocaleDateString()} • {selectedCumulativeRecord.department?.name} • {selectedCumulativeRecord.semester?.name}
                </p>
              </div>
              <button
                onClick={closeCumulativeDetailsModal}
                className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Summary Statistics - Mobile optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{selectedCumulativeRecord.totalLecturesHeld}</div>
                <div className="text-xs sm:text-sm text-blue-800">Total Lectures Held</div>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">{selectedCumulativeRecord.permissibleLectures}</div>
                <div className="text-xs sm:text-sm text-purple-800">Permissible Lectures (75%)</div>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {selectedCumulativeRecord.students?.filter(s => s.status === 'Adequate').length || 0}
                </div>
                <div className="text-xs sm:text-sm text-green-800">Students with Adequate Attendance</div>
              </div>
              <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-red-600">
                  {selectedCumulativeRecord.students?.filter(s => s.status === 'Short').length || 0}
                </div>
                <div className="text-xs sm:text-sm text-red-800">Students with Short Attendance</div>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium">Student Cumulative Attendance Details</h3>
                <div className="text-xs sm:text-sm text-gray-500">
                  Total Students: {selectedCumulativeRecord.students?.length || 0}
                </div>
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lectures Attended</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedCumulativeRecord.students?.map((student) => (
                      <tr key={student.studentId?._id || student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentId?.academicDetails?.universityRollNo || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentId?.academicDetails?.fullname || student.studentId?.fullname || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {student.lecturesAttended} / {selectedCumulativeRecord.totalLecturesHeld}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`font-medium ${
                            student.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {student.attendancePercentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.status === 'Adequate' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="sm:hidden space-y-3 max-h-80 overflow-y-auto">
                {selectedCumulativeRecord.students?.map((student) => (
                  <div key={student.studentId?._id || student.studentId} className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {student.studentId?.academicDetails?.fullname || student.studentId?.fullname || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Roll: {student.studentId?.academicDetails?.universityRollNo || 'N/A'}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                        student.status === 'Adequate' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Lectures:</span>
                        <div className="font-medium">{student.lecturesAttended} / {selectedCumulativeRecord.totalLecturesHeld}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Percentage:</span>
                        <div className={`font-medium ${
                          student.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {student.attendancePercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={closeCumulativeDetailsModal}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium touch-manipulation"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
