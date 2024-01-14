import express from "express";
import { Item } from "../models/itemModel.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import {v2 as cloudinary} from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

dotenv.config();

const router = express.Router();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET
  });

  // Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'ERI', // Specify your desired upload folder
      format: async (req, file) => 'png', // Set the format of your uploaded files
    },
});
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

// routes for fetching all items
router.post('/', verifyToken, async(req , res) => {
    try{
        const { searchterm, page = 1, limit = 10, sortOrder = 'asc'} = req.body;

        const query = searchterm
        ? {
            $or: [
                {itemName: { $regex: new RegExp(searchterm, 'i')}},
            ],
          }
        : {};

        // Perform a count query to get the total number of users
      const totalItemCount = await Item.countDocuments(query);
  
      const skip = (page - 1) * limit;
  
      const sortOption = sortOrder === 'asc' ? { itemName: 1 } : { itemName: -1 };
  
      const items = await Item.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortOption); // Sort by itemName
  
      // Map the items array to create an array of filtered items
        const filteredItems = items.map(item => ({
            itemId: item._id,
            itemPhotoUrl: item.itemPhotoUrls,
            itemName: item.itemName,
            itemPrice: item.itemPrice,
        }));

      return res.status(200).json({
        count: items.length,
        currentPage: page,
        totalPages: Math.ceil(totalItemCount / limit),
        data: filteredItems,
      });
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const upload = multer({ storage });

// routes for add items
router.post('/add', upload.array('images', 5), verifyToken, async (req, res) => {
    try {
        let items = req.body;

        // Ensure items is an array
        if (!Array.isArray(items)) {
            // Convert the single item into an array with a single element
            items = [items];
        }

        // If only one file is uploaded, req.files will be an array with a single element
        const files = req.files || [req.file];

        const uploadPromises = files.map(file => {
            return new Promise((resolve, reject) => {
                // Upload image to Cloudinary with unique filename option
                cloudinary.uploader.upload(file.path, { unique_filename: true }, (error, result) => {
                    if (error) {
                        if (error.http_code === 400 && error.message.includes('already exists')) {
                            // Handle the case where the same file is found
                            reject({ message: 'File with the same name already exists' });
                        } else {
                            // Handle other Cloudinary upload errors
                            reject({ message: 'Failed to upload image to Cloudinary' });
                        }
                    } else {
                        resolve(result.secure_url);
                    }
                });
            });
        });

        const uploadedImageUrls = await Promise.all(uploadPromises);

        // Check if the array is not empty
        if (uploadedImageUrls.length === 0) {
            return res.status(500).json({ message: 'No images uploaded', success: false });
        }

        const newItems = items.map((item, index) => ({
            itemPhotoUrls: uploadedImageUrls, // Save all uploaded image URLs in the array
            itemName: item.itemName,
            itemPrice: Number(parseFloat(item.itemPrice).toFixed(2)),
        }));

        const existingItems = await Item.find({
            itemName: { $in: newItems.map(item => item.itemName) },
        });

        if (existingItems.length > 0) {
            res.status(400).json({ message: 'One or more items already exist!', success: false });
            return;
        }
        console.log("New Items:", newItems);
        
        // await Item.create(newItems);
        const testItem = { itemName: 'Test Item', itemPrice: 10.99 };
        await Item.create([testItem]);
        res.status(201).json({ message: 'Items added successfully!', success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route for fetching a single item
router.get('/:itemId', verifyToken, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({ message: "Item not found" , success: false });
        }
        const decodedItem = item._id;

        // Compare the userId with the decodedUser _id
        if (itemId !== decodedItem.toString()) {
            return res.status(403).json({ message: "Unauthorized access" , success: false });
        }

        // Create a new object with limited data
        const limitedItemData = {
            itemPhotoUrl: item.itemPhotoUrls,
            itemName: item.itemName,
            itemPrice: item.itemPrice,   
        };

        return res.status(200).json({ data: limitedItemData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: error.message });
    }
});

// Route for updating a single item
router.put('/:itemId', verifyToken, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        
        const checkItem = await Item.findById(itemId);

        const updatedItem = {
            itemPhotoUrl: req.body.itemPhotoUrl || checkItem.itemPhotoUrls,
            itemName: req.body.itemName || checkItem.itemName,
            itemPrice: req.body.itemPrice || checkItem.itemPrice,
        };

        const item = await Item.findByIdAndUpdate(itemId, updatedItem, { new: true });

        if (!item) {
            return res.status(404).json({ message: "Item not found" , success: false });
        }

        return res.status(200).json({ message: 'Item updated successfully' , success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: error.message });
    }
});

// Route for deleting a single user
router.delete('/:itemId', verifyToken, async (req, res) => {
    try {
        const itemId = req.params.itemId;

        const item = await Item.findByIdAndDelete(itemId);

        if (!item) {
            return res.status(404).json({ message: "Item not found", success: false });
        }

        return res.status(200).json({ message: 'Item deleted successfully' , success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: error.message });
    }
});

export default router;

