import { supabase } from "../config/supabaseClient";
import { NextFunction, Request, Response } from "express";
import { User } from "@supabase/supabase-js";
import { CartService, SupabaseCartStore } from "./cartController";

const cartService = new CartService(new SupabaseCartStore());
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
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ error: "Email, password, and username required" });
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
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

    const guestCartId = req.cookies.cartId;

    let finalCart = null;

    if (guestCartId) {
      finalCart = await cartService.mergeGuestCartToUser(
        guestCartId,
        data.user.id,
      );
      res.cookie("cartId", finalCart.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
    } else {
      const { data: existingCart } = await supabase
        .from("carts")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (existingCart) {
        finalCart = existingCart;
      } else {
        // ✅ CREATE cart if none exists
        const { data: newCart, error } = await supabase
          .from("carts")
          .insert({
            user_id: data.user.id,
            items: [],
          })
          .select()
          .single();

        if (error) throw error;

        finalCart = newCart;
      }

      // After merging, set cartId cookie to the user's cart ID (which is the same as user ID)
      res.cookie("cartId", finalCart.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
    }

    res.json({
      message: "Logged in",
      user: {
        id: data.user?.id,
        email: data.user?.email,
        username: data.user?.user_metadata?.username,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
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

// export const getMe = async (req: AuthRequest, res: Response) => {
//   // user comes from middleware
//   console.log("GET ME:", req.user);
//   res.json(req.user);
// };
export const getMe = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username, // 👈 extract it
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/password?mode=reset", // frontend page
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Password updated successfully", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
// we can skip change password for now.
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "New password is required" });
    }

    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Password changed successfully",
      user: data.user,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
