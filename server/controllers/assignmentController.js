const Assignment = require('../models/assignmentModel');
const Department = require('../models/departmentModel');
const Semester = require('../models/semesterModel');
const Subject = require('../models/subjectModel');
const User = require('../models/userModel');
const StudentAcademicDetails = require('../models/studentAcademicDetailsModel'); // Import the academic details model
const path = require('path');
const fs = require('fs');
const { notifyTeachersOnStudentUpload, notifyStudentsOnTeacherUpload, notifyStudentOnGrading } = require('../services/notificationService');
const { uploadToS3, deleteFromS3, FILE_CATEGORIES, generateDownloadLink } = require('../services/fileservice');

// Validate file integrity after upload
const validateFileIntegrity = async (filePath, originalSize) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist after upload');
    }
    
    const stats = fs.statSync(filePath);
    if (originalSize && stats.size !== originalSize) {
      console.warn(`File size mismatch: expected ${originalSize}, got ${stats.size}`);
      // Don't fail for minor size differences, but log them
    }
    
    // For PDF files, do a basic validation
    if (filePath.toLowerCase().endsWith('.pdf')) {
      const fileBuffer = fs.readFileSync(filePath);
      // Check for PDF header
      if (!fileBuffer.toString('ascii', 0, 4).includes('%PDF')) {
        throw new Error('Invalid PDF file structure');
      }
    }
    
    return true;
  } catch (error) {
    console.error('File validation error:', error);
    throw error;
  }
};

// Create assignment
const createAssignment = async (req, res) => {
  try {
    const { title, description, department, semester, subject, dueDate, maxMarks, instructions } = req.body;
    const teacherId = req.user.id;

    // Verify subject belongs to selected department and semester
    const subjectDoc = await Subject.findById(subject).populate('department semester');
    if (!subjectDoc) {
      return res.status(400).json({ message: 'Invalid subject selected' });
    }
    
    if (subjectDoc.department._id.toString() !== department || 
        subjectDoc.semester._id.toString() !== semester) {
      return res.status(400).json({ 
        message: 'Subject does not belong to selected department and semester' 
      });
    }

    // Handle file uploads with validation
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          console.log(`Processing file upload: ${file.originalname}, size: ${file.size}`);
          
          const uploadResult = await uploadToS3(file, FILE_CATEGORIES.ASSIGNMENTS);
          
          // Validate file integrity after upload
          const fullPath = path.join(process.cwd(), uploadResult.key);
          await validateFileIntegrity(fullPath, file.size);
          
          attachments.push(uploadResult.key);
          console.log(`Successfully uploaded and validated: ${file.originalname}`);
        } catch (uploadError) {
          console.error('Error uploading assignment attachment:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading attachment: ' + uploadError.message,
            error: uploadError.message
          });
        }
      }
    }

    const assignment = new Assignment({
      title,
      description,
      department,
      semester,
      subject,
      createdBy: teacherId,
      dueDate: new Date(dueDate),
      maxMarks: maxMarks || 100,
      instructions,
      attachments
    });

    await assignment.save();

    // Notify students about the new assignment
    try {
      await notifyStudentsOnTeacherUpload(teacherId, 'assignment', assignment);
    } catch (notificationError) {
      console.error('Error creating notifications for students:', notificationError);
      // Do not fail the main operation if notification fails
    }
    
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('department', 'name code')
      .populate('semester', 'name number')
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: populatedAssignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating assignment',
      error: error.message 
    });
  }
};

// Get all assignments (filtered by student's department and semester)
const getAllAssignments = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    // If user is student, filter by their department and semester
    if (user.role === 'Student') {
      const academicDetails = await StudentAcademicDetails.findOne({ userId: user.id });
      if (!academicDetails) {
        return res.status(404).json({ success: false, message: 'Academic details not found' });
      }

      query = {
        department: academicDetails.department,
        semester: academicDetails.semester,
        isActive: true
      };
    } else {
      // For teachers and admins, show all active assignments
      query = { isActive: true };
    }

    let assignments;
    
    if (user.role === 'Student') {
      // For students, include only their own submission status
      assignments = await Assignment.find(query)
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .populate('subject', 'name code')
        .populate('createdBy', 'fullname username role')
        .sort({ createdAt: -1 });

      // Add student's own submission status while removing other students' submissions
      assignments = assignments.map(assignment => {
        const assignmentObj = assignment.toObject();
        
        // Find student's own submission
        const studentSubmission = assignment.submissions.find(
          sub => sub.studentId.toString() === user.id
        );
        
        // Add submission status for the student
        assignmentObj.hasSubmitted = !!studentSubmission;
        assignmentObj.studentSubmission = studentSubmission || null;
        
        // Remove all submission details and counts for security
        delete assignmentObj.submissions;
        delete assignmentObj.submissionCount;
        
        return assignmentObj;
      });

    } else {
      // For teachers and admins, include detailed submission information
      assignments = await Assignment.find(query)
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .populate('subject', 'name code')
        .populate('createdBy', 'fullname username role')
        .populate('submissions.studentId', 'fullname username')
        .sort({ createdAt: -1 });

      // Process assignments to add submission statistics and student details
      const assignmentsWithDetails = [];
      
      for (const assignment of assignments) {
        const assignmentObj = assignment.toObject();
        
        // Ensure submissions array exists and add submission count
        assignmentObj.submissions = assignmentObj.submissions || [];
        assignmentObj.submissionCount = assignmentObj.submissions.length;
        
        // Add additional statistics for easier frontend processing
        assignmentObj.gradedCount = assignmentObj.submissions.filter(sub => sub.isGraded).length;
        assignmentObj.ungradedCount = assignmentObj.submissions.filter(sub => !sub.isGraded).length;
        
        // Get academic details for each student in submissions
        if (assignmentObj.submissions && assignmentObj.submissions.length > 0) {
          const submissionsWithDetails = [];
          
          for (const sub of assignmentObj.submissions) {
            const academicDetails = await StudentAcademicDetails.findOne({ userId: sub.studentId._id });
            submissionsWithDetails.push({
              ...sub,
              studentDetails: academicDetails ? {
                fullname: academicDetails.fullname,
                classRollNo: academicDetails.classRollNo
              } : {
                fullname: sub.studentId.name,
                classRollNo: 'N/A'
              }
            });
          }
          
          assignmentObj.submissions = submissionsWithDetails;
        }
        
        assignmentsWithDetails.push(assignmentObj);
      }
      
      assignments = assignmentsWithDetails;
    }

    res.status(200).json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assignments',
      error: error.message 
    });
  }
};

// Get assignments grouped by subject (for students)
const getAssignmentsBySubject = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Student') {
      return res.status(403).json({ 
        success: false, 
        message: 'This endpoint is only for students' 
      });
    }

    const academicDetails = await StudentAcademicDetails.findOne({ userId: user.id });
    if (!academicDetails) {
      return res.status(404).json({ success: false, message: 'Academic details not found' });
    }

    const assignments = await Assignment.find({
      department: academicDetails.department,
      semester: academicDetails.semester,
      isActive: true
    })
    .populate('subject', 'name code')
    .populate('createdBy', 'name email role')
    .sort({ 'subject.name': 1, createdAt: -1 });

    // Group assignments by subject
    const groupedAssignments = {};
    assignments.forEach(assignment => {
      const subjectId = assignment.subject._id.toString();
      if (!groupedAssignments[subjectId]) {
        groupedAssignments[subjectId] = {
          subject: assignment.subject,
          assignments: []
        };
      }
      groupedAssignments[subjectId].assignments.push(assignment);
    });

    res.status(200).json({
      success: true,
      data: Object.values(groupedAssignments)
    });
  } catch (error) {
    console.error('Error fetching assignments by subject:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assignments',
      error: error.message 
    });
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
      .populate('department', 'name code')
      .populate('semester', 'name number')
      .populate('subject', 'name code')
      .populate('createdBy', 'name email')
      .populate('submissions.studentId', 'name email');

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }

    // Get academic details for each student in submissions (similar to getAllAssignments)
    const assignmentObj = assignment.toObject();
    
    if (assignmentObj.submissions && assignmentObj.submissions.length > 0) {
      const submissionsWithDetails = [];
      
      for (const sub of assignmentObj.submissions) {
        const academicDetails = await StudentAcademicDetails.findOne({ userId: sub.studentId._id });
        submissionsWithDetails.push({
          ...sub,
          studentDetails: academicDetails ? {
            fullname: academicDetails.fullname,
            classRollNo: academicDetails.classRollNo
          } : {
            fullname: sub.studentId.name,
            classRollNo: 'N/A'
          }
        });
      }
      
      assignmentObj.submissions = submissionsWithDetails;
    }

    res.status(200).json({
      success: true,
      assignment: assignmentObj
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assignment',
      error: error.message 
    });
  }
};

// Get assignments created by current teacher
const getMyAssignments = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const assignments = await Assignment.find({ createdBy: teacherId })
      .populate('department', 'name code')
      .populate('semester', 'name number')
      .populate('subject', 'name code')
      .populate('createdBy', 'fullname username role')
      .populate('submissions.studentId', 'fullname username')
      .sort({ createdAt: -1 });

    // Add submission statistics to each assignment
    const assignmentsWithStats = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      const submissions = assignment.submissions || [];
      
      assignmentObj.stats = {
        totalSubmissions: submissions.length,
        gradedSubmissions: submissions.filter(sub => sub.isGraded).length,
        pendingSubmissions: submissions.filter(sub => !sub.isGraded).length,
        submissions: submissions.map(sub => ({
          ...sub,
          studentName: sub.studentId.name,
          studentEmail: sub.studentId.email
        }))
      };

      return assignmentObj;
    });

    res.status(200).json({
      success: true,
      assignments: assignmentsWithStats
    });
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assignments',
      error: error.message 
    });
  }
};

// Update assignment
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const assignment = await Assignment.findOne({ _id: id, createdBy: teacherId });
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found or unauthorized' 
      });
    }

    // Extract fields from req.body
    const { title, description, department, semester, subject, dueDate, maxMarks, instructions, status } = req.body;

    // Verify subject belongs to selected department and semester if provided
    if (subject && department && semester) {
      const subjectDoc = await Subject.findById(subject).populate('department semester');
      if (!subjectDoc) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid subject selected' 
        });
      }
      
      if (subjectDoc.department._id.toString() !== department || 
          subjectDoc.semester._id.toString() !== semester) {
        return res.status(400).json({ 
          success: false,
          message: 'Subject does not belong to selected department and semester' 
        });
      }
    }

    // Update fields
    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.department = department || assignment.department;
    assignment.semester = semester || assignment.semester;
    assignment.subject = subject || assignment.subject;
    assignment.dueDate = dueDate ? new Date(dueDate) : assignment.dueDate;
    assignment.maxMarks = maxMarks || assignment.maxMarks;
    assignment.instructions = instructions || assignment.instructions;

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      // Replace existing attachments with new uploaded files
      const attachments = req.files.map(file => file.filename);
      assignment.attachments = attachments;
    } else if (req.body.attachments) {
      // If attachments sent as part of body (e.g., empty array), update accordingly
      assignment.attachments = req.body.attachments;
    }

    // Handle status field (convert to isActive boolean)
    if (status !== undefined) {
      assignment.isActive = status === 'active';
    }

    await assignment.save();

    const updatedAssignment = await Assignment.findById(assignment._id)
      .populate('department', 'name code')
      .populate('semester', 'name number')
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating assignment',
      error: error.message 
    });
  }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const assignment = await Assignment.findOneAndDelete({ _id: id, createdBy: teacherId });
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found or unauthorized' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting assignment',
      error: error.message 
    });
  }
};

// Submit assignment
const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }

    // Check if student belongs to assignment's department and semester
    const academicDetails = await StudentAcademicDetails.findOne({ userId: studentId });
    if (!academicDetails) {
      return res.status(404).json({ success: false, message: 'Academic details not found' });
    }

    if (academicDetails.department.toString() !== assignment.department.toString() ||
        academicDetails.semester.toString() !== assignment.semester.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible to submit this assignment'
      });
    }

    const submission = {
      studentId,
      submissionFile: req.file.filename, // Use the uploaded file's filename
      submissionDate: new Date()
    };

    assignment.submissions.push(submission);
    await assignment.save();

    // Notify teachers about the submission
    try {
      console.log(`Attempting to notify teachers about assignment submission: ${assignment.title} by student: ${studentId}`);
      await notifyTeachersOnStudentUpload(studentId, 'assignment_submission', {
        _id: assignment._id,
        title: assignment.title
      });
      console.log('Successfully notified teachers about assignment submission');
    } catch (notificationError) {
      console.error('CRITICAL: Failed to create notifications for assignment submission:', {
        error: notificationError.message,
        stack: notificationError.stack,
        assignmentId: assignment._id,
        assignmentTitle: assignment.title,
        studentId: studentId
      });
      // Don't fail the main operation if notification fails, but log it prominently
    }

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error submitting assignment',
      error: error.message 
    });
  }
};

// Update submission
const updateSubmission = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { submissionFile } = req.body;
    const studentId = req.user.id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found' 
      });
    }

    if (submission.studentId.toString() !== studentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to update this submission' 
      });
    }

    if (submission.isGraded) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot update graded submission' 
      });
    }

    submission.submissionFile = submissionFile;
    submission.submissionDate = new Date();

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Submission updated successfully',
      submission
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating submission',
      error: error.message 
    });
  }
};

// Grade submission
const gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;
    const teacherId = req.user.id;

    const assignment = await Assignment.findOne({ 
      _id: assignmentId, 
      createdBy: teacherId 
    });
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found or unauthorized' 
      });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found' 
      });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.isGraded = true;

    await assignment.save();

    // Notify student about grading
    try {
      await notifyStudentOnGrading(teacherId, submission.studentId, assignment, { grade, feedback });
    } catch (notificationError) {
      console.error('Error sending grade notification:', notificationError);
      // Do not fail the main operation if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error grading submission',
      error: error.message 
    });
  }
};

// Get student's own submissions
const getMySubmissions = async (req, res) => {
  try {
    const studentId = req.user.id;

    const assignments = await Assignment.find({
      'submissions.studentId': studentId
    })
    .populate('department', 'name code')
    .populate('semester', 'name number')
    .populate('subject', 'name code')
    .populate('createdBy', 'name email role');

    const submissions = [];
    assignments.forEach(assignment => {
      const studentSubmission = assignment.submissions.find(
        sub => sub.studentId.toString() === studentId
      );
      if (studentSubmission) {
        submissions.push({
          assignment: {
            _id: assignment._id,
            title: assignment.title,
            serialNumber: assignment.serialNumber,
            subject: assignment.subject,
            dueDate: assignment.dueDate,
            maxMarks: assignment.maxMarks
          },
          submission: studentSubmission
        });
      }
    });

    res.status(200).json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error fetching student submissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching submissions',
      error: error.message 
    });
  }
};

// Get assignment statistics
const getAssignmentStats = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const assignment = await Assignment.findOne({ 
      _id: id, 
      createdBy: teacherId 
    });
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found or unauthorized' 
      });
    }

    const totalSubmissions = assignment.submissions.length;
    const gradedSubmissions = assignment.submissions.filter(sub => sub.isGraded).length;
    const pendingSubmissions = totalSubmissions - gradedSubmissions;
    
    const grades = assignment.submissions
      .filter(sub => sub.grade !== null)
      .map(sub => sub.grade);
    
    const averageGrade = grades.length > 0 
      ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length 
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions,
        averageGrade: Math.round(averageGrade * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assignment statistics',
      error: error.message 
    });
  }
};

// Get metadata for dropdowns
const getAssignmentMetadata = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    const semesters = await Semester.find({ isActive: true }).sort({ number: 1 });
    
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

// Enhanced file search function to handle various filename patterns
const findFileInUploads = (filename) => {
  console.log(`Searching for file: ${filename}`);
  
  // Clean the filename to handle different path formats
  let cleanFilename = filename.replace(/^[\/\\]+/, '');
  
  // Define search directories in order of priority
  const searchDirs = [
    'uploads/assignments',
    'uploads',
    'uploads/notices',
    'uploads/pyqs',
    'uploads/study-materials',
    'uploads/paid-notes',
    'uploads/documents',
    'uploads/e-library'
  ];
  
  // Define possible filename patterns to search for
  const getFilenameVariations = (originalName) => {
    const variations = [originalName];
    
    // Remove timestamp prefixes (e.g., "1234567890-filename.pdf" -> "filename.pdf")
    const withoutTimestamp = originalName.replace(/^\d+-/, '');
    if (withoutTimestamp !== originalName) {
      variations.push(withoutTimestamp);
    }
    
    // Remove suffix numbers (e.g., "filename__1_.pdf" -> "filename.pdf")
    const withoutSuffix = originalName.replace(/__\d+_/, '');
    if (withoutSuffix !== originalName) {
      variations.push(withoutSuffix);
    }
    
    // Combine both removals
    const cleanName = withoutTimestamp.replace(/__\d+_/, '');
    if (cleanName !== originalName && !variations.includes(cleanName)) {
      variations.push(cleanName);
    }
    
    return variations;
  };
  
  const filenameVariations = getFilenameVariations(cleanFilename);
  console.log(`Filename variations to search:`, filenameVariations);
  
  // Search in each directory for each filename variation
  for (const searchDir of searchDirs) {
    const dirPath = path.join(process.cwd(), searchDir);
    
    if (!fs.existsSync(dirPath)) {
      continue;
    }
    
    try {
      const files = fs.readdirSync(dirPath);
      console.log(`Files in ${searchDir}:`, files);
      
      // First, try exact matches
      for (const variation of filenameVariations) {
        if (files.includes(variation)) {
          const foundPath = path.join(searchDir, variation);
          console.log(`Found exact match: ${foundPath}`);
          return foundPath;
        }
      }
      
      // Then, try partial matches (for cases where the stored filename has additional prefixes)
      for (const file of files) {
        for (const variation of filenameVariations) {
          // Check if the file ends with our variation (handles timestamp prefixes)
          if (file.endsWith(variation.replace(/^\d+-/, ''))) {
            const foundPath = path.join(searchDir, file);
            console.log(`Found partial match: ${foundPath} for ${variation}`);
            return foundPath;
          }
          
          // Check if our variation contains part of the file name
          const baseVariation = variation.replace(/^\d+-/, '').replace(/__\d+_/, '');
          const baseFile = file.replace(/^\d+-/, '').replace(/__\d+_/, '');
          if (baseVariation === baseFile) {
            const foundPath = path.join(searchDir, file);
            console.log(`Found base name match: ${foundPath} for ${variation}`);
            return foundPath;
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${searchDir}:`, error);
      continue;
    }
  }
  
  console.log(`File not found in any location: ${cleanFilename}`);
  return null;
};

// Download assignment file
const downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    console.log(`Direct file download request: ${filename}`);

    // Use enhanced file search
    const filePath = findFileInUploads(filename);
    
    if (!filePath) {
      console.error(`File not found in any expected location: ${filename}`);
      return res.status(404).json({
        success: false,
        message: 'File not found',
        details: `Searched for: ${filename}`
      });
    }

    const fullPath = path.join(process.cwd(), filePath);
    
    // Double-check file exists (should always be true if findFileInUploads worked)
    if (!fs.existsSync(fullPath)) {
      console.error(`File path resolved but file does not exist: ${fullPath}`);
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Validate file integrity before serving
    const ext = path.extname(fullPath).toLowerCase();
    if (ext === '.pdf') {
      try {
        await validateFileIntegrity(fullPath);
        console.log(`PDF integrity validated for direct download: ${filename}`);
      } catch (validationError) {
        console.error(`PDF validation failed for ${filename}:`, validationError);
        return res.status(500).json({
          success: false,
          message: 'File is corrupted or invalid'
        });
      }
    }

    // Get file stats
    const stats = fs.statSync(fullPath);
    const fileName = path.basename(fullPath);
    
    // Set appropriate headers for binary file download
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.zip': 'application/zip',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.epub': 'application/epub+zip'
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Accept-Ranges', 'bytes');

    // Stream the file directly with binary integrity
    const fileStream = fs.createReadStream(fullPath, {
      highWaterMark: 64 * 1024, // 64KB chunks
      encoding: null // Ensure binary mode
    });

    fileStream.on('error', (error) => {
      console.error('Direct file streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error serving file'
        });
      }
    });

    fileStream.on('open', () => {
      console.log(`Started direct streaming: ${fileName} (${stats.size} bytes) from ${filePath}`);
    });

    fileStream.on('end', () => {
      console.log(`Successfully streamed directly: ${fileName} (${stats.size} bytes)`);
    });

    // Handle client disconnect
    req.on('close', () => {
      if (!fileStream.destroyed) {
        fileStream.destroy();
        console.log(`Client disconnected during direct streaming: ${fileName}`);
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Error in direct file download:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error downloading file',
        error: error.message
      });
    }
  }
};

// Download assignment attachment by assignment ID and filename
const downloadAssignmentFile = async (req, res) => {
  try {
    const { id, filename } = req.params;
    const userId = req.user.id;

    console.log(`Assignment file download request: Assignment ID: ${id}, Filename: ${filename}`);

    // Find the assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user has access to this assignment
    if (req.user.role === 'Student') {
      // Students can only access assignments from their department and semester
      const academicDetails = await StudentAcademicDetails.findOne({ userId });
      if (!academicDetails) {
        return res.status(404).json({ success: false, message: 'Academic details not found' });
      }

      if (academicDetails.department.toString() !== assignment.department.toString() ||
          academicDetails.semester.toString() !== assignment.semester.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this assignment'
        });
      }
    } else if (req.user.role === 'Teacher') {
      // Teachers can access their own assignments or assignments from their subjects
      if (assignment.createdBy.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this assignment'
        });
      }
    }

    // Use enhanced file search instead of checking assignment attachments
    console.log(`Using enhanced file search for: ${filename}`);
    let filePath = findFileInUploads(filename);
    
    if (!filePath) {
      console.error(`File not found using enhanced search: ${filename}`);
      
      // Fallback: Check if the filename exists in assignment attachments (for exact matches)
      if (assignment.attachments && assignment.attachments.includes(filename)) {
        console.log(`Found in assignment attachments: ${filename}`);
        let fallbackPath = filename;
        if (!filename.startsWith('uploads/')) {
          fallbackPath = `uploads/assignments/${filename}`;
        }
        
        const fallbackFullPath = path.join(process.cwd(), fallbackPath);
        if (fs.existsSync(fallbackFullPath)) {
          console.log(`Using fallback path: ${fallbackPath}`);
          filePath = fallbackPath; // Fix: assign to filePath variable
        } else {
          return res.status(404).json({
            success: false,
            message: 'File not found on server',
            details: `Searched for: ${filename}`
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          details: `Searched for: ${filename}`
        });
      }
    }

    const fullPath = path.join(process.cwd(), filePath);
    
    // Double-check file exists (should always be true if findFileInUploads worked)
    if (!fs.existsSync(fullPath)) {
      console.error(`File path resolved but file does not exist: ${fullPath}`);
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Validate file integrity before serving
    const ext = path.extname(fullPath).toLowerCase();
    if (ext === '.pdf') {
      try {
        await validateFileIntegrity(fullPath);
        console.log(`PDF integrity validated for assignment download: ${filename}`);
      } catch (validationError) {
        console.error(`PDF validation failed for assignment ${filename}:`, validationError);
        return res.status(500).json({
          success: false,
          message: 'File is corrupted or invalid'
        });
      }
    }

    // Get file stats
    const stats = fs.statSync(fullPath);
    const fileName = path.basename(fullPath);
    
    // Set appropriate headers for binary file download
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.zip': 'application/zip',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.epub': 'application/epub+zip'
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Accept-Ranges', 'bytes');

    // Stream the file directly with binary integrity
    const fileStream = fs.createReadStream(fullPath, {
      highWaterMark: 64 * 1024, // 64KB chunks
      encoding: null // Ensure binary mode
    });

    fileStream.on('error', (error) => {
      console.error('Assignment file streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error serving file'
        });
      }
    });

    fileStream.on('open', () => {
      console.log(`Started streaming assignment file: ${fileName} (${stats.size} bytes) from ${filePath} for assignment: ${assignment.title}`);
    });

    fileStream.on('end', () => {
      console.log(`Successfully streamed assignment file: ${fileName} (${stats.size} bytes) for assignment: ${assignment.title}`);
    });

    // Handle client disconnect
    req.on('close', () => {
      if (!fileStream.destroyed) {
        fileStream.destroy();
        console.log(`Client disconnected during assignment file streaming: ${fileName}`);
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading assignment file:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error downloading assignment file',
        error: error.message
      });
    }
  }
};

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentsBySubject,
  getAssignmentById,
  getMyAssignments,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  updateSubmission,
  gradeSubmission,
  getMySubmissions,
  getAssignmentStats,
  getAssignmentMetadata,
  getSubjectsByDeptAndSem,
  downloadFile,
  downloadAssignmentFile
};
