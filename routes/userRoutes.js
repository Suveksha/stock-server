import { Router } from "express";
import axios from "axios";
import { verifyToken } from "../middleware/auth.js";
import { get } from "mongoose";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { io } from "../index.js";

const userRouter = Router();

const userSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    // console.log("REQ BODY",JSON.stringify(req.body))

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      email: email,
      password: hashedPassword,
      role: "user",
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // true only in prod (requires https)
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userLogout = (req, res) => {
  res.clearCookie("token").json({ message: "Logged out successfully" });
};

const getProfile = async (req, res) => {
  try {
    // console.log("Decoded user:", req.user.id);
    const user = await User.findById(req.user.id).select("-password");
    // console.log(JSON.stringify(user));
    res.status(200).json({ user });
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const checkUserExist = async (req, res) => {
  try {
    // console.log("REQ",req.body.email)
    const user = await User.findOne({ email: req.body.email }).select([
      "-password",
      "-transactions",
    ]);
    res.status(200).json({ user });
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const addBalance = async (req, res) => {
  try {
    const { _id, amount, mode } = req.body;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.updateOne(
      { _id },
      {
        $inc: { balance: amount },
        $push: {
          transactions: {
            amount,
            mode,
            type: "Credit",
            description: "Wallet recharge",
          },
        },
      }
    );

    const data = await User.findById(_id).select("balance");

    io.to(_id?.toString()).emit("wallet", {
      status: "SUCCESS",
      message: "Balance added and transaction recorded successfully.",
    });

    res.status(200).json({
      balance: data.balance,
      message: "Balance added and transaction recorded successfully",
    });
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Failed to add balance" });
  }
};

const getBalance = async (req, res) => {
  try {
    const currentBalance = await User.findById(req.body._id).select("balance");
    res.status(200).json(currentBalance);
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Failed to fetch balance" });
  }
};

const withdrawBalance = async (req, res) => {
  try {
    const { _id, amount, mode } = req.body;

    const user = await User.findById(_id);
    if (!user) {
      io.to(_id?.toString()).emit("wallet", {
        status: "REJECTED",
        message: "User not found.",
      });
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balance < amount) {
      io.to(_id?.toString()).emit("wallet", {
        status: "REJECTED",
        message: "Insufficient balance.",
      });
      return res.status(400).json({ message: "Insufficient balance" });
    }

    await User.updateOne(
      { _id },
      {
        $inc: { balance: -amount },
        $push: {
          transactions: {
            amount,
            mode,
            type: "Debit",
            description: "Wallet withdrawal",
          },
        },
      }
    );

    const data = await User.findById(_id).select("balance");

    io.to(_id?.toString()).emit("wallet", {
      status: "SUCCESS",
      message: "Balance withdrawn and transaction recorded successfully.",
    });

    res.status(200).json({
      balance: data.balance,
      message: "Balance withdrawn and transaction recorded successfully",
    });
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Failed to withdraw balance" });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await User.findById(req.body._id).select(
      "transactions"
    );
    res.status(200).json(transactions);
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Failed to withdraw balance" });
  }
};

const getAllTransactions = async (req, res) => {
  try {
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Internal Error" });
  }
};

userRouter.post("/signup", userSignup);
userRouter.post("/login", userLogin);
userRouter.post("/logout", userLogout);
userRouter.get("/profile", verifyToken, getProfile);
userRouter.post("/checkuser", checkUserExist);
userRouter.post("/add_balance", addBalance);
userRouter.post("/get_balance", getBalance);
userRouter.post("/withdraw", withdrawBalance);
userRouter.post("/get_transactions", getTransactions);

export default userRouter;
