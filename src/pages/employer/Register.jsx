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

    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!email) { setError("Email address is required."); return; }

    setLoading(true);
    try {
      const cred = await signInWithEmailLink(auth, email, window.location.href);
      await updatePassword(cred.user, password);
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

  // ── Checking state ──
  if (checking) {
    return (
      <div style={s.page}>
        <LeftPanel
          heading="Almost there"
          sub="Just a moment while we verify your invite link."
        />
        <div style={s.rightPanel}>
          <div style={s.formWrap}>
            <div style={s.formHeader}>
              <div style={s.spinnerWrap}>
                <div style={s.spinner} />
              </div>
              <h1 style={s.heading}>Verifying link</h1>
              <p style={s.sub}>Checking your invite link…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid link state ──
  if (!invitedParam || !isValidLink) {
    return (
      <div style={s.page}>
        <LeftPanel
          heading="Invite only"
          sub="Employer accounts are created via an official invite link sent to your email."
        />
        <div style={s.rightPanel}>
          <div style={s.formWrap}>
            <div style={{ ...s.alertError, marginBottom: "32px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Invalid or expired invite link
            </div>
            <h1 style={s.heading}>Invalid invite link</h1>
            <p style={{ ...s.sub, marginBottom: "32px" }}>
              This page is only accessible via an official Vetted invite email.
              If you'd like to list jobs on our platform, please apply for access first.
            </p>
            <Link to="/employer/join" style={s.btnPrimary}>Apply for Access</Link>
            <p style={s.footer}>
              Already have an account?{" "}
              <Link to="/employer/login" style={s.link}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div style={s.page}>
      <LeftPanel
        heading="You've been invited"
        sub="Complete your account setup to start posting jobs and managing applications on Vetted."
      />

      <div style={s.rightPanel}>
        <div style={s.formWrap}>

          {/* Header */}
          <div style={s.formHeader}>
            <div style={s.inviteBadge}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Invite verified
            </div>
            <h1 style={s.heading}>Create your account</h1>
            <p style={s.sub}>You've been invited to join Vetted as an employer.</p>
          </div>

          {/* Error */}
          {error && (
            <div style={s.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} style={s.form}>

            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input
                style={{ ...s.input, ...(emailFromUrl ? s.inputReadOnly : {}) }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                readOnly={!!emailFromUrl}
                placeholder="you@company.co.za"
              />
              {emailFromUrl && (
                <span style={s.fieldHint}>Pre-filled from your invite link</span>
              )}
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

            <div style={s.fieldDivider} />

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

            <button type="submit" disabled={loading} style={s.btnPrimary}>
              {loading ? "Creating account…" : "Create Account"}
            </button>

          </form>

          {/* Footer */}
          <p style={s.footer}>
            Already have an account?{" "}
            <Link to="/employer/login" style={s.link}>Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

// ── Left Panel ────────────────────────────────────────────────────────
function LeftPanel({ heading, sub }) {
  return (
    <div style={s.leftPanel}>
      <div style={s.brandWrap}>
        <div style={s.logoMark}>V</div>
        <div style={s.brandName}>Vetted</div>
      </div>
      <div style={s.brandBody}>
        <h2 style={s.brandHeading}>{heading}</h2>
        <p style={s.brandSub}>{sub}</p>
        <div style={s.featureList}>
          {[
            "Invite-only employer accounts",
            "Verified companies only — quality guaranteed",
            "Full dashboard access from day one",
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
    width: "380px",
    flexShrink: 0,
    background: "#ffffff",
    borderRight: "1px solid #e3e3e3",
    display: "flex",
    flexDirection: "column",
    padding: "48px 40px",
    position: "sticky",
    top: 0,
    height: "100vh",
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
    fontSize: "24px",
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
  brandFooter: { color: "#9aa0a6", fontSize: "12px", fontWeight: "500" },

  // ── Right form panel ──
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
    overflowY: "auto",
  },
  formWrap: { width: "100%", maxWidth: "400px" },
  formHeader: { marginBottom: "32px" },

  // ── Invite badge ──
  inviteBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#e6f4ea",
    color: "#0d652d",
    border: "1px solid #ceead6",
    borderRadius: "4px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "16px",
  },

  // ── Spinner (checking state) ──
  spinnerWrap: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "3px solid #e3f2fd",
    borderTop: "3px solid #1967d2",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // ── Typography ──
  heading: {
    color: "#202124",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  sub: { color: "#5f6368", fontSize: "14px", margin: 0, lineHeight: "1.6" },

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

  // ── Form elements ──
  form: { display: "flex", flexDirection: "column", gap: "16px" },
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
  inputReadOnly: {
    background: "#f8f9fa",
    color: "#5f6368",
    cursor: "not-allowed",
  },
  fieldHint: {
    color: "#9aa0a6",
    fontSize: "11px",
    fontWeight: "500",
  },
  fieldDivider: {
    borderTop: "1px solid #e3e3e3",
    margin: "4px 0",
  },

  // ── Buttons ──
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
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
    boxSizing: "border-box",
  },

  // ── Footer ──
  footer: { color: "#5f6368", fontSize: "13px", textAlign: "center", marginTop: "28px" },
  link: { color: "#1a73e8", textDecoration: "none", fontWeight: "600" },
};