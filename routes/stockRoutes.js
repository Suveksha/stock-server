import { Router } from "express";
import axios from "axios";
import mongoose from "mongoose";
import Stock from "../models/stock.js";

const stockRouter = Router();

const addStock=async(req,res)=>{
  try{
    const {symbol}=req.body
    const checkStock=await Stock.findOne({symbol})
    if(checkStock)
      res.status(400).json({ message: "Stock already exists" });
    else{
      const stock=new Stock({
        symbol:symbol,
        company_name:req.body.company_name,
        current_price:req.body.current_price,
        percent_change:req.body.percent_change,
        net_change:req.body.net_change,
        top_gain:req.body.top_gain,
        top_loss:req.body.top_loss,
        desc:req.body.desc,
        image:req.body.image,
        historical_data:req.body.historical_data
      })

      await stock.save()

      res.status(200).json({ message: "Stock added successfully" });
    }
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

const getAllStocks=async(req,res)=>{
  try{
    const stocks=await Stock.find()
    res.status(200).json(stocks)
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

const updateStock=async(req,res)=>{
  try{
    const {symbol}=req.body
    const checkStock=await Stock.findOne({symbol})
    if(checkStock){
      checkStock.company_name=req.body.company_name,
      checkStock.current_price=req.body.current_price,
      checkStock.percent_change=req.body.percent_change,
      checkStock.net_change=req.body.net_change,
      checkStock.top_gain=req.body.top_gain,
      checkStock.top_loss=req.body.top_loss,
      checkStock.desc=req.body.desc,
      checkStock.image=req.body.image,
      checkStock.historical_data=req.body.historical_data
      await checkStock.save()
      res.status(200).json({ message: "Stock updated successfully" });
    }
    else
      res.status(404).json({ message: "Stock not found" });
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

const getStock=async(req,res)=>{
  try{
    const {symbol}=req.body
    const stock=await Stock.findOne({symbol})
    if(stock)
      res.status(200).json(stock)
    else
      res.status(404).json({ message: "Stock not found" });
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

const getTopGainers=async(req,res)=>{
  try{
  const stocks=await Stock.find({$and:[{top_gain:true},{top_loss:false}]})
  console.log("Top Gainers",JSON.stringify(stocks))
  res.status(200).json(stocks)
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

const getTopLosers=async(req,res)=>{
  try{
  const stocks=await Stock.find({$and:[{top_gain:false},{top_loss:true}]})
  res.status(200).json(stocks)
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

const getHistoricalData=async(req,res)=>{
  try{
    const {symbol}=req.body
    const stock=await Stock.findOne({symbol})
    if(stock)
      res.status(200).json(stock.historical_data)
    else
      res.status(404).json({ message: "Stock not found" });
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

stockRouter.post("/add",addStock)
stockRouter.get("/all",getAllStocks)
stockRouter.post("/update",updateStock)
stockRouter.post("/get",getStock)
stockRouter.get("/gainers",getTopGainers)
stockRouter.get("/losers",getTopLosers)
stockRouter.get("/history",getHistoricalData)


export default stockRouter;
