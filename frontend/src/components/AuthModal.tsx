import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  // onLogin: (user: unknown) => void;
};

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setPassword("");
    setConfirmPassword("");
  };
  const isPasswordMismatch =
    mode === "register" &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  if (!open) return null;

  const handleForgotPassword = () => {
    // Redirect to forgot password page
    window.location.href = "/password?mode=forgot";
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
      }
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, username);
      }
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <h2>{mode === "login" ? "Login" : "Create Account"}</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "register" && (
          <>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmTouched(true)}
            />

            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </>
        )}
        {mode === "login" && (
          <span
            onClick={handleForgotPassword}
            style={{ cursor: "pointer", width: "fit-content" }}
          >
            Forgot Password?
          </span>
        )}
        {mode === "register" &&
          confirmTouched &&
          confirmPassword &&
          password !== confirmPassword && (
            <p style={{ color: "red", margin: "0" }}>Passwords do not match</p>
          )}
        <button onClick={handleSubmit} disabled={loading || isPasswordMismatch}>
          {loading ? "Loading..." : mode === "login" ? "Login" : "Register"}
        </button>

        <p>
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}
          <span
            onClick={switchMode}
            style={{ cursor: "pointer", width: "fit-content" }}
          >
            {mode === "login" ? " Register" : " Login"}
          </span>
        </p>

        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
