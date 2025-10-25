import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stock_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
    },

    trade_type: { type: String, enum: ["BUY", "SELL"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    trade_price: { type: Number, required: true },

    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

const Trade = mongoose.model("Trade", tradeSchema);

export default Trade;
