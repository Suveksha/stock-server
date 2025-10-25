import mongoose from "mongoose";

const watchListSchema=new mongoose.Schema({
  company_id:{
    type:mongoose.Schema.Types.ObjectId, ref:"Stock"
  }
})

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum: ["UPI", "Card", "NetBanking", "BUY", "SELL"], // add more if needed
      required: true,
    },
    type: {
      type: String,
      enum: ["Credit", "Debit"], // Credit = added, Debit = deducted
      default: "Credit",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } // adds createdAt, updatedAt
);

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
  transactions: [transactionSchema]
},{ timestamps: true })

const User=mongoose.model("User",userSchema)

export default User