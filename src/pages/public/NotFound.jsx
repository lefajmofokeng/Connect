import { useNavigate, Link } from "react-router-dom";

const FONT = '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={s.page}>

      {/* Navbar */}
      <nav style={s.navbar}>
        <div style={s.navInner}>
          <div onClick={() => navigate("/")} style={s.navLogo}>
            <div style={s.logoMark}>V</div>
            <span style={s.logoText}>Vetted</span>
          </div>
          <div style={s.navLinks}>
            <Link to="/jobs" style={s.navLink}>Browse Jobs</Link>
            <Link to="/employer/login" style={s.navBtn}>Employer Login</Link>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div style={s.body}>
        <div style={s.card}>

          {/* 404 mark */}
          <div style={s.codeWrap}>
            <span style={s.code}>4</span>
            <div style={s.logoMarkLarge}>V</div>
            <span style={s.code}>4</span>
          </div>

          <h1 style={s.title}>Page not found</h1>
          <p style={s.sub}>
            The page you're looking for doesn't exist, has been moved, or the link may be incorrect.
          </p>

          {/* Quick links */}
          <div style={s.quickLinks}>
            <div style={s.quickLinksTitle}>You might be looking for</div>
            <div style={s.quickLinksGrid}>
              {[
                { label: "Browse Jobs",      to: "/jobs",             desc: "Search all open positions" },
                { label: "Employer Login",   to: "/employer/login",   desc: "Access your employer portal" },
                { label: "Apply for Access", to: "/employer/join",    desc: "Register as an employer" },
                { label: "Home",             to: "/",                 desc: "Back to the Vetted homepage" },
              ].map(link => (
                <Link key={link.to} to={link.to} style={s.quickLink}>
                  <div style={s.quickLinkLabel}>{link.label}</div>
                  <div style={s.quickLinkDesc}>{link.desc}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={s.actions}>
            <button onClick={() => navigate(-1)} style={s.btnOutline}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Go Back
            </button>
            <button onClick={() => navigate("/")} style={s.btnPrimary}>
              Take me Home
            </button>
          </div>

          {/* Help note */}
          <p style={s.helpNote}>
            Still lost? Email us at{" "}
            <a href="mailto:support@vetted.co.za" style={{ color: "#1a73e8", fontWeight: "600", textDecoration: "none" }}>
              support@vetted.co.za
            </a>
          </p>

        </div>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.footerCopy}>© {new Date().getFullYear()} Vetted (Pty) Ltd</span>
          <div style={s.footerLinks}>
            <Link to="/terms"   style={s.footerLink}>Terms</Link>
            <Link to="/privacy" style={s.footerLink}>Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  page: {
    background: "#f4f5f7",
    minHeight: "100vh",
    fontFamily: FONT,
    color: "#202124",
    display: "flex",
    flexDirection: "column",
  },

  // ── Navbar ──
  navbar: { background: "#ffffff", borderBottom: "1px solid #e3e3e3" },
  navInner: { maxWidth: "1100px", margin: "0 auto", padding: "0 32px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
  logoMark: { width: "28px", height: "28px", borderRadius: "5px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#202124", fontWeight: "600", fontSize: "15px" },
  navLinks: { display: "flex", alignItems: "center", gap: "20px" },
  navLink: { color: "#5f6368", fontSize: "13px", textDecoration: "none", fontWeight: "500" },
  navBtn: { background: "#1a73e8", color: "#ffffff", borderRadius: "4px", padding: "7px 14px", fontSize: "13px", fontWeight: "600", textDecoration: "none" },

  // ── Body ──
  body: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 32px" },
  card: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "12px", padding: "48px 40px", maxWidth: "540px", width: "100%", textAlign: "center", boxShadow: "0 1px 3px rgba(60,64,67,0.1)" },

  // ── 404 display ──
  codeWrap: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" },
  code: { fontSize: "72px", fontWeight: "800", color: "#e3e3e3", lineHeight: 1, letterSpacing: "-3px" },
  logoMarkLarge: { width: "64px", height: "64px", borderRadius: "12px", background: "#ffca28", color: "#d84315", fontWeight: "800", fontSize: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  title: { color: "#202124", fontSize: "24px", fontWeight: "700", margin: "0 0 10px", letterSpacing: "-0.5px" },
  sub: { color: "#5f6368", fontSize: "14px", lineHeight: "1.7", margin: "0 0 32px" },

  // ── Quick links ──
  quickLinks: { background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "18px 20px", marginBottom: "28px", textAlign: "left" },
  quickLinksTitle: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" },
  quickLinksGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  quickLink: { display: "block", background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "6px", padding: "10px 12px", textDecoration: "none", transition: "border-color 0.15s" },
  quickLinkLabel: { color: "#1a73e8", fontSize: "13px", fontWeight: "600", marginBottom: "2px" },
  quickLinkDesc: { color: "#9aa0a6", fontSize: "11px" },

  // ── Actions ──
  actions: { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" },
  btnPrimary: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "4px", padding: "10px 22px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },
  btnOutline: { display: "inline-flex", alignItems: "center", background: "#ffffff", border: "1px solid #dadce0", color: "#3c4043", borderRadius: "4px", padding: "10px 18px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },

  helpNote: { color: "#9aa0a6", fontSize: "12px", margin: 0 },

  // ── Footer ──
  footer: { background: "#ffffff", borderTop: "1px solid #e3e3e3", padding: "16px 32px" },
  footerInner: { maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  footerCopy: { color: "#9aa0a6", fontSize: "12px" },
  footerLinks: { display: "flex", gap: "20px" },
  footerLink: { color: "#9aa0a6", fontSize: "12px", textDecoration: "none" },
};