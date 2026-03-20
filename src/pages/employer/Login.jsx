import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../lib/firebase";

export default function Login() {
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

      // Admin bypasses Firestore check entirely
      if (cred.user.email === "lefamjack@gmail.com") {
        navigate("/admin");
        return;
      }

      const snap = await getDoc(doc(db, "employers", cred.user.uid));

      if (!snap.exists()) {
        setError("No employer account found. Please contact support.");
        setLoading(false);
        return;
      }

      const profile = snap.data();
      const { verificationStatus, planStatus } = profile;

      // Admin bypasses all gates
      if (cred.user.email === "lefamjack@gmail.com") {
        navigate("/admin");
        return;
      }

      // Verification gate
      if (!verificationStatus || verificationStatus === "pending") {
        navigate("/employer/verify");
        return;
      }

      if (verificationStatus === "submitted") {
        setError("Your documents are under review. We'll notify you once approved.");
        setLoading(false);
        return;
      }

      if (verificationStatus === "rejected") {
        setError("Your application was not approved. Please contact support.");
        setLoading(false);
        return;
      }

      // All good
      navigate("/employer/dashboard");

    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
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
        <div style={s.brandArea}>
          <div style={s.logoMark}>V</div>
          <div style={s.logoText}>Vetted</div>
        </div>
        <div style={s.tagline}>
          <div style={s.taglineHeading}>Your hiring console.</div>
          <div style={s.taglineSub}>Post jobs, review applications, and manage your employer presence — all in one place.</div>
        </div>
        <div style={s.leftFooter}>jobs-42a5d · Spark Plan</div>
      </div>

      {/* Right panel — form */}
      <div style={s.rightPanel}>
        <div style={s.card}>

          <div style={s.cardHeader}>
            <h1 style={s.heading}>Sign in</h1>
            <p style={s.sub}>to continue to Vetted Employer Portal</p>
          </div>

          {error && (
            <div style={s.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={s.input}
                placeholder="you@company.co.za"
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

            <button type="submit" disabled={loading} style={s.btn}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>New to Vetted?</span>
            <div style={s.dividerLine} />
          </div>

          <p style={s.footer}>
            <Link to="/employer/join" style={s.link}>Apply for employer access →</Link>
          </p>

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

  // ── Left Branding Panel ──
  leftPanel: {
    width: "380px",
    flexShrink: 0,
    background: "#ffffff",
    borderRight: "1px solid #e3e3e3",
    display: "flex",
    flexDirection: "column",
    padding: "48px 40px",
    justifyContent: "space-between",
  },
  brandArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
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
    flexShrink: 0,
  },
  logoText: {
    color: "#202124",
    fontWeight: "600",
    fontSize: "16px",
  },
  tagline: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "48px 0",
  },
  taglineHeading: {
    color: "#202124",
    fontSize: "28px",
    fontWeight: "600",
    letterSpacing: "-0.5px",
    marginBottom: "12px",
    lineHeight: 1.2,
  },
  taglineSub: {
    color: "#5f6368",
    fontSize: "14px",
    lineHeight: "1.7",
  },
  leftFooter: {
    color: "#9aa0a6",
    fontSize: "11px",
    fontWeight: "500",
    fontFamily: '"Roboto Mono", monospace',
  },

  // ── Right Form Panel ──
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e3e3e3",
    borderRadius: "8px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 1px 3px 1px rgba(60,64,67,0.05), 0 1px 2px 0 rgba(60,64,67,0.08)",
  },
  cardHeader: {
    marginBottom: "28px",
  },
  heading: {
    color: "#202124",
    fontSize: "22px",
    fontWeight: "600",
    margin: "0 0 4px",
    letterSpacing: "-0.3px",
  },
  sub: {
    color: "#5f6368",
    fontSize: "13px",
    margin: 0,
  },

  // ── Alert ──
  alertError: {
    background: "#fce8e6",
    border: "1px solid #f5c6c2",
    color: "#c5221f",
    borderRadius: "4px",
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // ── Form ──
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
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
    boxSizing: "border-box",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    transition: "border-color 0.2s",
  },
  btn: {
    background: "#1a73e8",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "11px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    transition: "background 0.2s",
    width: "100%",
  },

  // ── Divider ──
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "24px 0 20px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e3e3e3",
  },
  dividerText: {
    color: "#9aa0a6",
    fontSize: "12px",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },

  // ── Footer ──
  footer: {
    textAlign: "center",
    margin: 0,
  },
  link: {
    color: "#1a73e8",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
  },
};