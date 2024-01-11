import { Double } from "mongodb";
import mongoose from "mongoose";

const itemSchema = mongoose.Schema(
    {
        itemPhotoUrl:{
            type: String,
            required: true,
        },
        itemName:{
            type: String,
            required: true,
            unique: true,
        },
        itemPrice:{
            type: Double,
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

export const Item = mongoose.model('Item',itemSchema);