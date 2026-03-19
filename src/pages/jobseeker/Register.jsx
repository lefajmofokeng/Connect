import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../lib/firebase";

const provider = new GoogleAuthProvider();

export default function JobSeekerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const createProfile = async (user, extra = {}) => {
    const existing = await getDoc(doc(db, "jobseekers", user.uid));
    if (!existing.exists()) {
      await setDoc(doc(db, "jobseekers", user.uid), {
        email: user.email,
        firstName: extra.firstName || user.displayName?.split(" ")[0] || "",
        lastName: extra.lastName || user.displayName?.split(" ").slice(1).join(" ") || "",
        phone: "",
        city: "",
        province: "",
        bio: "",
        skills: [],
        savedJobs: [],
        photoUrl: user.photoURL || "",
        cvUrl: "",
        cvFilename: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: `${form.firstName} ${form.lastName}` });
      await createProfile(cred.user, { firstName: form.firstName, lastName: form.lastName });
      navigate("/jobseeker/dashboard");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in.");
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
      await createProfile(result.user);
      navigate("/jobseeker/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <nav style={s.navbar}>
        <div style={s.navInner}>
          <div style={s.navLogo} onClick={() => navigate("/")}>
            <img src="/logo.png" alt="Cronos Jobs" style={s.navLogoImg} />
          </div>
          <Link to="/jobseeker/login" style={s.navLink}>Already have an account? Sign in</Link>
        </div>
      </nav>

      <div style={s.body}>
        <div style={s.card}>
          <h1 style={s.heading}>Create your account</h1>
          <p style={s.sub}>Find and track jobs across South Africa</p>

          {error && <div style={s.error}>{error}</div>}

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading} style={s.googleBtn}>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 10 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {googleLoading ? "Signing in…" : "Continue with Google"}
          </button>

          <div style={s.divider}><span style={s.dividerText}>or sign up with email</span></div>

          <form onSubmit={handleRegister} style={s.form}>
            <div style={s.row}>
              <Field label="First Name">
                <input style={s.input} value={form.firstName} onChange={set("firstName")} placeholder="Jane" required />
              </Field>
              <Field label="Last Name">
                <input style={s.input} value={form.lastName} onChange={set("lastName")} placeholder="Smith" required />
              </Field>
            </div>
            <Field label="Email Address">
              <input style={s.input} type="email" value={form.email} onChange={set("email")} placeholder="jane@email.com" required />
            </Field>
            <Field label="Password">
              <input style={s.input} type="password" value={form.password} onChange={set("password")} placeholder="Minimum 8 characters" required />
            </Field>
            <Field label="Confirm Password">
              <input style={s.input} type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" required />
            </Field>
            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p style={s.footer}>
            Already have an account?{" "}
            <Link to="/jobseeker/login" style={s.link}>Sign in</Link>
          </p>
          <p style={s.footerNote}>
            Are you an employer?{" "}
            <Link to="/employer/login" style={s.link}>Employer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ color: "#5f6368", fontSize: "13px", fontWeight: "500" }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  page: { background: "#f8f9fa", minHeight: "100vh", fontFamily: "'Circular Std', sans-serif" },
  navbar: { background: "#202124", height: "64px", display: "flex", alignItems: "center" },
  navInner: { maxWidth: "1100px", margin: "0 auto", padding: "0 24px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { cursor: "pointer" },
  navLogoImg: { height: "28px", objectFit: "contain" },
  navLink: { color: "rgba(255,255,255,0.7)", fontSize: "13px", textDecoration: "none" },
  body: { display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", minHeight: "calc(100vh - 64px)" },
  card: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "460px", boxShadow: "0 2px 8px rgba(60,64,67,0.1)" },
  heading: { color: "#202124", fontSize: "24px", fontWeight: "700", margin: "0 0 6px" },
  sub: { color: "#5f6368", fontSize: "14px", margin: "0 0 28px" },
  error: { background: "#fce8e6", border: "1px solid rgba(217,48,37,0.2)", color: "#d93025", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px" },
  googleBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "11px 16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", color: "#202124", fontFamily: "'Circular Std', sans-serif", boxShadow: "0 1px 3px rgba(60,64,67,0.08)", marginBottom: "20px" },
  divider: { position: "relative", textAlign: "center", margin: "0 0 20px" },
  dividerText: { background: "#fff", padding: "0 12px", color: "#80868b", fontSize: "12px", position: "relative", zIndex: 1 },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  input: { background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "11px 14px", color: "#202124", fontSize: "14px", outline: "none", width: "100%", fontFamily: "'Circular Std', sans-serif" },
  submitBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: "pointer", marginTop: "4px", fontFamily: "'Circular Std', sans-serif" },
  footer: { color: "#5f6368", fontSize: "13px", textAlign: "center", marginTop: "24px" },
  footerNote: { color: "#80868b", fontSize: "12px", textAlign: "center", marginTop: "8px" },
  link: { color: "#1a73e8", textDecoration: "none", fontWeight: "500" },
};