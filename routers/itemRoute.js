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
router.post('/', verifyToken, async (req, res) => {
    try {
        const item = req.body;

        const existingItem = await Item.findOne({
            itemName: item.itemName,
        });

        if (existingItem) {
            res.status(400).send({ message: 'Item already exists!' });
            return;
        }

        // Ensure two decimal places, even if none provided
        const formattedPrice = Number(parseFloat(item.itemPrice).toFixed(2));

        const newItem = {
            itemPhotoUrl: item.itemPhotoUrl,
            itemName: item.itemName,
            itemPrice: formattedPrice, // Use the formatted price
        };

        await Item.create(newItem);
        res.status(201).json({ message: 'Item added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});




export default router;

