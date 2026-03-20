import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../lib/firebase";

const provider = new GoogleAuthProvider();

export default function JobSeekerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const empSnap = await getDoc(doc(db, "employers", cred.user.uid));
      if (empSnap.exists()) {
        await auth.signOut();
        setError("This account is an employer account. Please use the employer login.");
        setLoading(false);
        return;
      }
      if (cred.user.email === "lefamjack@gmail.com") {
        await auth.signOut();
        setError("Please use the admin login.");
        setLoading(false);
        return;
      }
      navigate("/jobseeker/dashboard");
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const empSnap = await getDoc(doc(db, "employers", user.uid));
      if (empSnap.exists()) {
        await auth.signOut();
        setError("This Google account is linked to an employer account.");
        setGoogleLoading(false);
        return;
      }
      const jsSnap = await getDoc(doc(db, "jobseekers", user.uid));
      if (!jsSnap.exists()) {
        await setDoc(doc(db, "jobseekers", user.uid), {
          email: user.email,
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
          phone: "", city: "", province: "", bio: "", skills: [],
          savedJobs: [], photoUrl: user.photoURL || "",
          cvUrl: "", cvFilename: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      navigate("/jobseeker/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div style={s.page}>

      {/* ── Left branding panel ── */}
      <div style={s.leftPanel}>
        <div style={s.brandWrap}>
          <div style={s.logoMark}>V</div>
          <div style={s.brandName}>Vetted</div>
        </div>
        <div style={s.brandBody}>
          <h2 style={s.brandHeading}>Your next job starts here</h2>
          <p style={s.brandSub}>
            Browse verified job listings across South Africa and apply in minutes.
          </p>
          <div style={s.featureList}>
            {[
              "Verified employers — no scam listings",
              "Apply with your saved profile in one click",
              "Track all your applications in one place",
            ].map((f, i) => (
              <div key={i} style={s.featureItem}>
                <div style={s.featureDot} />
                <span style={s.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.brandFooter}>vetted.co.za</div>
      </div>

      {/* ── Right form panel ── */}
      <div style={s.rightPanel}>
        <div style={s.formWrap}>

          <div style={s.formHeader}>
            <h1 style={s.heading}>Sign in</h1>
            <p style={s.sub}>Welcome back — find your next opportunity</p>
          </div>

          {error && (
            <div style={s.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading} style={s.googleBtn}>
            <svg width="17" height="17" viewBox="0 0 48 48" style={{ marginRight: 10, flexShrink: 0 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {googleLoading ? "Signing in…" : "Continue with Google"}
          </button>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or sign in with email</span>
            <div style={s.dividerLine} />
          </div>

          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} style={s.btnPrimary}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={s.footer}>
            Don't have an account?{" "}
            <Link to="/jobseeker/register" style={s.link}>Create one free</Link>
          </p>
          <p style={s.footerNote}>
            Are you an employer?{" "}
            <Link to="/employer/login" style={s.link}>Employer login →</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f5f7",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  leftPanel: {
    width: "420px",
    flexShrink: 0,
    background: "#ffffff",
    borderRight: "1px solid #e3e3e3",
    display: "flex",
    flexDirection: "column",
    padding: "48px 40px",
  },
  brandWrap: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "64px" },
  logoMark: { width: "32px", height: "32px", borderRadius: "6px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" },
  brandName: { color: "#202124", fontWeight: "600", fontSize: "16px" },
  brandBody: { flex: 1 },
  brandHeading: { color: "#202124", fontSize: "26px", fontWeight: "600", margin: "0 0 12px", letterSpacing: "-0.5px", lineHeight: 1.3 },
  brandSub: { color: "#5f6368", fontSize: "14px", lineHeight: "1.6", margin: "0 0 32px" },
  featureList: { display: "flex", flexDirection: "column", gap: "14px" },
  featureItem: { display: "flex", alignItems: "flex-start", gap: "12px" },
  featureDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#1a73e8", flexShrink: 0, marginTop: "6px" },
  featureText: { color: "#3c4043", fontSize: "13px", lineHeight: "1.5", fontWeight: "500" },
  brandFooter: { color: "#9aa0a6", fontSize: "12px", fontWeight: "500" },
  rightPanel: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px" },
  formWrap: { width: "100%", maxWidth: "380px" },
  formHeader: { marginBottom: "28px" },
  heading: { color: "#202124", fontSize: "24px", fontWeight: "600", margin: "0 0 6px", letterSpacing: "-0.5px" },
  sub: { color: "#5f6368", fontSize: "14px", margin: 0 },
  alertError: { background: "#fce8e6", border: "1px solid #f5c6c2", color: "#c5221f", borderRadius: "4px", padding: "12px 16px", fontSize: "13px", fontWeight: "500", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" },
  googleBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "1px solid #dadce0", borderRadius: "4px", padding: "10px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#3c4043", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', boxShadow: "0 1px 2px rgba(60,64,67,0.06)", marginBottom: "20px", transition: "background 0.15s" },
  divider: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  dividerLine: { flex: 1, height: "1px", background: "#e3e3e3" },
  dividerText: { color: "#9aa0a6", fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { color: "#5f6368", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" },
  input: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "10px 12px", color: "#202124", fontSize: "14px", outline: "none", width: "100%", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', boxSizing: "border-box", transition: "border-color 0.2s" },
  btnPrimary: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "4px", padding: "11px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginTop: "4px", width: "100%", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', boxShadow: "0 1px 2px rgba(0,0,0,0.1)", transition: "background 0.2s" },
  footer: { color: "#5f6368", fontSize: "13px", textAlign: "center", marginTop: "24px", marginBottom: 0 },
  footerNote: { color: "#9aa0a6", fontSize: "12px", textAlign: "center", marginTop: "8px", marginBottom: 0 },
  link: { color: "#1a73e8", textDecoration: "none", fontWeight: "600" },
};