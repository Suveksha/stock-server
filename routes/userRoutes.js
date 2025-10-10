import { Router } from "express";
import axios from "axios";
import { verifyToken } from "../middleware/auth.js";
import { get } from "mongoose";
import UserSchema from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userRouter=Router()

const userSignup = async (req, res) => {
 try{
  const {firstName,lastName,email,password,phone}=req.body;
  console.log("REQ BODY",JSON.stringify(req.body))
  
   const existingUser = await UserSchema.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const hashedPassword=await bcrypt.hash(password, 10);

    const newUser=new UserSchema({
      firstName:firstName,
      lastName:lastName,
      phone:phone,
      email:email,
      password:hashedPassword
    })

    await newUser.save()

     res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
 }
 catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userLogin=async(req,res)=>{
  try{
    const {email,password,name}=req.body;
    
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await UserSchema.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });
 const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";

     res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,        // true only in prod (requires https)
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  }
  

  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
  
}

const userLogout = (req, res) => {
  res.clearCookie("token").json({ message: "Logged out successfully" });
};


const getProfile=async(req,res)=>{
  try {
    console.log("Decoded user:", req.user.id);
    const user = await UserSchema.findById(req.user.id).select("-password");
    console.log(JSON.stringify(user));
    res.status(200).json({ user });
  } catch (error) {
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}

const checkUserExist=async(req,res)=>{
  try{
    console.log("REQ",req.body.email)
    const user = await UserSchema.findOne({email:req.body.email}).select("-password")
     res.status(200).json({ user });
  }
  catch (error) {
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}

userRouter.post('/signup',userSignup);
userRouter.post("/login", userLogin);
userRouter.post("/logout", userLogout);
userRouter.get("/profile", verifyToken, getProfile);
userRouter.post("/checkuser",checkUserExist)

export default userRouter
