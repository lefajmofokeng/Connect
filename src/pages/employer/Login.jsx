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

      // Plan gate
      // All verified and approved employers can access dashboard
        // (invoice system handles payment tracking)

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
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Cronos Jobs</div>
        <h1 style={styles.heading}>Employer Login</h1>
        <p style={styles.sub}>Access your hiring portal</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="you@company.co.za"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={styles.footer}>
          Want to list jobs on Cronos?{" "}
          <Link to="/employer/join" style={styles.link}>Apply for access</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#080d1b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    background: "#0d1428",
    border: "1px solid #1e2d52",
    borderRadius: "16px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
  },
  logo: {
    color: "#0099fa",
    fontWeight: "700",
    fontSize: "18px",
    marginBottom: "32px",
    letterSpacing: "-0.02em",
  },
  heading: {
    color: "#e8edf8",
    fontSize: "26px",
    fontWeight: "700",
    margin: "0 0 6px",
  },
  sub: {
    color: "#6b7fa3",
    fontSize: "14px",
    margin: "0 0 32px",
  },
  error: {
    background: "rgba(255,79,106,0.1)",
    border: "1px solid rgba(255,79,106,0.3)",
    color: "#ff4f6a",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13px",
    marginBottom: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    color: "#6b7fa3",
    fontSize: "13px",
    fontWeight: "500",
  },
  input: {
    background: "#131b33",
    border: "1px solid #1e2d52",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#e8edf8",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  btn: {
    background: "#0099fa",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  footer: {
    color: "#6b7fa3",
    fontSize: "13px",
    textAlign: "center",
    marginTop: "28px",
  },
  link: {
    color: "#0099fa",
    textDecoration: "none",
    fontWeight: "500",
  },
};