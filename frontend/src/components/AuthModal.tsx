import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";


type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  // onLogin: (user: unknown) => void;
};

export function AuthModal(props: AuthModalProps) {
    const { login, register } = useAuth();

 const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

 const handleSubmit = async () => {
    try {
      setLoading(true);

      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }

      props.onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="modal">
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

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Loading..." : mode === "login" ? "Login" : "Register"}
        </button>

        <p>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? " Register" : " Login"}
          </span>
        </p>

        <button onClick={props.onClose}>Cancel</button>
      </div>
    </div>
  );
}