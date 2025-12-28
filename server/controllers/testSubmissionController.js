const Test = require('../models/testModel');
const TestSubmission = require('../models/testSubmissionModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
const { validationResult } = require('express-validator');

// Get available tests for student
const getAvailableTests = async (req, res) => {
    try {
        const academicDetails = await StudentAcademicDetails.findOne({ userId: req.user.id });
        if (!academicDetails) {
            return res.status(404).json({
                success: false,
                message: 'Academic details not found. Please complete your profile first.'
            });
        }

        // Get submitted test IDs
        const submittedTests = await TestSubmission.find({
            studentId: req.user.id,
            isCompleted: true
        }).distinct('testId');

        const currentDate = new Date();
        
        const availableTests = await Test.find({
            department: academicDetails.department,
            semester: academicDetails.semester,
            isActive: true,
            $or: [
                { dueDate: { $gt: currentDate } },
                { dueDate: null }
            ],
            _id: { $nin: submittedTests }
        })
        .populate('subject', 'name code')
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .populate('createdBy', 'fullname')
        .select('-questions.correctAnswerIndex') // Hide correct answers
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            tests: availableTests
        });
    } catch (error) {
        console.error('Error fetching available tests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available tests',
            error: error.message
        });
    }
};

// Get test for student (without correct answers)
const getTestForStudent = async (req, res) => {
    try {
        const test = req.test; // Set by middleware

        // Check if student has already submitted
        const existingSubmission = await TestSubmission.findOne({
            testId: test._id,
            studentId: req.user.id,
            isCompleted: true
        });

        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'You have already completed this test'
            });
        }

        // Remove correct answers from questions
        const sanitizedQuestions = test.questions.map((question, index) => ({
            questionIndex: index,
            questionText: question.questionText,
            options: question.options,
            marks: question.marks
        }));

        const testForStudent = {
            _id: test._id,
            title: test.title,
            description: test.description,
            instructions: test.instructions,
            duration: test.duration,
            totalMarks: test.totalMarks,
            questions: sanitizedQuestions,
            dueDate: test.dueDate,
            maxAttempts: test.maxAttempts,
            randomizeQuestions: test.randomizeQuestions,
            randomizeOptions: test.randomizeOptions
        };

        res.status(200).json({
            success: true,
            test: testForStudent
        });
    } catch (error) {
        console.error('Error fetching test for student:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching test',
            error: error.message
        });
    }
};

// Start a test
const startTest = async (req, res) => {
    try {
        const test = req.test; // Set by middleware

        // Check if student has already started but not completed
        const activeSubmission = await TestSubmission.findOne({
            testId: test._id,
            studentId: req.user.id,
            isCompleted: false
        });

        if (activeSubmission) {
            return res.status(200).json({
                success: true,
                message: 'Test session already active',
                submissionId: activeSubmission._id,
                startTime: activeSubmission.startTime
            });
        }

        // Check attempt count
        const attemptCount = await TestSubmission.countDocuments({
            testId: test._id,
            studentId: req.user.id
        });

        if (attemptCount >= test.maxAttempts) {
            return res.status(400).json({
                success: false,
                message: `Maximum attempts (${test.maxAttempts}) reached for this test`
            });
        }

        // Create new submission
        const newSubmission = new TestSubmission({
            testId: test._id,
            studentId: req.user.id,
            attemptNumber: attemptCount + 1,
            submittedAnswers: [],
            score: 0,
            totalMarks: test.totalMarks,
            startTime: new Date(),
            isCompleted: false,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        await newSubmission.save();

        res.status(201).json({
            success: true,
            message: 'Test started successfully',
            submissionId: newSubmission._id,
            startTime: newSubmission.startTime,
            duration: test.duration
        });
    } catch (error) {
        console.error('Error starting test:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting test',
            error: error.message
        });
    }
};

// Submit a test
const submitTest = async (req, res) => {
    try {
        const { submittedAnswers } = req.body;
        const test = req.test; // Set by middleware
        const submission = req.submission; // Set by middleware

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const currentTime = new Date();
        const timeTaken = (currentTime - submission.startTime) / (1000 * 60); // Time in minutes

        // Check time limit
        if (test.duration && timeTaken > test.duration) {
            submission.isLateSubmission = true;
        }

        // Calculate score
        let totalScore = 0;
        const processedAnswers = submittedAnswers.map((answer, index) => {
            const question = test.questions[answer.questionIndex];
            const isCorrect = question.correctAnswerIndex === answer.selectedOptionIndex;
            const marksObtained = isCorrect ? question.marks : 0;
            
            totalScore += marksObtained;

            return {
                questionIndex: answer.questionIndex,
                selectedOptionIndex: answer.selectedOptionIndex,
                isCorrect,
                marksObtained,
                timeTaken: answer.timeTaken || 0
            };
        });

        // Update submission
        submission.submittedAnswers = processedAnswers;
        submission.score = totalScore;
        submission.isCompleted = true;
        submission.endTime = currentTime;
        submission.submissionDate = currentTime;

        await submission.save();

        res.status(200).json({
            success: true,
            message: 'Test submitted successfully',
            result: {
                score: totalScore,
                totalMarks: test.totalMarks,
                percentage: submission.percentage,
                timeTaken: submission.timeTaken,
                isLateSubmission: submission.isLateSubmission
            }
        });
    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting test',
            error: error.message
        });
    }
};

// Get student's test records
const getMyTestRecords = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, subject } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = { studentId: req.user.id };
        
        if (status === 'completed') {
            query.isCompleted = true;
        } else if (status === 'active') {
            query.isCompleted = false;
        }

        const submissions = await TestSubmission.find(query)
            .populate({
                path: 'testId',
                select: 'title subject totalMarks duration dueDate',
                populate: {
                    path: 'subject',
                    select: 'name code'
                },
                match: subject ? { subject } : {}
            })
            .sort({ submissionDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Filter out submissions where testId is null (due to populate match)
        const filteredSubmissions = submissions.filter(sub => sub.testId);

        const total = await TestSubmission.countDocuments(query);

        res.status(200).json({
            success: true,
            submissions: filteredSubmissions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                hasNext: parseInt(page) * parseInt(limit) < total,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching test records:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching test records',
            error: error.message
        });
    }
};

// Get submission by ID
const getSubmissionById = async (req, res) => {
    try {
        const submission = req.submission; // Set by middleware

        await submission.populate([
            {
                path: 'testId',
                select: 'title questions totalMarks allowReview'
            },
            {
                path: 'studentId',
                select: 'fullname username'
            }
        ]);

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

// Get test review (if allowed)
const getTestReview = async (req, res) => {
    try {
        const test = req.test; // Set by middleware

        if (!test.allowReview) {
            return res.status(403).json({
                success: false,
                message: 'Review is not allowed for this test'
            });
        }

        const submission = await TestSubmission.findOne({
            testId: test._id,
            studentId: req.user.id,
            isCompleted: true
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'No completed submission found for this test'
            });
        }

        // Prepare review data with correct answers
        const reviewData = test.questions.map((question, index) => {
            const studentAnswer = submission.submittedAnswers.find(ans => ans.questionIndex === index);
            
            return {
                questionIndex: index,
                questionText: question.questionText,
                options: question.options,
                correctAnswerIndex: question.correctAnswerIndex,
                studentAnswerIndex: studentAnswer ? studentAnswer.selectedOptionIndex : null,
                isCorrect: studentAnswer ? studentAnswer.isCorrect : false,
                marksObtained: studentAnswer ? studentAnswer.marksObtained : 0,
                totalMarks: question.marks
            };
        });

        res.status(200).json({
            success: true,
            review: {
                test: {
                    title: test.title,
                    totalMarks: test.totalMarks
                },
                submission: {
                    score: submission.score,
                    percentage: submission.percentage,
                    submissionDate: submission.submissionDate,
                    timeTaken: submission.timeTaken
                },
                questions: reviewData
            }
        });
    } catch (error) {
        console.error('Error fetching test review:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching test review',
            error: error.message
        });
    }
};

// Get student performance across all tests
const getStudentPerformance = async (req, res) => {
    try {
        const submissions = await TestSubmission.find({
            studentId: req.user.id,
            isCompleted: true
        })
        .populate({
            path: 'testId',
            select: 'title subject totalMarks',
            populate: {
                path: 'subject',
                select: 'name code'
            }
        })
        .sort({ submissionDate: -1 });

        const totalTests = submissions.length;
        const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
        const totalPossibleMarks = submissions.reduce((sum, sub) => sum + sub.totalMarks, 0);
        const averagePercentage = totalPossibleMarks > 0 ? (totalScore / totalPossibleMarks) * 100 : 0;

        // Calculate subject-wise performance
        const subjectPerformance = {};
        submissions.forEach(submission => {
            const subjectName = submission.testId.subject.name;
            if (!subjectPerformance[subjectName]) {
                subjectPerformance[subjectName] = {
                    totalTests: 0,
                    totalScore: 0,
                    totalMarks: 0,
                    averagePercentage: 0
                };
            }
            subjectPerformance[subjectName].totalTests++;
            subjectPerformance[subjectName].totalScore += submission.score;
            subjectPerformance[subjectName].totalMarks += submission.totalMarks;
            subjectPerformance[subjectName].averagePercentage = 
                (subjectPerformance[subjectName].totalScore / subjectPerformance[subjectName].totalMarks) * 100;
        });

        res.status(200).json({
            success: true,
            performance: {
                overall: {
                    totalTests,
                    averagePercentage: averagePercentage.toFixed(2),
                    totalScore,
                    totalPossibleMarks
                },
                subjectWise: subjectPerformance,
                recentSubmissions: submissions.slice(0, 5) // Last 5 submissions
            }
        });
    } catch (error) {
        console.error('Error fetching student performance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student performance',
            error: error.message
        });
    }
};

module.exports = {
    getAvailableTests,
    getTestForStudent,
    startTest,
    submitTest,
    getMyTestRecords,
    getSubmissionById,
    getTestReview,
    getStudentPerformance
};
