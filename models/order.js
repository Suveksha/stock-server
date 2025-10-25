import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stock_id: { type: mongoose.Schema.Types.ObjectId, ref: "Stock", required: true },

  order_type: { type: String, enum: ["BUY", "SELL"], required: true },
  quantity: { type: Number, required: true, min: 1 },
  price_at_order: { type: Number, required: true },

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING"
  },
  remarks: { type: String }
},{timestamps:true});

const Order=mongoose.model("Order",orderSchema)

export default Order;


