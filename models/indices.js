import mongoose from "mongoose";

const indexSchema=new mongoose.Schema({
    title: String,
    symbol: {
      type:String,
      unique:true
    },
    desc: String,
    current_value: Number,
    net_change: Number,
    percent_change: Number,
    current_status: String,
})

const Index=mongoose.model("Index",indexSchema)

export default Index