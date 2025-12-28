import axios from './axios';

// Get my academic details
export const getMyAcademicDetails = async () => {
  try {
    const response = await axios.get('/academic-details/my-details');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create academic details
export const createAcademicDetails = async (formData) => {
  try {
    const response = await axios.post('/academic-details', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update academic details
export const updateAcademicDetails = async (formData) => {
  try {
    const response = await axios.put('/academic-details', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete academic details
export const deleteAcademicDetails = async () => {
  try {
    const response = await axios.delete('/academic-details');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get departments (for dropdown)
export const getDepartments = async () => {
  try {
    const response = await axios.get('/departments');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get semesters (for dropdown)
export const getSemesters = async () => {
  try {
    const response = await axios.get('/semesters');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Teacher-specific API functions
export const teacherAcademicApi = {
  // Get all students with filters and pagination
  getAllStudents: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await axios.get(`/academic-details?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search students
  searchStudents: async (query) => {
    try {
      const response = await axios.get(`/academic-details/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get students by department and semester
  getStudentsByDeptAndSem: async (departmentId, semesterId) => {
    try {
      const response = await axios.get(`/academic-details/department/${departmentId}/semester/${semesterId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get students by department, semester, and section
  getStudentsByDeptSemAndSection: async (departmentId, semesterId, section) => {
    try {
      const response = await axios.get(`/academic-details/department/${departmentId}/semester/${semesterId}/section/${section}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get student by ID
  getStudentById: async (id) => {
    try {
      const response = await axios.get(`/academic-details/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get student statistics
  getStudentStatistics: async () => {
    try {
      const response = await axios.get('/academic-details/statistics');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Export student data
  exportStudentData: async (filters = {}, format = 'excel') => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      params.append('format', format);
      
      const response = await axios.get(`/academic-details/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Determine file extension and MIME type
      const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `students.${fileExtension}`;
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: `${format.toUpperCase()} export completed successfully` };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Export individual student data
  exportStudentById: async (id, format = 'excel') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      const response = await axios.get(`/academic-details/export/${id}?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Determine file extension
      const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `student_${id}.${fileExtension}`;
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: `${format.toUpperCase()} export completed successfully` };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
