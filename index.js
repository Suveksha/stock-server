import express from 'express';
import router from './routes/stockRoutes.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from "cors";
import stockRouter from './routes/stockRoutes.js';
import userRouter from './routes/userRoutes.js';
import cookieParser from "cookie-parser";

dotenv.config();
const app=express();
const port=3000;

app.use(express.json())
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true               
}));
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>console.log("MongoDB connected")).catch((err)=>console.log(err))

app.use("/stock",stockRouter)
app.use("/user",userRouter)

app.listen(port,()=>{
  console.log("Sever is running at port "+port)
})