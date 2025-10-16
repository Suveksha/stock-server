import mongoose from "mongoose";

const historicalSchema=new mongoose.Schema({
  date:Date,
  open:Number,
  high:Number,
  low:Number,
  close:Number
})

const stockSchema=new mongoose.Schema({
  company_name:String,
  symbol:{
    type:String,
    unique:true
  },
  current_price:Number,
  percent_change:Number,
  net_change:Number,
  top_gain:Boolean,
  top_loss:Boolean,
  desc:String,
  image:String,
  historical_data:[historicalSchema]
},{ timestamps: true })

const Stock=mongoose.model("Stock",stockSchema)

export default Stock