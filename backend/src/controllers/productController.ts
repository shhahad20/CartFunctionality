import { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabaseClient.js";

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const {
    search = "",
    status = "",
    sortBy = "created_at",
    order = "desc",
    page = 1,
    limit = 10,
  } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const ascending = order === "asc";

  try {
    let query = supabase.from("products").select("*", { count: "exact" });

    // Search (full-text on name & description)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    // Sort
    query = query.order(sortBy as string, { ascending });

    // Pagination
    query = query.range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data,
      meta: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count?? 0) / Number(limit)),
      },
    });

    // try {

    //   const { data, error } = await supabase.from("products").select("*");

    //   if (error) {
    //     throw error;
    //   }

    //   res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

export async function getProduct(req: Request, res: Response) {
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

// export async function getProductById(productId: string) {
//   const { data, error } = await supabase
//     .from("products")
//     .select("*")
//     .eq("id", productId)
//     .single();

//   if (error || !data) {
//     throw new Error("Product not found");
//   }

//   return data;
// }
