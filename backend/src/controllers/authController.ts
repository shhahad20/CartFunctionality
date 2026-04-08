import { supabase } from "../config/supabaseClient";
import { NextFunction, Request, Response } from "express";
import { User } from "@supabase/supabase-js";

interface AuthRequest extends Request {
  user?: User | null;
}
//______________AUTH MIDDLEWARE____________________________

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = data.user;

    next();
  } catch (err) {
    res.status(500).json({ error: "Auth failed" });
  }
};
// _____________ AUTH CONTROLLER ____________________________
export const register = async (req:Request, res:Response) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      message: "User created",
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(401).json({ error: error.message });

    res.json({
      message: "Logged in",
      user: data.user,
      session: data.session,
      access_token: data.session.access_token,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  // user comes from middleware
  res.json(req.user);
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !data.session) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};