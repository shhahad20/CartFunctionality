import { useState } from "react";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onLogin: (user: unknown) => void;
};

export function AuthModal(props: AuthModalProps) {
  const { open, onClose, onLogin } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      // save token
      localStorage.setItem("token", data.access_token);

      onLogin(data.user);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <h2>Login</h2>

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

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>

        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}