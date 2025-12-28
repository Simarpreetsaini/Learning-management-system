const StudentAcademicDetails = require('../models/studentAcademicDetailsModel');
const Department = require('../models/departmentModel');
const Semester = require('../models/semesterModel');
const User = require('../models/userModel');

// Create student academic details
const createStudentAcademicDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            universityRollNo,
            classRollNo,
            fullname,
            fathername,
            mothername,
            dob,
            department,
            semester,
            section,
            phone,
            fatherphone,
            email,
            session,
            lateralEntry
        } = req.body;

        // Handle uploaded photo
        const photo = req.file ? req.file.filename : null;

        // Check if user is a student
        if (req.user.role !== 'Student' && req.user.role !== 'Teacher') {
            return res.status(403).json({
                success: false,
                message: 'Only students can create academic details'
            });
        }

        // Check if academic details already exist for this user
        const existingDetails = await StudentAcademicDetails.findOne({ userId });
        if (existingDetails) {
            return res.status(400).json({
                success: false,
                message: 'Academic details already exist for this user'
            });
        }

        // Check if university roll number already exists
        const existingRollNo = await StudentAcademicDetails.findOne({ universityRollNo });
        if (existingRollNo) {
            return res.status(400).json({
                success: false,
                message: 'University roll number already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await StudentAcademicDetails.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists in academic details'
            });
        }

        // Verify department exists
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department selected'
            });
        }

        // Verify semester exists
        const semesterExists = await Semester.findById(semester);
        if (!semesterExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid semester selected'
            });
        }

        const academicDetails = new StudentAcademicDetails({
            userId,
            universityRollNo: universityRollNo.toUpperCase(),
            classRollNo,
            fullname,
            fathername,
            mothername,
            dob: new Date(dob),
            department,
            semester,
            section: section.toUpperCase(),
            phone,
            fatherphone,
            email: email.toLowerCase(),
            photo,
            session,
            lateralEntry: lateralEntry || false
        });

        await academicDetails.save();

        const populatedDetails = await StudentAcademicDetails.findById(academicDetails._id)
            .populate('department', 'name code')
            .populate('semester', 'name number');

        res.status(201).json({
            success: true,
            message: 'Academic details created successfully',
            academicDetails: populatedDetails
        });
    } catch (error) {
        console.error('Error creating academic details:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating academic details',
            error: error.message
        });
    }
};

// Get academic details by current user
const getMyAcademicDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const academicDetails = await StudentAcademicDetails.findOne({ userId })
            .populate('department', 'name code')
            .populate('semester', 'name number');

        if (!academicDetails) {
            return res.status(404).json({
                success: false,
                message: 'Academic details not found'
            });
        }

        res.status(200).json({
            success: true,
            academicDetails
        });
    } catch (error) {
        console.error('Error fetching academic details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching academic details',
            error: error.message
        });
    }
};

const getAcademicDetails = async (req, res) => {
  try {
    const academicDetails = await StudentAcademicDetails.findOne({ userId: req.user._id });
    if (!academicDetails) {
      return res.status(404).json({ message: 'Academic details not found' });
    }
    res.status(200).json(academicDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get academic details by ID (Admin/Teacher access)
const getAcademicDetailsById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        const academicDetails = await StudentAcademicDetails.findById(id)
            .populate('userId', 'username fullname')
            .populate('department', 'name code')
            .populate('semester', 'name number');

        if (!academicDetails) {
            return res.status(404).json({
                success: false,
                message: 'Academic details not found'
            });
        }

        res.status(200).json({
            success: true,
            academicDetails
        });
    } catch (error) {
        console.error('Error fetching academic details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching academic details',
            error: error.message
        });
    }
};

// Get all academic details (Admin/Teacher access)
const getAllAcademicDetails = async (req, res) => {
    try {
        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        const { department, semester, section, page = 1, limit = 10 } = req.query;
        let query = {};

        if (department) query.department = department;
        if (semester) query.semester = semester;
        if (section) query.section = section.toUpperCase();

        const skip = (page - 1) * limit;

        const academicDetails = await StudentAcademicDetails.find(query)
            .populate('userId', 'username fullname')
            .populate('department', 'name code')
            .populate('semester', 'name number')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await StudentAcademicDetails.countDocuments(query);

        res.status(200).json({
            success: true,
            academicDetails,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching academic details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching academic details',
            error: error.message
        });
    }
};

// Update academic details
const updateAcademicDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            universityRollNo,
            classRollNo,
            fullname,
            fathername,
            mothername,
            dob,
            department,
            semester,
            section,
            phone,
            fatherphone,
            email,
            session,
            lateralEntry
        } = req.body;

        // Handle uploaded photo
        const photo = req.file ? req.file.filename : undefined;

        // Check if user is a student
        if (req.user.role !== 'Student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can update their academic details'
            });
        }

        // Check if university roll number exists for another user
        if (universityRollNo) {
            const existingRollNo = await StudentAcademicDetails.findOne({ 
                universityRollNo: universityRollNo.toUpperCase(),
                userId: { $ne: userId }
            });
            if (existingRollNo) {
                return res.status(400).json({
                    success: false,
                    message: 'University roll number already exists'
                });
            }
        }

        // Check if email exists for another user
        if (email) {
            const existingEmail = await StudentAcademicDetails.findOne({ 
                email: email.toLowerCase(),
                userId: { $ne: userId }
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists in academic details'
                });
            }
        }

        const updateData = {};
        if (universityRollNo) updateData.universityRollNo = universityRollNo.toUpperCase();
        if (classRollNo) updateData.classRollNo = classRollNo;
        if (fullname) updateData.fullname = fullname;
        if (fathername) updateData.fathername = fathername;
        if (mothername) updateData.mothername = mothername;
        if (dob) updateData.dob = new Date(dob);
        if (department) updateData.department = department;
        if (semester) updateData.semester = semester;
        if (section) updateData.section = section.toUpperCase();
        if (phone) updateData.phone = phone;
        if (fatherphone) updateData.fatherphone = fatherphone;
        if (email) updateData.email = email.toLowerCase();
        if (photo) updateData.photo = photo;
        if (session) updateData.session = session;
        if (lateralEntry !== undefined) updateData.lateralEntry = lateralEntry;

        const academicDetails = await StudentAcademicDetails.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, runValidators: true }
        ).populate('department', 'name code')
         .populate('semester', 'name number');

        if (!academicDetails) {
            return res.status(404).json({
                success: false,
                message: 'Academic details not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Academic details updated successfully',
            academicDetails
        });
    } catch (error) {
        console.error('Error updating academic details:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating academic details',
            error: error.message
        });
    }
};

// Delete academic details
const deleteAcademicDetails = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user is a student
        if (req.user.role !== 'Student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can delete their academic details'
            });
        }

        const academicDetails = await StudentAcademicDetails.findOneAndDelete({ userId });

        if (!academicDetails) {
            return res.status(404).json({
                success: false,
                message: 'Academic details not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Academic details deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting academic details:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting academic details',
            error: error.message
        });
    }
};

// Get students by department and semester (Teacher/Admin access)
const getStudentsByDeptAndSem = async (req, res) => {
    try {
        const { departmentId, semesterId } = req.params;

        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        const students = await StudentAcademicDetails.find({
            department: departmentId,
            semester: semesterId
        })
        .populate('userId', 'username fullname')
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .sort({ classRollNo: 1 });

        res.status(200).json({
            success: true,
            students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students',
            error: error.message
        });
    }
};

// Get students by department, semester, and section (Teacher/Admin access)
const getStudentsByDeptSemAndSection = async (req, res) => {
    try {
        const { departmentId, semesterId, section } = req.params;

        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        const students = await StudentAcademicDetails.find({
            department: departmentId,
            semester: semesterId,
            section: section.toUpperCase()
        })
        .populate('userId', 'username fullname')
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .sort({ classRollNo: 1 });

        res.status(200).json({
            success: true,
            students
        });
    } catch (error) {
        console.error('Error fetching students by section:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students by section',
            error: error.message
        });
    }
};

// Search students (Admin/Teacher access)
const searchStudents = async (req, res) => {
    try {
        const { query } = req.query;

        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchRegex = new RegExp(query, 'i');

        const students = await StudentAcademicDetails.find({
            $or: [
                { universityRollNo: searchRegex },
                { classRollNo: searchRegex },
                { fullname: searchRegex },
                { email: searchRegex }
            ]
        })
        .populate('userId', 'username fullname')
        .populate('department', 'name code')
        .populate('semester', 'name number')
        .limit(20);

        res.status(200).json({
            success: true,
            students
        });
    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching students',
            error: error.message
        });
    }
};

// Export student data to Excel or PDF
const exportStudentData = async (req, res) => {
    try {
        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        const { department, semester, section, format = 'excel', studentIds } = req.query;
        let query = {};

        // Build query based on filters
        if (department) query.department = department;
        if (semester) query.semester = semester;
        if (section) query.section = section.toUpperCase();
        
        // If specific student IDs are provided, filter by them
        if (studentIds) {
            const ids = studentIds.split(',');
            query._id = { $in: ids };
        }

        const students = await StudentAcademicDetails.find(query)
            .populate('userId', 'username fullname')
            .populate('department', 'name code')
            .populate('semester', 'name number')
            .sort({ classRollNo: 1 });

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No student data found for export'
            });
        }

        // Prepare data for export
        const exportData = students.map(student => ({
            'Registration Number': student.universityRollNo,
            'Class Roll No': student.classRollNo,
            'Full Name': student.fullname,
            'Father Name': student.fathername,
            'Mother Name': student.mothername,
            'Date of Birth': student.dob ? new Date(student.dob).toLocaleDateString() : '',
            'Department': student.department?.name || '',
            'Department Code': student.department?.code || '',
            'Semester': student.semester?.name || '',
            'Section': student.section || '',
            'Phone': student.phone,
            'Father Phone': student.fatherphone,
            'Email': student.email,
            'Session': student.session,
            'Lateral Entry': student.lateralEntry ? 'Yes' : 'No',
            'Username': student.userId?.username || '',
            'Created At': new Date(student.createdAt).toLocaleDateString()
        }));

        if (format === 'excel') {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Student Data');

            // Add title
            worksheet.mergeCells('A1:Q1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'Student Academic Data Report';
            titleCell.font = { size: 16, bold: true };
            titleCell.alignment = { horizontal: 'center' };

            // Add export info
            worksheet.mergeCells('A2:Q2');
            const infoCell = worksheet.getCell('A2');
            infoCell.value = `Generated on: ${new Date().toLocaleDateString()} | Total Students: ${students.length}`;
            infoCell.font = { size: 12 };
            infoCell.alignment = { horizontal: 'center' };

            // Add headers
            const headers = Object.keys(exportData[0]);
            worksheet.addRow([]); // Empty row
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Add data
            exportData.forEach(row => {
                worksheet.addRow(Object.values(row));
            });

            // Auto-fit columns
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = maxLength < 10 ? 10 : maxLength + 2;
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

            // Write to response
            await workbook.xlsx.write(res);
            res.end();

        } else if (format === 'pdf') {
            const PDFDocument = require('pdfkit');
            const fs = require('fs');
            const path = require('path');
            
            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=students.pdf');

            // Pipe the PDF to response
            doc.pipe(res);

            // Add title
            doc.fontSize(18).font('Helvetica-Bold').text('Student Academic Data Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()} | Total Students: ${students.length}`, { align: 'center' });
            doc.moveDown(2);

            // Create individual student cards instead of table for better photo display
            for (let i = 0; i < students.length; i++) {
                const student = students[i];
                const exportRow = exportData[i];
                
                // Check if we need a new page (allow space for student card)
                if (doc.y > doc.page.height - 200) {
                    doc.addPage();
                }

                const cardTop = doc.y;
                const cardHeight = 150;
                const cardWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
                const photoWidth = 80;
                const photoHeight = 100;

                // Draw card border
                doc.rect(doc.page.margins.left, cardTop, cardWidth, cardHeight).stroke();

                // Student photo section
                const photoX = doc.page.margins.left + cardWidth - photoWidth - 10;
                const photoY = cardTop + 10;
                
                // Try to add photo if it exists
                if (student.photo) {
                    try {
                        const photoPath = path.join(__dirname, '../uploads/temp', student.photo);
                        if (fs.existsSync(photoPath)) {
                            doc.image(photoPath, photoX, photoY, {
                                width: photoWidth,
                                height: photoHeight,
                                fit: [photoWidth, photoHeight]
                            });
                        } else {
                            // Draw placeholder if photo file doesn't exist
                            doc.rect(photoX, photoY, photoWidth, photoHeight).stroke();
                            doc.fontSize(8).text('Photo\nNot Found', photoX + 20, photoY + 40);
                        }
                    } catch (error) {
                        // Draw placeholder if there's an error loading photo
                        doc.rect(photoX, photoY, photoWidth, photoHeight).stroke();
                        doc.fontSize(8).text('Photo\nError', photoX + 25, photoY + 40);
                    }
                } else {
                    // Draw placeholder for no photo
                    doc.rect(photoX, photoY, photoWidth, photoHeight).stroke();
                    doc.fontSize(8).text('No Photo\nAvailable', photoX + 15, photoY + 40);
                }

                // Student details section
                const detailsX = doc.page.margins.left + 10;
                const detailsWidth = cardWidth - photoWidth - 30;
                let detailsY = cardTop + 10;

                doc.fontSize(12).font('Helvetica-Bold');
                doc.text(exportRow['Full Name'], detailsX, detailsY, { width: detailsWidth });
                detailsY += 15;

                doc.fontSize(9).font('Helvetica');
                
                // First row of details
                doc.text(`Roll No: ${exportRow['Registration Number']} | Class Roll: ${exportRow['Class Roll No']}`, detailsX, detailsY, { width: detailsWidth });
                detailsY += 12;
                
                doc.text(`Department: ${exportRow['Department']} | Semester: ${exportRow['Semester']} | Section: ${exportRow['Section']}`, detailsX, detailsY, { width: detailsWidth });
                detailsY += 12;
                
                doc.text(`Father: ${exportRow['Father Name']} | Mother: ${exportRow['Mother Name']}`, detailsX, detailsY, { width: detailsWidth });
                detailsY += 12;
                
                doc.text(`DOB: ${exportRow['Date of Birth']} | Session: ${exportRow['Session']} | Entry: ${exportRow['Lateral Entry']}`, detailsX, detailsY, { width: detailsWidth });
                detailsY += 12;
                
                doc.text(`Email: ${exportRow['Email']}`, detailsX, detailsY, { width: detailsWidth });
                detailsY += 12;
                
                doc.text(`Phone: ${exportRow['Phone']} | Father Phone: ${exportRow['Father Phone']}`, detailsX, detailsY, { width: detailsWidth });

                // Move to next student
                doc.y = cardTop + cardHeight + 10;
            }

            // Finalize the PDF
            doc.end();

        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid format. Supported formats: excel, pdf'
            });
        }

    } catch (error) {
        console.error('Error exporting student data:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting student data',
            error: error.message
        });
    }
};

// Export individual student data
const exportStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'excel' } = req.query;
        
        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        const student = await StudentAcademicDetails.findById(id)
            .populate('userId', 'username fullname')
            .populate('department', 'name code')
            .populate('semester', 'name number');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const exportData = [{
            'Registration Number': student.universityRollNo,
            'Class Roll No': student.classRollNo,
            'Full Name': student.fullname,
            'Father Name': student.fathername,
            'Mother Name': student.mothername,
            'Date of Birth': student.dob ? new Date(student.dob).toLocaleDateString() : '',
            'Department': student.department?.name || '',
            'Department Code': student.department?.code || '',
            'Semester': student.semester?.name || '',
            'Section': student.section || '',
            'Phone': student.phone,
            'Father Phone': student.fatherphone,
            'Email': student.email,
            'Session': student.session,
            'Lateral Entry': student.lateralEntry ? 'Yes' : 'No',
            'Username': student.userId?.username || '',
            'Created At': new Date(student.createdAt).toLocaleDateString()
        }];

        if (format === 'excel') {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Student Data');

            // Add title
            worksheet.mergeCells('A1:Q1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `Student Data - ${student.fullname}`;
            titleCell.font = { size: 16, bold: true };
            titleCell.alignment = { horizontal: 'center' };

            // Add export info
            worksheet.mergeCells('A2:Q2');
            const infoCell = worksheet.getCell('A2');
            infoCell.value = `Generated on: ${new Date().toLocaleDateString()} | Roll No: ${student.universityRollNo}`;
            infoCell.font = { size: 12 };
            infoCell.alignment = { horizontal: 'center' };

            // Add headers
            const headers = Object.keys(exportData[0]);
            worksheet.addRow([]); // Empty row
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Add data
            exportData.forEach(row => {
                worksheet.addRow(Object.values(row));
            });

            // Auto-fit columns
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = maxLength < 10 ? 10 : maxLength + 2;
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=student_${student.universityRollNo}.xlsx`);

            // Write to response
            await workbook.xlsx.write(res);
            res.end();

        } else if (format === 'pdf') {
            const PDFDocument = require('pdfkit');
            const fs = require('fs');
            const path = require('path');
            
            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=student_${student.universityRollNo}.pdf`);

            // Pipe the PDF to response
            doc.pipe(res);

            // Add title with college form style
            doc.fontSize(18).font('Helvetica-Bold').text('STUDENT ACADEMIC DETAILS', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()} | Roll No: ${student.universityRollNo}`, { align: 'center' });
            doc.moveDown(2);

            // Create college form layout with photo on top right
            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const photoWidth = 120;
            const photoHeight = 150;
            const photoX = doc.page.margins.left + pageWidth - photoWidth;
            const photoY = doc.y;

            // Add photo section
            if (student.photo) {
                try {
                    const photoPath = path.join(__dirname, '../uploads/temp', student.photo);
                    if (fs.existsSync(photoPath)) {
                        doc.image(photoPath, photoX, photoY, {
                            width: photoWidth,
                            height: photoHeight,
                            fit: [photoWidth, photoHeight]
                        });
                        // Add photo border
                        doc.rect(photoX, photoY, photoWidth, photoHeight).stroke();
                    } else {
                        // Draw placeholder if photo file doesn't exist
                        doc.rect(photoX, photoY, photoWidth, photoHeight).stroke();
                        doc.fontSize(10).text('Photo\nNot Found', photoX + 35, photoY + 70);
                    }
                } catch (error) {
                    // Draw placeholder if there's an error loading photo
                    doc.rect(photoX, photoY, photoWidth, photoHeight).stroke();
                    doc.fontSize(10).text('Photo\nError', photoX + 40, photoY + 70);
                }
            } else {
                // Draw placeholder for no photo
                doc.rect(photoX, photoY, photoWidth, photoHeight).stroke();
                doc.fontSize(10).text('No Photo\nAvailable', photoX + 30, photoY + 70);
            }

            // Add student details in college form format
            const detailsWidth = pageWidth - photoWidth - 20;
            let yPosition = photoY;
            const lineHeight = 20;

            doc.fontSize(12).font('Helvetica-Bold');
            
            // Personal Information Section
            doc.text('PERSONAL INFORMATION', doc.page.margins.left, yPosition, { width: detailsWidth });
            yPosition += lineHeight;
            doc.moveTo(doc.page.margins.left, yPosition).lineTo(doc.page.margins.left + detailsWidth, yPosition).stroke();
            yPosition += 10;

            doc.fontSize(10).font('Helvetica');
            
            // Name
            doc.font('Helvetica-Bold').text('Full Name: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.fullname);
            yPosition += lineHeight;

            // Father's Name
            doc.font('Helvetica-Bold').text('Father\'s Name: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.fathername);
            yPosition += lineHeight;

            // Mother's Name
            doc.font('Helvetica-Bold').text('Mother\'s Name: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.mothername);
            yPosition += lineHeight;

            // Date of Birth
            doc.font('Helvetica-Bold').text('Date of Birth: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(exportData[0]['Date of Birth']);
            yPosition += lineHeight + 10;

            // Academic Information Section
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('ACADEMIC INFORMATION', doc.page.margins.left, yPosition, { width: detailsWidth });
            yPosition += lineHeight;
            doc.moveTo(doc.page.margins.left, yPosition).lineTo(doc.page.margins.left + detailsWidth, yPosition).stroke();
            yPosition += 10;

            doc.fontSize(10).font('Helvetica');

            // Registration Number
            doc.font('Helvetica-Bold').text('Registration Number: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.universityRollNo);
            yPosition += lineHeight;

            // Class Roll No
            doc.font('Helvetica-Bold').text('Class Roll No: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.classRollNo);
            yPosition += lineHeight;

            // Department
            doc.font('Helvetica-Bold').text('Department: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(`${student.department?.name} (${student.department?.code})`);
            yPosition += lineHeight;

            // Semester
            doc.font('Helvetica-Bold').text('Semester: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.semester?.name);
            yPosition += lineHeight;

            // Section
            doc.font('Helvetica-Bold').text('Section: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.section);
            yPosition += lineHeight;

            // Session
            doc.font('Helvetica-Bold').text('Session: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.session);
            yPosition += lineHeight;

            // Lateral Entry
            doc.font('Helvetica-Bold').text('Entry Type: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.lateralEntry ? 'Lateral Entry' : 'Regular Entry');
            yPosition += lineHeight + 10;

            // Contact Information Section
            yPosition = Math.max(yPosition, photoY + photoHeight + 20); // Ensure we're below the photo

            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('CONTACT INFORMATION', doc.page.margins.left, yPosition, { width: pageWidth });
            yPosition += lineHeight;
            doc.moveTo(doc.page.margins.left, yPosition).lineTo(doc.page.margins.left + pageWidth, yPosition).stroke();
            yPosition += 10;

            doc.fontSize(10).font('Helvetica');

            // Email
            doc.font('Helvetica-Bold').text('Email: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.email);
            yPosition += lineHeight;

            // Phone
            doc.font('Helvetica-Bold').text('Phone: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.phone);
            yPosition += lineHeight;

            // Father's Phone
            doc.font('Helvetica-Bold').text('Father\'s Phone: ', doc.page.margins.left, yPosition, { continued: true });
            doc.font('Helvetica').text(student.fatherphone);
            yPosition += lineHeight + 20;

            // Footer
            doc.fontSize(8).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, doc.page.margins.left, doc.page.height - 50, { align: 'center' });

            // Finalize the PDF
            doc.end();

        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid format. Supported formats: excel, pdf'
            });
        }

    } catch (error) {
        console.error('Error exporting student data:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting student data',
            error: error.message
        });
    }
};

// Get student statistics for teachers
const getStudentStatistics = async (req, res) => {
    try {
        // Check if user has permission (Admin or Teacher)
        if (!['Admin', 'Teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Teacher role required.'
            });
        }

        const totalStudents = await StudentAcademicDetails.countDocuments();
        
        const departmentStats = await StudentAcademicDetails.aggregate([
            {
                $lookup: {
                    from: 'departments',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'departmentInfo'
                }
            },
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    departmentName: { $first: '$departmentInfo.name' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const semesterStats = await StudentAcademicDetails.aggregate([
            {
                $lookup: {
                    from: 'semesters',
                    localField: 'semester',
                    foreignField: '_id',
                    as: 'semesterInfo'
                }
            },
            {
                $group: {
                    _id: '$semester',
                    count: { $sum: 1 },
                    semesterName: { $first: '$semesterInfo.name' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const sectionStats = await StudentAcademicDetails.aggregate([
            {
                $group: {
                    _id: '$section',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const lateralEntryStats = await StudentAcademicDetails.aggregate([
            {
                $group: {
                    _id: '$lateralEntry',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            statistics: {
                totalStudents,
                departmentStats,
                semesterStats,
                sectionStats,
                lateralEntryStats
            }
        });

    } catch (error) {
        console.error('Error fetching student statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student statistics',
            error: error.message
        });
    }
};

module.exports = {
    createStudentAcademicDetails,
    getMyAcademicDetails,
    getAcademicDetailsById,
    getAllAcademicDetails,
    updateAcademicDetails,
    deleteAcademicDetails,
    getStudentsByDeptAndSem,
    getStudentsByDeptSemAndSection,
    searchStudents,
    getAcademicDetails,
    exportStudentData,
    exportStudentById,
    getStudentStatistics
};
