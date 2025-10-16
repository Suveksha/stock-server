import mongoose from "mongoose";

const newsSchema=new mongoose.Schema({
  title:String,
  description:String,
  image:String
})

const News=mongoose.model("News",newsSchema)

export default News