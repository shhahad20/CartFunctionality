import { supabase } from "../config/supabaseClient";
import { Request, Response, NextFunction } from "express";

export async function requireAuth(req:Request, res:Response, next:NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  (req as any).user = data.user;
  next();
}