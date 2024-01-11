import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.get('/', (req, res) => {
    console.log(req)
    return res.status(200).send('Welcome to Elea Random Items')
});

app.listen(process.env.PORT, () => {
    console.log(`ITS RUNNING ON PORT ${process.env.PORT}`);
});