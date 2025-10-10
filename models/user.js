import mongoose from "mongoose";

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
  }
})

const UserSchema=mongoose.model("User",userSchema)

export default UserSchema