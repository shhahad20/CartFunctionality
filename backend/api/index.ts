import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import homeRouter from '../src/routers/homeRouter.js';
import {createCartRouter} from '../src/routers/cartRouter.js';
import { CartService, InMemoryCartStore } from "../src/controllers/cartController.js";

dotenv.config();

// interface Product {
//   id: string;
//   name: string;
//   price: number;
//   image?: string;
// }

// interface CartItem {
//   productId: string;
//   name: string;
//   price: number;
//   image?: string;
//   quantity: number;
// }

// interface AddItemBody {
//   productId?: string;
//   quantity?: number;
// }

// interface UpdateQuantityBody {
//   quantity?: number;
// }

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
app.use(express.json());


app.use('/', homeRouter)
// Swap InMemoryCartStore → MongoCartStore or RedisCartStore in production
const cartService = new CartService(new InMemoryCartStore());
app.use("/api/cart", createCartRouter(cartService));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

