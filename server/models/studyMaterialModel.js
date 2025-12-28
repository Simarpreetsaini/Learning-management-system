const mongoose = require('mongoose')
require('dotenv').config()

const studyMaterialSchema = new mongoose.Schema({

    studyfile : {
        type : String,
        required : false
    },
    title: {
        type: String,
        required : true
    },
    description: {
        type: String,
        required: false
    },
    body : {
        type: String,
        required : false
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester', // Reference to your Semester model
        required : true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject', // Reference to your Subject model
        required : true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department', // Reference to your Department model
        required : true
    },
    type: {
        type: String,
        enum: ['notes', 'slides', 'reference', 'tutorial', 'assignment', 'other'],
        default: 'notes'
    },
    tags: [{
        type: String
    }],
    isPublic: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who created this material
        required: false // Making it optional for backward compatibility
    }

}, {
    timestamps: true // Adds createdAt and updatedAt automatically
})

const studyMaterial = mongoose.model("study_material", studyMaterialSchema)
module.exports = studyMaterial