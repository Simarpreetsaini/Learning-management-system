import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from '../utils/toast';
import axiosInstance from '../api/axios';

const Departments = () => {
  const { user } = useContext(AuthContext);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get('/departments');
      if (response.data.success) {
        setDepartments(response.data.departments || []);
        setError(null);
      } else {
        setError('Failed to fetch departments');
        toast.error('Failed to fetch departments');
      }
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
      const response = editingDepartment ? 
        await axiosInstance.put(`/departments/${editingDepartment._id}`, formData) :
        await axiosInstance.post('/departments', formData);
      
      if (response.data.success) {
        toast.success(editingDepartment ? 'Department updated successfully' : 'Department created successfully');
        setShowCreateForm(false);
        setEditingDepartment(null);
        setFormData({ name: '', code: '', description: '' });
        fetchDepartments();
      } else {
        throw new Error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Operation failed';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        const response = await axiosInstance.delete(`/departments/${id}`);
        if (response.data.success) {
          toast.success('Department deleted successfully');
          fetchDepartments();
        } else {
          throw new Error(response.data.message || 'Failed to delete department');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete department';
        toast.error(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' });
    setEditingDepartment(null);
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container-padding py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Department Management</h1>
        {user?.role === 'Admin' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary btn-mobile w-full sm:w-auto"
          >
            <span className="sm:hidden">Add New Department</span>
            <span className="hidden sm:inline">Add Department</span>
          </button>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="mobile-modal-content w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Computer Science"
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., CS"
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
                    placeholder="Brief description of the department"
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
                    {editingDepartment ? 'Update Department' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Departments List */}
      <div className="space-y-4">
        {departments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🏢</div>
            <p className="text-gray-500 text-lg">No departments found</p>
            {user?.role === 'Admin' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mt-4"
              >
                Create First Department
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Name</th>
                      <th className="table-header-cell">Code</th>
                      <th className="table-header-cell">Description</th>
                      <th className="table-header-cell text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {departments.map((department) => (
                      <tr key={department._id} className="hover:bg-gray-50">
                        <td className="table-cell font-medium">{department.name}</td>
                        <td className="table-cell">
                          <span className="badge-secondary">{department.code}</span>
                        </td>
                        <td className="table-cell">
                          <span className="line-clamp-2">{department.description || 'No description'}</span>
                        </td>
                        <td className="table-cell text-right">
                          {user?.role === 'Admin' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(department)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(department._id)}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden grid gap-4">
              {departments.map((department) => (
                <div key={department._id} className="card">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {department.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge-secondary text-xs">{department.code}</span>
                        </div>
                      </div>
                    </div>
                    
                    {department.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {department.description}
                      </p>
                    )}

                    <div className="text-xs text-gray-500 mb-4">
                      <p>Created: {new Date(department.createdAt).toLocaleDateString()}</p>
                      {department.updatedAt !== department.createdAt && (
                        <p>Updated: {new Date(department.updatedAt).toLocaleDateString()}</p>
                      )}
                    </div>

                    {user?.role === 'Admin' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(department)}
                          className="btn-primary btn-sm flex-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(department._id)}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Departments;
