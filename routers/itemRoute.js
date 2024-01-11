import express from "express";
import { Item } from "../models/itemModel.js";
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

// routes for add items
router.post('/' ,verifyToken, async (req, res) => {
    try{

    }catch(error){
        console.error(error);
        res.status(500).json({ message: "Internal Server Errors" });
    }
});


export default router;

