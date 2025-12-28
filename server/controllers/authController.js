const User = require('../models/userModel');

const register = async (req, res) => {
    try {
        console.log('Register request received:', req.body);
        
        const { username, fullname, password, role = 'Student' } = req.body; // Default role to 'Student'
        
        // Input validation
        if (!username || !fullname || !password) {
            console.log('Missing required fields - username:', !!username, 'fullname:', !!fullname, 'password:', !!password);
            return res.status(400).json({ 
                message: "Username, fullname, and password are required" 
            });
        }

        if (typeof username !== 'string' || typeof fullname !== 'string' || typeof password !== 'string') {
            console.log('Invalid field types');
            return res.status(400).json({ 
                message: "Username, fullname, and password must be strings" 
            });
        }

        if (username.trim().length === 0 || fullname.trim().length === 0 || password.trim().length === 0) {
            console.log('Empty fields after trim');
            return res.status(400).json({ 
                message: "Username, fullname, and password cannot be empty" 
            });
        }
        
        // Check if user already exists by username
        const userExist = await User.findOne({ username: username.trim() });

        if (userExist) {
            console.log('User already exists:', username);
            return res.status(400).json({ message: "User already exists" });
        }

        // Check if fullname already exists
        const fullnameExist = await User.findOne({ fullname: fullname.trim() });

        if (fullnameExist) {
            console.log('Fullname already exists:', fullname);
            return res.status(400).json({ message: "Full name already exists" });
        }

        console.log('Creating new user');
        const userCreated = await User.create({ 
            username: username.trim(), 
            fullname: fullname.trim(), 
            password, 
            role 
        });
        
        const token = await userCreated.generateToken();
        res.status(201).json({
            message: "User registration successful",
            token: token,
            userId: userCreated._id.toString()
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        
        const { username, password } = req.body;
        
        // Input validation
        if (!username || !password) {
            console.log('Missing credentials - username:', !!username, 'password:', !!password);
            return res.status(400).json({ 
                message: "Username and password are required" 
            });
        }

        if (typeof username !== 'string' || typeof password !== 'string') {
            console.log('Invalid credential types - username type:', typeof username, 'password type:', typeof password);
            return res.status(400).json({ 
                message: "Username and password must be strings" 
            });
        }

        if (username.trim().length === 0 || password.trim().length === 0) {
            console.log('Empty credentials after trim');
            return res.status(400).json({ 
                message: "Username and password cannot be empty" 
            });
        }

        console.log('Looking for user with username:', username);
        const userExist = await User.findOne({ username: username.trim() });
        
        if (!userExist) {
            console.log('User not found:', username);
            return res.status(400).json({ message: "User does not exist" });
        }
        
        console.log('User found, comparing password');
        const isPasswordValid = await userExist.comparePassword(password);

        if (isPasswordValid) {
            console.log('Password valid, generating token');
            const token = await userExist.generateToken();
            res.status(200).json({
                message: "Login successful",
                token: token,
                userId: userExist._id.toString(),
            });
        } else {
            console.log('Invalid password for user:', username);
            res.status(401).json({ message: "Invalid Credentials" });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
};

const user = async (req, res) => {
    try {
        const userId = req.userID;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }

        res.json({
            userData: {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const userById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }

        res.json({
            userData: {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const userByName = async (req, res) => {
    try {
        const username = req.params.username;
        const userProfile = await User.findOne({ username }).select('-password');
        
        if (!userProfile) {
            return res.status(404).json({ message: 'User  not found' });
        }
        
        return res.status(200).json({ userProfile });
    } catch (error) {
        console.log(`Error from user route ${error}`);
        res.status(500).json({ error: error.message });
    }
};

const allUsers = async (req, res) => {
    try {
        const userData = await User.find({}, { password: 0 });
        return res.status(200).json({ userData });
    } catch (error) {
        console.log(`Error from user route ${error}`);
        res.status(500).json({ error: error.message });
    }
};

// Update User
const updateUser  = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUser  = await User.findByIdAndUpdate(id, req.body, { new: true }).select('-password');

        if (!updatedUser ) {
            return res.status(404).json({ message: "User  not found" });
        }

        res.status(200).json(updatedUser );
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
};

// Delete User
const deleteUser  = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser  = await User.findByIdAndDelete(id);

        if (!deletedUser ) {
            return res.status(404).json({ message: "User  not found" });
        }

        res.status(200).json({ message: "User  deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        console.log('Change password request received:', { userId: req.userID });
        
        const { currentPassword, newPassword } = req.body;
        
        // Input validation
        if (!currentPassword || !newPassword) {
            console.log('Missing required fields - currentPassword:', !!currentPassword, 'newPassword:', !!newPassword);
            return res.status(400).json({ 
                message: "Current password and new password are required" 
            });
        }

        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
            console.log('Invalid field types');
            return res.status(400).json({ 
                message: "Current password and new password must be strings" 
            });
        }

        if (currentPassword.trim().length === 0 || newPassword.trim().length === 0) {
            console.log('Empty fields after trim');
            return res.status(400).json({ 
                message: "Current password and new password cannot be empty" 
            });
        }

        // Validate new password length
        if (newPassword.length < 3) {
            console.log('New password too short');
            return res.status(400).json({ 
                message: "New password must be at least 3 characters long" 
            });
        }

        // Check if new password is same as current password
        if (currentPassword === newPassword) {
            console.log('New password same as current password');
            return res.status(400).json({ 
                message: "New password must be different from current password" 
            });
        }

        // Get user from database (req.userID is set by authMiddleware)
        const user = await User.findById(req.userID);
        
        if (!user) {
            console.log('User not found:', req.userID);
            return res.status(404).json({ message: "User not found" });
        }

        console.log('User found, verifying current password');
        
        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        
        if (!isCurrentPasswordValid) {
            console.log('Invalid current password for user:', user.username);
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        console.log('Current password verified, updating to new password');
        
        // Update password (this will trigger the pre-save middleware to hash the password)
        user.password = newPassword;
        await user.save();
        
        console.log('Password updated successfully for user:', user.username);
        
        res.status(200).json({
            message: "Password changed successfully"
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            message: "Error changing password", 
            error: error.message 
        });
    }
};

module.exports = {
    register,
    login,
    user,
    allUsers,
    updateUser ,
    deleteUser ,
    userByName,
    userById,
    changePassword
};
