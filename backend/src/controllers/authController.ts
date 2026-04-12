import { supabase } from "../config/supabaseClient";
import { NextFunction, Request, Response } from "express";
import { User } from "@supabase/supabase-js";

interface AuthRequest extends Request {
  user?: User | null;
}
//______________AUTH MIDDLEWARE____________________________

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {

    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      message: "User created",
      user: data.user,
      // session: data.session,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(401).json({ error: error.message });

    res.cookie("token", data.session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production",
      secure: false, // ⚠️ for localhost
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.json({
      message: "Logged in",
      user: data.user,
      // session: data.session,
      // access_token: data.session.access_token,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
  });
  res.json({ message: "Logged out" });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  // user comes from middleware
  res.json(req.user);
};
