import axiosInstance from './axios';
import { activitiesApi } from './activitiesApi';

export const dashboardApi = {
  // Get assignments for the current user
  getAssignments: async (userRole) => {
    try {
      const response = await axiosInstance.get('/assignments');
      return response.data?.assignments || [];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  },

  // Get tests for the current user (role-based)
  getTests: async (userRole) => {
    try {
      let response;
      
      if (userRole === 'Student') {
        response = await axiosInstance.get('/student/tests/available');
      } else if (userRole === 'Teacher') {
        response = await axiosInstance.get('/tests/my');
      } else {
        // Admin or fallback
        response = await axiosInstance.get('/tests');
      }
      
      return response.data?.tests || response.data || [];
    } catch (error) {
      console.error('Error fetching tests:', error);
      return [];
    }
  },

  // Get notices
  getNotices: async () => {
    try {
      // Use active notices endpoint which properly handles visibility filtering
      const response = await axiosInstance.get('/notices/active');
      return response.data?.notices || [];
    } catch (error) {
      console.error('Error fetching notices:', error);
      return [];
    }
  },

  // Get study materials
  getStudyMaterials: async () => {
    try {
      const response = await axiosInstance.get('/study-materials');
      return response.data?.studyMaterials || [];
    } catch (error) {
      console.error('Error fetching study materials:', error);
      return [];
    }
  },

  // Get attendance data for the current user
  getAttendance: async () => {
    try {
      const response = await axiosInstance.get('/attendance');
      return response.data?.attendance || [];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  },

  // Get student performance data
  getStudentPerformance: async () => {
    try {
      const response = await axiosInstance.get('/student/performance');
      return response.data?.performance || null;
    } catch (error) {
      console.error('Error fetching student performance:', error);
      return null;
    }
  },

  // Get activities for teacher dashboard
  getTeacherActivities: async () => {
    return activitiesApi.getTeacherActivities();
  },

  // Get notifications for student dashboard
  getStudentNotifications: async () => {
    return activitiesApi.getStudentNotifications();
  }
};
