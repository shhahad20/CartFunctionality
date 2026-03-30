import { supabase } from "../config/supabaseClient.js";


export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error || !data) {
    throw new Error("Products not found");
  }

  return data;
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