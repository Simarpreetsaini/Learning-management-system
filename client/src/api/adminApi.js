import axiosInstance from './axios';

// Admin User Management API
export const adminApi = {
  // Get all users with pagination and filters
  getAllUsers: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Get all users API error:', error);
      throw error;
    }
  },

  // Get user statistics for dashboard
  getUserStatistics: async () => {
    try {
      const response = await axiosInstance.get('/admin/users/statistics');
      return response.data;
    } catch (error) {
      console.error('Get user statistics API error:', error);
      throw error;
    }
  },

  // Get single user by ID
  getUserById: async (userId) => {
    try {
      const response = await axiosInstance.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user by ID API error:', error);
      throw error;
    }
  },

  // Get user's password (hashed)
  getUserPassword: async (userId) => {
    try {
      const response = await axiosInstance.get(`/admin/users/${userId}/password`);
      return response.data;
    } catch (error) {
      console.error('Get user password API error:', error);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Create user API error:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Update user API error:', error);
      throw error;
    }
  },

  // Reset user password
  resetUserPassword: async (userId, newPassword) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}/reset-password`, {
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Reset user password API error:', error);
      throw error;
    }
  },

  // Delete single user
  deleteUser: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Delete user API error:', error);
      throw error;
    }
  },

  // Bulk delete users
  bulkDeleteUsers: async (userIds) => {
    try {
      const response = await axiosInstance.delete('/admin/users', {
        data: { userIds }
      });
      return response.data;
    } catch (error) {
      console.error('Bulk delete users API error:', error);
      throw error;
    }
  }
};

export default adminApi;
