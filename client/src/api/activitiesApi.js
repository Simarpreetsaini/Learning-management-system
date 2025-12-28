import axiosInstance from './axios';

export const activitiesApi = {
  // Get activities for teacher dashboard
  getTeacherActivities: async () => {
    try {
      const response = await axiosInstance.get('/activities/teacher/activities');
      return response.data?.activities || [];
    } catch (error) {
      console.error('Error fetching teacher activities:', error);
      return [];
    }
  },

  // Get notifications for student dashboard
  getStudentNotifications: async () => {
    try {
      const response = await axiosInstance.get('/activities/student/notifications');
      return response.data?.notifications || [];
    } catch (error) {
      console.error('Error fetching student notifications:', error);
      return [];
    }
  }
};
