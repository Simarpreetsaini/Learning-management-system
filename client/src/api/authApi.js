import axiosInstance from './axios';

export const authApi = {
  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await axiosInstance.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Change password API error:', error);
      throw error;
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get('/auth/user');
      return response.data;
    } catch (error) {
      console.error('Get current user API error:', error);
      throw error;
    }
  },

  // Login
  login: async (username, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', {
        username,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  // Register
  register: async (username, fullname, password, role = 'Student') => {
    try {
      const response = await axiosInstance.post('/auth/register', {
        username,
        fullname,
        password,
        role
      });
      return response.data;
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  }
};

export default authApi;
