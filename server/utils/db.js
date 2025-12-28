const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); // Ensure environment variables are loaded

const URI = process.env.URI;

const connectDB = async () => {
    try {
        await mongoose.connect(URI);
        console.log("Connection successful to DB");
    } catch (e) {
        console.error("Database connection failed:", e);
        process.exit(1);  // Exit with failure
    }
};

module.exports = connectDB;