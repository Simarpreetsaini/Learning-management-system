const express = require('express');
const router = express.Router();
const { getTeacherActivities, getStudentNotifications } = require('../services/activitiesService');

// Controller to get all activities for teacher panel (teacher + students)
const getAllActivitiesForTeacher = async (req, res) => {
  try {
    console.log('Getting teacher activities for user:', req.user._id);
    const teacherId = req.userID || req.user._id; // Use req.userID set by middleware
    const activities = await getTeacherActivities(teacherId);
    res.json({ success: true, activities });
  } catch (error) {
    console.error('Error fetching teacher activities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
};

// Controller to get notifications for student panel
const getNotificationsForStudent = async (req, res) => {
  try {
    console.log('Getting student notifications for user:', req.user._id);
    const studentId = req.userID || req.user._id; // Use req.userID set by middleware
    const notifications = await getStudentNotifications(studentId);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching student notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

module.exports = {
  getAllActivitiesForTeacher,
  getNotificationsForStudent,
};
