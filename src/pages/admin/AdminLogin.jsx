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
      <div style={s.card}>
        <div style={s.logoRow}>
          <div style={s.logoMark}>C</div>
          <div>
            <div style={s.logoText}>Cronos Jobs</div>
            <div style={s.logoSub}>Internal Control System</div>
          </div>
        </div>

        <h1 style={s.heading}>Admin Access</h1>
        <p style={s.sub}>Restricted to authorised personnel only.</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleLogin} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={s.input}
              placeholder="admin@cronosjobs.co.za"
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
            {loading ? "Signing in…" : "Sign In to Control System"}
          </button>
        </form>

        <div style={s.warning}>
          ⚠ Unauthorised access attempts are logged.
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#080d1b", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(0,153,250,0.08) 0%, transparent 60%)" },
  card: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "16px", padding: "48px 40px", width: "100%", maxWidth: "420px" },
  logoRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px" },
  logoMark: { width: "40px", height: "40px", borderRadius: "10px", background: "#0099fa", color: "#fff", fontWeight: "800", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoText: { color: "#e8edf8", fontWeight: "700", fontSize: "15px" },
  logoSub: { color: "#0099fa", fontSize: "11px", fontWeight: "500", letterSpacing: "0.04em" },
  heading: { color: "#e8edf8", fontSize: "26px", fontWeight: "700", margin: "0 0 6px" },
  sub: { color: "#6b7fa3", fontSize: "14px", margin: "0 0 32px" },
  error: { background: "rgba(255,79,106,0.1)", border: "1px solid rgba(255,79,106,0.3)", color: "#ff4f6a", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#6b7fa3", fontSize: "13px", fontWeight: "500" },
  input: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "12px 14px", color: "#e8edf8", fontSize: "14px", outline: "none", width: "100%", fontFamily: "sans-serif" },
  btn: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "8px" },
  warning: { color: "#3d4f73", fontSize: "12px", textAlign: "center", marginTop: "24px" },
};