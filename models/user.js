import mongoose from "mongoose";

const watchListSchema=new mongoose.Schema({
  company_id:{
    type:mongoose.Schema.Types.ObjectId, ref:"Stock"
  }
})

const stockBuySchema=new mongoose.Schema({
  company_id:{
    type:mongoose.Schema.Types.ObjectId, ref:"Stock"
  },
  quantity:{
    type:Number
  },
  buy_price:{
    type:Number
  },
  date: { type: Date, default: Date.now },
  quantity: { type: Number, required: true, min: 1 },
})

const stockSellSchema=new mongoose.Schema({
  company_id:{
    type:mongoose.Schema.Types.ObjectId, ref:"Stock"
  },
  sell_price:{
    type:Number
  },
  date: { type: Date, default: Date.now },
  quantity: { type: Number, required: true, min: 1 },
})

const userSchema=new mongoose.Schema({
  firstName:{
    type:String,
    trim:true
  },
   lastName:{
    type:String,
    trim:true
  },
  email:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone:{
    type: String,
    required: true,
    lowercase: true,
  },
  password:{
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  balance: { type: Number, default: 0 },
  watchlist:[watchListSchema],
  stockBuy:[stockBuySchema],
  stockSell:[stockSellSchema],
},{ timestamps: true })

const UserSchema=mongoose.model("User",userSchema)

export default UserSchema