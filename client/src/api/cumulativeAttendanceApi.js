import axiosInstance from './axios';

const cumulativeAttendanceApi = {
  // Create or update cumulative attendance record
  createOrUpdateCumulativeAttendance: async (data) => {
    try {
      const response = await axiosInstance.post('/cumulative-attendance', data);
      return response.data;
    } catch (error) {
      console.error('Error creating/updating cumulative attendance:', error);
      throw error;
    }
  },

  // Get cumulative attendance records by filters
  getCumulativeAttendanceByFilters: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axiosInstance.get(`/cumulative-attendance?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cumulative attendance records:', error);
      throw error;
    }
  },

  // Get cumulative attendance record by ID
  getCumulativeAttendanceById: async (id) => {
    try {
      const response = await axiosInstance.get(`/cumulative-attendance/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cumulative attendance record:', error);
      throw error;
    }
  },

  // Delete cumulative attendance record
  deleteCumulativeAttendance: async (id) => {
    try {
      const response = await axiosInstance.delete(`/cumulative-attendance/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting cumulative attendance record:', error);
      throw error;
    }
  },

  // Get cumulative attendance statistics
  getCumulativeAttendanceStats: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axiosInstance.get(`/cumulative-attendance/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cumulative attendance stats:', error);
      throw error;
    }
  },

  // Get student's cumulative attendance records
  getStudentCumulativeAttendance: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axiosInstance.get(`/cumulative-attendance/student/my-cumulative-attendance?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student cumulative attendance:', error);
      throw error;
    }
  }
};

export default cumulativeAttendanceApi;
