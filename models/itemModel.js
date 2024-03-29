// itemModel.js

import mongoose from 'mongoose';

const itemSchema = mongoose.Schema(
    {
        itemPhotoUrls: [{
            type: String,
            required: true,
        }],
        itemName: {
            type: String,
            required: true,
            unique: true,
        },
        itemPrice: {
            type: Number,
            required: true,
            set: (price) => parseFloat(price).toFixed(2),
        },
    },
    {
        timestamps: true,
    }
);

export const Item = mongoose.model('Item', itemSchema);
