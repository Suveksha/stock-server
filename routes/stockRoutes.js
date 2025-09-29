import { Router } from "express";
import axios from "axios";
import { STOCK_LIST } from "../lookup.js";

const router = Router();

const getStockList = async (req, res) => {
  console.log("Fetching lost of stocks...");
  try {
    await res.send(STOCK_LIST);
  } catch (err) {
    console.log("Error fetching stocks", JSON.stringify(err));
  }
};

const getStocks = async (req, res) => {
  const options = {
    method: "GET",
    url: process.env.BASE_URL + "/stock",
    params: {
      name: req.query.name, //name of bank has to come from request from frontend
    },
    headers: { "x-api-key": process.env.API_KEY },
  };

  console.log("Fetching stocks...", process.env.STOCK_LIST);
  try {
    const stocks = await axios.request(options);
    console.log("Stocks fetched", stocks.data);
    res.send(stocks.data);
  } catch (err) {
    console.log("Error fetching stocks", JSON.stringify(err));
    res.send(err);
  }
};

const getHistoricalData=async(req,res)=>{
  const options = {
  method: 'GET',
  url: process.env.BASE_URL + '/historical_data',
  headers: {'x-api-key': process.env.API_KEY},
  params:{
    stock_name: req.query.name,
    period: req.query.period,
    filter: req.query.filter
  }
};

console.log("Options",JSON.stringify(options));
try{
  const response=await axios.request(options);
  res.send(response.data);
}catch(err){
  console.log("Error fetching stocks", JSON.stringify(err));
  res.send(err);
}

}

const getMutualFunds=async(req,res)=>{
  const options = {
  method: 'GET',
  url: 'https://stock.indianapi.in/mutual_funds',
  headers: {'x-api-key': process.env.API_KEY}
};
try {
  const { data } = await axios.request(options);
  console.log(data);
} catch (error) {
  console.error(error);
}
}

router.get("/", (req, res) => getStocks(req, res));
router.get("/list", (req, res) => getStockList(req, res));
router.get("/historical_data", (req, res) => getHistoricalData(req, res));


export default router;
