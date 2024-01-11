import express from "express";
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// parsing the body
router.use(express.json());


// Middleware for token verification
const verifyToken = (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        return res.status(401).json({ message: "Missing token" });
    }

    const token = authorizationHeader.split(" ")[1]; // Extract the token from the Authorization header

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded; // Attach the decoded user information to the request object
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        } else {
            return res.status(401).json({ message: "Invalid token" });
        }
    }
};

// routes for login
router.post('/login', async (req, res) => {
    try{
        const { username, password } = req.body;

        // Check if username and password are provided
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        // Find the admin by username
        const user = await User.findOne({ username }).select('password');

        // If the admin is not found, return an error
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        // If passwords match, create a session and return a success message
        if (passwordMatch) {

            // Create a new session with random id
            const token = jwt.sign({ adminId: user._id }, process.env.SECRET_KEY, { expiresIn: '24h' });
            
            return res.json({ success: true, message: "Login successful", token });
        } else {
            // If passwords do not match, return an error
            return res.status(401).json({ message: "Invalid username or password" });
        }
    }catch(error){
        console.error(error);
        res.status(500).json({ message: "Internal Server Errors" });
    }
});

// routes for add admin
router.post('/add', async (req, res) => {
    try {
        const { adminName, username, password, adminType } = req.body;

        // Check if username and password are provided
        if (!adminName || !username || !password || !adminType) {
            return res.status(400).json({ message: "all field are required" });
        }

        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new admin with the hashed password
        const newUser = new User({ adminName, username, password: hashedPassword, adminType });
        await newUser.save();

        res.json({ success: true, message: "Registration successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/logout', verifyToken, (req, res) => {
    // Destroy the session
    res.json({ success: true, message: "Logout successful" });
});

router.get('/', verifyToken, async(req, res) => {
    // Destroy the session
    const activeAdmin = req.user._id;

    // Find the admin by username
    const user = await User.findOne({ activeAdmin });

    // Filter the information you want to include in the response
    const filteredUserInfo = {
        adminId: user._id,
        adminName: user.adminName,
    };
    res.json({ message: "successful", adminInfo: filteredUserInfo });
});

export default router;

