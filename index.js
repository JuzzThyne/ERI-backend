import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from './routers/userRoute.js';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
    console.log(req)
    return res.status(200).send('Welcome to Elea Random Items')
});

app.use('/user', userRoutes);

// connect database
mongoose.connect(process.env.DATABASE, {
})
    .then(() => {
        console.log('connected');
        app.listen(process.env.PORT || 5000, () => {
            console.log(`ITS RUNNING ON PORT ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log(error);
    });