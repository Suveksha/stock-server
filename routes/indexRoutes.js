import { Router } from "express";
import Index from "../models/indices.js";

const indexRouter=Router()

const addIndex=async(req,res)=>{
  try{
    const index=new Index({
      title:req.body.title,
      symbol:req.body.symbol,
      desc:req.body.desc,
      current_value:req.body.current_value,
      net_change:req.body.net_change,
      percent_change:req.body.percent_change,
      current_status:req.body.current_status
    })

    await index.save()
    res.status(200).json({ message: "Index added successfully" });
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

const getAllIndex=async(req,res)=>{
  try{
    const index=await Index.find()
    console.log("Index",JSON.stringify(index))
    res.status(200).json(index)
  }catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

const updateIndex=async(req,res)=>{
  try{
    const {symbol}=req.body
    const checkIndex=await Index.findOne({symbol})
    if(checkIndex){
      checkIndex.title=req.body.title,
      checkIndex.symbol=req.body.symbol,
      checkIndex.desc=req.body.desc,
      checkIndex.current_value=req.body.current_value,
      checkIndex.net_change=req.body.net_change,
      checkIndex.percent_change=req.body.percent_change,
      checkIndex.current_status=req.body.current_status
      await checkIndex.save()
      res.status(200).json({ message: "Index updated successfully" });
    }
    else
      res.status(404).json({ message: "Index not found" });
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

const getIndex=async(req,res)=>{
  try{
    const {symbol}=req.body
    const index=await Index.findOne({symbol})
    if(index)
      res.status(200).json(index)
    else
      res.status(404).json({ message: "Index not found" });
  }
  catch(error){
    console.log("Error",JSON.stringify(error))
    res.status(500).json({ message: "Internal server error" });
  }
}

indexRouter.post("/add",addIndex)
indexRouter.get("/all",getAllIndex)
indexRouter.post("/update",updateIndex)
indexRouter.post("/get",getIndex)


export default indexRouter