const studyMaterial = require('../models/studyMaterialModel')
const { notifyStudentsOnTeacherUpload } = require('../services/notificationService')
const { uploadToS3, generateDownloadLink, deleteFromS3, FILE_CATEGORIES } = require('../services/fileservice')

// Create a new study material
const createStudyMaterial = async (req, res) => {
    try {
        const { 
            title, 
            description,
            body, 
            semester, 
            subject, 
            department, 
            studyfile,
            type,
            tags,
            isPublic 
        } = req.body

        // Validation
        if (!title || !semester || !subject || !department) {
            return res.status(400).json({
                success: false,
                message: "Title, semester, subject, and department are required fields"
            })
        }

        // Handle file upload locally
        let fileUrl = null;
        let s3Key = null;
        
        if (req.file) {
            try {
                const uploadResult = await uploadToS3(req.file, FILE_CATEGORIES.STUDY_MATERIALS);
                fileUrl = uploadResult.location;
                s3Key = uploadResult.key;
                console.log('Study material file uploaded locally:', s3Key);
            } catch (uploadError) {
                console.error('Error uploading study material file locally:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Error uploading file to local storage",
                    error: uploadError.message
                });
            }
        }

        const newStudyMaterial = new studyMaterial({
            studyfile: s3Key || studyfile, // Store local file path instead of filename
            fileUrl: fileUrl, // Store local file URL for easy access
            title,
            description,
            body,
            semester,
            subject,
            department,
            type: type || 'notes',
            tags: Array.isArray(tags) ? tags : tags?.split(',').map(tag => tag.trim()).filter(tag => tag),
            isPublic: isPublic !== undefined ? isPublic : true,
            createdBy: req.user ? req.user._id : null // Set the creator
        })

        const savedMaterial = await newStudyMaterial.save()
        
        // Populate references before sending response
        await savedMaterial.populate(['semester', 'subject', 'department'])
        
        // Create notifications for students if user is a teacher
        if (req.user && req.user.role === 'Teacher') {
            try {
                await notifyStudentsOnTeacherUpload(req.user._id, 'study_material', {
                    _id: savedMaterial._id,
                    title: savedMaterial.title,
                    department: savedMaterial.department,
                    semester: savedMaterial.semester
                });
            } catch (notificationError) {
                console.error('Error creating notifications:', notificationError);
                // Don't fail the main operation if notification fails
            }
        }
        
        res.status(201).json({
            success: true,
            message: "Study material created successfully",
            studyMaterials: [savedMaterial] // Match frontend expected format
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating study material",
            error: error.message
        })
    }
}

// Get all study materials with populated references
const getAllStudyMaterials = async (req, res) => {
    try {
        let filter = {}
        
        // If user is a student, only show public materials
        // If user is teacher/admin, show all materials they created + public materials from others
        if (req.user) {
            if (req.user.role === 'Student') {
                filter.isPublic = true
            } else if (req.user.role === 'Teacher' || req.user.role === 'Admin') {
                // Teachers/Admins can see public materials + their own private materials
                filter = {
                    $or: [
                        { isPublic: true },
                        { createdBy: req.user._id }
                    ]
                }
            }
        } else {
            // If no user context, only show public materials
            filter.isPublic = true
        }
        
        const materials = await studyMaterial.find(filter)
            .populate('semester', 'name code')
            .populate('subject', 'name code')
            .populate('department', 'name code')
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 })
        
        res.status(200).json({
            success: true,
            count: materials.length,
            studyMaterials: materials
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching study materials",
            error: error.message
        })
    }
}

// Get study material by ID with populated references
const getStudyMaterialById = async (req, res) => {
    try {
        const { id } = req.params
        const material = await studyMaterial.findById(id)
            .populate('semester', 'name code')
            .populate('subject', 'name code')
            .populate('department', 'name code')
        
        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Study material not found"
            })
        }
        
        res.status(200).json({
            success: true,
            studyMaterials: [material]
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching study material",
            error: error.message
        })
    }
}

// Update study material by ID
const updateStudyMaterial = async (req, res) => {
    try {
        const { id } = req.params
        const updates = req.body
        
        // Find existing material first
        const existingMaterial = await studyMaterial.findById(id);
        if (!existingMaterial) {
            return res.status(404).json({
                success: false,
                message: "Study material not found"
            })
        }

        // Handle file upload if new file is provided
        if (req.file) {
            try {
                // Upload new file locally
                const uploadResult = await uploadToS3(req.file, FILE_CATEGORIES.STUDY_MATERIALS);
                updates.fileUrl = uploadResult.location;
                updates.studyfile = uploadResult.key;
                
                // Delete old file locally if it exists
                if (existingMaterial.studyfile) {
                    await deleteFromS3(existingMaterial.studyfile);
                    console.log('Deleted old study material file locally:', existingMaterial.studyfile);
                }
                
                console.log('Updated study material file locally:', uploadResult.key);
            } catch (uploadError) {
                console.error('Error updating study material file locally:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Error updating file in local storage",
                    error: uploadError.message
                });
            }
        }
        
        const updatedMaterial = await studyMaterial.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate(['semester', 'subject', 'department'])
        
        res.status(200).json({
            success: true,
            message: "Study material updated successfully",
            studyMaterials: [updatedMaterial]
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating study material",
            error: error.message
        })
    }
}

// Delete study material by ID
const deleteStudyMaterial = async (req, res) => {
    try {
        const { id } = req.params
        const materialToDelete = await studyMaterial.findById(id)
            .populate(['semester', 'subject', 'department'])
        
        if (!materialToDelete) {
            return res.status(404).json({
                success: false,
                message: "Study material not found"
            })
        }

        // Delete file locally if it exists
        if (materialToDelete.studyfile) {
            try {
                await deleteFromS3(materialToDelete.studyfile);
                console.log('Deleted study material file locally:', materialToDelete.studyfile);
            } catch (deleteError) {
                console.warn('Failed to delete file locally:', deleteError);
                // Continue with database deletion even if local deletion fails
            }
        }

        // Delete from database
        await studyMaterial.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Study material deleted successfully",
            studyMaterials: [materialToDelete]
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting study material",
            error: error.message
        })
    }
}

// Download study material file
const downloadStudyMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        
        const material = await studyMaterial.findById(id);
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Study material not found'
            });
        }

        if (!material.studyfile && !material.fileUrl) {
            return res.status(404).json({
                success: false,
                message: 'No file attached to this study material'
            });
        }

        // Generate download URL
        const downloadUrl = await generateDownloadLink(material.studyfile || material.fileUrl);
        
        // Track download
        await studyMaterial.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });
        
        res.status(200).json({
            success: true,
            data: {
                downloadUrl: downloadUrl,
                title: material.title,
                expiresIn: '1 hour'
            }
        });
    } catch (error) {
        console.error('Download study material error:', error);
        res.status(500).json({
            success: false,
            message: 'Download failed',
            error: error.message
        });
    }
}

// Get study materials by department ID
const getStudyMaterialsByDepartment = async (req, res) => {
    try {
        const { departmentId } = req.params
        const materials = await studyMaterial.find({ department: departmentId })
            .populate('semester', 'name code')
            .populate('subject', 'name code')
            .populate('department', 'name code')
            .sort({ createdAt: -1 })
        
        res.status(200).json({
            success: true,
            count: materials.length,
            studyMaterials: materials
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching study materials by department",
            error: error.message
        })
    }
}

// Get study materials by subject ID
const getStudyMaterialsBySubject = async (req, res) => {
    try {
        const { subjectId } = req.params
        const materials = await studyMaterial.find({ subject: subjectId })
            .populate('semester', 'name code')
            .populate('subject', 'name code')
            .populate('department', 'name code')
            .sort({ createdAt: -1 })
        
        res.status(200).json({
            success: true,
            count: materials.length,
            studyMaterials: materials
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching study materials by subject",
            error: error.message
        })
    }
}

// Get study materials by semester ID
const getStudyMaterialsBySemester = async (req, res) => {
    try {
        const { semesterId } = req.params
        const materials = await studyMaterial.find({ semester: semesterId })
            .populate('semester', 'name code')
            .populate('subject', 'name code')
            .populate('department', 'name code')
            .sort({ createdAt: -1 })
        
        res.status(200).json({
            success: true,
            count: materials.length,
            studyMaterials: materials
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching study materials by semester",
            error: error.message
        })
    }
}

// Get study materials by multiple filter IDs
const getStudyMaterialsWithFilters = async (req, res) => {
    try {
        const { departmentIds, subjectIds, semesterIds, departmentId, subjectId, semesterId } = req.query
        const filter = {}
        
        // Support both singular and plural parameter names for compatibility
        if (departmentIds || departmentId) filter.department = departmentIds || departmentId
        if (subjectIds || subjectId) filter.subject = subjectIds || subjectId
        if (semesterIds || semesterId) filter.semester = semesterIds || semesterId
        
        const materials = await studyMaterial.find(filter)
            .populate('semester', 'name code')
            .populate('subject', 'name code')
            .populate('department', 'name code')
            .sort({ createdAt: -1 })
        
        res.status(200).json({
            success: true,
            count: materials.length,
            filters: filter,
            studyMaterials: materials
        })
    } catch (error) {
        console.error('Error fetching filtered study materials:', error)
        res.status(500).json({
            success: false,
            message: "Error fetching filtered study materials",
            error: error.message
        })
    }
}

// Search study materials by title or body content
const searchStudyMaterials = async (req, res) => {
    try {
        const { query } = req.query
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            })
        }
        
        const materials = await studyMaterial.find({
            $or: [
                { title: { $regex: new RegExp(query, 'i') } },
                { body: { $regex: new RegExp(query, 'i') } }
            ]
        })
        .populate('semester', 'name code')
        .populate('subject', 'name code')
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        
        res.status(200).json({
            success: true,
            count: materials.length,
            searchQuery: query,
            studyMaterials: materials
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error searching study materials",
            error: error.message
        })
    }
}

// Get study materials with pagination
const getStudyMaterialsPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit
        
        const materials = await studyMaterial.find()
            .populate('semester', 'name code')
            .populate('subject', 'name code')
            .populate('department', 'name code')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
        
        const total = await studyMaterial.countDocuments()
        const totalPages = Math.ceil(total / limit)
        
        res.status(200).json({
            success: true,
            studyMaterials: materials,
            pagination: {
                currentPage: page,
                totalPages,
                totalDocuments: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching paginated study materials",
            error: error.message
        })
    }
}

// Get statistics with populated data
const getStudyMaterialStats = async (req, res) => {
    try {
        const totalMaterials = await studyMaterial.countDocuments()
        const materialsWithFiles = await studyMaterial.countDocuments({ 
            studyfile: { $exists: true, $ne: null, $ne: "" } 
        })
        const materialsWithoutFiles = totalMaterials - materialsWithFiles
        
        // Aggregate with population for better stats
        const departmentStats = await studyMaterial.aggregate([
            {
                $lookup: {
                    from: 'departments', // Adjust collection name based on your department model
                    localField: 'department',
                    foreignField: '_id',
                    as: 'departmentInfo'
                }
            },
            { $unwind: '$departmentInfo' },
            { 
                $group: { 
                    _id: '$department', 
                    departmentName: { $first: '$departmentInfo.name' },
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { count: -1 } }
        ])
        
        const subjectStats = await studyMaterial.aggregate([
            {
                $lookup: {
                    from: 'subjects', // Adjust collection name based on your subject model
                    localField: 'subject',
                    foreignField: '_id',
                    as: 'subjectInfo'
                }
            },
            { $unwind: '$subjectInfo' },
            { 
                $group: { 
                    _id: '$subject', 
                    subjectName: { $first: '$subjectInfo.name' },
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { count: -1 } }
        ])
        
        const semesterStats = await studyMaterial.aggregate([
            {
                $lookup: {
                    from: 'semesters', // Adjust collection name based on your semester model
                    localField: 'semester',
                    foreignField: '_id',
                    as: 'semesterInfo'
                }
            },
            { $unwind: '$semesterInfo' },
            { 
                $group: { 
                    _id: '$semester', 
                    semesterName: { $first: '$semesterInfo.name' },
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { count: -1 } }
        ])
        
        res.status(200).json({
            success: true,
            data: {
                totalMaterials,
                materialsWithFiles,
                materialsWithoutFiles,
                departmentStats,
                subjectStats,
                semesterStats
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching statistics",
            error: error.message
        })
    }
}

// Additional helper functions for your existing models

// Get all departments (from your department model)
const getAllDepartments = async (req, res) => {
    try {
        const Department = require('../models/departmentModel')
        const departments = await Department.find({ isActive: true }).sort({ name: 1 })
        
        res.status(200).json({
            success: true,
            count: departments.length,
            data: departments
        })
    } catch (error) {
        console.error('Error fetching departments:', error)
        res.status(500).json({
            success: false,
            message: "Error fetching departments",
            error: error.message
        })
    }
}

// Get all subjects (from your subject model)
const getAllSubjects = async (req, res) => {
    try {
        const Subject = require('../models/subjectModel')
        const subjects = await Subject.find({ isActive: true })
            .populate('department', 'name code')
            .populate('semester', 'name number')
            .sort({ name: 1 })
        
        res.status(200).json({
            success: true,
            count: subjects.length,
            data: subjects
        })
    } catch (error) {
        console.error('Error fetching subjects:', error)
        res.status(500).json({
            success: false,
            message: "Error fetching subjects",
            error: error.message
        })
    }
}

// Get all semesters (from your semester model)
const getAllSemesters = async (req, res) => {
    try {
        const Semester = require('../models/semesterModel')
        const semesters = await Semester.find({ isActive: true }).sort({ number: 1 })
        
        res.status(200).json({
            success: true,
            count: semesters.length,
            data: semesters
        })
    } catch (error) {
        console.error('Error fetching semesters:', error)
        res.status(500).json({
            success: false,
            message: "Error fetching semesters",
            error: error.message
        })
    }
}

// Get subjects filtered by department and semester
const getSubjectsByDepartmentAndSemester = async (req, res) => {
    try {
        const { departmentId, semesterId } = req.query
        const Subject = require('../models/subjectModel')
        
        let filter = { isActive: true }
        
        if (departmentId) {
            filter.department = departmentId
        }
        
        if (semesterId) {
            filter.semester = semesterId
        }
        
        const subjects = await Subject.find(filter)
            .populate('department', 'name code')
            .populate('semester', 'name number')
            .sort({ name: 1 })
        
        res.status(200).json({
            success: true,
            count: subjects.length,
            filters: { departmentId, semesterId },
            data: subjects
        })
    } catch (error) {
        console.error('Error fetching filtered subjects:', error)
        res.status(500).json({
            success: false,
            message: "Error fetching filtered subjects",
            error: error.message
        })
    }
}

// Track download for a study material
const trackDownload = async (req, res) => {
    try {
        const { id } = req.params
        
        const material = await studyMaterial.findByIdAndUpdate(
            id,
            { $inc: { downloadCount: 1 } },
            { new: true }
        )
        
        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Study material not found"
            })
        }
        
        res.status(200).json({
            success: true,
            message: "Download tracked successfully",
            downloadCount: material.downloadCount
        })
    } catch (error) {
        console.error('Error tracking download:', error)
        res.status(500).json({
            success: false,
            message: "Error tracking download",
            error: error.message
        })
    }
}

// Track view for a study material
const trackView = async (req, res) => {
    try {
        const { id } = req.params
        
        const material = await studyMaterial.findByIdAndUpdate(
            id,
            { $inc: { viewCount: 1 } },
            { new: true }
        )
        
        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Study material not found"
            })
        }
        
        res.status(200).json({
            success: true,
            message: "View tracked successfully",
            viewCount: material.viewCount
        })
    } catch (error) {
        console.error('Error tracking view:', error)
        res.status(500).json({
            success: false,
            message: "Error tracking view",
            error: error.message
        })
    }
}

module.exports = {
    createStudyMaterial,
    getAllStudyMaterials,
    getStudyMaterialById,
    updateStudyMaterial,
    deleteStudyMaterial,
    downloadStudyMaterial,
    getStudyMaterialsByDepartment,
    getStudyMaterialsBySubject,
    getStudyMaterialsBySemester,
    getStudyMaterialsWithFilters,
    searchStudyMaterials,
    getStudyMaterialsPaginated,
    getStudyMaterialStats,
    getAllDepartments,
    getAllSubjects,
    getAllSemesters,
    getSubjectsByDepartmentAndSemester,
    trackDownload,
    trackView
}
