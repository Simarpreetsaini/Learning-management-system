const User = require('../models/userModel');
const { getTeacherById, getStudentsByTeacherId } = User;
const { getActivitiesByUserIds } = require('../models/activityModel');
const { getNotificationsForStudent } = require('../models/notificationModel');

/**
 * Fetch activities for a teacher and their students.
 * @param {string} teacherId
 * @returns {Promise<Array>} List of activities
 */
const getTeacherActivities = async (teacherId) => {
  try {
    // Get teacher's own activities
    const teacherActivities = await getActivitiesByUserIds([teacherId]);

    // Get students of the teacher
    const students = await getStudentsByTeacherId(teacherId);
    const studentIds = students.map(student => student._id || student.id);

    // Get activities of students
    const studentActivities = await getActivitiesByUserIds(studentIds);

    // Combine and sort by timestamp descending
    const allActivities = [...teacherActivities, ...studentActivities];
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return allActivities;
  } catch (error) {
    console.error('Error fetching teacher activities:', error);
    throw error;
  }
};

/**
 * Fetch notifications for a student.
 * @param {string} studentId
 * @returns {Promise<Array>} List of notifications
 */
const getStudentNotifications = async (studentId) => {
  try {
    // Fetch notifications relevant to the student
    const notifications = await getNotificationsForStudent(studentId);

    // Sort notifications by timestamp descending (use createdAt for notifications)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return notifications;
  } catch (error) {
    console.error('Error fetching student notifications:', error);
    throw error;
  }
};

module.exports = {
  getTeacherActivities,
  getStudentNotifications
};
