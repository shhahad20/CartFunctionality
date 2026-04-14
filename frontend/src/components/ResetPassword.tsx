import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";


type Mode = "forgot" | "reset" | "change";

export default function PasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
 const { user } = useAuth();
  const { 
    forgotPassword, 
    resetPassword, 
    changePassword, 
    loading, 
    error,
    refresh,
  } = useAuth();

  const mode = (params.get("mode") as Mode) || "forgot";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  // 🔥 Handle Supabase session from reset link
  useEffect(() => {
    if (mode === "reset") {
      // This ensures Supabase sets session from URL
      refresh();
    }
    if (mode === "change" && !user) {
  navigate("/login");
}
  }, [mode, refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    try {
      if (mode === "forgot") {
        await forgotPassword(email);
        setSuccess("Reset email sent. Check your inbox.");
      }

      if (mode === "reset") {
        if (password !== confirm) {
          throw new Error("Passwords do not match");
        }

        await resetPassword(password);
        setSuccess("Password reset successfully");

        // 🔥 redirect after reset
        setTimeout(() => navigate("/login"), 1500);
      }

      if (mode === "change") {
        if (password !== confirm) {
          throw new Error("Passwords do not match");
        }

        await changePassword(password);
        setSuccess("Password changed successfully");
      }
    } catch (err) {
      // error already handled in context
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4 capitalize">
        {mode === "forgot" && "Forgot Password"}
        {mode === "reset" && "Reset Password"}
        {mode === "change" && "Change Password"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "forgot" && (
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        {(mode === "reset" || mode === "change") && (
          <>
            <input
              type="password"
              placeholder="New password"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              className="w-full p-2 border rounded"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded"
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-3">{error}</p>}
      {success && <p className="text-green-600 mt-3">{success}</p>}
    </div>
  );
}