import { useState } from "react";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onLogin: (user: unknown) => void;
};

export function AuthModal(props: AuthModalProps) {
 const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const endpoint =
        mode === "login"
          ? "http://localhost:4000/auth/login"
          : "http://localhost:4000/auth/register";

      const res = await fetch(endpoint, {
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

      // 🔥 IMPORTANT: auto-login after register
      if (mode === "register") {
        // call login again
        const loginRes = await fetch("http://localhost:4000/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginRes.json();

        localStorage.setItem("token", loginData.access_token);
        props.onLogin(loginData.user);
      } else {
        localStorage.setItem("token", data.access_token);
        props.onLogin(data.user);
      }

      props.onClose();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
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
          {loading
            ? "Loading..."
            : mode === "login"
            ? "Login"
            : "Register"}
        </button>

        {/* 🔁 Toggle */}
        <p style={{ fontSize: 14 }}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() =>
              setMode(mode === "login" ? "register" : "login")
            }
          >
            {mode === "login" ? "Register" : "Login"}
          </span>
        </p>

        <button onClick={props.onClose}>Cancel</button>
      </div>
    </div>
  );
}