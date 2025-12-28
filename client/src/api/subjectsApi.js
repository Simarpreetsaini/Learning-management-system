import axiosInstance from './axios';

// Get all subjects (public access)
export const getAllSubjects = async () => {
  try {
    const response = await axiosInstance.get('/subjects/public');
    return response.data;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }
};

// Get subjects by department and semester (public access)
export const getSubjectsByDepartmentAndSemester = async (departmentId, semesterId) => {
  try {
    const response = await axiosInstance.get(`/subjects/public/department/${departmentId}/semester/${semesterId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subjects by department and semester:', error);
    throw error;
  }
};

// Get subject by ID (public access)
export const getSubjectById = async (subjectId) => {
  try {
    const response = await axiosInstance.get(`/subjects/public/${subjectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subject by ID:', error);
    throw error;
  }
};

// Authenticated endpoints (for admin/teacher use)
export const getAllSubjectsAuth = async () => {
  try {
    const response = await axiosInstance.get('/subjects');
    return response.data;
  } catch (error) {
    console.error('Error fetching subjects (authenticated):', error);
    throw error;
  }
};

export const createSubject = async (subjectData) => {
  try {
    const response = await axiosInstance.post('/subjects', subjectData);
    return response.data;
  } catch (error) {
    console.error('Error creating subject:', error);
    throw error;
  }
};

export const updateSubject = async (subjectId, subjectData) => {
  try {
    const response = await axiosInstance.put(`/subjects/${subjectId}`, subjectData);
    return response.data;
  } catch (error) {
    console.error('Error updating subject:', error);
    throw error;
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    const response = await axiosInstance.delete(`/subjects/${subjectId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
};
