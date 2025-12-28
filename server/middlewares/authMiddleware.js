const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization');
    
    if (!token || !token.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ message: "Unauthorized. Token not provided or invalid format." });
    }

    const jwtToken = token.replace("Bearer ", "").trim();

    try {
        const isVerified = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY); // decode

        const userData = await User.findById(isVerified.userId).select({ password: 0 });

        if (!userData) {
            return res.status(401).json({ message: "Unauthorized. User not found." });
        }

        // Attach user data to request object
        req.user = userData;
        req.token = jwtToken; // Store the cleaned token
        req.userID = userData._id;

        next();
    } catch (error) {
        console.log("Auth middleware error:", error);
        res.status(401).json({ message: "Unauthorized. Invalid token." });
    }
};

module.exports = authMiddleware;
