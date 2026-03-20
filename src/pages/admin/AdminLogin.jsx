import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (cred.user.email !== "lefamjack@gmail.com") {
        setError("You are not authorised to access this panel.");
        await auth.signOut();
        setLoading(false);
        return;
      }

      navigate("/admin");
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Incorrect email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>

      {/* Left panel — branding */}
      <div style={s.leftPanel}>
        <div style={s.brandWrap}>
          <div style={s.logoMark}>V</div>
          <div style={s.brandName}>Vetted</div>
        </div>
        <div style={s.brandBody}>
          <h2 style={s.brandHeading}>Internal Control System</h2>
          <p style={s.brandSub}>
            Restricted access. Authorised personnel only.
          </p>
          <div style={s.featureList}>
            {[
              "Manage employer applications & verification",
              "Full job listing control and moderation",
              "Billing and invoice management",
            ].map((f, i) => (
              <div key={i} style={s.featureItem}>
                <div style={s.featureDot} />
                <span style={s.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.warningBadge}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Unauthorised access attempts are logged.
        </div>
      </div>

      {/* Right panel — form */}
      <div style={s.rightPanel}>
        <div style={s.formWrap}>

          {/* Header */}
          <div style={s.formHeader}>
            <div style={s.adminBadge}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Admin Access
            </div>
            <h1 style={s.heading}>Sign in</h1>
            <p style={s.sub}>Access the Vetted admin console.</p>
          </div>

          {/* Error */}
          {error && (
            <div style={s.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={s.input}
                placeholder="admin@vetted.co.za"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={s.input}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} style={s.btnPrimary}>
              {loading ? "Signing in…" : "Sign In to Console"}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f5f7",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // ── Left branding panel ──
  leftPanel: {
    width: "420px",
    flexShrink: 0,
    background: "#ffffff",
    borderRight: "1px solid #e3e3e3",
    display: "flex",
    flexDirection: "column",
    padding: "48px 40px",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "64px",
  },
  logoMark: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    background: "#ffca28",
    color: "#d84315",
    fontWeight: "700",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { color: "#202124", fontWeight: "600", fontSize: "16px" },
  brandBody: { flex: 1 },
  brandHeading: {
    color: "#202124",
    fontSize: "26px",
    fontWeight: "600",
    margin: "0 0 12px",
    letterSpacing: "-0.5px",
    lineHeight: 1.3,
  },
  brandSub: {
    color: "#5f6368",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 32px",
  },
  featureList: { display: "flex", flexDirection: "column", gap: "14px" },
  featureItem: { display: "flex", alignItems: "flex-start", gap: "12px" },
  featureDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#1a73e8",
    flexShrink: 0,
    marginTop: "6px",
  },
  featureText: { color: "#3c4043", fontSize: "13px", lineHeight: "1.5", fontWeight: "500" },

  // Warning at the bottom of left panel
  warningBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fef7e0",
    border: "1px solid #fde68a",
    borderRadius: "4px",
    padding: "10px 12px",
    color: "#ea8600",
    fontSize: "12px",
    fontWeight: "500",
  },

  // ── Right form panel ──
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
  },
  formWrap: { width: "100%", maxWidth: "380px" },
  formHeader: { marginBottom: "32px" },

  // Admin badge
  adminBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#fce8e6",
    color: "#c5221f",
    border: "1px solid #f5c6c2",
    borderRadius: "4px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "16px",
  },

  heading: {
    color: "#202124",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  sub: { color: "#5f6368", fontSize: "14px", margin: 0 },

  // ── Alert ──
  alertError: {
    background: "#fce8e6",
    border: "1px solid #f5c6c2",
    color: "#c5221f",
    borderRadius: "4px",
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // ── Form ──
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    color: "#5f6368",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  input: {
    background: "#ffffff",
    border: "1px solid #e3e3e3",
    borderRadius: "4px",
    padding: "10px 12px",
    color: "#202124",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  btnPrimary: {
    background: "#1a73e8",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "11px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
    width: "100%",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    transition: "background 0.2s",
  },
};