import mongoose from "mongoose";

const userSchema = mongoose.Schema (
    {
        adminName:{
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        adminType: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model('User', userSchema);
