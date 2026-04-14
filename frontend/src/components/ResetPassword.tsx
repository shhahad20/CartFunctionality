import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

type Mode = "forgot" | "reset";

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

function getPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, Math.max(1, Math.round((score * 4) / 5)));
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "#E24B4A", "#EF9F27", "#EF9F27", "#1D9E75"];

export default function PasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {
    forgotPassword,
    resetPassword,
    // changePassword,
    loading,
    error,
    refresh,
  } = useAuth();

  const mode = (params.get("mode") as Mode) || "forgot";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (mode === "reset") refresh();
    // if (mode === "change" && !user) navigate("/login");
  }, [mode, refresh]);

  const clearNotices = () => {
    setSuccess(null);
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotices();

    if (mode === "forgot") {
      if (!email.trim())
        return setLocalError("Please enter your email address.");
      if (!/\S+@\S+\.\S+/.test(email))
        return setLocalError("Please enter a valid email address.");
    } else {
      if (!password) return setLocalError("Please enter a new password.");
      if (password.length < 8)
        return setLocalError("Password must be at least 8 characters.");
      if (password !== confirm) return setLocalError("Passwords do not match.");
    }

    try {
      if (mode === "forgot") {
        await forgotPassword(email);
        setSuccess("Reset email sent — check your inbox!");
      }
      if (mode === "reset") {
        await resetPassword(password);
        setSuccess("Password reset — redirecting to login…");
        setTimeout(() => navigate("/login"), 1500);
      }
    //   if (mode === "change") {
    //     await changePassword(password);
    //     setSuccess("Password updated successfully!");
    //   }
    } catch (err) {
      console.error(err);
    }
  };

  const displayError = localError || error;

  const modeConfig = {
    forgot: {
      title: "Forgot password",
      subtitle: "Enter your email and we'll send a reset link to your inbox.",
      btnLabel: "Send reset link",
    },
    reset: {
      title: "Reset password",
      subtitle: "Choose a strong new password for your account.",
      btnLabel: "Reset password",
    },
    // change: {
    //   title: "Change password",
    //   subtitle: "Update the password on your current account.",
    //   btnLabel: "Update password",
    // },
  };

  const { title, subtitle, btnLabel } = modeConfig[mode];

  return (
    <>
      <style>{`
        .pw-root {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0rem 1rem;
          margin-top: 4vh;
        }

        .pw-card {
          background: #ffffff;
          border: 0.5px solid rgba(0,0,0,0.1);
          border-radius: 16px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 400px;
          position: relative;
          overflow: hidden;
        }

        .pw-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        //   background: linear-gradient(90deg, #B5D4F4, #9FE1CB, #EEEDFE);
          opacity: 0.9;
        }

        .pw-icon-wrap {
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

        .pw-title {
          font-size: 24px;
          font-weight: 500;
          color: #1a1a18;
          margin: 0 0 4px;
          line-height: 1.2;
        }

        .pw-subtitle {
          font-size: 13px;
          color: #777772;
          margin: 0 0 1.75rem;
          font-weight: 300;
          line-height: 1.55;
        }

        .pw-tabs {
          display: flex;
          gap: 3px;
          background: #f5f5f3;
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 1.75rem;
          border: 0.5px solid rgba(0,0,0,0.07);
        }

        .pw-tab {
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

        .pw-tab.active {
          background: #fff;
          color: #1a1a18;
          font-weight: 500;
          border: 0.5px solid rgba(0,0,0,0.1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .pw-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #888;
          margin-bottom: 6px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .pw-input {
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
        }

        .pw-input:focus {
        //   border-color: rgba(55,138,221,0.5);
        border-color: #333333;
          box-shadow: 0 0 0 3px rgba(145, 145, 145, 0.08);
        }

        .pw-input::placeholder { color: #bbb; }

        .pw-input-wrap { position: relative; }

        .pw-eye {
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
        .pw-eye:hover { color: #777; }

        .pw-strength-bars {
          display: flex;
          gap: 4px;
          margin-top: 8px;
          height: 3px;
        }

        .pw-strength-bar {
          flex: 1;
          border-radius: 2px;
          background: rgba(0,0,0,0.08);
          transition: background 0.3s;
        }

        .pw-strength-label {
          font-size: 11px;
          color: #aaa;
          margin-top: 5px;
          min-height: 16px;
          transition: color 0.3s;
        }

        .pw-btn {
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
        .pw-btn:hover { opacity: 0.82; }
        .pw-btn:active { transform: scale(0.99); }
        .pw-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .pw-spinner {
          width: 14px; height: 14px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pw-spin 0.6s linear infinite;
        }
        @keyframes pw-spin { to { transform: rotate(360deg); } }

        .pw-notice {
          margin-top: 1rem;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
        }
        .pw-notice-error {
          background: #fff5f5;
          color: #a32d2d;
          border: 0.5px solid rgba(163,45,45,0.2);
        }
        .pw-notice-success {
          background: #f0faf5;
          color: #0f6e56;
          border: 0.5px solid rgba(15,110,86,0.2);
        }

        .pw-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 1.25rem 0;
        }
        .pw-divider-line { flex: 1; height: 0.5px; background: rgba(0,0,0,0.08); }
        .pw-divider-text { font-size: 11px; color: #bbb; }

        .pw-back {
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
        .pw-back:hover { color: #1a1a18; }
      `}</style>

      <div className="pw-root">
        <div className="pw-card">
          {/* Icon */}
          <div className="pw-icon-wrap">
            {mode === "forgot" && (
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{ width: 22, height: 22, stroke: "#888", fill: "none" }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
            {mode === "reset" && (
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{ width: 22, height: 22, stroke: "#888", fill: "none" }}
              >
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            )}
            {/* {mode === "change" && (
              <svg
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                style={{ width: 22, height: 22, stroke: "#888", fill: "none" }}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            )} */}
          </div>

          {/* Heading */}
          <h2 className="pw-title">{title}</h2>
          <p className="pw-subtitle">{subtitle}</p>

          {/* Mode tabs */}
          <div className="pw-tabs">
            {(["forgot", "reset"] as Mode[]).map((m) => (
              <button
                key={m}
                className={`pw-tab${mode === m ? " active" : ""}`}
                onClick={() => navigate(`?mode=${m}`)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === "forgot" && (
              <div style={{ marginBottom: 12 }}>
                <label className="pw-label">Email address</label>
                <input
                  className="pw-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearNotices();
                  }}
                  required
                />
              </div>
            )}

            {(mode === "reset") && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label className="pw-label">New password</label>
                  <div className="pw-input-wrap">
                    <input
                      className="pw-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearNotices();
                      }}
                      style={{ paddingRight: 36 }}
                      required
                    />
                    <button
                      type="button"
                      className="pw-eye"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <div className="pw-strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="pw-strength-bar"
                        style={{
                          background:
                            password && i <= strength
                              ? strengthColors[strength]
                              : undefined,
                        }}
                      />
                    ))}
                  </div>
                  {password && (
                    <div
                      className="pw-strength-label"
                      style={{ color: strengthColors[strength] }}
                    >
                      {strengthLabels[strength]}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="pw-label">Confirm password</label>
                  <div className="pw-input-wrap">
                    <input
                      className="pw-input"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        clearNotices();
                      }}
                      style={{ paddingRight: 36 }}
                      required
                    />
                    <button
                      type="button"
                      className="pw-eye"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button className="pw-btn" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="pw-spinner" /> Processing…
                </>
              ) : (
                btnLabel
              )}
            </button>
          </form>

          {/* Notices */}
          {displayError && (
            <div className="pw-notice pw-notice-error">
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
            <div className="pw-notice pw-notice-success">
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

          <div className="pw-divider">
            <div className="pw-divider-line" />
            <div className="pw-divider-text">or</div>
            <div className="pw-divider-line" />
          </div>

          <button className="pw-back" onClick={() => navigate("/login")}>
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
            Back to sign in
          </button>
        </div>
      </div>
    </>
  );
}
