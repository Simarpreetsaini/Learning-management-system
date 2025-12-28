const Test = require('../models/testModel');
const TestSubmission = require('../models/testSubmissionModel');
const Department = require('../models/departmentModel');
const Semester = require('../models/semesterModel');
const Subject = require('../models/subjectModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { notifyStudentsOnTeacherUpload } = require('../services/notificationService');
// Add these functions to testController.js

// Get subjects by department and semester
const getSubjectsByDeptAndSem = async (req, res) => {
    try {
        const { departmentId, semesterId } = req.params;

        const subjects = await Subject.find({
            department: departmentId,
            semester: semesterId,
            isActive: true
        })
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .sort({ name: 1 });

        res.status(200).json({
            success: true,
            subjects
        });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subjects',
            error: error.message
        });
    }
};

// Get test metadata for dropdowns
const getTestMetadata = async (req, res) => {
    try {
        const [departments, semesters] = await Promise.all([
            Department.find({ isActive: true }).sort({ name: 1 }),
            Semester.find({ isActive: true }).sort({ number: 1 })
        ]);

        res.status(200).json({
            success: true,
            metadata: {
                departments,
                semesters
            }
        });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching metadata',
            error: error.message
        });
    }
};

// Get teacher statistics
const getTeacherStatistics = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const [totalTests, activeTests, totalSubmissions] = await Promise.all([
            Test.countDocuments({ createdBy: teacherId }),
            Test.countDocuments({ createdBy: teacherId, isActive: true }),
            TestSubmission.countDocuments({
                testId: { $in: await Test.find({ createdBy: teacherId }).distinct('_id') }
            })
        ]);

        res.status(200).json({
            success: true,
            statistics: {
                totalTests,
                activeTests,
                totalSubmissions,
                inactiveTests: totalTests - activeTests
            }
        });
    } catch (error) {
        console.error('Error fetching teacher statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// Get question-wise performance
const getQuestionPerformance = async (req, res) => {
    try {
        const { id } = req.params;

        const test = await Test.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        const submissions = await TestSubmission.find({ testId: id, isCompleted: true });
        
        const questionPerformance = test.questions.map((question, index) => {
            let correct = 0;
            let total = 0;

            submissions.forEach(submission => {
                const answer = submission.submittedAnswers.find(ans => ans.questionIndex === index);
                if (answer) {
                    total++;
                    if (answer.selectedOptionIndex === question.correctAnswerIndex) {
                        correct++;
                    }
                }
            });

            return {
                questionIndex: index,
                questionText: question.questionText,
                totalAttempts: total,
                correctAnswers: correct,
                successRate: total > 0 ? ((correct / total) * 100).toFixed(2) : 0
            };
        });

        res.status(200).json({
            success: true,
            questionPerformance
        });
    } catch (error) {
        console.error('Error fetching question performance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching question performance',
            error: error.message
        });
    }
};

// Create a new test
const createTest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            title,
            description,
            department,
            semester,
            subject,
            questions,
            duration,
            dueDate,
            allowReview,
            randomizeQuestions,
            randomizeOptions,
            maxAttempts,
            instructions
        } = req.body;

        // Verify department, semester, and subject exist
        const [deptExists, semExists, subjExists] = await Promise.all([
            Department.findById(department),
            Semester.findById(semester),
            Subject.findById(subject)
        ]);

        if (!deptExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        if (!semExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid semester selected'
            });
        }

        if (!subjExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject selected'
            });
        }

        // Verify subject belongs to the selected department and semester
        if (subjExists.department.toString() !== department || 
            subjExists.semester.toString() !== semester) {
            return res.status(400).json({
                success: false,
                message: 'Subject does not belong to selected department and semester'
            });
        }

        const newTest = new Test({
            title,
            description,
            department,
            semester,
            subject,
            createdBy: req.user.id,
            questions,
            duration,
            dueDate: dueDate ? new Date(dueDate) : null,
            allowReview: allowReview || false,
            randomizeQuestions: randomizeQuestions || false,
            randomizeOptions: randomizeOptions || false,
            maxAttempts: maxAttempts || 1,
            instructions
        });

        await newTest.save();

        const populatedTest = await Test.findById(newTest._id)
            .populate('department', 'name code')
            .populate('semester', 'name number')
            .populate('subject', 'name code')
            .populate('createdBy', 'fullname username');

        // Notify students about the new test
        try {
            await notifyStudentsOnTeacherUpload(req.user.id, 'test', {
                _id: populatedTest._id,
                title: populatedTest.title,
                department: populatedTest.department,
                semester: populatedTest.semester
            });
        } catch (notificationError) {
            console.error('Error creating notifications for test:', notificationError);
            // Don't fail the main operation if notification fails
        }

        res.status(201).json({
            success: true,
            message: 'Test created successfully',
            test: populatedTest
        });
    } catch (error) {
        console.error('Error creating test:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating test',
            error: error.message
        });
    }
};

// Get all tests (for teachers/admin)
const getAllTests = async (req, res) => {
    try {
        const { department, semester, subject, isActive, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        // If user is teacher, only show their tests
        if (req.user.role === 'Teacher') {
            query.createdBy = req.user.id;
        }

        if (department) query.department = department;
        if (semester) query.semester = semester;
        if (subject) query.subject = subject;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const tests = await Test.find(query)
            .populate('department', 'name code')
            .populate('semester', 'name number')
            .populate('subject', 'name code')
            .populate('createdBy', 'fullname username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Test.countDocuments(query);

        res.status(200).json({
            success: true,
            tests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                hasNext: parseInt(page) * parseInt(limit) < total,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tests',
            error: error.message
        });
    }
};

// Get tests created by current teacher
const getMyTests = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const tests = await Test.find({ createdBy: req.user.id })
            .populate('department', 'name code')
            .populate('semester', 'name number')
            .populate('subject', 'name code')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Test.countDocuments({ createdBy: req.user.id });

        res.status(200).json({
            success: true,
            tests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                hasNext: parseInt(page) * parseInt(limit) < total,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching teacher tests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tests',
            error: error.message
        });
    }
};

// Get test by ID
const getTestById = async (req, res) => {
    try {
        const { id } = req.params;

        const test = await Test.findById(id)
            .populate('department', 'name code')
            .populate('semester', 'name number')
            .populate('subject', 'name code')
            .populate('createdBy', 'fullname username');

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check if teacher owns this test (if user is teacher)
        if (req.user.role === 'Teacher' && test.createdBy._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own tests.'
            });
        }

        res.status(200).json({
            success: true,
            test
        });
    } catch (error) {
        console.error('Error fetching test:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching test',
            error: error.message
        });
    }
};

// Update test
const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const test = await Test.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check ownership
        if (test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own tests.'
            });
        }

        // Check if test has submissions
        const submissionCount = await TestSubmission.countDocuments({ testId: id });
        if (submissionCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update test that already has submissions'
            });
        }

        const updatedTest = await Test.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        )
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .populate('subject', 'name code')
        .populate('createdBy', 'fullname username');

        res.status(200).json({
            success: true,
            message: 'Test updated successfully',
            test: updatedTest
        });
    } catch (error) {
        console.error('Error updating test:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating test',
            error: error.message
        });
    }
};

// Delete test (hard delete - permanently remove from database)
const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;

        const test = await Test.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check ownership
        if (test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own tests.'
            });
        }

        // Check if test has submissions
        const submissionCount = await TestSubmission.countDocuments({ testId: id });
        if (submissionCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete test that already has submissions'
            });
        }

        // Permanently delete the test from database
        await Test.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Test deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting test:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting test',
            error: error.message
        });
    }
};

// Toggle test activation status
const toggleTestStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const test = await Test.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check ownership
        if (test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only modify your own tests.'
            });
        }

        test.isActive = !test.isActive;
        await test.save();

        res.status(200).json({
            success: true,
            message: `Test ${test.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: test.isActive
        });
    } catch (error) {
        console.error('Error toggling test status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating test status',
            error: error.message
        });
    }
};

// Get test submissions for a specific test with academic details
const getTestSubmissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 50, sortBy = 'submissionDate', sortOrder = 'desc' } = req.query;

        const test = await Test.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check ownership
        if (test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view submissions for your own tests.'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get submissions with populated student data
        const submissions = await TestSubmission.find({ testId: id })
            .populate('studentId', 'fullname username')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Get academic details for each student
        const submissionsWithAcademicDetails = await Promise.all(
            submissions.map(async (submission) => {
                const academicDetails = await StudentAcademicDetails.findOne({ 
                    userId: submission.studentId._id 
                }).select('classRollNo fullname');

                return {
                    ...submission.toObject(),
                    academicDetails
                };
            })
        );

        const total = await TestSubmission.countDocuments({ testId: id });

        res.status(200).json({
            success: true,
            submissions: submissionsWithAcademicDetails,
            test: {
                title: test.title,
                totalMarks: test.totalMarks
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                hasNext: parseInt(page) * parseInt(limit) < total,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching test submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching test submissions',
            error: error.message
        });
    }
};

// Get detailed submission by ID
const getSubmissionById = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const submission = await TestSubmission.findById(submissionId)
            .populate('studentId', 'fullname username')
            .populate('testId');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Check if teacher owns the test
        if (submission.testId.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view submissions for your own tests.'
            });
        }

        res.status(200).json({
            success: true,
            submission
        });
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submission',
            error: error.message
        });
    }
};

// Get test analytics - average score
const getTestAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        const test = await Test.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check ownership
        if (test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view analytics for your own tests.'
            });
        }

        const submissions = await TestSubmission.find({ testId: id, isCompleted: true });

        if (submissions.length === 0) {
            return res.status(200).json({
                success: true,
                analytics: {
                    totalSubmissions: 0,
                    averageScore: 0,
                    averagePercentage: 0,
                    highestScore: 0,
                    lowestScore: 0,
                    passCount: 0,
                    failCount: 0
                }
            });
        }

        const scores = submissions.map(submission => submission.score);
        const totalScore = scores.reduce((acc, score) => acc + score, 0);
        const averageScore = totalScore / submissions.length;
        const averagePercentage = (totalScore / (test.totalMarks * submissions.length)) * 100;

        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const passCount = submissions.filter(submission => submission.score >= (test.totalMarks * 0.5)).length; // Assuming 50% is passing
        const failCount = submissions.length - passCount;

        res.status(200).json({
            success: true,
            analytics: {
                totalSubmissions: submissions.length,
                averageScore: averageScore,
                averagePercentage: averagePercentage,
                highestScore: highestScore,
                lowestScore: lowestScore,
                passCount: passCount,
                failCount: failCount
            }
        });
    } catch (error) {
        console.error('Error fetching test analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching test analytics',
            error: error.message
        });
    }
};

// Export all functions
module.exports = {
    createTest,
    getAllTests,
    getMyTests,
    getTestById,
    updateTest,
    deleteTest,
    toggleTestStatus,
    getTestSubmissions,
    getSubmissionById,
    getTestAnalytics,
    getSubjectsByDeptAndSem,
    getTestMetadata,
    getTeacherStatistics,
    getQuestionPerformance
};
