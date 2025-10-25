import express from 'express';
import router from './routes/stockRoutes.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from "cors";
import stockRouter from './routes/stockRoutes.js';
import userRouter from './routes/userRoutes.js';
import cookieParser from "cookie-parser";
import indexRouter from './routes/indexRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import http from "http";
import { Server } from 'socket.io';

dotenv.config();
const app=express();
const port=3000;

app.use(express.json())
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true               
}));
app.use(cookieParser());

const server=http.createServer(app);

const io=new Server(server,{
  cors:{
    origin:"*"
  }
})

io.on("connection",(socket)=>{
  console.log("User connected");

  socket.on("joinRoom",(userId)=>{
    socket.join(userId);
    console.log("User joined room",userId);
  });

  socket.on("disconnect",()=>{
    console.log("User disconnected");
  })
})

mongoose.connect(process.env.MONGO_URI,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>console.log("MongoDB connected")).catch((err)=>console.log(err))

app.use("/stock",stockRouter)
app.use("/user",userRouter)
app.use("/index",indexRouter)
app.use("/order",orderRouter)

server.listen(port,()=>{
  console.log("Sever is running at port "+port)
})

export {io};