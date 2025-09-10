import express from "express";
import { GetAnalyticsData } from "../controllers/analytics.js";


const app = express.Router();

app.get("/getdata", GetAnalyticsData)


export default app;




