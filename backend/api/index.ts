import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import 'dotenv/config';
import rateLimit from "express-rate-limit";
import homeRouter from '../src/routers/homeRouter.js';
import {createCartRouter} from '../src/routers/cartRouter.js';
import { CartService, SupabaseCartStore } from "../src/controllers/cartController.js";
import checkoutRouter from "../src/routers/checkoutRouter.js";
import productRouter from "../src/routers/productRouter.js";
import webhook from "../src/routers/webhook.js";
import orderRouter from "../src/routers/orderRouter.js";
import authRouter from "../src/routers/authRouter.js";
import cookieParser from "cookie-parser";
import "../src/helper/cleaner.js"; // start cleanup job

dotenv.config();


const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: true }))
// ⚠️ MUST be before express.json() because Stripe needs raw body for signature verification
app.use("/api/webhook", webhook);
app.use(express.json());

app.use(cookieParser());
app.use('/', homeRouter)
// Swap InMemoryCartStore → MongoCartStore or RedisCartStore in production
const cartService = new CartService(new SupabaseCartStore());
app.use("/api/cart", createCartRouter(cartService));
app.use('/api/cart/checkout', checkoutRouter, rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
}));
app.use('/api/products', productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

