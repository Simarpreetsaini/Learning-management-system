const express = require('express');
const router = express.Router();
const { getAllActivitiesForTeacher, getNotificationsForStudent } = require('../controllers/activitiesController');
const authenticateTeacher = require('../middlewares/authenticateTeacher');
const authenticateStudent = require('../middlewares/authMiddleware');

// Route to get all activities for teacher panel (requires teacher authentication)
router.get('/teacher/activities', authenticateTeacher, getAllActivitiesForTeacher);

// Route to get notifications for student panel (requires student authentication)
router.get('/student/notifications', authenticateStudent, getNotificationsForStudent);

module.exports = router;
