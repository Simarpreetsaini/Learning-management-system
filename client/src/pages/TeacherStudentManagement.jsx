import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { teacherAcademicApi, getDepartments, getSemesters } from '../api/academicDetailsApi';
import { isTeacher } from '../utils/roleUtils';
import { toast } from '../utils/toast';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Users, 
  GraduationCap, 
  Building, 
  Calendar,
  FileText,
  CheckSquare,
  Square,
  MoreVertical,
  RefreshCw,
  Grid,
  List,
  ArrowUpDown
} from 'lucide-react';
import { Card, Table, Input, Button, Badge, PageHeader } from '../components/ui';
import StudentDetailsCard from '../components/StudentDetailsCard';
import MobileStudentCard from '../components/MobileStudentCard';
import MobileFilterPanel from '../components/MobileFilterPanel';
import MobileExportMenu from '../components/MobileExportMenu';
import MobileStudentSearch from '../components/MobileStudentSearch';

const TeacherStudentManagement = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Mobile-specific states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileExportMenu, setShowMobileExportMenu] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [recentSearches, setRecentSearches] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    section: '',
    session: '',
    lateralEntry: '',
    page: 1,
    limit: 20
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    if (isTeacher(user)) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (isTeacher(user)) {
      fetchStudents();
    }
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [deptResponse, semResponse, statsResponse] = await Promise.all([
        getDepartments(),
        getSemesters(),
        teacherAcademicApi.getStudentStatistics()
      ]);

      setDepartments(deptResponse.departments || []);
      setSemesters(semResponse.semesters || []);
      setStatistics(statsResponse.statistics || null);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await teacherAcademicApi.getAllStudents(filters);
      setStudents(response.academicDetails || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchStudents();
      return;
    }

    try {
      setLoading(true);
      const response = await teacherAcademicApi.searchStudents(searchQuery);
      setStudents(response.students || []);
      setPagination({ currentPage: 1, totalPages: 1, totalRecords: response.students?.length || 0 });
    } catch (error) {
      console.error('Error searching students:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      semester: '',
      section: '',
      session: '',
      lateralEntry: '',
      page: 1,
      limit: 20
    });
    setSearchQuery('');
  };

  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s._id)));
    }
  };

  const handleExportAll = async (format = 'excel') => {
    try {
      await teacherAcademicApi.exportStudentData({}, format);
      toast.success(`All student data exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const handleExportFiltered = async (format = 'excel') => {
    try {
      await teacherAcademicApi.exportStudentData(filters, format);
      toast.success(`Filtered student data exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const handleExportSelected = async (format = 'excel') => {
    if (selectedStudents.size === 0) {
      toast.warning('Please select students to export');
      return;
    }

    try {
      const studentIds = Array.from(selectedStudents).join(',');
      await teacherAcademicApi.exportStudentData({ studentIds }, format);
      toast.success(`Selected student data exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const handleExportStudent = async (studentId, format = 'excel') => {
    try {
      await teacherAcademicApi.exportStudentById(studentId, format);
      toast.success(`Student data exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const viewStudentDetails = async (studentId) => {
    try {
      const response = await teacherAcademicApi.getStudentById(studentId);
      setSelectedStudent(response.academicDetails);
      setShowStudentModal(true);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to load student details');
    }
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  if (!isTeacher(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Only teachers can access this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        description="Manage and download student academic data"
      />

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalStudents}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.departmentStats?.length || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Semesters</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.semesterStats?.length || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sections</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.sectionStats?.length || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Mobile Search and Controls */}
      <div className="block md:hidden">
        <Card className="p-4">
          <div className="space-y-4">
            {/* Mobile Search */}
            <MobileStudentSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={handleSearch}
              onClear={() => setSearchQuery('')}
              recentSearches={recentSearches}
              placeholder="Search students..."
            />

            {/* Mobile Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMobileFilters(true)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(filters.department || filters.semester || filters.section || filters.session || filters.lateralEntry) && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    Active
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowMobileExportMenu(true)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
                {selectedStudents.size > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {selectedStudents.size}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Desktop Search and Filter Controls */}
      <Card className="p-6 hidden md:block">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name, roll number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full"
              />
            </div>
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>

              <select
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {semesters.map(sem => (
                  <option key={sem._id} value={sem._id}>{sem.name}</option>
                ))}
              </select>

              <select
                value={filters.section}
                onChange={(e) => handleFilterChange('section', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>

              <Input
                type="text"
                placeholder="Session (e.g., 2023-2024)"
                value={filters.session}
                onChange={(e) => handleFilterChange('session', e.target.value)}
              />

              <select
                value={filters.lateralEntry}
                onChange={(e) => handleFilterChange('lateralEntry', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Students</option>
                <option value="true">Lateral Entry</option>
                <option value="false">Regular Entry</option>
              </select>

              <div className="md:col-span-5 flex gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Export Controls */}
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Button 
                onClick={() => handleExportAll('excel')} 
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export All (Excel)
              </Button>
            </div>
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => handleExportAll('pdf')} 
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export All (PDF)
              </Button>
            </div>
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => handleExportFiltered('excel')} 
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Filtered (Excel)
              </Button>
            </div>
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => handleExportFiltered('pdf')} 
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Filtered (PDF)
              </Button>
            </div>
            {selectedStudents.size > 0 && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportSelected('excel')} 
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Selected Excel ({selectedStudents.size})
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportSelected('pdf')} 
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Selected PDF ({selectedStudents.size})
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile Students List */}
      <div className="block md:hidden">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Students ({pagination.totalRecords || 0})
            </h3>
            {students.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                {selectedStudents.size === students.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                All
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <MobileStudentCard
                  key={student._id}
                  student={student}
                  isSelected={selectedStudents.has(student._id)}
                  onSelect={handleSelectStudent}
                  onView={viewStudentDetails}
                  onExport={handleExportStudent}
                />
              ))}
            </div>
          )}

          {/* Mobile Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 space-y-3">
              <div className="text-center text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalRecords} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPrev}
                  onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                  className="flex-1"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNext}
                  onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                  className="flex-1"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Desktop Students Table */}
      <Card className="hidden md:block">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Students ({pagination.totalRecords || 0})
            </h3>
            {students.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedStudents.size === students.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Select All
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectStudent(student._id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedStudents.has(student._id) ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.fullname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.universityRollNo} | {student.classRollNo}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {student.department?.name} - {student.semester?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Section {student.section} | {student.session}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{student.email}</div>
                          <div className="text-sm text-gray-500">{student.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.lateralEntry ? (
                          <Badge variant="secondary">Lateral Entry</Badge>
                        ) : (
                          <Badge variant="primary">Regular</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewStudentDetails(student._id)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <div className="relative group">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Download className="h-4 w-4" />
                              Export
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                              <button
                                onClick={() => handleExportStudent(student._id, 'excel')}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Excel
                              </button>
                              <button
                                onClick={() => handleExportStudent(student._id, 'pdf')}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Desktop Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalRecords} total students)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPrev}
                  onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNext}
                  onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl w-full h-full sm:max-w-7xl sm:max-h-[95vh] sm:h-auto overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Student Academic Details</h3>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl font-bold p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-0">
              <StudentDetailsCard
                student={selectedStudent}
                showActions={true}
                onExport={(format) => handleExportStudent(selectedStudent._id, format)}
                onClose={() => setShowStudentModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Panel */}
      <MobileFilterPanel
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        departments={departments}
        semesters={semesters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      {/* Mobile Export Menu */}
      <MobileExportMenu
        isOpen={showMobileExportMenu}
        onClose={() => setShowMobileExportMenu(false)}
        selectedCount={selectedStudents.size}
        onExportAll={handleExportAll}
        onExportFiltered={handleExportFiltered}
        onExportSelected={handleExportSelected}
        hasFilters={!!(filters.department || filters.semester || filters.section || filters.session || filters.lateralEntry)}
      />
    </div>
  );
};

export default TeacherStudentManagement;
