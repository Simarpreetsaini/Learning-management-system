import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Subjects = () => {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    semester: '',
    credits: '',
    description: ''
  });

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
    fetchSemesters();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await axiosInstance.get('/subjects');
      if (response.data.success) {
        setSubjects(response.data.subjects || []);
      } else {
        toast.error('Failed to fetch subjects');
      }
    } catch (error) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get('/departments');
      if (response.data.success) {
        setDepartments(response.data.departments || []);
      } else {
        toast.error('Failed to fetch departments');
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await axiosInstance.get('/semesters');
      if (response.data.success) {
        setSemesters(response.data.semesters || []);
      } else {
        toast.error('Failed to fetch semesters');
      }
    } catch (error) {
      toast.error('Failed to fetch semesters');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare form data with proper type conversion
      const submitData = {
        ...formData,
        // Convert credits to number if provided, otherwise send undefined
        credits: formData.credits && formData.credits.trim() !== '' 
          ? Number(formData.credits) 
          : undefined
      };

      const response = editingSubject 
        ? await axiosInstance.put(`/subjects/${editingSubject._id}`, submitData)
        : await axiosInstance.post('/subjects', submitData);
      
      if (response.data.success) {
        toast.success(editingSubject ? 'Subject updated successfully' : 'Subject created successfully');
        setShowCreateForm(false);
        setEditingSubject(null);
        setFormData({ name: '', code: '', department: '', semester: '', credits: '', description: '' });
        fetchSubjects();
      } else {
        throw new Error(response.data.message || 'Failed to save subject');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save subject';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      department: subject.department._id,
      semester: subject.semester._id,
      credits: subject.credits || '',
      description: subject.description || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        const response = await axiosInstance.delete(`/subjects/${subjectId}`);
        if (response.data.success) {
          toast.success('Subject deleted successfully');
          fetchSubjects();
        } else {
          throw new Error(response.data.message || 'Failed to delete subject');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete subject';
        toast.error(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', department: '', semester: '', credits: '', description: '' });
    setEditingSubject(null);
    setShowCreateForm(false);
  };

  const filterSubjects = async () => {
    if (!filterDepartment && !filterSemester) {
      fetchSubjects();
      return;
    }

    try {
      let url = '/subjects';
      if (filterDepartment && filterSemester) {
        url = `/subjects/department/${filterDepartment}/semester/${filterSemester}`;
      }
      
      const response = await axiosInstance.get(url);
      if (response.data.success) {
        setSubjects(response.data.subjects || []);
      } else {
        toast.error('Failed to filter subjects');
      }
    } catch (error) {
      toast.error('Failed to filter subjects');
    }
  };

  const clearFilters = () => {
    setFilterDepartment('');
    setFilterSemester('');
    fetchSubjects();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-padding py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Subject Management</h1>
        {user?.role === 'Admin' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary btn-mobile w-full sm:w-auto"
          >
            <span className="sm:hidden">Add New Subject</span>
            <span className="hidden sm:inline">Add Subject</span>
          </button>
        )}
      </div>

      {/* Mobile-Optimized Filter Section */}
      <div className="mb-6 card">
        <div className="card-body">
          <h3 className="text-base sm:text-lg font-medium mb-4">Filter Subjects</h3>
          
          {/* Mobile: Stacked Layout, Desktop: Grid Layout */}
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600 sm:hidden">Department</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="input w-full"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600 sm:hidden">Semester</label>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="input w-full"
              >
                <option value="">All Semesters</option>
                {semesters.map(sem => (
                  <option key={sem._id} value={sem._id}>{sem.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
              <button
                onClick={filterSubjects}
                className="btn-success btn-sm flex-1 sm:flex-none sm:px-6"
              >
                Apply Filter
              </button>
              <button
                onClick={clearFilters}
                className="btn-secondary btn-sm flex-1 sm:flex-none sm:px-6"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="mobile-modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mobile: Stacked, Desktop: Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Data Structures"
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Code (Optional)
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="e.g., CS201"
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="input w-full"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      required
                      className="input w-full"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(sem => (
                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credits (Optional)
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    placeholder="e.g., 3"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Brief description of the subject"
                    className="input w-full resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary btn-mobile order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary btn-mobile order-1 sm:order-2"
                  >
                    {editingSubject ? 'Update Subject' : 'Create Subject'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subjects List */}
      <div className="space-y-4">
        {subjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <p className="text-gray-500 text-lg">No subjects found</p>
            {user?.role === 'Admin' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mt-4"
              >
                Create First Subject
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {subjects.map(subject => (
              <div key={subject._id} className="card card-hover">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                        {subject.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {subject.code && (
                          <span className="badge-secondary text-xs">{subject.code}</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subject.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subject.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium text-right truncate ml-2">
                        {subject.department?.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Semester:</span>
                      <span className="font-medium text-right truncate ml-2">
                        {subject.semester?.name}
                      </span>
                    </div>
                    {subject.credits && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Credits:</span>
                        <span className="font-medium">{subject.credits}</span>
                      </div>
                    )}
                  </div>

                  {subject.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {subject.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p>Created: {new Date(subject.createdAt).toLocaleDateString()}</p>
                    {subject.updatedAt !== subject.createdAt && (
                      <p>Updated: {new Date(subject.updatedAt).toLocaleDateString()}</p>
                    )}
                  </div>

                  {user?.role === 'Admin' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="btn-primary btn-sm flex-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subject._id)}
                        className="btn-error btn-sm flex-1"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;
