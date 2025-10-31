import { Router } from "express";
import User from "../models/user.js";
import Order from "../models/order.js";
import { io } from "../index.js";
import mongoose from "mongoose";
import Stock from "../models/stock.js";
import Trade from "../models/trade.js";
import { authorizeAdmin } from "../middleware/role.js";

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
      if (user.balance < stock.current_price * quantity) {
        io.to(user_id?.toString()).emit("new_order", {
          status: "REJECTED",
          message: "Insufficient balance.",
        });
        res.status(400).json({ message: "Insufficient balance" });
      } else {
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
              balance: (user.balance - stock.current_price * quantity).toFixed(
                2
              ),
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

        // const trade = new Trade({
        //   user_id,
        //   stock_id,
        //   trade_type: type,
        //   quantity,
        //   trade_price: stock.current_price,
        //   order_id: order._id,
        // });
        // await trade.save();

        res.status(200).json({ message: "Order created successfully" });
        // io.emit("newOrder", { //Emit this one to only admin
        //   user_id,
        //   stock_id,
        //   order_type: type,
        //   quantity,
        //   price_at_order,
        //   status: "PENDING",
        // });

        io.to(user_id?.toString()).emit("new_order", {
          order_id: order._id,
          status: "PENDING",
          message: "Your order has been placed and is pending for approval.",
        });
      }
    } else if (type === "SELL") {
      console.log("SELL---------------");

      console.log("USER_ID 111111111", user_id);
      console.log("StockID 1111111", stock_id);
      //   const trade = await Trade.aggregate([
      //   {
      //     $match: {

      //         user_id: new mongoose.Types.ObjectId(user_id),
      // stock_id: new mongoose.Types.ObjectId(stock_id),
      //           trade_type: "BUY",

      //     },
      //   },
      //   {
      //     $group: {
      //       _id: null,
      //       total_invested: {
      //         $sum: {
      //           $multiply: ["$trade_price", "$quantity"],
      //         },
      //       },
      //       total_count: {
      //         $sum: "$quantity",
      //       },
      //     },
      //   },
      // ]);
      console.log("TRADE", trade.length);

      if (trade.length <= 0 || trade[0].total_count < quantity) {
        {
          const id = user_id?.toString();
          console.log("ID=====", id);
          io.to(id).emit("new_order", {
            status: "REJECTED",
            message: "Not enough stock to sell.",
          });
          return res.status(400).json({ message: "Not enough stock to sell" });
        }
      } else {
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
              balance: (user.balance + stock.current_price * quantity).toFixed(
                2
              ),
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

        // const trade = new Trade({
        //   user_id,
        //   stock_id,
        //   trade_type: type,
        //   quantity,
        //   trade_price: stock.current_price,
        //   order_id: order._id,
        // });
        // await trade.save();
        res.status(200).json({ message: "Order created successfully" });

        // io.emit("newOrder", { //Emit this one to only admin
        //   user_id,
        //   stock_id,
        //   order_type: type,
        //   quantity,
        //   price_at_order,
        //   status: "PENDING",
        // });

        io.to(user_id.toString()).emit("new_order", {
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
    console.log("USER ID-------", req.body.user_id);
    const orders = await Order.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(req.body.user_id),
        },
      },
      {
        $lookup: {
          from: "stocks",
          localField: "stock_id",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $project: {
          company_name: { $arrayElemAt: ["$result.company_name", 0] },
          symbol: { $arrayElemAt: ["$result.symbol", 0] },
          status: 1,
          price_at_order: 1,
          quantity: 1,
          order_type: 1,
        },
      },
      {
        $addFields: {
          total_cost: {
            $divide: [
              { $ceil: { $multiply: ["$quantity", "$price_at_order", 100] } },
              100,
            ],
          },
        },
      },
    ]);

    console.log("ORDERS--------", JSON.stringify(orders));
    res.status(200).json(orders);
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $lookup:
          /**
           * from: The target collection.
           * localField: The local join field.
           * foreignField: The target join field.
           * as: The name for the results.
           * pipeline: Optional pipeline to run on the foreign collection.
           * let: Optional variables to use in the pipeline field stages.
           */
          {
            from: "stocks",
            localField: "stock_id",
            foreignField: "_id",
            as: "result",
          },
      },
      {
        $project:
          /**
           * specifications: The fields to
           *   include or exclude.
           */
          {
            company_name: {
              $arrayElemAt: ["$result.company_name", 0],
            },
            symbol: {
              $arrayElemAt: ["$result.symbol", 0],
            },
            status: 1,
            price_at_order: 1,
            quantity: 1,
            order_type: 1,
            user_id: 1,
          },
      },
      {
        $addFields:
          /**
           * newField: The new field name.
           * expression: The new field expression.
           */
          {
            total_cost: {
              $divide: [
                {
                  $ceil: {
                    $multiply: ["$quantity", "$price_at_order", 100],
                  },
                },
                100,
              ],
            },
          },
      },
    ]);
    res.status(200).json(orders);
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

const orderAccept = async (req, res) => {
  try {
    const user = await User.findById(req.body.user_id);

    const result = await Order.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.body.order_id) } },
      {
        $addFields: {
          total_cost: {
            $divide: [
              {
                $ceil: {
                  $multiply: ["$quantity", "$price_at_order", 100],
                },
              },
              100,
            ],
          },
        },
      },
    ]);
    const order = result[0];
    if (!order) return res.status(404).json({ message: "Order not found" });

    console.log("USER BALANCE:", user.balance);
    console.log("ORDER TOTAL COST:", order.total_cost);

    if (order.status !== "PENDING") {
      io.to(req.body.admin_id).emit("order_update", {
        status: "REJECTED",
        message: "Order is not pending",
      });
      return res.status(400).json({ message: "Order is not pending" });
    }

    await Order.updateOne(
      { _id: req.body.order_id },
      { $set: { status: "APPROVED" } }
    );

    const trade = new Trade({
      user_id: req.body.user_id,
      stock_id: order.stock_id,
      trade_type: order.order_type,
      quantity: order.quantity,
      trade_price: order.price_at_order,
      order_id: order._id,
    });
    await trade.save();

    if (order.order_type === "SELL") {
      await User.updateOne(
        { _id: req.body.user_id },
        { $set: { balance: user.balance - Number(order.total_cost) } }
      );
    }

    io.to(req.body.admin_id).emit("order_update", {
      status: "APPROVED",
      message: order.order_type + " order has been approved.",
    });

    res.status(200).json({ message: "Order has been approved" });
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Failed to accept order" });
  }
};

const orderReject = async (req, res) => {
  try {
    const user = await User.findById(req.body.user_id);
    const result = await Order.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.body.order_id) } },
      {
        $addFields: {
          total_cost: {
            $divide: [
              {
                $ceil: {
                  $multiply: ["$quantity", "$price_at_order", 100],
                },
              },
              100,
            ],
          },
        },
      },
    ]);
    const order = result[0];
    if (!order) return res.status(404).json({ message: "Order not found" });

    console.log("ORDER STATUS===========", order.status);
    if (order.status !== "PENDING") {
      io.to(req.body.user_id).emit("order_update", {
        status: "REJECT",
        message: "Order is not pending",
      });
      return res.status(400).json({ message: "Order is not pending" });
    }

    await Order.updateOne(
      { _id: req.body.order_id },
      { $set: { status: "REJECTED" } }
    );

    if (order.order_type === "BUY") {
      await User.updateOne(
        { _id: req.body.user_id },
        { $set: { balance: user.balance + Number(order.total_cost) } }
      );
      io.to(req.body.admin_id).emit("order_update", {
        status: "REJECT",
        message: order.order_type + " order has been rejected.",
      });
    } else {
      io.to(req.body.user_id).emit("order_update", {
        status: "REJECT",
        message: order.order_type + " order has been rejected.",
      });
    }
    res.status(200).json({ message: "Order has been rejected" });
  } catch (error) {
    console.log("Error", JSON.stringify(error));
    res.status(500).json({ message: "Failed to reject order" });
  }
};

orderRouter.post("/create", createOrder);
orderRouter.post("/get", getOrders);
orderRouter.post("/all", getAllOrders);
orderRouter.post("/accept", orderAccept);
orderRouter.post("/reject", orderReject);

export default orderRouter;
