import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../lib/firebase";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const FONT_HEAD = '"Bricolage Grotesque", "Circular Std", -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_BODY = '"Inter", "Circular Std", -apple-system, BlinkMacSystemFont, sans-serif';

export default function JobSeekerLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user   = result.user;

      // ── 1. Block employer accounts ──────────────────────────────
      const empSnap = await getDoc(doc(db, "employers", user.uid));
      if (empSnap.exists()) {
        await auth.signOut();
        setError("This Google account is linked to an employer account. Please use the employer login.");
        setLoading(false);
        return;
      }

      // ── 2. Route based on whether they have a jobseeker profile ──
      const jsSnap = await getDoc(doc(db, "jobseekers", user.uid));
      if (!jsSnap.exists()) {
        // Brand new user — send to registration to complete their profile
        navigate("/register/jobseeker");
      } else {
        // Existing user — successfully grant access directly to dashboard
        navigate("/jobseeker/dashboard");
      }
    } catch (err) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Global CSS Hover & Keyframe Engine */}
      <style>{`
        .cro-google-btn:hover {
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow: 0 12px 30px rgba(255, 255, 255, 0.12) !important;
        }
        .cro-link:hover {
          text-decoration: underline !important;
        }
        @keyframes croSpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Decorative Branding Dynamic Lighting Background System */}
      <div style={styles.radialGlowTop} />
      <div style={styles.radialGlowBottom} />

      {/* Close Navigation Micro-Component Action */}
      <Link to="/" style={styles.closeBtn} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px" }}>
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </Link>

      {/* Premium Glassmorphic Layout Card - Entirely Centered Content */}
      <div style={styles.card}>

        <h1 style={styles.title}>Login to <span style={styles.titleSpan}>Croloft</span></h1>
        <p style={styles.subtitle}>
          If you gained access to Croloft, you can login directly with your Google account.
        </p>

        {/* Runtime Diagnostic Errors Workspace Logger */}
        {error && (
          <div style={styles.alertError}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div style={{ fontWeight: "600" }}>{error}</div>
          </div>
        )}

        {/* Action Workflow Layer Target Hub */}
        <button 
          type="button" 
          onClick={handleGoogle}
          disabled={loading}
          className="cro-google-btn"
          style={{
            ...styles.googleBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? (
            <span style={styles.spinner} />
          ) : (
            <svg height="18" width="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span style={{ fontWeight: "600" }}>
            {loading ? "Verifying Authorization..." : "Sign in with Google"}
          </span>
        </button>

        {/* Anchored Core Business Target Redirection Workspace */}
        <div style={styles.footer}>
          <div style={styles.footerRow}>
            <span style={styles.footerLabel}>Don't have an account yet?</span>
            {/* FIX: Routes properly to registration component layout without 404 */}
            <Link to="/jobseeker/Register" className="cro-link" style={styles.footerLinkActive}>
              Create Account
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "4px" }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>
          
          <div style={{ ...styles.footerRow, marginTop: "6px" }}>
            <span style={styles.footerLabel}>Hiring Manager or Business?</span>
            <Link to="/employer/login" className="cro-link" style={styles.footerLinkMuted}>
              Employer Console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#080d1b", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  radialGlowTop: {
    position: "absolute",
    width: "600px",
    height: "500px",
    top: "-100px",
    right: "-100px",
    background: "radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 70%)",
    pointerEvents: "none",
    zIndex: 1,
  },
  radialGlowBottom: {
    position: "absolute",
    width: "500px",
    height: "500px",
    bottom: "-150px",
    left: "-100px",
    background: "radial-gradient(circle, rgba(0, 145, 255, 0.04) 0%, rgba(0, 0, 0, 0) 75%)",
    pointerEvents: "none",
    zIndex: 1,
  },
  closeBtn: {
    position: "absolute",
    top: "32px",
    left: "32px",
    background: "rgba(255, 255, 255, 0.03)",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    color: "#ffffff",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center", 
    textAlign: "center",  
    zIndex: 10,
    boxSizing: "border-box",
  },
  title: {
    fontFamily: FONT_HEAD,
    fontSize: "32px",
    fontWeight: "500",
    marginBottom: "12px",
    lineHeight: "1.1",
    color: "#ffffff",
    margin: 0,
  },
  titleSpan: {
    color: "#ffffff",
    fontWeight: "500",
  },
  subtitle: {
    fontFamily: FONT_BODY,
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.6",
    marginBottom: "32px",
    margin: 0,
    paddingBottom: "32px",
    paddingTop: "15px",
  },
  alertError: {
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#fca5a5",
    borderRadius: "8px",
    padding: "14px 16px",
    fontSize: "13px",
    fontFamily: FONT_BODY,
    lineHeight: "1.5",
    marginBottom: "24px",
    display: "flex",
    alignItems: "flex-start",
    textAlign: "left",
    gap: "10px",
    width: "100%",
    boxSizing: "border-box",
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    background: "rgba(255, 255, 255, 0.04)",
    borderRadius: "50px",
    color: "#ffffff",
    fontFamily: FONT_BODY,
    fontSize: "14px",
    fontWeight: "400",
    cursor: "pointer",
    width: "100%",
    padding: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  spinner: {
    display: "inline-block",
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.1)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "croSpinner 0.75s linear infinite",
  },
  footer: {
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    paddingTop: "24px",
    marginTop: "32px",
    width: "100%",
    fontSize: "13px",
    fontFamily: FONT_BODY,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  footerRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    width: "100%",
  },
  footerLabel: {
    color: "#64748b",
    fontWeight: "500",
  },
  footerLinkActive: {
    color: "#ffffff",
    fontWeight: "400",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    transition: "color 0.15s ease",
  },
  footerLinkMuted: {
    color: "#94a3b8",
    fontWeight: "400",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    transition: "color 0.15s ease",
  },
};