import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

type AuthMode = "login" | "register" | "check-email";

const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    style={{ width: 15, height: 15, stroke: "currentColor", fill: "none" }}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    style={{ width: 15, height: 15, stroke: "currentColor", fill: "none" }}
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, loading, error } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearNotices = () => {
    setLocalError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotices();

    try {
      if (mode === "register") {
        // Validation
        if (!email.trim()) return setLocalError("Please enter your email address.");
        if (!/\S+@\S+\.\S+/.test(email)) return setLocalError("Please enter a valid email address.");
        if (!username.trim()) return setLocalError("Please enter a username.");
        if (!password) return setLocalError("Please enter a password.");
        if (password.length < 8) return setLocalError("Password must be at least 8 characters.");
        if (password !== confirmPassword) return setLocalError("Passwords do not match.");

        await register(email, password, username);
        setMode("check-email");
      } else if (mode === "login") {
        // Validation
        if (!email.trim()) return setLocalError("Please enter your email address.");
        if (!/\S+@\S+\.\S+/.test(email)) return setLocalError("Please enter a valid email address.");
        if (!password) return setLocalError("Please enter your password.");

        await login(email, password);
        setSuccess("Login successful — redirecting…");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const displayError = localError || error;
  const isPasswordMismatch = mode === "register" && confirmPassword && password !== confirmPassword;

  // ─── Check-email screen ────────────────────────────────────────────
  if (mode === "check-email") {
    return (
      <>
        <style>{`
          .auth-root {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0rem 1rem;
            margin-top: 4vh;
          }

          .auth-card {
            background: #ffffff;
            border: 0.5px solid rgba(0,0,0,0.1);
            border-radius: 16px;
            padding: 2.5rem 2rem;
            width: 100%;
            max-width: 400px;
            position: relative;
            overflow: hidden;
            text-align: center;
          }

          .auth-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #B5D4F4, #9FE1CB, #EEEDFE);
            opacity: 0.9;
          }

          .auth-icon-wrap {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            background: #f5f5f3;
            border: 0.5px solid rgba(0,0,0,0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
          }

          .auth-title {
            font-size: 24px;
            font-weight: 500;
            color: #1a1a18;
            margin: 0 0 8px;
            line-height: 1.2;
          }

          .auth-subtitle {
            font-size: 13px;
            color: #777772;
            margin: 0 0 1rem;
            font-weight: 300;
            line-height: 1.55;
          }

          .auth-email-highlight {
            font-weight: 500;
            color: #1a1a18;
          }

          .auth-notice {
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 13px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            line-height: 1.5;
            margin: 1rem 0;
            background: #f5f5f3;
            color: #888;
            border: 0.5px solid rgba(0,0,0,0.08);
          }

          .auth-btn {
            width: 100%;
            padding: 11px;
            margin-top: 12px;
            font-size: 14px;
            font-weight: 500;
            font-family: 'DM Sans', sans-serif;
            color: #fff;
            background: #1a1a18;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: opacity 0.15s, transform 0.1s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .auth-btn:hover { opacity: 0.82; }
          .auth-btn:active { transform: scale(0.99); }

          .auth-back {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            font-size: 13px;
            color: #aaa;
            cursor: pointer;
            background: none;
            border: none;
            font-family: 'DM Sans', sans-serif;
            padding: 0;
            margin-top: 1rem;
            transition: color 0.15s;
            width: 100%;
          }
          .auth-back:hover { color: #1a1a18; }
        `}</style>

        <div className="auth-root">
          <div className="auth-card">
            <div className="auth-icon-wrap">
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{ width: 22, height: 22, stroke: "#888", fill: "none" }}
              >
                <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
              </svg>
            </div>

            <h2 className="auth-title">Check your email</h2>
            <p className="auth-subtitle">
              We sent a confirmation link to <span className="auth-email-highlight">{email}</span>.
            </p>
            <p className="auth-subtitle">
              Click the link in the email to activate your account.
            </p>

            <div className="auth-notice">
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{
                  width: 14,
                  height: 14,
                  stroke: "currentColor",
                  fill: "none",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Didn't receive it? Check your spam folder.
            </div>

            <button className="auth-btn" onClick={() => setMode("register")}>
              Try a different email
            </button>

            <button className="auth-back" onClick={() => navigate("/")}>
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{
                  width: 13,
                  height: 13,
                  stroke: "currentColor",
                  fill: "none",
                }}
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to home
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Login / Register screen ────────────────────────────────────────
  return (
    <>
      <style>{`
        .auth-root {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0rem 1rem;
          margin-top: 4vh;
        }

        .auth-card {
          background: #ffffff;
          border: 0.5px solid rgba(0,0,0,0.1);
          border-radius: 16px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 400px;
          position: relative;
          overflow: hidden;
        }

        .auth-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #B5D4F4, #9FE1CB, #EEEDFE);
          opacity: 0.9;
        }

        .auth-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #f5f5f3;
          border: 0.5px solid rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .auth-title {
          font-size: 24px;
          font-weight: 500;
          color: #1a1a18;
          margin: 0 0 4px;
          line-height: 1.2;
        }

        .auth-subtitle {
          font-size: 13px;
          color: #777772;
          margin: 0 0 1.75rem;
          font-weight: 300;
          line-height: 1.55;
        }

        .auth-tabs {
          display: flex;
          gap: 3px;
          background: #f5f5f3;
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 1.75rem;
          border: 0.5px solid rgba(0,0,0,0.07);
        }

        .auth-tab {
          flex: 1;
          padding: 7px 0;
          font-size: 12px;
          font-weight: 400;
          color: #888;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-tab.active {
          background: #fff;
          color: #1a1a18;
          font-weight: 500;
          border: 0.5px solid rgba(0,0,0,0.1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .auth-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #888;
          margin-bottom: 6px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .auth-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a18;
          background: #fff;
          border: 0.5px solid rgba(0,0,0,0.15);
          border-radius: 8px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
          margin-bottom: 12px;
        }

        .auth-input:focus {
          border-color: #333333;
          box-shadow: 0 0 0 3px rgba(145, 145, 145, 0.08);
        }

        .auth-input::placeholder { color: #bbb; }

        .auth-input-wrap {
          position: relative;
          margin-bottom: 12px;
        }

        .auth-eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #bbb;
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .auth-eye:hover { color: #777; }

        .auth-btn {
          width: 100%;
          padding: 11px;
          margin-top: 8px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          background: #1a1a18;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .auth-btn:hover { opacity: 0.82; }
        .auth-btn:active { transform: scale(0.99); }
        .auth-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .auth-spinner {
          width: 14px; height: 14px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: auth-spin 0.6s linear infinite;
        }
        @keyframes auth-spin { to { transform: rotate(360deg); } }

        .auth-notice {
          margin-top: 1rem;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
        }
        .auth-notice-error {
          background: #fff5f5;
          color: #a32d2d;
          border: 0.5px solid rgba(163,45,45,0.2);
        }
        .auth-notice-success {
          background: #f0faf5;
          color: #0f6e56;
          border: 0.5px solid rgba(15,110,86,0.2);
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 1.25rem 0;
        }
        .auth-divider-line { flex: 1; height: 0.5px; background: rgba(0,0,0,0.08); }
        .auth-divider-text { font-size: 11px; color: #bbb; }

        .auth-toggle {
          text-align: center;
          font-size: 13px;
          color: #777;
        }
        .auth-toggle button {
          background: none;
          border: none;
          color: #1a1a18;
          cursor: pointer;
          font-weight: 500;
          transition: opacity 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .auth-toggle button:hover { opacity: 0.7; }

        .auth-forgot {
          font-size: 12px;
          color: #aaa;
          margin-top: 10px;
        }
        .auth-forgot button {
          background: none;
          border: none;
          color: #1a1a18;
          cursor: pointer;
          font-weight: 500;
          transition: opacity 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .auth-forgot button:hover { opacity: 0.7; }

        .auth-back {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 13px;
          color: #aaa;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
          transition: color 0.15s;
          width: 100%;
        }
        .auth-back:hover { color: #1a1a18; }

        .auth-form {
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <div className="auth-root">
        <div className="auth-card">
          {/* Icon */}
          <div className="auth-icon-wrap">
            {mode === "login" ? (
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{ width: 22, height: 22, stroke: "#888", fill: "none" }}
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5m0 0l-5-5" />
                <line x1="10" y1="5" x2="10" y2="19" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{ width: 22, height: 22, stroke: "#888", fill: "none" }}
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6M23 11h-6" />
              </svg>
            )}
          </div>

          {/* Heading */}
          <h2 className="auth-title">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Sign in to access your account and continue shopping."
              : "Join us and start your shopping journey today."}
          </p>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab${mode === "login" ? " active" : ""}`}
              onClick={() => {
                setMode("login");
                clearNotices();
              }}
            >
              Login
            </button>
            <button
              className={`auth-tab${mode === "register" ? " active" : ""}`}
              onClick={() => {
                setMode("register");
                clearNotices();
              }}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">Email address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearNotices();
              }}
              required
            />

            {mode === "register" && (
              <>
                <label className="auth-label">Username</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearNotices();
                  }}
                  required
                />
              </>
            )}

            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearNotices();
                }}
                style={{ marginBottom: 0, paddingRight: 36 }}
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {mode === "register" && (
              <>
                <label className="auth-label" style={{ marginTop: 12 }}>Confirm password</label>
                <div className="auth-input-wrap">
                  <input
                    className="auth-input"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearNotices();
                    }}
                    style={{ marginBottom: 0, paddingRight: 36 }}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </>
            )}

            <button className="auth-btn" type="submit" disabled={loading || isPasswordMismatch}>
              {loading ? (
                <>
                  <div className="auth-spinner" /> Processing…
                </>
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Notices */}
          {displayError && (
            <div className="auth-notice auth-notice-error">
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{
                  width: 14,
                  height: 14,
                  stroke: "currentColor",
                  fill: "none",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {displayError}
            </div>
          )}
          {success && (
            <div className="auth-notice auth-notice-success">
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{
                  width: 14,
                  height: 14,
                  stroke: "currentColor",
                  fill: "none",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {success}
            </div>
          )}

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <div className="auth-divider-text">or</div>
            <div className="auth-divider-line" />
          </div>

          {/* Footer options */}
          {mode === "login" && (
            <div className="auth-forgot">
              Need help?{" "}
              <button onClick={() => navigate("/password?mode=forgot")}>
                Reset your password
              </button>
            </div>
          )}

          <button className="auth-back" onClick={() => navigate("/")}>
            <svg
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              style={{
                width: 13,
                height: 13,
                stroke: "currentColor",
                fill: "none",
              }}
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to home
          </button>
        </div>
      </div>
    </>
  );
}
