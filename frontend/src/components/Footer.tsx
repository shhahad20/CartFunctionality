
export function Footer() {
  const navLinks = {
    Product: ["Features", "Pricing", "Changelog", "Roadmap", "Integrations"],
    Developers: ["Documentation", "API reference", "SDKs", "Status", "GitHub"],
    Company: ["About", "Blog", "Careers", "Contact", "Security"],
  };

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <span className="brand-name">
            Digital Services<span className="brand-dot">.</span>
          </span>
          <p>
            A modern platform to help teams build, ship, and scale with
            confidence. Simple, fast, and reliable.
          </p>
          <div className="social-links">
            {/* add your social icon buttons here */}
          </div>
        </div>

        {Object.entries(navLinks).map(([heading, links]) => (
          <div key={heading} className="footer-col">
            <h4>{heading}</h4>
            <ul>
              {links.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span className="footer-copy">
          © {new Date().getFullYear()} ShahadAltharwa, Inc. All rights reserved.
        </span>
        <div className="status-badge">
          <span className="status-dot" />
          All systems operational
        </div>
        <div className="footer-legal">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/cookies">Cookies</a>
        </div>
      </div>
    </footer>
  );
}