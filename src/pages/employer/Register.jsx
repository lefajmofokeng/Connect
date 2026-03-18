import { useState, useEffect } from "react";
import { isSignInWithEmailLink, signInWithEmailLink, updatePassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { auth, db } from "../../lib/firebase";

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailFromUrl = searchParams.get("email") || "";
  const invitedParam = searchParams.get("invited") === "true";

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const valid = isSignInWithEmailLink(auth, window.location.href);
    setIsValidLink(valid);
    setChecking(false);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!email) {
      setError("Email address is required.");
      return;
    }

    setLoading(true);

    try {
      // Sign in with the magic link
      const cred = await signInWithEmailLink(auth, email, window.location.href);

      // Set their password
      await updatePassword(cred.user, password);

      // Create employer doc in Firestore
      await setDoc(doc(db, "employers", cred.user.uid), {
        email: cred.user.email,
        companyName,
        slug: companyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        verificationStatus: "pending",
        plan: "none",
        planStatus: "inactive",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate("/employer/verify");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-action-code") {
        setError("This invite link has expired or already been used. Please contact support.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError("Something went wrong. Please try again or contact support.");
      }
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logo}>Cronos Jobs</div>
          <p style={s.sub}>Verifying your invite link…</p>
        </div>
      </div>
    );
  }

  if (!invitedParam || !isValidLink) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logo}>Cronos Jobs</div>
          <h1 style={s.heading}>Invalid Invite Link</h1>
          <p style={s.sub}>
            This page is only accessible via an official Cronos Jobs invite email.
            If you'd like to list jobs on our platform, please apply for access first.
          </p>
          <Link to="/employer/join" style={s.btn}>Apply for Access</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>Cronos Jobs</div>
        <h1 style={s.heading}>Create Your Account</h1>
        <p style={s.sub}>You've been invited to join Cronos Jobs as an employer.</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleRegister} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input
              style={{ ...s.input, ...(emailFromUrl ? s.inputDisabled : {}) }}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              readOnly={!!emailFromUrl}
              placeholder="you@company.co.za"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Company Name</label>
            <input
              style={s.input}
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
              placeholder="Acme (Pty) Ltd"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Minimum 8 characters"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Confirm Password</label>
            <input
              style={s.input}
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repeat your password"
            />
          </div>

          <button type="submit" disabled={loading} style={s.btnSubmit}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account?{" "}
          <Link to="/employer/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#080d1b", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" },
  card: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "16px", padding: "48px 40px", width: "100%", maxWidth: "440px" },
  logo: { color: "#0099fa", fontWeight: "700", fontSize: "18px", marginBottom: "32px" },
  heading: { color: "#e8edf8", fontSize: "24px", fontWeight: "700", margin: "0 0 6px" },
  sub: { color: "#6b7fa3", fontSize: "14px", margin: "0 0 32px", lineHeight: "1.6" },
  error: { background: "rgba(255,79,106,0.1)", border: "1px solid rgba(255,79,106,0.3)", color: "#ff4f6a", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { color: "#6b7fa3", fontSize: "13px", fontWeight: "500" },
  input: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "11px 14px", color: "#e8edf8", fontSize: "14px", outline: "none", width: "100%", fontFamily: "sans-serif" },
  inputDisabled: { opacity: "0.6", cursor: "not-allowed" },
  btnSubmit: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "8px" },
  btn: { display: "inline-block", marginTop: "20px", background: "#0099fa", color: "#fff", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", textAlign: "center" },
  footer: { color: "#6b7fa3", fontSize: "13px", textAlign: "center", marginTop: "28px" },
  link: { color: "#0099fa", textDecoration: "none" },
};