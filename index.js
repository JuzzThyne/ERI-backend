import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from './routers/userRoute.js';
import itemRoutes from './routers/itemRoute.js';
import cors from "cors";

dotenv.config();

const app = express();

app.use(express.json());

// METHOD 1: Allow All Origins with Default of Cors(*)
app.use(cors({
    origin: `${process.env.PRODUCTION}`, // Replace with your frontend's origin
  }));

app.get('/', (req, res) => {
    console.log(req)
    return res.status(200).send('Welcome to Elea Random Items')
});

app.use('/user', userRoutes);
app.use('/item', itemRoutes);

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