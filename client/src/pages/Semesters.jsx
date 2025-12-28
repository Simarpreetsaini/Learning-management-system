import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Semesters = () => {
  const { user } = useContext(AuthContext);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    description: ''
  });

  useEffect(() => {
    fetchSemesters();
  }, []);

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
    } finally {
      setLoading(false);
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
      // Convert number to integer before sending
      const numberValue = parseInt(formData.number, 10);
      
      // Validate the number
      if (isNaN(numberValue) || numberValue < 1 || numberValue > 8) {
        toast.error('Please enter a valid semester number between 1 and 8');
        return;
      }

      const submitData = {
        ...formData,
        number: numberValue
      };

      const response = editingSemester 
        ? await axiosInstance.put(`/semesters/${editingSemester._id}`, submitData)
        : await axiosInstance.post('/semesters', submitData);
      
      if (response.data.success) {
        toast.success(editingSemester ? 'Semester updated successfully' : 'Semester created successfully');
        setShowCreateForm(false);
        setEditingSemester(null);
        setFormData({ name: '', number: '', description: '' });
        fetchSemesters();
      } else {
        throw new Error(response.data.message || 'Failed to save semester');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save semester';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (semester) => {
    setEditingSemester(semester);
    setFormData({
      name: semester.name,
      number: semester.number,
      description: semester.description || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (semesterId) => {
    if (window.confirm('Are you sure you want to delete this semester?')) {
      try {
        const response = await axiosInstance.delete(`/semesters/${semesterId}`);
        if (response.data.success) {
          toast.success('Semester deleted successfully');
          fetchSemesters();
        } else {
          throw new Error(response.data.message || 'Failed to delete semester');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete semester';
        toast.error(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', number: '', description: '' });
    setEditingSemester(null);
    setShowCreateForm(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-padding py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Semester Management</h1>
        {user?.role === 'Admin' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary btn-mobile w-full sm:w-auto"
          >
            <span className="sm:hidden">Add New Semester</span>
            <span className="hidden sm:inline">Add Semester</span>
          </button>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="mobile-modal-content w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">
                {editingSemester ? 'Edit Semester' : 'Add New Semester'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., First Semester, Second Semester"
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester Number
                  </label>
                  <input
                    type="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="8"
                    placeholder="1-8"
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
                    placeholder="Brief description of the semester"
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
                    {editingSemester ? 'Update Semester' : 'Create Semester'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Semesters List */}
      <div className="space-y-4">
        {semesters.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📅</div>
            <p className="text-gray-500 text-lg">No semesters found</p>
            {user?.role === 'Admin' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mt-4"
              >
                Create First Semester
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {semesters.map(semester => (
              <div key={semester._id} className="card card-hover">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                        {semester.name}
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm">Semester {semester.number}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                      semester.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {semester.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {semester.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {semester.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p>Created: {new Date(semester.createdAt).toLocaleDateString()}</p>
                    {semester.updatedAt !== semester.createdAt && (
                      <p>Updated: {new Date(semester.updatedAt).toLocaleDateString()}</p>
                    )}
                  </div>

                  {user?.role === 'Admin' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(semester)}
                        className="btn-primary btn-sm flex-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(semester._id)}
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

export default Semesters;
