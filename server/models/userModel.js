const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    fullname : {
        type : String,
        required : true,
        unique : true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type:String,
        required: true,
        default:'Student'
    }
})

// Password hash logic (unchanged)
userSchema.pre('save', async function (next) {
    const user = this
    if (!user.isModified("password")) {
        return next()
    }
    try {
        const saltRound = await bcrypt.genSalt(10)
        const hash_password = await bcrypt.hash(user.password, saltRound)
        user.password = hash_password
        next()
    } catch (error) {
        next(error)
    }
})

// Compare password
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password)
}

// Generate JWT token
userSchema.methods.generateToken = async function () {
    try {
       return jwt.sign({
            userId: this._id.toString(),
            role: this.role, // Include role in the token
            department: this.department || null, // Include department in the token (null if undefined)
            semester: this.semester || null // Include semester in the token (null if undefined)
        },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "30d"
            }
        )
    } catch (error) {
        console.log("generateToken().error : ", error)
        throw new Error("Token generation error: " + error.message)
    }
}

const User = mongoose.model("User", userSchema)

// Helper functions for activities service
const getTeacherById = async (teacherId) => {
    try {
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'Teacher') {
            throw new Error('Teacher not found');
        }
        return teacher;
    } catch (error) {
        console.error('Error fetching teacher by ID:', error);
        throw error;
    }
};

const getStudentsByTeacherId = async (teacherId) => {
    try {
        // In a real implementation, you might have a separate model for teacher-student relationships
        // For now, we'll return students from the same department/semester as the teacher
        // This is a simplified approach - you may need to adjust based on your actual data structure
        
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'Teacher') {
            return [];
        }

        // Get students from the same department as the teacher
        // You might need to adjust this query based on your actual schema
        const students = await User.find({
            role: 'Student',
            // Add additional filters based on your schema
            // For example: department: teacher.department, semester: teacher.semester
        }).select('_id fullname username role department semester');

        return students;
    } catch (error) {
        console.error('Error fetching students by teacher ID:', error);
        throw error;
    }
};

// Export the model and helper functions
module.exports = User;
module.exports.User = User;
module.exports.getTeacherById = getTeacherById;
module.exports.getStudentsByTeacherId = getStudentsByTeacherId;
