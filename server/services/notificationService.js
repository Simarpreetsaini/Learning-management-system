const { createNotification, createBulkNotifications, getNotificationsForStudent } = require('../models/notificationModel');
const User = require('../models/userModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');

/**
 * Create notification for students when teacher uploads content
 */
const notifyStudentsOnTeacherUpload = async (teacherId, uploadType, uploadData) => {
    try {
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'Teacher') {
            throw new Error('Invalid teacher');
        }

        // Get all students from the same department/semester as the upload
        let students = [];
        
        if (uploadData.department && uploadData.semester) {
            // Find students in the specific department and semester
            const academicDetails = await StudentAcademicDetails.find({
                department: uploadData.department,
                semester: uploadData.semester
            }).populate('userId');
            
            students = academicDetails.map(detail => detail.userId).filter(user => user && user.role === 'Student');
        } else {
            // Fallback: get all students (for general uploads)
            students = await User.find({ role: 'Student' });
        }

        if (students.length === 0) {
            console.log('No students found to notify');
            return;
        }

        // Create notification data based on upload type
        let notificationData = {
            senderId: teacherId,
            type: uploadType,
            priority: 'medium'
        };

        switch (uploadType) {
            case 'study_material':
                notificationData.title = `New Study Material: ${uploadData.title}`;
                notificationData.message = `${teacher.fullname} has uploaded new study material "${uploadData.title}"`;
                notificationData.relatedId = uploadData._id;
                notificationData.relatedModel = 'StudyMaterial';
                break;
            
            case 'assignment':
                notificationData.title = `New Assignment: ${uploadData.title}`;
                notificationData.message = `${teacher.fullname} has created a new assignment "${uploadData.title}"`;
                notificationData.relatedId = uploadData._id;
                notificationData.relatedModel = 'Assignment';
                notificationData.priority = 'high';
                break;
            
            case 'notice':
                notificationData.title = `New Notice: ${uploadData.title}`;
                notificationData.message = `${teacher.fullname} has posted a new notice "${uploadData.title}"`;
                notificationData.relatedId = uploadData._id;
                notificationData.relatedModel = 'Notice';
                break;
            
            case 'paid_note':
                notificationData.title = `New Paid Note: ${uploadData.title}`;
                notificationData.message = `${teacher.fullname} has uploaded a new paid note "${uploadData.title}"`;
                notificationData.relatedId = uploadData._id;
                notificationData.relatedModel = 'PaidNote';
                break;
            
            default:
                notificationData.title = 'New Content Available';
                notificationData.message = `${teacher.fullname} has uploaded new content`;
        }

        // Create bulk notifications for all students
        const notifications = students.map(student => ({
            ...notificationData,
            recipientId: student._id
        }));

        await createBulkNotifications(notifications);
        console.log(`Created ${notifications.length} notifications for ${uploadType} upload`);

    } catch (error) {
        console.error('Error notifying students on teacher upload:', error);
        throw error;
    }
};

/**
 * Create notification for teachers when student uploads content
 */
const notifyTeachersOnStudentUpload = async (studentId, uploadType, uploadData) => {
    try {
        const student = await User.findById(studentId);
        if (!student || student.role !== 'Student') {
            throw new Error('Invalid student');
        }

        // Get student's academic details to find relevant teachers
        const academicDetails = await StudentAcademicDetails.findOne({ userId: studentId });
        if (!academicDetails) {
            console.log('No academic details found for student');
            return;
        }

        let teachers = [];

        // For assignment submissions, notify only the teacher who created the assignment
        if (uploadType === 'assignment_submission' && uploadData._id) {
            const Assignment = require('../models/assignmentModel');
            const assignment = await Assignment.findById(uploadData._id).populate('createdBy');
            
            if (assignment && assignment.createdBy && assignment.createdBy.role === 'Teacher') {
                teachers = [assignment.createdBy];
                console.log(`Found assignment creator: ${assignment.createdBy.fullname || assignment.createdBy.name}`);
            } else {
                console.log('Assignment creator not found or invalid');
                return;
            }
        } else if (uploadType === 'test_submission' && uploadData._id) {
            // For test submissions, notify only the teacher who created the test
            const Test = require('../models/testModel');
            const test = await Test.findById(uploadData._id).populate('createdBy');
            
            if (test && test.createdBy && test.createdBy.role === 'Teacher') {
                teachers = [test.createdBy];
                console.log(`Found test creator: ${test.createdBy.fullname || test.createdBy.name}`);
            } else {
                console.log('Test creator not found or invalid');
                return;
            }
        } else {
            // For other types, find teachers in the same department/semester
            teachers = await User.find({ 
                role: 'Teacher',
                // You can add more specific filtering here based on department/semester if needed
            });
        }

        if (teachers.length === 0) {
            console.log('No teachers found to notify');
            return;
        }

        // Create notification data based on upload type
        let notificationData = {
            senderId: studentId,
            type: uploadType,
            priority: 'medium'
        };

        switch (uploadType) {
            case 'assignment_submission':
                notificationData.title = `Assignment Submitted: ${uploadData.title}`;
                notificationData.message = `${student.fullname || student.name} has submitted assignment "${uploadData.title}"`;
                notificationData.relatedId = uploadData._id;
                notificationData.relatedModel = 'Assignment';
                notificationData.priority = 'high'; // Higher priority for assignment submissions
                break;
            
            case 'test_submission':
                notificationData.title = `Test Submitted: ${uploadData.title}`;
                notificationData.message = `${student.fullname || student.name} has submitted test "${uploadData.title}"`;
                notificationData.relatedId = uploadData._id;
                notificationData.relatedModel = 'Test';
                notificationData.priority = 'high'; // Higher priority for test submissions
                break;
            
            default:
                notificationData.title = 'Student Submission';
                notificationData.message = `${student.fullname || student.name} has submitted content`;
        }

        // Create bulk notifications for relevant teachers
        const notifications = teachers.map(teacher => ({
            ...notificationData,
            recipientId: teacher._id
        }));

        await createBulkNotifications(notifications);
        console.log(`Created ${notifications.length} notifications for ${uploadType} submission to specific teacher(s)`);

    } catch (error) {
        console.error('Error notifying teachers on student upload:', error);
        throw error;
    }
};

/**
 * Get notifications for a user with pagination
 */
const getUserNotifications = async (userId, page = 1, limit = 20) => {
    try {
        const notifications = await getNotificationsForStudent(userId, limit * page);
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedNotifications = notifications.slice(startIndex, endIndex);
        
        return {
            notifications: paginatedNotifications,
            totalCount: notifications.length,
            currentPage: page,
            totalPages: Math.ceil(notifications.length / limit),
            hasMore: endIndex < notifications.length
        };
    } catch (error) {
        console.error('Error getting user notifications:', error);
        throw error;
    }
};

/**
 * Create notification for student when assignment is graded
 */
const notifyStudentOnGrading = async (teacherId, studentId, assignmentData, gradeData) => {
    try {
        const teacher = await User.findById(teacherId);
        const student = await User.findById(studentId);
        
        if (!teacher || teacher.role !== 'Teacher') {
            throw new Error('Invalid teacher');
        }
        
        if (!student || student.role !== 'Student') {
            throw new Error('Invalid student');
        }

        // Create notification data for grade
        const notificationData = {
            recipientId: studentId,
            senderId: teacherId,
            type: 'grade',
            title: `Assignment Graded: ${assignmentData.title}`,
            message: `${teacher.fullname || teacher.name} has graded your assignment "${assignmentData.title}". Grade: ${gradeData.grade}/${assignmentData.maxMarks || 100}`,
            relatedId: assignmentData._id,
            relatedModel: 'Assignment',
            priority: 'high',
            metadata: {
                grade: gradeData.grade,
                maxMarks: assignmentData.maxMarks || 100,
                feedback: gradeData.feedback,
                assignmentTitle: assignmentData.title,
                teacherName: teacher.fullname || teacher.name,
                redirectPath: '/my-submissions'
            }
        };

        await createNotification(notificationData);
        console.log(`Created grade notification for student ${student.fullname || student.name} for assignment "${assignmentData.title}"`);

    } catch (error) {
        console.error('Error notifying student on grading:', error);
        throw error;
    }
};

/**
 * Create a general notification
 */
const createGeneralNotification = async (recipientId, title, message, type = 'system', priority = 'medium', metadata = {}) => {
    try {
        const notificationData = {
            recipientId,
            title,
            message,
            type,
            priority,
            metadata
        };

        return await createNotification(notificationData);
    } catch (error) {
        console.error('Error creating general notification:', error);
        throw error;
    }
};

module.exports = {
    notifyStudentsOnTeacherUpload,
    notifyTeachersOnStudentUpload,
    notifyStudentOnGrading,
    getUserNotifications,
    createGeneralNotification
};
