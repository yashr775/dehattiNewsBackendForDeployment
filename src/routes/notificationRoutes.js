
import express from "express";
import { subscribe } from "../controllers/notificationController.js";

const router = express.Router();

router.post("/subscribe", subscribe);

export default router;