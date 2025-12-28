import axiosInstance from './axios';

// Public PYQ API calls (no authentication required)
export const publicPyqApi = {
  // Get all PYQs publicly
  getAllPyqs: async () => {
    try {
      const response = await axiosInstance.get('/pyqs/public');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get PYQ by ID publicly
  getPyqById: async (id) => {
    try {
      const response = await axiosInstance.get(`/pyqs/public/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get PYQs by department publicly
  getPyqsByDepartment: async (department) => {
    try {
      const response = await axiosInstance.get(`/pyqs/public/department/${department}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get PYQs by semester publicly
  getPyqsBySemester: async (semester) => {
    try {
      const response = await axiosInstance.get(`/pyqs/public/semester/${semester}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get PYQs by subject publicly
  getPyqsBySubject: async (subject) => {
    try {
      const response = await axiosInstance.get(`/pyqs/public/subject/${subject}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download PYQ file publicly
  downloadPyq: async (id, filename) => {
    try {
      const response = await axiosInstance.get(`/pyqs/public/${id}/download`, {
        responseType: 'blob'
      });
      
      // Get the content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Create blob with proper MIME type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      // Ensure the link is added to DOM for Firefox compatibility
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Download started' };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Get departments (public access)
  getDepartments: async () => {
    try {
      const response = await axiosInstance.get('/departments/public');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get semesters (public access)
  getSemesters: async () => {
    try {
      const response = await axiosInstance.get('/semesters/public');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get subjects (public access)
  getSubjects: async () => {
    try {
      const response = await axiosInstance.get('/subjects/public');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get filtered subjects (public access)
  getFilteredSubjects: async (departmentId, semesterId) => {
    try {
      const response = await axiosInstance.get(`/study-materials/helpers/subjects-filtered?departmentId=${departmentId}&semesterId=${semesterId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
