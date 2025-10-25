import { Router } from "express";
import User from "../models/user.js";
import Order from "../models/order.js";
import { io } from "../index.js";
import mongoose from "mongoose";
import Stock from "../models/stock.js";
import Trade from "../models/trade.js";


const orderRouter = Router();

const createOrder = async (req, res) => {
  try {
    const { user_id, stock_id, type, quantity, price_at_order } = req.body;

    console.log("USER ID", user_id);
    console.log("STOCK ID", stock_id);

    const user = await User.findById(user_id);
    console.log("USER", JSON.stringify(user));

    const stock = await Stock.findById(stock_id);
    console.log("STOCK", JSON.stringify(stock));

    if (!user || !stock) {
      return res.status(404).json({ message: "User or Stock not found" });
    }

    if (type === "BUY") {
      if (user.balance < stock.current_price * quantity)
        res.status(400).json({ message: "Insufficient balance" });
      else {
        const order = new Order({
          user_id,
          stock_id,
          order_type: type,
          quantity,
          price_at_order,
          status: "PENDING",
          remarks: "ORDER CREATED",
        });

        await order.save();

        await User.updateOne(
          { _id: user_id },
          {
            $set: {
              balance: (user.balance - stock.current_price * quantity).toFixed(2),
            },
            $push: {
              transactions: {
                amount: (stock.current_price * quantity).toFixed(2),
                mode: "BUY",
                type: "DEBIT",
                description: "Order Placed for " + stock.company_name,
              },
            },
          }
        );

        const trade = new Trade({
          user_id,
          stock_id,
          trade_type: type,
          quantity,
          trade_price: stock.current_price,
          order_id: order._id,
        });
        await trade.save();

        res.status(200).json({ message: "Order created successfully" });
        // io.emit("newOrder", {
        //   user_id,
        //   stock_id,
        //   order_type: type,
        //   quantity,
        //   price_at_order,
        //   status: "PENDING",
        // });

        io.to(user_id?.toString()).emit("newOrder", {
          order_id: order._id,
          status: "PENDING",
          message: "Your order has been placed and is pending for approval.",
        });
      }
    } else if (type === "SELL") {
      console.log("SELL---------------");
 
        console.log("USER_ID 111111111",user_id)
        console.log("StockID 1111111",stock_id)
        const trade = await Trade.aggregate([
        {
          $match: {
            
              user_id: new mongoose.Types.ObjectId(user_id),
      stock_id: new mongoose.Types.ObjectId(stock_id),
                trade_type: "BUY",
              
          
          },
        },
        {
          $group: {
            _id: null,
            total_invested: {
              $sum: {
                $multiply: ["$trade_price", "$quantity"],
              },
            },
            total_count: {
              $sum: "$quantity",
            },
          },
        },
      ]);
      console.log("TRADE", trade.length);
      
      
      
      if (trade.length <= 0 || trade[0].total_count < quantity) {
       {
        const id=user_id?.toString()
        console.log("ID=====",id)
         io.to(id).emit("newOrder", {
          order_id: "",
          status: "PENDING",
          message: "Not enough stock to sell.",
        });
        return res.status(400).json({ message: "Not enough stock to sell" });
      }
    }

    else{
        const order = new Order({
          user_id,
          stock_id,
          order_type: type,
          quantity,
          price_at_order,
          status: "PENDING",
          remarks: "ORDER CREATED",
        });

        await order.save();
    
          await User.updateOne(
          { _id: user_id },
          {
            $set: {
              balance: (user.balance + stock.current_price * quantity).toFixed(2),
            },
            $push: {
              transactions: {
                amount: (stock.current_price * quantity).toFixed(2),
                mode: "SELL",
                type: "CREDIT",
                description: "Order Placed for " + stock.company_name,
              },
            },
          }
        );
     


        const trade = new Trade({
          user_id,
          stock_id,
          trade_type: type,
          quantity,
          trade_price: stock.current_price,
          order_id: order._id,
        });
        await trade.save();
      res.status(200).json({ message: "Order created successfully" });

        // io.emit("newOrder", {
        //   user_id,
        //   stock_id,
        //   order_type: type,
        //   quantity,
        //   price_at_order,
        //   status: "PENDING",
        // });

        io.to(user_id.toString()).emit("newOrder", {
          order_id: order._id,
          status: "PENDING",
          message: "Your order has been placed and is pending for approval.",
        });
    }
      }
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Internal server error" });
  }
};

const getOrders = async (req, res) => {
  try {
    console.log("USER ID-------",req.body.user_id)
    const orders = await Order.aggregate([
  {
    $match: {
      user_id: new mongoose.Types.ObjectId(req.body.user_id),
    }
  },
  {
    $lookup: {
      from: "stocks",
      localField: "stock_id",
      foreignField: "_id",
      as: "result",
    }
  },
  {
    $project: {
      company_name: { $arrayElemAt: ["$result.company_name", 0] },
      symbol: { $arrayElemAt: ["$result.symbol", 0] },
      status: 1,
      price_at_order: 1,
      quantity: 1,
      order_type: 1
    }
  },
  {
  $addFields: {
    total_cost: {
      $divide: [
        { $ceil: { $multiply: ["$quantity", "$price_at_order", 100] } },
        100
      ]
    }
  }
}
]);

    console.log("ORDERS--------",JSON.stringify(orders))
    res.status(200).json(orders);
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Internal server error" });
  }
};

orderRouter.post("/create", createOrder);
orderRouter.post("/get", getOrders);

export default orderRouter;
