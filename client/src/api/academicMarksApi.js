import axios from './axios';

// Create or update academic marks (Teacher/Admin)
export const createOrUpdateMarks = async (marksData) => {
  try {
    const response = await axios.post('/academic-marks', marksData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get academic marks for current student
export const getMarksForStudent = async () => {
  try {
    const response = await axios.get('/academic-marks/my-marks');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get academic marks by department, semester, and section (Teacher/Admin)
export const getMarksByDeptSemSection = async (departmentId, semesterId, section) => {
  try {
    const response = await axios.get(`/academic-marks/department/${departmentId}/semester/${semesterId}/section/${section}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get students by department and semester (Teacher/Admin)
export const getStudentsByDeptAndSem = async (departmentId, semesterId) => {
  try {
    const response = await axios.get(`/academic-marks/department/${departmentId}/semester/${semesterId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get subjects by department and semester (Teacher/Admin)
export const getSubjectsByDepartmentAndSemester = async (departmentId, semesterId) => {
  try {
    const response = await axios.get(`/subjects/department/${departmentId}/semester/${semesterId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all departments
export const getAllDepartments = async () => {
  try {
    const response = await axios.get('/departments');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all semesters
export const getAllSemesters = async () => {
  try {
    const response = await axios.get('/semesters');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all subjects (Teacher/Admin)
export const getAllSubjects = async () => {
  try {
    const response = await axios.get('/subjects');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get students by subject (Teacher/Admin)
export const getStudentsBySubject = async (subjectId) => {
  try {
    const response = await axios.get(`/academic-marks/subject/${subjectId}/students`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all marks records for teacher (Teacher/Admin)
export const getAllMarksForTeacher = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const url = `/academic-marks/teacher/all-marks${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update specific marks record (Teacher/Admin)
export const updateMarksRecord = async (markId, updateData) => {
  try {
    const response = await axios.put(`/academic-marks/${markId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete specific marks record (Teacher/Admin)
export const deleteMarksRecord = async (markId) => {
  try {
    const response = await axios.delete(`/academic-marks/${markId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get marks statistics (Teacher/Admin)
export const getMarksStatistics = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const url = `/academic-marks/statistics/summary${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
