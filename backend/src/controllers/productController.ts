import { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabaseClient.js";

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("📦 Fetching products...");

    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      throw error;
    }

    res.status(200).json(data); // ✅ return directly
  } catch (error) {
    console.error("❌ getProducts error:", error);
    res.status(500).json({ error: "Failed to fetch products" }); // ✅ important
  }
}

export async function getProduct(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ getProduct error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
}

export async function getProductById(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !data) {
    throw new Error("Product not found");
  }

  return data;
}
