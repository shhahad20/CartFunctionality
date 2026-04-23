import { useNavigate } from "react-router-dom";

export default function ConfirmPage() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .confirm-root {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0rem 1rem;
          margin-top: 4vh;
        }

        .confirm-card {
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

        .confirm-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #1D9E75, #1D9E75);
          opacity: 0.9;
        }

        .confirm-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #f0faf5;
          border: 0.5px solid rgba(15, 110, 86, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .confirm-title {
          font-size: 24px;
          font-weight: 500;
          color: #1a1a18;
          margin: 0 0 8px;
          line-height: 1.2;
        }

        .confirm-subtitle {
          font-size: 13px;
          color: #777772;
          margin: 0 0 1.75rem;
          font-weight: 300;
          line-height: 1.55;
        }

        .confirm-notice {
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
          margin-bottom: 1.5rem;
          background: #f0faf5;
          color: #0f6e56;
          border: 0.5px solid rgba(15, 110, 86, 0.2);
        }

        .confirm-btn {
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
        .confirm-btn:hover { opacity: 0.82; }
        .confirm-btn:active { transform: scale(0.99); }

        .confirm-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 1.25rem 0;
        }
        .confirm-divider-line { flex: 1; height: 0.5px; background: rgba(0,0,0,0.08); }
        .confirm-divider-text { font-size: 11px; color: #bbb; }

        .confirm-back {
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
        .confirm-back:hover { color: #1a1a18; }
      `}</style>

      <div className="confirm-root">
        <div className="confirm-card">
          {/* Icon */}
          <div className="confirm-icon-wrap">
            <svg
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              style={{ width: 22, height: 22, stroke: "#0f6e56", fill: "none" }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="confirm-title">Email confirmed!</h2>
          <p className="confirm-subtitle">Your account is now active and ready to use.</p>

          {/* Success notice */}
          <div className="confirm-notice">
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
            You can now log in and start shopping!
          </div>

          {/* Button */}
          <button className="confirm-btn" onClick={() => navigate("/")}>
            <svg
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              style={{
                width: 16,
                height: 16,
                stroke: "currentColor",
                fill: "none",
              }}
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go to Home
          </button>

          <div className="confirm-divider">
            <div className="confirm-divider-line" />
            <div className="confirm-divider-text">or</div>
            <div className="confirm-divider-line" />
          </div>

          <button className="confirm-back" onClick={() => navigate("/login")}>
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